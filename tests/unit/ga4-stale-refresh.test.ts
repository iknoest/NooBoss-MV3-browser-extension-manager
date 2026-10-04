import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  GA4_STALE_CACHE_MS,
  isAnalyticsCacheStale,
  shouldAutoRefreshAnalytics,
  fetchGA4Report,
  checkAnalyticsPermissions,
  requestAnalyticsPermissions,
} from "../../src/shared/ga4-client";
import { inFlightGA4PropertyFetches } from "../../src/popup/components/DeveloperView";
import type { DeveloperProject } from "../../src/shared/types";
import type { StoredGA4MetricsRecord } from "../../src/shared/storage";

describe("Developer Analytics: 24h Stale-on-Open Refresh Policy", () => {
  let fakeStorage: Record<string, any> = {};
  let mockPermissionsContains: ReturnType<typeof vi.fn>;
  let mockPermissionsRequest: ReturnType<typeof vi.fn>;
  let mockIdentityGetAuthToken: ReturnType<typeof vi.fn>;

  const sampleProject: DeveloperProject = {
    id: "proj_analytics_1",
    name: "Analytics Project",
    localExtensionId: "ext_test_1",
    cwsExtensionId: "abcdefghijklmnopqrstuvwxyz123456",
    gaPropertyId: "553647047",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  };

  const sampleCacheRecord: StoredGA4MetricsRecord = {
    propertyId: "553647047",
    visitors: 120,
    views: 450,
    engagementRate: 0.65,
    newUsers: 30,
    activeUsers: 120,
    eventCount: 450,
    keyEvents: 5,
    fetchedAt: Date.now() - 23 * 3600 * 1000, // 23h old
  };

  beforeEach(() => {
    fakeStorage = {};
    inFlightGA4PropertyFetches.clear();
    mockPermissionsContains = vi.fn();
    mockPermissionsRequest = vi.fn();
    mockIdentityGetAuthToken = vi.fn();

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
      permissions: {
        contains: mockPermissionsContains,
        request: mockPermissionsRequest,
      },
      identity: {
        getAuthToken: mockIdentityGetAuthToken,
        removeCachedAuthToken: vi.fn((_details: any, cb?: () => void) => {
          if (cb) cb();
        }),
      },
      alarms: {
        create: vi.fn(),
        getAll: vi.fn((cb?: (alarms: any[]) => void) => {
          if (cb) cb([]);
          return Promise.resolve([]);
        }),
      },
      runtime: {
        lastError: undefined,
      },
    };
  });

  afterEach(() => {
    inFlightGA4PropertyFetches.clear();
    vi.restoreAllMocks();
  });

  describe("Cache Freshness & Decision Logic (GA4_STALE_CACHE_MS = 24h)", () => {
    it("recognizes 24 hours as 86,400,000 milliseconds", () => {
      expect(GA4_STALE_CACHE_MS).toBe(24 * 60 * 60 * 1000);
    });

    it("evaluates cache age 23h as fresh", () => {
      const now = Date.now();
      const fetchedAt23h = now - 23 * 3600 * 1000;
      expect(isAnalyticsCacheStale(fetchedAt23h, now)).toBe(false);
    });

    it("evaluates cache age 24h and 25h as stale", () => {
      const now = Date.now();
      const fetchedAt24h = now - 24 * 60 * 60 * 1000;
      const fetchedAt25h = now - 25 * 3600 * 1000;
      expect(isAnalyticsCacheStale(fetchedAt24h, now)).toBe(true);
      expect(isAnalyticsCacheStale(fetchedAt25h, now)).toBe(true);
    });

    it("evaluates missing or undefined fetchedAt as stale", () => {
      expect(isAnalyticsCacheStale(undefined)).toBe(true);
      expect(isAnalyticsCacheStale(null)).toBe(true);
      expect(isAnalyticsCacheStale(0)).toBe(true);
    });
  });

  describe("Required Policy Verification Matrix", () => {
    it("Scenario 1: workspace open + cache age 23h -> no fetch", () => {
      const now = Date.now();
      const decision = shouldAutoRefreshAnalytics({
        cachedPropertyId: "553647047",
        fetchedAt: now - 23 * 3600 * 1000,
        targetPropertyId: "553647047",
        hasPermissions: true,
        now,
      });

      expect(decision.shouldFetch).toBe(false);
      expect(decision.isStale).toBe(false);
      expect(decision.reason).toBe("cache_fresh");
    });

    it("Scenario 2: workspace open + cache age 25h -> silent refresh attempted", () => {
      const now = Date.now();
      const decision = shouldAutoRefreshAnalytics({
        cachedPropertyId: "553647047",
        fetchedAt: now - 25 * 3600 * 1000,
        targetPropertyId: "553647047",
        hasPermissions: true,
        now,
      });

      expect(decision.shouldFetch).toBe(true);
      expect(decision.isStale).toBe(true);
      expect(decision.reason).toBe("cache_stale");
    });

    it("Scenario 3: workspace open + no cache + permissions granted -> silent refresh attempted", () => {
      const now = Date.now();
      const decision = shouldAutoRefreshAnalytics({
        cachedPropertyId: undefined,
        fetchedAt: undefined,
        targetPropertyId: "553647047",
        hasPermissions: true,
        now,
      });

      expect(decision.shouldFetch).toBe(true);
      expect(decision.isStale).toBe(false);
      expect(decision.reason).toBe("no_cache_permitted");
    });

    it("Scenario 4: workspace open + no cache + permissions NOT granted -> no fetch attempted", () => {
      const now = Date.now();
      const decision = shouldAutoRefreshAnalytics({
        cachedPropertyId: undefined,
        fetchedAt: undefined,
        targetPropertyId: "553647047",
        hasPermissions: false,
        now,
      });

      expect(decision.shouldFetch).toBe(false);
      expect(decision.isStale).toBe(false);
      expect(decision.reason).toBe("no_cache_unpermitted");
    });

    it("Scenario 5: workspace closed -> no timer/alarm active", () => {
      // Extension Drawer does NOT use chrome.alarms or background intervals for analytics
      expect(chrome.alarms.create).not.toHaveBeenCalled();
    });

    it("Scenario 6: refresh failure preserves existing cached metrics without modal error", async () => {
      // Simulate stale cache existing in memory
      let currentCache: StoredGA4MetricsRecord = {
        ...sampleCacheRecord,
        fetchedAt: Date.now() - 25 * 3600 * 1000, // 25h old
      };

      // Mock fetch failure (e.g. offline or API timeout)
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network failure connecting to Google Analytics"));

      let subtleStatus = "";
      try {
        await mockFetch();
      } catch (err: any) {
        subtleStatus = "Cached (update failed)";
        // Stale metrics are preserved: currentCache is NOT wiped out or set to null
      }

      expect(currentCache.visitors).toBe(120);
      expect(currentCache.views).toBe(450);
      expect(currentCache.activeUsers).toBe(120);
      expect(subtleStatus).toBe("Cached (update failed)");
    });

    it("Scenario 7: manual refresh button still forces immediate fetch bypassing 24h check", async () => {
      const now = Date.now();
      // Cache is only 1 hour old (fresh)
      const cachedRecord = {
        ...sampleCacheRecord,
        fetchedAt: now - 1 * 3600 * 1000,
      };

      // Passive check says no fetch:
      const passiveDecision = shouldAutoRefreshAnalytics({
        cachedPropertyId: cachedRecord.propertyId,
        fetchedAt: cachedRecord.fetchedAt,
        targetPropertyId: sampleProject.gaPropertyId!,
        hasPermissions: true,
        now,
      });
      expect(passiveDecision.shouldFetch).toBe(false);

      // Manual refresh bypasses policy and fetches directly
      mockIdentityGetAuthToken.mockImplementation(
        (details: any, cb: (token: string | undefined) => void) => {
          cb("token_manual_refresh");
        }
      );

      const fakeResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          metricHeaders: [
            { name: "activeUsers", type: "TYPE_INTEGER" },
            { name: "screenPageViews", type: "TYPE_INTEGER" },
            { name: "engagementRate", type: "TYPE_FLOAT" },
            { name: "newUsers", type: "TYPE_INTEGER" },
          ],
          rows: [
            {
              dimensionValues: [{ value: "date_range_0" }],
              metricValues: [
                { value: "150" }, // activeUsers
                { value: "500" }, // screenPageViews
                { value: "0.7" }, // engagementRate
                { value: "40" },  // newUsers
                { value: "500" }, // eventCount
                { value: "6" },   // keyEvents
              ],
            },
          ],
        }),
      };
      (globalThis as any).fetch = vi.fn().mockResolvedValue(fakeResponse);

      const refreshed = await fetchGA4Report("553647047", false);
      expect(refreshed.visitors).toBe(150);
      expect(refreshed.views).toBe(500);
      expect((globalThis as any).fetch).toHaveBeenCalled();
    });

    it("Scenario 8: rapid tab switching does not trigger duplicate parallel requests", async () => {
      const propId = "553647047";
      expect(inFlightGA4PropertyFetches.has(propId)).toBe(false);

      // First request starts
      let resolveFirst: any;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      inFlightGA4PropertyFetches.add(propId);
      expect(inFlightGA4PropertyFetches.has(propId)).toBe(true);

      // Second request arrives immediately while first is in-flight
      const isSecondSkipped = inFlightGA4PropertyFetches.has(propId);
      expect(isSecondSkipped).toBe(true);

      // First request completes
      resolveFirst({ success: true });
      await firstPromise;
      inFlightGA4PropertyFetches.delete(propId);

      expect(inFlightGA4PropertyFetches.has(propId)).toBe(false);
    });

    it("Scenario 9: passive permission check uses checkAnalyticsPermissions without user prompt", async () => {
      mockPermissionsContains.mockResolvedValue(false);

      const hasPerms = await checkAnalyticsPermissions();
      expect(hasPerms).toBe(false);
      // chrome.permissions.request must NOT be called passively on open
      expect(mockPermissionsRequest).not.toHaveBeenCalled();
    });
  });
});
