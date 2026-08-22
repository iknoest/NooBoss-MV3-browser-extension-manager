import { describe, it, expect } from "vitest";
import { computeGroupAggregateState } from "../../src/popup/components/GroupStateToggle";
import { searchMaterialSymbols, MATERIAL_SYMBOLS } from "../../src/popup/components/MaterialSymbols";
import { validateImportData } from "../../src/shared/import-export";
import type { ExtensionInfo } from "../../src/shared/types";

describe("Modernization Features & Group State", () => {
  const sampleExtensions: ExtensionInfo[] = [
    { id: "ext1", name: "Ext 1", version: "1.0", enabled: true, type: "extension", installType: "normal", mayDisable: true } as unknown as ExtensionInfo,
    { id: "ext2", name: "Ext 2", version: "1.0", enabled: false, type: "extension", installType: "normal", mayDisable: true } as unknown as ExtensionInfo,
    { id: "ext3", name: "Ext 3", version: "1.0", enabled: true, type: "extension", installType: "normal", mayDisable: true } as unknown as ExtensionInfo,
  ];

  describe("computeGroupAggregateState", () => {
    it("returns empty when extensionIds is empty", () => {
      expect(computeGroupAggregateState([], sampleExtensions)).toBe("empty");
    });

    it("returns empty when no matching extension IDs exist in installed list", () => {
      expect(computeGroupAggregateState(["nonexistent_id"], sampleExtensions)).toBe("empty");
    });

    it("returns allOn when all member extensions are enabled", () => {
      expect(computeGroupAggregateState(["ext1", "ext3"], sampleExtensions)).toBe("allOn");
    });

    it("returns allOff when all member extensions are disabled", () => {
      expect(computeGroupAggregateState(["ext2"], sampleExtensions)).toBe("allOff");
    });

    it("returns mixed when some member extensions are enabled and some are disabled", () => {
      expect(computeGroupAggregateState(["ext1", "ext2"], sampleExtensions)).toBe("mixed");
    });
  });

  describe("searchMaterialSymbols (Offline catalog)", () => {
    it("provides the default folder symbol with SVG path", () => {
      expect(MATERIAL_SYMBOLS.folder).toBeDefined();
      expect(MATERIAL_SYMBOLS.folder.svg).toContain("<path");
    });

    it("searches symbols by exact and prefix name", () => {
      const codeResults = searchMaterialSymbols("code");
      expect(codeResults.length).toBeGreaterThan(0);
      expect(codeResults[0].name).toBe("code");
    });

    it("searches symbols by keyword tokens (e.g. adblock -> block)", () => {
      const adblockResults = searchMaterialSymbols("adblock");
      expect(adblockResults.some((s) => s.name === "block")).toBe(true);
    });

    it("returns all symbols when query is empty", () => {
      const allResults = searchMaterialSymbols("");
      expect(allResults.length).toBe(Object.keys(MATERIAL_SYMBOLS).length);
    });
  });

  describe("Group Icon & Theme Schema Validation", () => {
    it("validates full export/import schema with material symbol icon", () => {
      const importData = {
        version: 1,
        exportedAt: Date.now(),
        groups: [
          {
            id: "g1",
            name: "Dev Tools",
            extensionIds: ["ext1"],
            icon: { type: "material", name: "code" },
          },
        ],
        autoStateRules: [],
        settings: {
          theme: "dark",
          accentPreset: "purple",
          accentColor: "#9333ea",
          autoStateEnabled: true,
          autoStateMode: "automatic",
          notifyInstallUninstall: true,
          notifyStateChange: true,
          notifyAutoState: true,
          historyTrackInstall: true,
          historyTrackUninstall: true,
          historyTrackEnable: true,
          historyTrackDisable: true,
          historyMaxRecords: 5000,
          viewMode: "grid",
          showDisabledFirst: false,
        },
      };

      const result = validateImportData(importData);
      expect(result).toBeDefined();
      expect(result.groups[0].icon).toEqual({ type: "material", name: "code" });
      expect(result.settings.accentPreset).toBe("purple");
      expect(result.settings.accentColor).toBe("#9333ea");
    });

    it("validates full export/import schema with custom dataUrl icon", () => {
      const importData = {
        version: 1,
        exportedAt: Date.now(),
        groups: [
          {
            id: "g2",
            name: "Custom Icon Group",
            extensionIds: ["ext1"],
            icon: { type: "custom", dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==" },
          },
        ],
        autoStateRules: [],
        settings: {
          theme: "system",
          accentPreset: "default",
          accentColor: "#1a73e8",
          autoStateEnabled: true,
          autoStateMode: "automatic",
          notifyInstallUninstall: true,
          notifyStateChange: true,
          notifyAutoState: true,
          historyTrackInstall: true,
          historyTrackUninstall: true,
          historyTrackEnable: true,
          historyTrackDisable: true,
          historyMaxRecords: 5000,
          viewMode: "grid",
          showDisabledFirst: false,
        },
      };

      const result = validateImportData(importData);
      expect(result).toBeDefined();
      expect(result.groups[0].icon).toEqual({
        type: "custom",
        dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      });
    });

    it("validates full export/import schema with legacy string icon safely", () => {
      const importData = {
        version: 1,
        exportedAt: Date.now(),
        groups: [
          {
            id: "g3",
            name: "Legacy String Group",
            extensionIds: [],
            icon: "folder",
          },
        ],
        autoStateRules: [],
        settings: {
          theme: "light",
          accentPreset: "blue",
          accentColor: "#2563eb",
          autoStateEnabled: false,
          autoStateMode: "assisted",
          notifyInstallUninstall: false,
          notifyStateChange: false,
          notifyAutoState: false,
          historyTrackInstall: false,
          historyTrackUninstall: false,
          historyTrackEnable: false,
          historyTrackDisable: false,
          historyMaxRecords: 1000,
          viewMode: "list",
          showDisabledFirst: true,
        },
      };

      const result = validateImportData(importData);
      expect(result).toBeDefined();
      expect(result.groups[0].icon).toBe("folder");
    });
  });
});
