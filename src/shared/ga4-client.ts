/**
 * Google Analytics 4 (GA4) Data API v1beta Client & Data Types
 *
 * Official API Specification:
 * - Documentation: https://developers.google.com/analytics/devguides/reporting/data/v1
 * - Endpoint: POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport
 * - Required OAuth Scope: https://www.googleapis.com/auth/analytics.readonly
 * - Standard Rolling Window: 28 days ("28daysAgo" to "yesterday")
 * - Public Chrome Extension OAuth Client ID:
 *   799106519083-4abp5ksuf8mmqnh6tjret0guni0dbpt2.apps.googleusercontent.com
 * - Bound Extension ID: onkcjpfgllpfbimnchjehboikhippnka
 */

export const GA4_DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
export const GA4_READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
export const GA4_OAUTH_CLIENT_ID = "799106519083-4abp5ksuf8mmqnh6tjret0guni0dbpt2.apps.googleusercontent.com";
export const GA4_EXTENSION_ID = "onkcjpfgllpfbimnchjehboikhippnka";

/**
 * Optional permissions required for Developer Analytics (GA4).
 * These are requested at runtime only when the user explicitly initiates
 * an Analytics connection — never automatically on extension load or
 * Developer Workspace entry.
 */
export const GA4_ANALYTICS_PERMISSIONS: chrome.permissions.Permissions = {
  permissions: ["identity"],
  origins: ["https://analyticsdata.googleapis.com/*"],
};

/**
 * Checks whether the optional Analytics permissions (identity + analyticsdata host) are granted.
 */
export async function checkAnalyticsPermissions(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.permissions || !chrome.permissions.contains) {
    return true; // Non-extension / test environment fallback
  }
  try {
    return await chrome.permissions.contains(GA4_ANALYTICS_PERMISSIONS);
  } catch (err) {
    console.warn("[GA4Client] Failed to check analytics permissions:", err);
    return false;
  }
}

/**
 * Requests the optional Analytics permissions (identity + analyticsdata host).
 * Must be invoked directly within a user gesture handler (e.g. click on "Authorize & Connect").
 */
export async function requestAnalyticsPermissions(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.permissions || !chrome.permissions.request) {
    return true; // Non-extension / test environment fallback
  }
  try {
    return await chrome.permissions.request(GA4_ANALYTICS_PERMISSIONS);
  } catch (err) {
    console.warn("[GA4Client] Analytics permission request failed or rejected:", err);
    return false;
  }
}

export const GA4_PRIMARY_KPIS = [
  { name: "activeUsers", label: "Active users", description: "Distinct active users over the past 28 days" },
  { name: "screenPageViews", label: "Views", description: "Total page and extension views over the past 28 days" },
  { name: "engagementRate", label: "Engagement", description: "Engaged session rate over the past 28 days" },
  { name: "newUsers", label: "New users", description: "First-time users acquired over the past 28 days" },
] as const;

// Backward-compatible alias
export const GA4_TARGET_METRICS = GA4_PRIMARY_KPIS;

export type GA4MetricName = typeof GA4_PRIMARY_KPIS[number]["name"];

export interface GA4DateRange {
  startDate: string;
  endDate: string;
}

export interface GA4ReportRequest {
  dateRanges: GA4DateRange[];
  metrics: Array<{ name: string }>;
}

export interface GA4MetricValues {
  visitors: number | null;
  views: number | null;
  engagementRate: number | null;
  newUsers: number | null;
  visitorsTrend?: string;
  viewsTrend?: string;
  engagementTrend?: string;
  newUsersTrend?: string;
  hasPreviousBaseline?: boolean;
  activeUsers: number | null;
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

export interface GA4ProjectTrackingStatus {
  state: GA4ConnectionState;
  metrics?: GA4ReportResult;
  errorMessage?: string;
  lastAttemptAt?: number;
}

/**
 * Computes trend percentage for count metrics (e.g. Active users, Views, New users).
 * Returns undefined when previous baseline is zero or null to avoid misleading or repetitive badges.
 */
export function computeCountTrend(curr: number | null, prev: number | null): string | undefined {
  if (curr === null || prev === null || prev === 0) {
    return undefined;
  }
  const diff = curr - prev;
  const pct = Math.round((diff / prev) * 100);
  if (pct > 0) return `+${pct}%`;
  if (pct < 0) return `−${Math.abs(pct)}%`;
  return "0%";
}

/**
 * Computes percentage-point delta for rate metrics (e.g. Engagement rate 0.0-1.0).
 * Returns undefined when previous baseline is zero or null.
 */
export function computeRateTrend(curr: number | null, prev: number | null): string | undefined {
  if (curr === null || prev === null || prev === 0) {
    return undefined;
  }
  const ptDiff = Math.round((curr - prev) * 100);
  if (ptDiff > 0) return `+${ptDiff}pt`;
  if (ptDiff < 0) return `−${Math.abs(ptDiff)}pt`;
  return "0pt";
}

/**
 * Normalizes user-entered GA4 property ID to numeric format.
 * Accepts both "552797256" and "properties/552797256" with optional whitespace or slashes.
 */
export function cleanPropertyId(raw: string | undefined | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const match = trimmed.replace(/\/+$/, "").match(/^(?:properties\/)?([0-9]+)$/);
  return match ? match[1] : "";
}

/**
 * Builds the canonical Google Analytics web console reports URL for a given GA4 property.
 * Accepts numeric ID or "properties/ID".
 * E.g., "552797256" -> "https://analytics.google.com/analytics/web/#/p552797256/reports"
 */
export function getGA4PropertyReportsUrl(propertyId: string | undefined | null): string {
  const cleanId = cleanPropertyId(propertyId);
  if (!cleanId) return "https://analytics.google.com/analytics/web/";
  return `https://analytics.google.com/analytics/web/#/p${cleanId}/reports`;
}

/**
 * Builds the canonical GA4 Data API v1beta runReport request payload.
 * Rolling window: 28 days ("28daysAgo" to "today") compared with previous 28 days ("56daysAgo" to "29daysAgo").
 * Primary KPIs: activeUsers (Active users), screenPageViews (Views), engagementRate (Engagement), newUsers (New users).
 */
export function buildGA4RunReportPayload(): GA4ReportRequest {
  return {
    dateRanges: [
      {
        startDate: "28daysAgo",
        endDate: "today",
      },
      {
        startDate: "56daysAgo",
        endDate: "29daysAgo",
      },
    ],
    metrics: [
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "engagementRate" },
      { name: "newUsers" },
      { name: "eventCount" },
      { name: "keyEvents" },
    ],
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
    visitors: null,
    views: null,
    engagementRate: null,
    newUsers: null,
    activeUsers: null,
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

  const parseVal = (metricValues: Array<{ value: string }> | undefined, name: string): number | null => {
    if (!metricValues) return null;
    const idx = headerIndices.get(name);
    if (idx !== undefined && metricValues[idx]) {
      const parsed = parseFloat(metricValues[idx].value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const rows: any[] = Array.isArray(data.rows) ? data.rows : [];

  if (rows.length === 0) {
    result.visitors = 0;
    result.views = 0;
    result.engagementRate = 0;
    result.newUsers = 0;
    result.activeUsers = 0;
    result.eventCount = 0;
    result.keyEvents = 0;
    result.hasPreviousBaseline = false;
    return result;
  }

  // Find row corresponding to date_range_0 (current 28 days)
  const row0 = rows.find((r) => r.dimensionValues?.[0]?.value === "date_range_0") || rows[0];
  // Find row corresponding to date_range_1 (previous 28 days)
  const row1 = rows.find((r) => r.dimensionValues?.[0]?.value === "date_range_1");

  const mValues0 = row0?.metricValues;
  const mValues1 = row1?.metricValues;

  const visitors0 = parseVal(mValues0, "activeUsers");
  const views0 = parseVal(mValues0, "screenPageViews");
  const engagement0 = parseVal(mValues0, "engagementRate");
  const newUsers0 = parseVal(mValues0, "newUsers");

  const visitors1 = parseVal(mValues1, "activeUsers");
  const views1 = parseVal(mValues1, "screenPageViews");
  const engagement1 = parseVal(mValues1, "engagementRate");
  const newUsers1 = parseVal(mValues1, "newUsers");

  const hasPreviousBaseline = Boolean(
    row1 &&
    ((visitors1 ?? 0) > 0 ||
     (views1 ?? 0) > 0 ||
     (engagement1 ?? 0) > 0 ||
     (newUsers1 ?? 0) > 0)
  );
  result.hasPreviousBaseline = hasPreviousBaseline;

  result.visitors = visitors0;
  result.views = views0;
  result.engagementRate = engagement0;
  result.newUsers = newUsers0;

  // Backward compatibility
  result.activeUsers = visitors0;
  result.eventCount = parseVal(mValues0, "eventCount") ?? views0;
  result.keyEvents = parseVal(mValues0, "keyEvents") ?? 0;

  // Trend context
  result.visitorsTrend = computeCountTrend(visitors0, visitors1);
  result.viewsTrend = computeCountTrend(views0, views1);
  result.engagementTrend = computeRateTrend(engagement0, engagement1);
  result.newUsersTrend = computeCountTrend(newUsers0, newUsers1);

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
 * Obtains an OAuth token via Chrome Identity.
 *
 * NOTE: Tokens are NEVER logged or stored on disk.
 */
export async function getAuthToken(interactive: boolean = false): Promise<string> {
  if (typeof chrome === "undefined" || !chrome.identity || !chrome.identity.getAuthToken) {
    throw new Error("Chrome Identity API is not available.");
  }

  return new Promise<string>((resolve, reject) => {
    try {
      chrome.identity.getAuthToken({ interactive }, (tokenResult) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          return reject(new Error(lastError.message || "OAuth authorization failed or was cancelled."));
        }
        if (!tokenResult) {
          return reject(new Error("No OAuth token returned."));
        }
        const token = typeof tokenResult === "string" ? tokenResult : (tokenResult as any).token;
        if (!token) {
          return reject(new Error("Empty OAuth token returned."));
        }
        resolve(token);
      });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Removes a token from Chrome Identity's internal cache.
 */
export async function removeCachedAuthToken(token: string): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.identity || !chrome.identity.removeCachedAuthToken) {
    return;
  }

  return new Promise<void>((resolve) => {
    try {
      chrome.identity.removeCachedAuthToken({ token }, () => {
        resolve();
      });
    } catch {
      resolve();
    }
  });
}

/**
 * Clears any cached auth token from Chrome Identity without interactive prompt.
 */
export async function clearAuthToken(): Promise<void> {
  try {
    const token = await getAuthToken(false);
    if (token) {
      await removeCachedAuthToken(token);
    }
  } catch {
    // Token not present or already invalidated
  }
}

/**
 * Helper to extract a human-readable error message from a GA4 API error response.
 */
async function extractErrorMessage(response: Response, propertyId: string): Promise<string> {
  let apiMsg = "";
  try {
    const json = await response.json();
    if (json.error?.message) {
      apiMsg = json.error.message;
    }
  } catch {
    // Non-JSON or unreadable body
  }

  if (response.status === 401) {
    return apiMsg ? `Authentication expired or invalid: ${apiMsg}` : "Authentication expired or invalid. Please reconnect.";
  }
  if (response.status === 403) {
    if (apiMsg.includes("SERVICE_DISABLED") || apiMsg.includes("is disabled") || apiMsg.includes("has not been used in project")) {
      return "Google Analytics Data API is disabled in Google Cloud project. Enable analyticsdata.googleapis.com in Google Cloud Console.";
    }
    return apiMsg ? `Access denied: ${apiMsg}` : `Access denied for property ${propertyId}. Ensure your Google account has at least Viewer role.`;
  }
  if (response.status === 404) {
    return `Property ${propertyId} not found. Please verify the numeric GA4 Property ID.`;
  }
  if (response.status === 429) {
    return `Google Analytics Data API quota or rate limit exceeded. Please try again later.`;
  }
  return apiMsg || `Google Analytics Data API error (${response.status} ${response.statusText})`;
}

/**
 * Fetches real GA4 report for the given propertyId using Chrome Identity.
 *
 * @param propertyId The GA4 property ID (e.g. "553647047")
 * @param interactive Whether to prompt user interactively if no cached token exists
 */
export async function fetchGA4Report(
  propertyId: string,
  interactive: boolean = false
): Promise<GA4ReportResult> {
  const cleanedId = cleanPropertyId(propertyId);
  if (!cleanedId) {
    throw new Error("Invalid or empty Google Analytics property ID.");
  }

  const token = await getAuthToken(interactive);
  const url = getGA4RunReportUrl(cleanedId);
  const payload = buildGA4RunReportPayload();

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    throw new Error(`Network failure connecting to Google Analytics: ${err?.message || "fetch error"}`);
  }

  if (!response.ok) {
    // If 401 Unauthorized, remove cached token
    if (response.status === 401) {
      await removeCachedAuthToken(token);
      if (interactive) {
        // Retry once with a newly requested token
        const freshToken = await getAuthToken(true);
        const retryResponse = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${freshToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!retryResponse.ok) {
          const retryErr = await extractErrorMessage(retryResponse, cleanedId);
          throw new Error(retryErr);
        }
        const retryData = await retryResponse.json();
        return parseGA4RunReportResponse(cleanedId, retryData);
      }
      throw new Error("Google Analytics authentication expired or invalid. Please reconnect.");
    }

    const errMsg = await extractErrorMessage(response, cleanedId);
    const err: any = new Error(errMsg);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return parseGA4RunReportResponse(cleanedId, data);
}

/**
 * Cloud Console and Manifest requirements specification for GA4 integration.
 */
export interface GA4SetupSpecification {
  apiName: string;
  scope: string;
  clientId: string;
  extensionId: string;
  manifestPermissions: string[];
  hostPermissions: string[];
  cloudConsoleSteps: string[];
}

export const GA4_SETUP_SPECIFICATION: GA4SetupSpecification = {
  apiName: "Google Analytics Data API v1beta",
  scope: GA4_READONLY_SCOPE,
  clientId: GA4_OAUTH_CLIENT_ID,
  extensionId: GA4_EXTENSION_ID,
  manifestPermissions: ["storage"],
  hostPermissions: [],
  cloudConsoleSteps: [
    "1. Google Cloud Console project configured with Google Analytics Data API enabled.",
    "2. OAuth consent screen configured with read-only analytics scope.",
    "3. OAuth 2.0 Client ID (type: Chrome extension) created for extension ID onkcjpfgllpfbimnchjehboikhippnka.",
    "4. Manifest configured with identity as optional permission, analyticsdata as optional host permission, and oauth2 client_id.",
  ],
};
