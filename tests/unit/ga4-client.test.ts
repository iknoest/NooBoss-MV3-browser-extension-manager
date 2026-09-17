import { describe, it, expect } from "vitest";
import {
  cleanPropertyId,
  buildGA4RunReportPayload,
  parseGA4RunReportResponse,
  getGA4RunReportUrl,
  computeCountTrend,
  computeRateTrend,
  GA4_TARGET_METRICS,
  GA4_PRIMARY_KPIS,
  GA4_READONLY_SCOPE,
} from "../../src/shared/ga4-client";

describe("GA4 Data API Client Module", () => {
  describe("cleanPropertyId", () => {
    it("strips properties/ prefix and trims whitespace and trailing slashes", () => {
      expect(cleanPropertyId("123456789")).toBe("123456789");
      expect(cleanPropertyId("properties/123456789")).toBe("123456789");
      expect(cleanPropertyId("  properties/987654321/  ")).toBe("987654321");
      expect(cleanPropertyId("")).toBe("");
      expect(cleanPropertyId(null as any)).toBe("");
    });
  });

  describe("buildGA4RunReportPayload", () => {
    it("builds correct 28-day rolling window request with target metrics and comparison period", () => {
      const payload = buildGA4RunReportPayload();
      expect(payload.dateRanges).toEqual([
        { startDate: "28daysAgo", endDate: "today" },
        { startDate: "56daysAgo", endDate: "29daysAgo" },
      ]);
      expect(payload.metrics.map((m) => m.name)).toEqual([
        "activeUsers",
        "screenPageViews",
        "engagementRate",
        "newUsers",
        "eventCount",
        "keyEvents",
      ]);
    });
  });

  describe("computeCountTrend and computeRateTrend", () => {
    it("handles zero baseline by returning undefined to avoid repetitive badges", () => {
      expect(computeCountTrend(10, 0)).toBeUndefined();
      expect(computeCountTrend(0, 0)).toBeUndefined();
      expect(computeCountTrend(10, null)).toBeUndefined();
      expect(computeCountTrend(null, 10)).toBeUndefined();
    });

    it("computes percentage deltas for non-zero baseline", () => {
      expect(computeCountTrend(15, 10)).toBe("+50%");
      expect(computeCountTrend(5, 10)).toBe("−50%");
      expect(computeCountTrend(10, 10)).toBe("0%");
    });

    it("computes rate difference trends", () => {
      expect(computeRateTrend(0.35, 0.25)).toBe("+10pt");
      expect(computeRateTrend(0.20, 0.25)).toBe("−5pt");
      expect(computeRateTrend(0.20, 0.20)).toBe("0pt");
      expect(computeRateTrend(0.20, 0)).toBeUndefined();
    });
  });

  describe("getGA4RunReportUrl", () => {
    it("constructs official REST endpoint URL", () => {
      expect(getGA4RunReportUrl("123456789")).toBe(
        "https://analyticsdata.googleapis.com/v1beta/properties/123456789:runReport"
      );
      expect(getGA4RunReportUrl("properties/987654")).toBe(
        "https://analyticsdata.googleapis.com/v1beta/properties/987654:runReport"
      );
    });
  });

  describe("parseGA4RunReportResponse", () => {
    it("parses valid GA4 Data API response with zero baseline without per-metric badges", () => {
      const mockResponse = {
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
              { value: "32" },
              { value: "62" },
              { value: "0.3025" },
              { value: "33" },
            ],
          },
          {
            dimensionValues: [{ value: "date_range_1" }],
            metricValues: [
              { value: "0" },
              { value: "0" },
              { value: "0" },
              { value: "0" },
            ],
          },
        ],
        rowCount: 2,
      };

      const result = parseGA4RunReportResponse("552797256", mockResponse);
      expect(result.propertyId).toBe("552797256");
      expect(result.visitors).toBe(32);
      expect(result.views).toBe(62);
      expect(result.engagementRate).toBeCloseTo(0.3025);
      expect(result.newUsers).toBe(33);
      expect(result.hasPreviousBaseline).toBe(false);
      expect(result.visitorsTrend).toBeUndefined();
      expect(result.viewsTrend).toBeUndefined();
      expect(result.newUsersTrend).toBeUndefined();
      // Legacy compatibility
      expect(result.activeUsers).toBe(32);
      expect(result.eventCount).toBe(62);
    });

    it("parses valid GA4 Data API response with positive baseline into trend badges", () => {
      const mockResponse = {
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
              { value: "30" },
              { value: "60" },
              { value: "0.50" },
              { value: "15" },
            ],
          },
          {
            dimensionValues: [{ value: "date_range_1" }],
            metricValues: [
              { value: "20" },
              { value: "80" },
              { value: "0.40" },
              { value: "10" },
            ],
          },
        ],
        rowCount: 2,
      };

      const result = parseGA4RunReportResponse("552797256", mockResponse);
      expect(result.hasPreviousBaseline).toBe(true);
      expect(result.visitorsTrend).toBe("+50%");
      expect(result.viewsTrend).toBe("−25%");
      expect(result.engagementTrend).toBe("+10pt");
      expect(result.newUsersTrend).toBe("+50%");
    });

    it("parses empty rows response as zeroes", () => {
      const mockResponse = {
        metricHeaders: [
          { name: "activeUsers", type: "TYPE_INTEGER" },
          { name: "screenPageViews", type: "TYPE_INTEGER" },
          { name: "engagementRate", type: "TYPE_FLOAT" },
          { name: "newUsers", type: "TYPE_INTEGER" },
        ],
        rows: [],
        rowCount: 0,
      };

      const result = parseGA4RunReportResponse("123456789", mockResponse);
      expect(result.visitors).toBe(0);
      expect(result.views).toBe(0);
      expect(result.engagementRate).toBe(0);
      expect(result.newUsers).toBe(0);
      expect(result.visitorsTrend).toBeUndefined();
    });

    it("handles null / malformed response gracefully", () => {
      const result = parseGA4RunReportResponse("123456789", null);
      expect(result.visitors).toBeNull();
      expect(result.views).toBeNull();
      expect(result.engagementRate).toBeNull();
      expect(result.newUsers).toBeNull();
    });
  });

  describe("API Specification Constants", () => {
    it("uses readonly analytics OAuth scope", () => {
      expect(GA4_READONLY_SCOPE).toBe("https://www.googleapis.com/auth/analytics.readonly");
    });

    it("has 4 primary KPIs defined with canonical GA4 labels", () => {
      expect(GA4_PRIMARY_KPIS.length).toBe(4);
      expect(GA4_PRIMARY_KPIS.map((m) => m.name)).toEqual([
        "activeUsers",
        "screenPageViews",
        "engagementRate",
        "newUsers",
      ]);
      expect(GA4_PRIMARY_KPIS.map((m) => m.label)).toEqual([
        "Active users",
        "Views",
        "Engagement",
        "New users",
      ]);
      expect(GA4_TARGET_METRICS).toBe(GA4_PRIMARY_KPIS);
    });
  });
});
