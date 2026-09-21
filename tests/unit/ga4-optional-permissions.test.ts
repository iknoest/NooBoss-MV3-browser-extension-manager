import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GA4_ANALYTICS_PERMISSIONS,
  checkAnalyticsPermissions,
  requestAnalyticsPermissions,
  fetchGA4Report,
} from "../../src/shared/ga4-client";

describe("GA4 Optional Analytics Permissions", () => {
  let mockPermissions: {
    contains: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockPermissions = {
      contains: vi.fn(),
      request: vi.fn(),
    };

    (globalThis as any).chrome = {
      permissions: mockPermissions,
      identity: {
        getAuthToken: vi.fn(),
        removeCachedAuthToken: vi.fn((_details: any, cb?: () => void) => {
          if (cb) cb();
        }),
      },
      runtime: {
        lastError: undefined,
      },
    };
  });

  describe("GA4_ANALYTICS_PERMISSIONS constant", () => {
    it("requests identity permission and analyticsdata origin", () => {
      expect(GA4_ANALYTICS_PERMISSIONS.permissions).toEqual(["identity"]);
      expect(GA4_ANALYTICS_PERMISSIONS.origins).toEqual([
        "https://analyticsdata.googleapis.com/*",
      ]);
    });

    it("does NOT include downloads or clients2 origins (those are ZIP-only)", () => {
      expect(GA4_ANALYTICS_PERMISSIONS.permissions).not.toContain("downloads");
      expect(GA4_ANALYTICS_PERMISSIONS.origins).not.toContain(
        "https://clients2.google.com/*"
      );
      expect(GA4_ANALYTICS_PERMISSIONS.origins).not.toContain(
        "https://clients2.googleusercontent.com/*"
      );
    });
  });

  describe("checkAnalyticsPermissions", () => {
    it("delegates to chrome.permissions.contains with exact permission set", async () => {
      mockPermissions.contains.mockResolvedValue(true);
      const result = await checkAnalyticsPermissions();
      expect(result).toBe(true);
      expect(mockPermissions.contains).toHaveBeenCalledWith(
        GA4_ANALYTICS_PERMISSIONS
      );
    });

    it("returns false when permissions are not granted", async () => {
      mockPermissions.contains.mockResolvedValue(false);
      const result = await checkAnalyticsPermissions();
      expect(result).toBe(false);
    });

    it("returns false on API error without throwing", async () => {
      mockPermissions.contains.mockRejectedValue(new Error("API unavailable"));
      const result = await checkAnalyticsPermissions();
      expect(result).toBe(false);
    });
  });

  describe("requestAnalyticsPermissions", () => {
    it("delegates to chrome.permissions.request with exact permission set", async () => {
      mockPermissions.request.mockResolvedValue(true);
      const result = await requestAnalyticsPermissions();
      expect(result).toBe(true);
      expect(mockPermissions.request).toHaveBeenCalledWith(
        GA4_ANALYTICS_PERMISSIONS
      );
    });

    it("returns false when user denies the permission prompt", async () => {
      mockPermissions.request.mockResolvedValue(false);
      const result = await requestAnalyticsPermissions();
      expect(result).toBe(false);
    });

    it("returns false on rejection without throwing (e.g. no user gesture)", async () => {
      mockPermissions.request.mockRejectedValue(
        new Error("This function must be called during a user gesture")
      );
      const result = await requestAnalyticsPermissions();
      expect(result).toBe(false);
    });
  });

  describe("No automatic permission request on Developer Workspace load", () => {
    it("checkAnalyticsPermissions does not call chrome.permissions.request", async () => {
      mockPermissions.contains.mockResolvedValue(false);
      await checkAnalyticsPermissions();
      expect(mockPermissions.request).not.toHaveBeenCalled();
    });
  });

  describe("Permission denied leaves feature disconnected and retryable", () => {
    it("denied permission does not affect chrome.identity state", async () => {
      mockPermissions.request.mockResolvedValue(false);
      await requestAnalyticsPermissions();
      // chrome.identity should never have been called
      expect(globalThis.chrome.identity.getAuthToken).not.toHaveBeenCalled();
    });
  });

  describe("Granted permission enables OAuth flow", () => {
    it("after permission grant, getAuthToken can be called", async () => {
      mockPermissions.contains.mockResolvedValue(true);

      const hasPerms = await checkAnalyticsPermissions();
      expect(hasPerms).toBe(true);

      // Now simulate the OAuth call that would follow
      (globalThis.chrome.identity.getAuthToken as any).mockImplementation(
        (_details: any, cb: (token: string | undefined) => void) => {
          cb("mock_token_after_grant");
        }
      );

      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          metricHeaders: [
            { name: "activeUsers" },
            { name: "screenPageViews" },
            { name: "engagementRate" },
            { name: "newUsers" },
            { name: "eventCount" },
            { name: "keyEvents" },
          ],
          rows: [
            {
              dimensionValues: [{ value: "date_range_0" }],
              metricValues: [
                { value: "10" },
                { value: "50" },
                { value: "0.5" },
                { value: "3" },
                { value: "50" },
                { value: "2" },
              ],
            },
          ],
        }),
      });

      const report = await fetchGA4Report("553647047", true);
      expect(report.propertyId).toBe("553647047");
      expect(report.visitors).toBe(10);
    });
  });

  describe("Already-connected projects remain usable", () => {
    it("when permissions are already granted, check returns true immediately", async () => {
      // Simulate state after previous grant (upgrade scenario or already connected)
      mockPermissions.contains.mockResolvedValue(true);

      const hasPerms = await checkAnalyticsPermissions();
      expect(hasPerms).toBe(true);
      // No request should be needed
      expect(mockPermissions.request).not.toHaveBeenCalled();
    });
  });

  describe("Non-extension environment fallback", () => {
    it("checkAnalyticsPermissions returns true when chrome.permissions is undefined", async () => {
      (globalThis as any).chrome = {};
      const result = await checkAnalyticsPermissions();
      expect(result).toBe(true);
    });

    it("requestAnalyticsPermissions returns true when chrome.permissions is undefined", async () => {
      (globalThis as any).chrome = {};
      const result = await requestAnalyticsPermissions();
      expect(result).toBe(true);
    });
  });
});
