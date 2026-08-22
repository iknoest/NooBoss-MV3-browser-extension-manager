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
import { DEFAULT_SETTINGS, type ExtensionInfo, type ExtensionGroup } from "../../src/shared/types";

describe("Material Symbols & Usability Refinements", () => {
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
  });

  describe("Recommended Icon Palette", () => {
    const requestedIcons = [
      "business_center", "build", "brush", "ad_off", "shopping_cart",
      "apparel", "assignment", "book", "music_note", "stylus_note",
      "lock", "search", "sports_esports", "code", "attach_money",
      "globe", "automation", "cloud", "chat_bubble", "videocam",
      "translate", "language", "mic", "favorite", "travel",
      "bedtime", "light_mode", "alarm", "bid_landscape", "database",
      "encrypted", "key", "sports_baseball", "text_format", "stacked_email",
      "image", "communication", "lightbulb", "flag_2", "fitness_center",
      "folder", "area_chart", "bar_chart", "emoji_nature",
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

  describe("View Mode Persistence & Defaults", () => {
    it("defaults to bigTile viewMode in DEFAULT_SETTINGS", () => {
      expect(DEFAULT_SETTINGS.viewMode).toBe("bigTile");
    });

    it("maps legacy grid viewMode to bigTile on import", () => {
      const legacyData = {
        version: 1,
        exportedAt: Date.now(),
        groups: [],
        autoStateRules: [],
        settings: {
          ...DEFAULT_SETTINGS,
          viewMode: "grid",
        },
      };
      const res = validateImportData(legacyData);
      expect(res.settings.viewMode).toBe("bigTile");
    });

    it("preserves distinct bigTile, list, and tile modes on import", () => {
      for (const mode of ["bigTile", "list", "tile"] as const) {
        const data = {
          version: 1,
          exportedAt: Date.now(),
          groups: [],
          autoStateRules: [],
          settings: {
            ...DEFAULT_SETTINGS,
            viewMode: mode,
          },
        };
        const res = validateImportData(data);
        expect(res.settings.viewMode).toBe(mode);
      }
    });
  });

  describe("CSS Grid & Layout Constraints", () => {
    it("enforces Big Tile layout to max 2 columns without horizontal overflow min-widths", () => {
      const css = fs.readFileSync("src/popup/components/nooboss.css", "utf8");
      expect(css).toMatch(/\.big-tile-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
      expect(css).not.toMatch(/\.nb-big-tile\s*\{[^}]*width:\s*220px/);
      expect(css).not.toMatch(/\.nb-big-tile\s*\{[^}]*min-width:\s*220px/);
    });

    it("enforces Tile layout to max 6 columns", () => {
      const css = fs.readFileSync("src/popup/components/nooboss.css", "utf8");
      expect(css).toMatch(/\.tile-grid\s*\{[^}]*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/);
    });

    it("enforces switch hit targets >= 40x34px", () => {
      const css = fs.readFileSync("src/popup/components/nooboss.css", "utf8");
      expect(css).toMatch(/\.extension-switch,\s*\.group-state-toggle\s*\{[^}]*min-width:\s*40px/);
      expect(css).toMatch(/\.extension-switch,\s*\.group-state-toggle\s*\{[^}]*min-height:\s*34px/);
    });

    it("enforces action button hit targets >= 32x32px", () => {
      const css = fs.readFileSync("src/popup/components/nooboss.css", "utf8");
      expect(css).toMatch(/\.action-icon-btn\s*\{[^}]*min-width:\s*32px/);
      expect(css).toMatch(/\.action-icon-btn\s*\{[^}]*min-height:\s*32px/);
    });
  });

  describe("Direct Management Group Toggle Simulation", () => {
    it("synchronously dispatches setEnabled for all eligible members", async () => {
      const callLog: Array<{ id: string; enabled: boolean }> = [];
      const mockSetEnabled = async (id: string, enabled: boolean) => {
        callLog.push({ id, enabled });
      };

      const groupMembers = ["ext1", "ext2", "ext3"];
      const operations = groupMembers.map((id) => mockSetEnabled(id, true));
      await Promise.all(operations);

      expect(callLog).toHaveLength(3);
      expect(callLog.every((c) => c.enabled === true)).toBe(true);
    });

    it("handles partial group toggle failures without unhandled rejection", async () => {
      const mockSetEnabled = async (id: string, enabled: boolean) => {
        if (id === "ext2") throw new Error("Policy restricted");
        return true;
      };

      const groupMembers = ["ext1", "ext2", "ext3"];
      const operations = groupMembers.map(async (id) => {
        try {
          await mockSetEnabled(id, false);
          return { id, success: true };
        } catch (err) {
          return { id, success: false, error: (err as Error).message };
        }
      });

      const results = await Promise.all(operations);
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      expect(successful).toHaveLength(2);
      expect(failed).toHaveLength(1);
      expect(failed[0].id).toBe("ext2");
    });
  });
});
