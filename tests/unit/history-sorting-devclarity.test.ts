import { describe, it, expect } from "vitest";
import * as fs from "fs";
import type { ExtensionInfo, HistoryRecord, DeveloperProject } from "../../src/shared/types";
import { sortExtensions, getExtensionHistoryStats } from "../../src/popup/components/Selector";

describe("History Event Filtering, Extension Sorting & Developer Clarity", () => {
  const ext1: ExtensionInfo = {
    id: "ext_alpha",
    name: "Alpha Blocker",
    version: "1.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
  } as ExtensionInfo;

  const ext2: ExtensionInfo = {
    id: "ext_beta",
    name: "Beta Reader",
    version: "2.1",
    enabled: false,
    type: "extension",
    installType: "development",
    mayDisable: true,
  } as ExtensionInfo;

  const ext3: ExtensionInfo = {
    id: "ext_gamma",
    name: "Gamma Theme",
    version: "0.5",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
  } as ExtensionInfo;

  const extNoHistory: ExtensionInfo = {
    id: "ext_zeta",
    name: "Zeta Newbie",
    version: "0.1",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
  } as ExtensionInfo;

  const sampleHistory: HistoryRecord[] = [
    {
      id: "hist_1",
      timestamp: 1000,
      event: "installed",
      extensionId: "ext_alpha",
      extensionName: "Alpha Blocker",
      extensionVersion: "1.0",
      source: "user",
    },
    {
      id: "hist_2",
      timestamp: 2000,
      event: "enabled",
      extensionId: "ext_alpha",
      extensionName: "Alpha Blocker",
      extensionVersion: "1.0",
      source: "user",
    },
    {
      id: "hist_3",
      timestamp: 3000,
      event: "installed",
      extensionId: "ext_beta",
      extensionName: "Beta Reader",
      extensionVersion: "2.0",
      source: "user",
    },
    {
      id: "hist_4",
      timestamp: 4000,
      event: "disabled",
      extensionId: "ext_beta",
      extensionName: "Beta Reader",
      extensionVersion: "2.0",
      source: "user",
    },
    {
      id: "hist_5",
      timestamp: 5000,
      event: "enabled",
      extensionId: "ext_beta",
      extensionName: "Beta Reader",
      extensionVersion: "2.1",
      source: "user",
    },
    {
      id: "hist_6",
      timestamp: 2500,
      event: "disabled",
      extensionId: "ext_gamma",
      extensionName: "Gamma Theme",
      extensionVersion: "0.5",
      source: "user",
    },
  ];

  describe("Outcome 1 — History Event Filtering & Search", () => {
    it("HistoryView source defines all required event filter options", () => {
      const historySource = fs.readFileSync("src/popup/components/HistoryView.tsx", "utf8");
      expect(historySource).toContain('id="historyEventFilter"');
      expect(historySource).toContain('<option value="all">All events</option>');
      expect(historySource).toContain('<option value="installed">Installed</option>');
      expect(historySource).toContain('<option value="uninstalled">Uninstalled</option>');
      expect(historySource).toContain('<option value="enabled">Enabled</option>');
      expect(historySource).toContain('<option value="disabled">Disabled</option>');
    });

    it("HistoryView source defines search input and empty states", () => {
      const historySource = fs.readFileSync("src/popup/components/HistoryView.tsx", "utf8");
      expect(historySource).toContain('id="historySearch"');
      expect(historySource).toContain("Search by extension name...");
      expect(historySource).toContain("No events match the current filter.");
      expect(historySource).toContain("No history records yet.");
    });

    it("filters history by event type correctly", () => {
      const installedOnly = sampleHistory.filter((r) => r.event === "installed");
      expect(installedOnly).toHaveLength(2);
      expect(installedOnly.map((r) => r.extensionId)).toEqual(["ext_alpha", "ext_beta"]);

      const disabledOnly = sampleHistory.filter((r) => r.event === "disabled");
      expect(disabledOnly).toHaveLength(2);
      expect(disabledOnly.map((r) => r.extensionId)).toEqual(["ext_beta", "ext_gamma"]);

      const enabledOnly = sampleHistory.filter((r) => r.event === "enabled");
      expect(enabledOnly).toHaveLength(2);
      expect(enabledOnly.map((r) => r.extensionId)).toEqual(["ext_alpha", "ext_beta"]);
    });

    it("combines event filter and search query preserving reverse-chronological order", () => {
      const sorted = [...sampleHistory].sort((a, b) => b.timestamp - a.timestamp);
      // Filter for event 'disabled' and query 'beta'
      const filtered = sorted.filter(
        (r) => r.event === "disabled" && r.extensionName.toLowerCase().includes("beta")
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("hist_4");
      expect(filtered[0].timestamp).toBe(4000);
    });
  });

  describe("Outcome 2 & 3 — History-Backed Extension Sorting", () => {
    const list = [ext2, ext1, extNoHistory, ext3];

    it("SortMode: Recently installed / updated sorts newest install/update first, unrecorded below alphabetical", () => {
      // ext_beta installed = 3000
      // ext_alpha installed = 1000
      // ext_gamma, ext_zeta = no install/update history -> alphabetical tie-break: Gamma Theme, Zeta Newbie
      const sorted = sortExtensions(list, "recently_installed", sampleHistory);
      expect(sorted.map((e) => e.id)).toEqual(["ext_beta", "ext_alpha", "ext_gamma", "ext_zeta"]);
    });

    it("SortMode: Name A–Z sorts alphabetically case-insensitive", () => {
      const sorted = sortExtensions(list, "name_asc", sampleHistory);
      expect(sorted.map((e) => e.name)).toEqual([
        "Alpha Blocker",
        "Beta Reader",
        "Gamma Theme",
        "Zeta Newbie",
      ]);
    });

    it("SortMode: Recently changed sorts newest event timestamp first, no-history last", () => {
      // ext_beta latest timestamp = 5000
      // ext_gamma latest timestamp = 2500
      // ext_alpha latest timestamp = 2000
      // ext_zeta = 0 (no history)
      const sorted = sortExtensions(list, "recently_changed", sampleHistory);
      expect(sorted.map((e) => e.id)).toEqual([
        "ext_beta", // 5000
        "ext_gamma", // 2500
        "ext_alpha", // 2000
        "ext_zeta", // 0
      ]);
    });

    it("SortMode: Enabled first places enabled extensions before disabled, alphabetical within", () => {
      // Enabled: ext1 ("Alpha Blocker"), ext3 ("Gamma Theme"), extNoHistory ("Zeta Newbie")
      // Disabled: ext2 ("Beta Reader")
      const sorted = sortExtensions(list, "enabled_first", sampleHistory);
      expect(sorted.map((e) => e.id)).toEqual(["ext_alpha", "ext_gamma", "ext_zeta", "ext_beta"]);
    });

    it("Selector action-bar includes sort dropdown with exact 4 modes and help button", () => {
      const selectorSource = fs.readFileSync("src/popup/components/Selector.tsx", "utf8");
      expect(selectorSource).toContain('id="sortModeSelect"');
      expect(selectorSource).toContain('<option value="recently_installed">Recently installed / updated</option>');
      expect(selectorSource).toContain('<option value="enabled_first">Enabled first</option>');
      expect(selectorSource).toContain('<option value="recently_changed">Recently changed</option>');
      expect(selectorSource).toContain('<option value="name_asc">Name A–Z</option>');
      // Must NOT use misleading labels like "Most used", "Most changes", or "First seen"
      expect(selectorSource).not.toContain("Most used");
      expect(selectorSource).not.toContain("Most changes");
      expect(selectorSource).not.toContain("Most changed");
      expect(selectorSource).not.toContain("First seen");
      // Sort wrapper and help
      expect(selectorSource).toContain('className="sort-control-wrapper"');
      expect(selectorSource).toContain('className="sort-help-btn"');
    });
  });

  describe("Outcome 4, 5, 6, 7 — Developer Workspace Status & Clarity", () => {
    it("DeveloperView uses explicit status wording across all integration types", () => {
      const devSource = fs.readFileSync("src/popup/components/DeveloperView.tsx", "utf8");

      // Runtime
      expect(devSource).toContain('localExt.enabled ? "Runtime ON" : "Runtime OFF"');
      expect(devSource).toContain('ext.enabled ? "Runtime ON" : "Runtime OFF"');

      // GitHub
      expect(devSource).toContain("GitHub linked");
      expect(devSource).toContain("GitHub not linked");

      // Store
      expect(devSource).toContain("Store linked");
      expect(devSource).toContain("Store not linked");

      // Analytics (GA4 Data API integration)
      expect(devSource).toContain("Analytics not connected");
      expect(devSource).toContain("Analytics not linked");
      expect(devSource).toContain("Analytics connected");

      // Package
      expect(devSource).toContain("Download ZIP");
    });

    it("DeveloperView eliminates duplicate gear icon from project row", () => {
      const devSource = fs.readFileSync("src/popup/components/DeveloperView.tsx", "utf8");
      // Project row should have ONE configuration entry: Edit button and row click
      expect(devSource).toContain('onClick={() => handleStartEdit(proj)}');
      expect(devSource).toContain('title="Edit project bindings"');
      // No duplicate gear in dev-local-controls
      const localControlsSlice = devSource.slice(
        devSource.indexOf('className="dev-local-controls"'),
        devSource.indexOf('className="dev-row-actions"')
      );
      expect(localControlsSlice).not.toContain('name="settings"');
    });

    it("DeveloperView header includes CWS Dashboard quick-entry link", () => {
      const devSource = fs.readFileSync("src/popup/components/DeveloperView.tsx", "utf8");
      expect(devSource).toContain("CWS Dashboard");
      expect(devSource).toContain("https://chrome.google.com/webstore/devconsole/");
    });

    it("OptionsView displays Show Developer workspace setting", () => {
      const optionsSource = fs.readFileSync("src/popup/components/OptionsView.tsx", "utf8");
      expect(optionsSource).toContain("Developer Workspace");
      expect(optionsSource).toContain("Show Developer workspace");
      expect(optionsSource).toContain(
        "Adds the Developer tab for managing local builds, source links, store releases, analytics, and packages."
      );
      // Preserves internal developerMode boolean
      expect(optionsSource).toContain('handleUpdateSetting("developerMode"');
    });
  });
});
