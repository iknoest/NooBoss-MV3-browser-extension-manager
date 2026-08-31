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
import { validateImportData } from "../../src/shared/import-export";

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

    it("resolves EXPORT_DATA from direct ExportData object and catches bug where res.data was required", () => {
      const rawSwResponse: ExportData = {
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

      // 1. Demonstrate why the previous buggy code failed:
      const buggyExtract = (rawSwResponse as { data?: ExportData })?.data;
      expect(buggyExtract).toBeUndefined(); // Buggy code got undefined because response is raw ExportData

      // 2. Test fixed consumer extract logic:
      const resolved =
        rawSwResponse && typeof rawSwResponse === "object" && !("error" in rawSwResponse)
          ? ("data" in rawSwResponse && (rawSwResponse as { data: ExportData }).data ? (rawSwResponse as { data: ExportData }).data : rawSwResponse)
          : null;

      expect(resolved).not.toBeNull();
      expect(resolved?.version).toBe(1);
      expect(resolved?.generator).toBe("NooBoss-MV3");
      expect(resolved?.groups).toHaveLength(1);

      // 3. Verify JSON serialization structure:
      const jsonString = JSON.stringify(resolved, null, 2);
      const parsed = JSON.parse(jsonString);
      expect(parsed.version).toBe(1);
      expect(parsed.groups).toBeDefined();
      expect(parsed.autoStateRules).toBeDefined();
      expect(parsed.settings).toBeDefined();

      // 4. Verify filename format:
      const filename = `extension-drawer-backup-${new Date().toISOString().slice(0, 10)}.json`;
      expect(filename).toMatch(/^extension-drawer-backup-\d{4}-\d{2}-\d{2}\.json$/);

      // 5. Verify import validator accepts newly exported object:
      const validated = validateImportData(parsed);
      expect(validated.version).toBe(1);
      expect(validated.groups[0].name).toBe("Dev");
    });

    it("rejects error or empty response without creating download payload", () => {
      const errorResponse = { error: "Storage error" };
      const nullResponse = null;
      const undefinedResponse = undefined;

      const extractPayload = (res: unknown) => {
        const exportObj =
          res && typeof res === "object" && !("error" in res)
            ? ("data" in res && (res as { data: unknown }).data ? (res as { data: unknown }).data : res)
            : null;
        if (exportObj && typeof exportObj === "object" && "version" in exportObj) {
          return exportObj;
        }
        return null;
      };

      expect(extractPayload(errorResponse)).toBeNull();
      expect(extractPayload(nullResponse)).toBeNull();
      expect(extractPayload(undefinedResponse)).toBeNull();
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
