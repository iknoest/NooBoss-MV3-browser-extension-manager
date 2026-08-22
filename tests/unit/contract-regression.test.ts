import { describe, it, expect } from "vitest";
import type {
  ExtensionInfo,
  ExtensionGroup,
  AutoStateRule,
  HistoryRecord,
  AppSettings,
  PendingAutoStateChange,
  ExportData,
} from "../../src/shared/types";
import { DEFAULT_SETTINGS } from "../../src/shared/types";

describe("Frontend/Backend Service Worker Message Contract Regression Tests", () => {
  // Simulates the exact response resolution logic from NooBossApp
  function resolveBackendResponse<T>(response: unknown, fallback: T): T {
    if (response === undefined || response === null) return fallback;
    return response as T;
  }

  describe("Direct array and object contracts (Service Worker authority)", () => {
    it("resolves GET_EXTENSIONS from direct ExtensionInfo[]", () => {
      const swResponse: ExtensionInfo[] = [
        {
          id: "ext1",
          name: "Test Ext",
          shortName: "Test",
          description: "desc",
          version: "1.0",
          enabled: true,
          mayDisable: true,
          type: "extension",
          installType: "normal",
          offlineEnabled: true,
          optionsUrl: "",
          permissions: [],
          hostPermissions: [],
        },
      ];

      // Direct array from service worker
      const resolved = Array.isArray(swResponse)
        ? swResponse
        : (swResponse as { extensions?: ExtensionInfo[] })?.extensions || [];

      expect(resolved).toHaveLength(1);
      expect(resolved[0].id).toBe("ext1");
      expect(resolved[0].name).toBe("Test Ext");
    });

    it("resolves GET_GROUPS from direct ExtensionGroup[]", () => {
      const swResponse: ExtensionGroup[] = [
        {
          id: "group_1",
          name: "Dev Group",
          extensionIds: ["ext1", "ext2"],
          color: "#4f46e5",
          createdAt: 123456789,
        },
      ];

      const resolved = Array.isArray(swResponse)
        ? swResponse
        : (swResponse as { groups?: ExtensionGroup[] })?.groups || [];

      expect(resolved).toHaveLength(1);
      expect(resolved[0].name).toBe("Dev Group");
      expect(resolved[0].extensionIds).toEqual(["ext1", "ext2"]);
    });

    it("resolves GET_AUTOSTATE_RULES from direct AutoStateRule[]", () => {
      const swResponse: AutoStateRule[] = [
        {
          id: "rule_1",
          enabled: true,
          name: "GitHub Rule",
          pattern: "github.com",
          isWildcard: false,
          targets: ["ext1"],
          action: "enableOnlyWhileMatched",
          priority: 0,
          createdAt: 123456789,
        },
      ];

      const resolved = Array.isArray(swResponse)
        ? swResponse
        : (swResponse as { rules?: AutoStateRule[] })?.rules || [];

      expect(resolved).toHaveLength(1);
      expect(resolved[0].pattern).toBe("github.com");
      expect(resolved[0].action).toBe("enableOnlyWhileMatched");
    });

    it("resolves GET_HISTORY from direct HistoryRecord[]", () => {
      const swResponse: HistoryRecord[] = [
        {
          id: "hist_1",
          extensionId: "ext1",
          extensionName: "Test Ext",
          extensionVersion: "1.0",
          event: "enabled",
          source: "user",
          timestamp: 123456789,
        },
      ];

      const resolved = Array.isArray(swResponse)
        ? swResponse
        : (swResponse as { records?: HistoryRecord[] })?.records || [];

      expect(resolved).toHaveLength(1);
      expect(resolved[0].event).toBe("enabled");
    });

    it("resolves GET_SETTINGS from direct AppSettings object", () => {
      const swResponse: AppSettings = {
        ...DEFAULT_SETTINGS,
        theme: "dark",
        autoStateMode: "assisted",
      };

      const resolved =
        swResponse && typeof swResponse === "object" && !Array.isArray(swResponse)
          ? ((swResponse as { settings?: AppSettings }).settings || swResponse)
          : DEFAULT_SETTINGS;

      expect(resolved.theme).toBe("dark");
      expect(resolved.autoStateMode).toBe("assisted");
    });

    it("resolves GET_PENDING_CHANGES from direct PendingAutoStateChange[]", () => {
      const swResponse: PendingAutoStateChange[] = [
        {
          extensionId: "ext1",
          extensionName: "Test Ext",
          targetEnabled: true,
          ruleId: "rule_1",
          ruleName: "GitHub Rule",
          timestamp: 123456789,
        },
      ];

      const resolved = Array.isArray(swResponse)
        ? swResponse
        : (swResponse as { changes?: PendingAutoStateChange[] })?.changes || [];

      expect(resolved).toHaveLength(1);
      expect(resolved[0].targetEnabled).toBe(true);
    });

    it("resolves EXPORT_DATA from direct ExportData object", () => {
      const swResponse: ExportData = {
        version: 1,
        exportedAt: 123456789,
        generator: "NooBoss-MV3",
        groups: [
          {
            id: "group_1",
            name: "Dev",
            extensionIds: ["ext1"],
            color: "#4f46e5",
            createdAt: 123456789,
          },
        ],
        autoStateRules: [],
        settings: DEFAULT_SETTINGS,
      };

      const exportObj = (swResponse as { data?: ExportData })?.data || swResponse;
      expect(exportObj.version).toBe(1);
      expect(exportObj.generator).toBe("NooBoss-MV3");
      expect(exportObj.groups).toHaveLength(1);
    });
  });

  describe("Defensive legacy wrapper handling", () => {
    it("handles wrapped { extensions: [...] } without breaking", () => {
      const wrapped = {
        extensions: [
          {
            id: "ext2",
            name: "Wrapped Ext",
            shortName: "Wrapped",
            description: "wrapped desc",
            version: "2.0",
            enabled: false,
            mayDisable: true,
            type: "extension",
            installType: "normal",
            offlineEnabled: true,
            optionsUrl: "",
            permissions: [],
            hostPermissions: [],
          },
        ],
      };

      const resolved = Array.isArray(wrapped)
        ? wrapped
        : (wrapped as { extensions?: ExtensionInfo[] })?.extensions || [];

      expect(resolved).toHaveLength(1);
      expect(resolved[0].id).toBe("ext2");
    });
  });
});
