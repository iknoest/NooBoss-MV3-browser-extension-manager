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
    it("Mode 1: Default preserves original list order", () => {
      const sorted = sortExtensions(sampleExtensions, "default");
      expect(sorted.map((e) => e.id)).toEqual(["ext_z", "ext_b", "ext_a", "ext_c"]);
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
      // Verify both enabled ones are at the front
      expect(sorted[0].enabled).toBe(true);
      expect(sorted[1].enabled).toBe(true);
      expect(sorted[2].enabled).toBe(false);
      expect(sorted[3].enabled).toBe(false);
    });

    it("Mode 4: Latest change sorts by newest management timestamp descending", () => {
      // ext_a: latest = 5000
      // ext_b: latest = 4000
      // ext_z: latest = 1000
      // ext_c: no events (sorts last)
      const sorted = sortExtensions(sampleExtensions, "latest_change", sampleHistory);
      expect(sorted.map((e) => e.id)).toEqual(["ext_a", "ext_b", "ext_z", "ext_c"]);
    });

    it("Mode 4 backward compatibility: recently_changed alias matches latest_change", () => {
      const sorted = sortExtensions(sampleExtensions, "recently_changed", sampleHistory);
      expect(sorted.map((e) => e.id)).toEqual(["ext_a", "ext_b", "ext_z", "ext_c"]);
    });

    it("Mode 5: Most changes sorts by count of management events descending", () => {
      // ext_b: 3 events (rec_2, rec_3, rec_4)
      // ext_a: 1 event (rec_5)
      // ext_z: 1 event (rec_1) -> tie-break alphabetical: "Alpha Addon" before "Zeta Extension"
      // ext_c: 0 events -> sorts last
      const sorted = sortExtensions(sampleExtensions, "most_changes", sampleHistory);
      expect(sorted.map((e) => e.id)).toEqual(["ext_b", "ext_a", "ext_z", "ext_c"]);
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

    it("exposes exactly the 5 user-facing sort options in the dropdown", () => {
      expect(selectorSource).toContain('<option value="default">Default</option>');
      expect(selectorSource).toContain('<option value="name_asc">Name A–Z</option>');
      expect(selectorSource).toContain('<option value="enabled_first">Enabled first</option>');
      expect(selectorSource).toContain('<option value="latest_change">Latest change</option>');
      expect(selectorSource).toContain('<option value="most_changes">Most changes</option>');
    });

    it("provides the exact verbatim contextual help copy", () => {
      const expectedHelp =
        "Changes are install, update, enable and disable events recorded by Extension Drawer. This is not extension usage.";
      expect(selectorSource).toContain(expectedHelp);
    });

    it("includes contextual help button with tooltip and toggleable popover", () => {
      expect(selectorSource).toContain('className="sort-help-btn"');
      expect(selectorSource).toContain('className="sort-help-popover"');
      expect(selectorSource).toContain('className="sort-help-popover-text"');
      expect(selectorSource).toContain('className="sort-help-close-btn"');
    });
  });
});
