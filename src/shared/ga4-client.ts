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

export interface GA4ProjectTrackingStatus {
  state: GA4ConnectionState;
  metrics?: GA4ReportResult;
  errorMessage?: string;
  lastAttemptAt?: number;
}

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
  manifestPermissions: ["identity", "storage"],
  hostPermissions: ["https://analyticsdata.googleapis.com/*"],
  cloudConsoleSteps: [
    "1. Google Cloud Console project configured with Google Analytics Data API enabled.",
    "2. OAuth consent screen configured with read-only analytics scope.",
    "3. OAuth 2.0 Client ID (type: Chrome extension) created for extension ID onkcjpfgllpfbimnchjehboikhippnka.",
    "4. Manifest configured with identity permission, analyticsdata host permission, and oauth2 client_id.",
  ],
};
