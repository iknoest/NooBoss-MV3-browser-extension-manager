import { describe, it, expect } from "vitest";
import fs from "fs";
import { sortExtensions, SortMode } from "../../src/popup/components/Selector";
import type { ExtensionInfo, HistoryRecord } from "../../src/shared/types";

describe("Outcome A — Clarified Extension Sorting UX", () => {
  const sampleExtensions: ExtensionInfo[] = [
    {
      id: "ext_z",
      name: "Zeta Extension",
      version: "1.0.0",
      enabled: false,
      installType: "normal",
      type: "extension",
      optionsUrl: "",
    } as ExtensionInfo,
    {
      id: "ext_b",
      name: "Beta Tool",
      version: "2.0.0",
      enabled: true,
      installType: "normal",
      type: "extension",
      optionsUrl: "",
    } as ExtensionInfo,
    {
      id: "ext_a",
      name: "Alpha Addon",
      version: "1.1.0",
      enabled: false,
      installType: "normal",
      type: "extension",
      optionsUrl: "",
    } as ExtensionInfo,
    {
      id: "ext_c",
      name: "Charlie Dev",
      version: "0.1.0",
      enabled: true,
      installType: "development",
      type: "extension",
      optionsUrl: "",
    } as ExtensionInfo,
  ];

  const sampleHistory: HistoryRecord[] = [
    {
      id: "rec_1",
      extensionId: "ext_z",
      extensionName: "Zeta Extension",
      extensionVersion: "1.0.0",
      timestamp: 1000,
      event: "installed",
      source: "user",
    },
    {
      id: "rec_2",
      extensionId: "ext_b",
      extensionName: "Beta Tool",
      extensionVersion: "2.0.0",
      timestamp: 2000,
      event: "enabled",
      source: "user",
    },
    {
      id: "rec_3",
      extensionId: "ext_b",
      extensionName: "Beta Tool",
      extensionVersion: "2.0.0",
      timestamp: 3000,
      event: "disabled",
      source: "user",
    },
    {
      id: "rec_4",
      extensionId: "ext_b",
      extensionName: "Beta Tool",
      extensionVersion: "2.0.0",
      timestamp: 4000,
      event: "enabled",
      source: "user",
    },
    {
      id: "rec_5",
      extensionId: "ext_a",
      extensionName: "Alpha Addon",
      extensionVersion: "1.1.0",
      timestamp: 5000,
      event: "disabled",
      source: "user",
    },
    // ext_c has 0 recorded history events
  ];

  describe("Sort Modes Behavior", () => {
    it("Mode 1: Recently installed / updated sorts by newest install/update event, unknown dates below alphabetical", () => {
      const sorted = sortExtensions(sampleExtensions, "recently_installed", sampleHistory);
      // ext_z has installed event at 1000 -> comes first
      // ext_a, ext_b, ext_c have no install/update history -> alphabetical tie-break below
      expect(sorted.map((e) => e.id)).toEqual(["ext_z", "ext_a", "ext_b", "ext_c"]);
    });

    it("Mode 2: Name A–Z sorts alphabetically by name", () => {
      const sorted = sortExtensions(sampleExtensions, "name_asc");
      expect(sorted.map((e) => e.id)).toEqual(["ext_a", "ext_b", "ext_c", "ext_z"]);
    });

    it("Mode 3: Enabled first prioritizes active extensions, disabled second, alphabetical tie-break", () => {
      const sorted = sortExtensions(sampleExtensions, "enabled_first");
      // Enabled: ext_b ("Beta Tool"), ext_c ("Charlie Dev")
      // Disabled: ext_a ("Alpha Addon"), ext_z ("Zeta Extension")
      expect(sorted.map((e) => e.id)).toEqual(["ext_b", "ext_c", "ext_a", "ext_z"]);
      expect(sorted[0].enabled).toBe(true);
      expect(sorted[1].enabled).toBe(true);
      expect(sorted[2].enabled).toBe(false);
      expect(sorted[3].enabled).toBe(false);
    });

    it("Mode 4: Recently changed sorts by most recent management-history event descending", () => {
      // ext_a: latest = 5000 (disabled)
      // ext_b: latest = 4000 (enabled)
      // ext_z: latest = 1000 (installed)
      // ext_c: no events (sorts last)
      const sorted = sortExtensions(sampleExtensions, "recently_changed", sampleHistory);
      expect(sorted.map((e) => e.id)).toEqual(["ext_a", "ext_b", "ext_z", "ext_c"]);
    });

    it("Mode 4 backward compatibility: latest_change alias matches recently_changed", () => {
      const sorted = sortExtensions(sampleExtensions, "latest_change", sampleHistory);
      expect(sorted.map((e) => e.id)).toEqual(["ext_a", "ext_b", "ext_z", "ext_c"]);
    });
  });

  describe("UI Elements & Accessibility", () => {
    const selectorSource = fs.readFileSync("src/popup/components/Selector.tsx", "utf8");

    it("renders sort control wrapper with visible Sort: label prefix and icon", () => {
      expect(selectorSource).toContain('className="sort-control-wrapper"');
      expect(selectorSource).toContain('className="sort-control-label"');
      expect(selectorSource).toContain('<span className="sort-label-text">Sort:</span>');
      expect(selectorSource).toContain('<MaterialSymbol name="swap_vert" size={16} />');
    });

    it("exposes exactly the 4 user-facing sort options in the dropdown", () => {
      expect(selectorSource).toContain('<option value="recently_installed">Recently installed / updated</option>');
      expect(selectorSource).toContain('<option value="enabled_first">Enabled first</option>');
      expect(selectorSource).toContain('<option value="recently_changed">Recently changed</option>');
      expect(selectorSource).toContain('<option value="name_asc">Name A–Z</option>');
      // Must not expose Most changed or Most used or First seen
      expect(selectorSource).not.toContain("Most changes");
      expect(selectorSource).not.toContain("Most changed");
      expect(selectorSource).not.toContain("Most used");
      expect(selectorSource).not.toContain("First seen");
    });

    it("provides the concise contextual help copy without Most used claims", () => {
      expect(selectorSource).toContain("Based on install and update events recorded by Extension Drawer.");
      expect(selectorSource).toContain("Based on Extension Drawer history.");
      expect(selectorSource).not.toContain("Most used");
    });

    it("includes contextual help button with tooltip and toggleable popover", () => {
      expect(selectorSource).toContain('className="sort-help-btn"');
      expect(selectorSource).toContain('className="sort-help-popover"');
      expect(selectorSource).toContain('className="sort-help-popover-text"');
      expect(selectorSource).toContain('className="sort-help-close-btn"');
    });
  });
});
