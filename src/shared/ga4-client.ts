/**
 * Google Analytics 4 (GA4) Data API v1beta Client & Data Types
 *
 * Official API Specification:
 * - Documentation: https://developers.google.com/analytics/devguides/reporting/data/v1
 * - Endpoint: POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport
 * - Required OAuth Scope: https://www.googleapis.com/auth/analytics.readonly
 * - Standard Rolling Window: 28 days ("28daysAgo" to "yesterday")
 */

export const GA4_DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
export const GA4_READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export const GA4_TARGET_METRICS = [
  { name: "activeUsers", label: "Active users", description: "Distinct active users over the past 28 days" },
  { name: "newUsers", label: "New users", description: "New users acquired over the past 28 days" },
  { name: "eventCount", label: "Event count", description: "Total events logged over the past 28 days" },
  { name: "keyEvents", label: "Key events", description: "Important actions/conversions completed over the past 28 days" },
] as const;

export type GA4MetricName = typeof GA4_TARGET_METRICS[number]["name"];

export interface GA4DateRange {
  startDate: string;
  endDate: string;
}

export interface GA4ReportRequest {
  dateRanges: GA4DateRange[];
  metrics: Array<{ name: string }>;
}

export interface GA4MetricValues {
  activeUsers: number | null;
  newUsers: number | null;
  eventCount: number | null;
  keyEvents: number | null;
}

export interface GA4ReportResult extends GA4MetricValues {
  propertyId: string;
  dateRangeDescription: string;
  fetchedAt: number;
}

export type GA4ConnectionState =
  | "unlinked"           // No property ID configured
  | "not_connected"      // Property ID configured, but OAuth/API not yet authorized
  | "connecting"         // Authorization/fetching in progress
  | "connected"          // Successfully retrieved live GA4 metrics
  | "error";             // Error communicating with GA4

/**
 * Normalizes user-entered GA4 property ID to numeric format (e.g. "properties/123456789" -> "123456789").
 */
export function cleanPropertyId(raw: string | undefined | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const match = trimmed.match(/^(?:properties\/)?([0-9]+)$/);
  return match ? match[1] : trimmed.replace(/^properties\//, "").trim();
}

/**
 * Builds the canonical GA4 Data API v1beta runReport request payload.
 * Rolling window: 28 days ("28daysAgo" to "yesterday").
 * Target metrics: activeUsers, newUsers, eventCount, keyEvents.
 */
export function buildGA4RunReportPayload(): GA4ReportRequest {
  return {
    dateRanges: [
      {
        startDate: "28daysAgo",
        endDate: "yesterday",
      },
    ],
    metrics: GA4_TARGET_METRICS.map((m) => ({ name: m.name })),
  };
}

/**
 * Parses raw JSON response from GA4 Data API runReport endpoint.
 */
export function parseGA4RunReportResponse(
  propertyId: string,
  data: any
): GA4ReportResult {
  const result: GA4ReportResult = {
    propertyId: cleanPropertyId(propertyId),
    dateRangeDescription: "Last 28 days",
    activeUsers: null,
    newUsers: null,
    eventCount: null,
    keyEvents: null,
    fetchedAt: Date.now(),
  };

  if (!data || typeof data !== "object") {
    return result;
  }

  const metricHeaders: Array<{ name: string }> = data.metricHeaders ?? [];
  const headerIndices = new Map<string, number>();
  metricHeaders.forEach((h, idx) => {
    headerIndices.set(h.name, idx);
  });

  // Data can be in rows[0].metricValues or totals[0].metricValues
  const metricValues: Array<{ value: string }> | undefined =
    data.rows?.[0]?.metricValues ?? data.totals?.[0]?.metricValues;

  if (metricValues && Array.isArray(metricValues)) {
    const parseVal = (name: string): number | null => {
      const idx = headerIndices.get(name);
      if (idx !== undefined && metricValues[idx]) {
        const parsed = parseInt(metricValues[idx].value, 10);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    result.activeUsers = parseVal("activeUsers");
    result.newUsers = parseVal("newUsers");
    result.eventCount = parseVal("eventCount");
    result.keyEvents = parseVal("keyEvents");
  } else if (Array.isArray(data.rows) && data.rows.length === 0) {
    // 0 rows returned indicates property has 0 recorded events in the window
    result.activeUsers = 0;
    result.newUsers = 0;
    result.eventCount = 0;
    result.keyEvents = 0;
  }

  return result;
}

/**
 * Returns the full runReport REST endpoint for a property.
 */
export function getGA4RunReportUrl(propertyId: string): string {
  const cleaned = cleanPropertyId(propertyId);
  return `${GA4_DATA_API_BASE}/properties/${cleaned}:runReport`;
}

/**
 * Cloud Console and Manifest requirements specification for GA4 integration.
 */
export interface GA4SetupSpecification {
  apiName: string;
  scope: string;
  manifestPermissions: string[];
  hostPermissions: string[];
  cloudConsoleSteps: string[];
}

export const GA4_SETUP_SPECIFICATION: GA4SetupSpecification = {
  apiName: "Google Analytics Data API v1beta",
  scope: GA4_READONLY_SCOPE,
  manifestPermissions: ["identity", "storage"],
  hostPermissions: ["https://analyticsdata.googleapis.com/*"],
  cloudConsoleSteps: [
    "1. Create or select a Google Cloud Console project.",
    "2. Enable 'Google Analytics Data API'.",
    "3. Configure OAuth consent screen for the project.",
    "4. Create OAuth 2.0 Client ID of application type 'Chrome extension' bound to Extension ID.",
    "5. Add oauth2 client_id and scopes to manifest.json.",
  ],
};
