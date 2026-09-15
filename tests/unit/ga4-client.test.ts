import { describe, it, expect } from "vitest";
import {
  cleanPropertyId,
  buildGA4RunReportPayload,
  parseGA4RunReportResponse,
  getGA4RunReportUrl,
  GA4_TARGET_METRICS,
  GA4_READONLY_SCOPE,
} from "../../src/shared/ga4-client";

describe("GA4 Data API Client Module", () => {
  describe("cleanPropertyId", () => {
    it("strips properties/ prefix and trims whitespace", () => {
      expect(cleanPropertyId("123456789")).toBe("123456789");
      expect(cleanPropertyId("properties/123456789")).toBe("123456789");
      expect(cleanPropertyId("  properties/987654321  ")).toBe("987654321");
      expect(cleanPropertyId("")).toBe("");
      expect(cleanPropertyId(null as any)).toBe("");
    });
  });

  describe("buildGA4RunReportPayload", () => {
    it("builds correct 28-day rolling window request with target metrics", () => {
      const payload = buildGA4RunReportPayload();
      expect(payload.dateRanges).toEqual([
        { startDate: "28daysAgo", endDate: "yesterday" },
      ]);
      expect(payload.metrics.map((m) => m.name)).toEqual([
        "activeUsers",
        "newUsers",
        "eventCount",
        "keyEvents",
      ]);
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
    it("parses valid GA4 Data API response rows into typed metrics", () => {
      const mockResponse = {
        metricHeaders: [
          { name: "activeUsers", type: "TYPE_INTEGER" },
          { name: "newUsers", type: "TYPE_INTEGER" },
          { name: "eventCount", type: "TYPE_INTEGER" },
          { name: "keyEvents", type: "TYPE_INTEGER" },
        ],
        rows: [
          {
            metricValues: [
              { value: "1420" },
              { value: "310" },
              { value: "89450" },
              { value: "480" },
            ],
          },
        ],
        rowCount: 1,
      };

      const result = parseGA4RunReportResponse("123456789", mockResponse);
      expect(result.propertyId).toBe("123456789");
      expect(result.dateRangeDescription).toBe("Last 28 days");
      expect(result.activeUsers).toBe(1420);
      expect(result.newUsers).toBe(310);
      expect(result.eventCount).toBe(89450);
      expect(result.keyEvents).toBe(480);
    });

    it("parses empty rows response as zeroes", () => {
      const mockResponse = {
        metricHeaders: [
          { name: "activeUsers", type: "TYPE_INTEGER" },
          { name: "newUsers", type: "TYPE_INTEGER" },
          { name: "eventCount", type: "TYPE_INTEGER" },
          { name: "keyEvents", type: "TYPE_INTEGER" },
        ],
        rows: [],
        rowCount: 0,
      };

      const result = parseGA4RunReportResponse("123456789", mockResponse);
      expect(result.activeUsers).toBe(0);
      expect(result.newUsers).toBe(0);
      expect(result.eventCount).toBe(0);
      expect(result.keyEvents).toBe(0);
    });

    it("handles null / malformed response gracefully", () => {
      const result = parseGA4RunReportResponse("123456789", null);
      expect(result.activeUsers).toBeNull();
      expect(result.newUsers).toBeNull();
      expect(result.eventCount).toBeNull();
      expect(result.keyEvents).toBeNull();
    });
  });

  describe("API Specification Constants", () => {
    it("uses readonly analytics OAuth scope", () => {
      expect(GA4_READONLY_SCOPE).toBe("https://www.googleapis.com/auth/analytics.readonly");
    });

    it("has 4 target metrics defined", () => {
      expect(GA4_TARGET_METRICS.length).toBe(4);
      expect(GA4_TARGET_METRICS.map((m) => m.name)).toEqual([
        "activeUsers",
        "newUsers",
        "eventCount",
        "keyEvents",
      ]);
    });
  });
});
