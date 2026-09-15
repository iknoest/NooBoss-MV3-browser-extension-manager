import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import {
  fetchGA4Report,
  getAuthToken,
  removeCachedAuthToken,
  clearAuthToken,
} from "../../src/shared/ga4-client";
import {
  getGA4MetricsMap,
  getProjectGA4Metrics,
  saveProjectGA4Metrics,
  clearProjectGA4Metrics,
} from "../../src/shared/storage";
import { STORAGE_KEYS } from "../../src/shared/types";

describe("GA4 Connection, Auth & Storage Subsystem", () => {
  let fakeStorage: Record<string, any> = {};

  beforeEach(() => {
    fakeStorage = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn((keys: any, cb?: (items: any) => void) => {
            const res: Record<string, any> = {};
            if (typeof keys === "string") {
              res[keys] = fakeStorage[keys];
            } else if (Array.isArray(keys)) {
              keys.forEach((k) => (res[k] = fakeStorage[k]));
            } else if (keys && typeof keys === "object") {
              Object.keys(keys).forEach((k) => {
                res[k] = fakeStorage[k] !== undefined ? fakeStorage[k] : keys[k];
              });
            }
            if (typeof cb === "function") {
              cb(res);
              return;
            }
            return Promise.resolve(res);
          }),
          set: vi.fn((items: Record<string, any>, cb?: () => void) => {
            Object.assign(fakeStorage, items);
            if (typeof cb === "function") {
              cb();
              return;
            }
            return Promise.resolve();
          }),
        },
      },
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

  describe("Manifest Configuration", () => {
    it("has required identity and analytics permissions and correct OAuth config", () => {
      const manifest = JSON.parse(fs.readFileSync("src/manifest.json", "utf8"));
      expect(manifest.permissions).toContain("identity");
      expect(manifest.host_permissions).toContain("https://analyticsdata.googleapis.com/*");
      expect(manifest.oauth2).toBeDefined();
      expect(manifest.oauth2.client_id).toBe(
        "799106519083-4abp5ksuf8mmqnh6tjret0guni0dbpt2.apps.googleusercontent.com"
      );
      expect(manifest.oauth2.scopes).toContain("https://www.googleapis.com/auth/analytics.readonly");
      expect(manifest.key).toBeDefined();
    });
  });

  describe("Token Management", () => {
    it("delegates to chrome.identity.getAuthToken with interactive flag", async () => {
      (globalThis.chrome.identity.getAuthToken as any).mockImplementation(
        (details: any, cb: (token: string | undefined) => void) => {
          expect(details.interactive).toBe(true);
          cb("mock_access_token_123");
        }
      );

      const token = await getAuthToken(true);
      expect(token).toBe("mock_access_token_123");
    });

    it("handles chrome.identity error during getAuthToken", async () => {
      (globalThis.chrome.identity.getAuthToken as any).mockImplementation(
        (_details: any, cb: (token: string | undefined) => void) => {
          globalThis.chrome.runtime.lastError = { message: "The user did not approve access." };
          cb(undefined);
        }
      );

      await expect(getAuthToken(true)).rejects.toThrow("The user did not approve access.");
    });

    it("removes cached token via chrome.identity.removeCachedAuthToken", async () => {
      await removeCachedAuthToken("stale_token_abc");
      expect(globalThis.chrome.identity.removeCachedAuthToken).toHaveBeenCalledWith(
        { token: "stale_token_abc" },
        expect.any(Function)
      );
    });

    it("clears cached token when clearAuthToken is invoked", async () => {
      (globalThis.chrome.identity.getAuthToken as any).mockImplementation(
        (_details: any, cb: (token: string | undefined) => void) => {
          cb("cached_token_xyz");
        }
      );

      await clearAuthToken();
      expect(globalThis.chrome.identity.removeCachedAuthToken).toHaveBeenCalledWith(
        { token: "cached_token_xyz" },
        expect.any(Function)
      );
    });
  });

  describe("fetchGA4Report", () => {
    it("successfully fetches report and formats metric numbers", async () => {
      (globalThis.chrome.identity.getAuthToken as any).mockImplementation(
        (_details: any, cb: (token: string | undefined) => void) => {
          cb("valid_token");
        }
      );

      const mockGA4Response = {
        metricHeaders: [
          { name: "activeUsers", type: "TYPE_INTEGER" },
          { name: "newUsers", type: "TYPE_INTEGER" },
          { name: "eventCount", type: "TYPE_INTEGER" },
          { name: "keyEvents", type: "TYPE_INTEGER" },
        ],
        rows: [
          {
            metricValues: [
              { value: "520" },
              { value: "85" },
              { value: "12300" },
              { value: "42" },
            ],
          },
        ],
        rowCount: 1,
      };

      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockGA4Response,
      });

      const report = await fetchGA4Report("553647047", true);
      expect(report.propertyId).toBe("553647047");
      expect(report.activeUsers).toBe(520);
      expect(report.newUsers).toBe(85);
      expect(report.eventCount).toBe(12300);
      expect(report.keyEvents).toBe(42);
      expect(report.fetchedAt).toBeGreaterThan(0);
    });

    it("handles 401 error by invalidating token", async () => {
      (globalThis.chrome.identity.getAuthToken as any).mockImplementation(
        (_details: any, cb: (token: string | undefined) => void) => {
          cb("expired_token");
        }
      );

      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: "Request had invalid authentication credentials." },
        }),
      });

      await expect(fetchGA4Report("553647047", false)).rejects.toThrow("expired or invalid");
      expect(globalThis.chrome.identity.removeCachedAuthToken).toHaveBeenCalledWith(
        { token: "expired_token" },
        expect.any(Function)
      );
    });

    it("handles 403 permission denied with clear message", async () => {
      (globalThis.chrome.identity.getAuthToken as any).mockImplementation(
        (_details: any, cb: (token: string | undefined) => void) => {
          cb("valid_token");
        }
      );

      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: { message: "User does not have sufficient permissions for this property." },
        }),
      });

      await expect(fetchGA4Report("553647047", true)).rejects.toThrow("Access denied");
    });
  });

  describe("Storage Subsystem Safety", () => {
    it("stores only parsed metric aggregates, NEVER raw tokens", async () => {
      const record = {
        propertyId: "553647047",
        activeUsers: 100,
        newUsers: 20,
        eventCount: 5000,
        keyEvents: 10,
        fetchedAt: Date.now(),
      };

      await saveProjectGA4Metrics("proj-nowebp", record);

      const storedMap = await getGA4MetricsMap();
      expect(storedMap["proj-nowebp"]).toEqual(record);

      const single = await getProjectGA4Metrics("proj-nowebp");
      expect(single).toEqual(record);

      // Verify no token keys exist anywhere in storage
      const storageKeys = Object.keys(fakeStorage);
      expect(storageKeys).toContain(STORAGE_KEYS.GA4_METRICS);
      const dumped = JSON.stringify(fakeStorage);
      expect(dumped).not.toContain("token");
      expect(dumped).not.toContain("bearer");
      expect(dumped).not.toContain("oauth");

      // Test clearing
      await clearProjectGA4Metrics("proj-nowebp");
      const cleared = await getProjectGA4Metrics("proj-nowebp");
      expect(cleared).toBeNull();
    });
  });
});
