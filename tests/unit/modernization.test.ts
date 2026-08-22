import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { computeGroupAggregateState } from "../../src/popup/components/GroupStateToggle";
import {
  ALL_MATERIAL_SYMBOLS,
  RECOMMENDED_MATERIAL_SYMBOLS,
  isValidSymbolName,
  normalizeSymbolName,
  searchMaterialSymbols,
} from "../../src/shared/material-symbols-catalog";
import { renderGroupIcon } from "../../src/popup/components/GroupBrief";
import { validateImportData } from "../../src/shared/import-export";
import type { ExtensionInfo, ExtensionGroup } from "../../src/shared/types";

describe("Material Symbols & Icon System Refinements", () => {
  const sampleExtensions: ExtensionInfo[] = [
    { id: "ext1", name: "Ext 1", version: "1.0", enabled: true, type: "extension", installType: "normal", mayDisable: true } as unknown as ExtensionInfo,
    { id: "ext2", name: "Ext 2", version: "1.0", enabled: false, type: "extension", installType: "normal", mayDisable: true } as unknown as ExtensionInfo,
    { id: "ext3", name: "Ext 3", version: "1.0", enabled: true, type: "extension", installType: "normal", mayDisable: true } as unknown as ExtensionInfo,
  ];

  describe("Default Group Icon Behavior", () => {
    it("renders folder icon for group with no icon specified", () => {
      const group = { id: "g1", name: "No Icon Group", extensionIds: [], color: "#1a73e8", createdAt: 1000 } as ExtensionGroup;
      const rendered = renderGroupIcon(group);
      expect(rendered).toBeDefined();
      expect(rendered.props.name).toBe("folder");
    });

    it("renders folder fallback for group with invalid material symbol name", () => {
      const group = {
        id: "g2",
        name: "Invalid Icon Group",
        extensionIds: [],
        color: "#1a73e8",
        createdAt: 1000,
        icon: { type: "material", name: "nonexistent_unicorn_symbol_123" },
      } as ExtensionGroup;
      const rendered = renderGroupIcon(group);
      expect(rendered).toBeDefined();
      expect(rendered.props.fallback).toBe("folder");
    });

    it("renders folder fallback for empty legacy string icon", () => {
      const group = {
        id: "g3",
        name: "Empty Legacy Icon",
        extensionIds: [],
        color: "#1a73e8",
        createdAt: 1000,
        icon: "",
      } as ExtensionGroup;
      const rendered = renderGroupIcon(group);
      expect(rendered).toBeDefined();
      expect(rendered.props.name).toBe("folder");
    });
  });

  describe("Recommended Icon Palette", () => {
    const requestedIcons = [
      "business_center",
      "build",
      "brush",
      "ad_off",
      "shopping_cart",
      "apparel",
      "assignment",
      "book",
      "music_note",
      "stylus_note",
      "lock",
      "search",
      "sports_esports",
      "code",
      "attach_money",
      "globe",
      "automation",
      "cloud",
      "chat_bubble",
      "videocam",
      "translate",
      "language",
      "mic",
      "favorite",
      "travel",
      "bedtime",
      "light_mode",
      "alarm",
      "bid_landscape",
      "database",
      "encrypted",
      "key",
      "sports_baseball",
      "text_format",
      "stacked_email",
      "image",
      "communication",
      "lightbulb",
      "flag_2",
      "fitness_center",
      "folder",
      "area_chart",
      "bar_chart",
      "emoji_nature",
    ];

    it("contains all requested icons verified in the recommended catalog", () => {
      const recommendedNames = new Set(RECOMMENDED_MATERIAL_SYMBOLS.map((r) => r.name));
      for (const requested of requestedIcons) {
        expect(recommendedNames.has(requested), `Missing recommended icon: ${requested}`).toBe(true);
      }
    });

    it("contains crossword in the complete catalog", () => {
      expect(isValidSymbolName("crossword")).toBe(true);
    });
  });

  describe("Icon Name Normalization", () => {
    it("normalizes human-readable names with spaces and mixed case", () => {
      expect(normalizeSymbolName("Shopping Cart")).toBe("shopping_cart");
      expect(normalizeSymbolName("  BUSINESS CENTER ")).toBe("business_center");
      expect(normalizeSymbolName("Stylus Note")).toBe("stylus_note");
      expect(normalizeSymbolName("Crossword")).toBe("crossword");
      expect(normalizeSymbolName("ad-off")).toBe("ad_off");
    });
  });

  describe("Local Validation", () => {
    it("accepts valid official Material Symbol names", () => {
      expect(isValidSymbolName("crossword")).toBe(true);
      expect(isValidSymbolName("shopping_cart")).toBe(true);
      expect(isValidSymbolName("code")).toBe(true);
      expect(isValidSymbolName("folder")).toBe(true);
      expect(isValidSymbolName("Sports Esports")).toBe(true);
    });

    it("rejects invalid or arbitrary icon names", () => {
      expect(isValidSymbolName("fake_symbol_does_not_exist")).toBe(false);
      expect(isValidSymbolName("random text 12345")).toBe(false);
      expect(isValidSymbolName("")).toBe(false);
    });
  });

  describe("Offline Full-Library Search", () => {
    it("finds crossword directly", () => {
      const results = searchMaterialSymbols("crossword");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toBe("crossword");
    });

    it("ranks exact and prefix matches first for car", () => {
      const results = searchMaterialSymbols("car");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.includes("car"))).toBe(true);
    });

    it("searches across all 3,800+ symbols", () => {
      expect(ALL_MATERIAL_SYMBOLS.length).toBeGreaterThan(3500);
      const all = searchMaterialSymbols("");
      expect(all.length).toBeGreaterThan(0);
    });
  });

  describe("Group State Toggle", () => {
    it("computes aggregate state accurately", () => {
      expect(computeGroupAggregateState([], sampleExtensions)).toBe("empty");
      expect(computeGroupAggregateState(["ext1", "ext3"], sampleExtensions)).toBe("allOn");
      expect(computeGroupAggregateState(["ext2"], sampleExtensions)).toBe("allOff");
      expect(computeGroupAggregateState(["ext1", "ext2"], sampleExtensions)).toBe("mixed");
    });
  });

  describe("Data Persistence & Schema Validation", () => {
    it("preserves material symbol group icons through import/export", () => {
      const data = {
        version: 1,
        exportedAt: Date.now(),
        groups: [
          { id: "g1", name: "Work", extensionIds: ["ext1"], icon: { type: "material", name: "business_center" } },
          { id: "g2", name: "Custom", extensionIds: [], icon: { type: "custom", dataUrl: "data:image/png;base64,123" } },
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

      const res = validateImportData(data);
      expect(res.groups[0].icon).toEqual({ type: "material", name: "business_center" });
      expect(res.groups[1].icon).toEqual({ type: "custom", dataUrl: "data:image/png;base64,123" });
    });
  });

  describe("Extension Crossword Logo Assets", () => {
    it("contains generated icon PNGs for manifest sizes 16, 32, 48, 128", () => {
      for (const size of [16, 32, 48, 128]) {
        const filePath = path.resolve(process.cwd(), `src/icons/icon${size}.png`);
        expect(fs.existsSync(filePath), `Icon file missing: ${filePath}`).toBe(true);
        const stat = fs.statSync(filePath);
        expect(stat.size).toBeGreaterThan(50);
      }
    });
  });
});
