import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import type { ExtensionInfo, HistoryRecord } from "../../src/shared/types";
import { sortExtensions, getExtensionHistoryStats } from "../../src/popup/components/Selector";
import { STORAGE_KEYS } from "../../src/shared/types";
import { getWelcomeSeen, setWelcomeSeen } from "../../src/shared/storage";

describe("Onboarding, About IA, History Deduplication & Extension Sorting", () => {
  let fakeStorage: Record<string, any> = {};

  beforeEach(() => {
    fakeStorage = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn((keys: any, cb?: (items: any) => void) => {
            const res: Record<string, any> = {};
            if (typeof keys === "string") {
              res[keys] = fakeStorage[keys];
            } else if (Array.isArray(keys)) {
              keys.forEach((k) => (res[k] = fakeStorage[k]));
            } else if (keys && typeof keys === "object") {
              Object.keys(keys).forEach((k) => {
                res[k] = fakeStorage[k] !== undefined ? fakeStorage[k] : keys[k];
              });
            }
            if (typeof cb === "function") {
              cb(res);
              return;
            }
            return Promise.resolve(res);
          }),
          set: vi.fn((items: Record<string, any>, cb?: () => void) => {
            Object.assign(fakeStorage, items);
            if (typeof cb === "function") {
              cb();
              return;
            }
            return Promise.resolve();
          }),
        },
      },
      runtime: {
        id: "mock_extension_id",
        getURL: vi.fn((path: string) => `chrome-extension://mock_extension_id/${path}`),
        lastError: undefined,
      },
      tabs: {
        create: vi.fn(),
      },
    };
  });

  describe("1. History Export Deduplication", () => {
    it("HistoryView no longer renders Export History action or button", () => {
      const historySource = fs.readFileSync("src/popup/components/HistoryView.tsx", "utf8");
      expect(historySource).not.toContain("historyExportBtn");
      expect(historySource).not.toContain("Export history");
      expect(historySource).not.toContain("exportHistoryCSV");
      // History view remains focused on table, filter, and clear
      expect(historySource).toContain("history-clear-btn");
      expect(historySource).toContain("history-table");
      expect(historySource).toContain("history-actions-group");
    });

    it("OptionsView Backup & Data retains single canonical Export History entry", () => {
      const optionsSource = fs.readFileSync("src/popup/components/OptionsView.tsx", "utf8");
      expect(optionsSource).toContain("optionsExportHistoryBtn");
      expect(optionsSource).toContain("Export History");
      expect(optionsSource).toContain("Export Extension Drawer history records to CSV");
      expect(optionsSource).toContain("Export CSV");
      expect(optionsSource).toContain("handleExportHistory");
    });
  });

  describe("2. About IA and Terminology", () => {
    const aboutSource = fs.readFileSync("src/popup/components/AboutView.tsx", "utf8");

    it("begins with 'What can Extension Drawer do?' as the first substantive section", () => {
      const introIdx = aboutSource.indexOf("What, Why, Who");
      const whatCanDoIdx = aboutSource.indexOf("What can Extension Drawer do?");
      const aboutProjectIdx = aboutSource.indexOf("About this project");
      const acknowledgementsIdx = aboutSource.indexOf("Acknowledgements");

      expect(introIdx).toBeGreaterThan(0);
      expect(whatCanDoIdx).toBeGreaterThan(introIdx);
      // 'What can Extension Drawer do?' must precede 'About this project' and 'Acknowledgements'
      expect(whatCanDoIdx).toBeLessThan(aboutProjectIdx);
      expect(aboutProjectIdx).toBeLessThan(acknowledgementsIdx);
    });

    it("covers all 6 required capabilities in the first section", () => {
      expect(aboutSource).toContain("Manage extensions:");
      expect(aboutSource).toContain("Enable, disable, remove, search and sort extensions.");

      expect(aboutSource).toContain("Groups:");
      expect(aboutSource).toContain("Organize related extensions and control them together.");

      expect(aboutSource).toContain("Site Rules:");
      expect(aboutSource).toContain("Automatically turn extensions on or off based on websites the user opens.");

      expect(aboutSource).toContain("History:");
      expect(aboutSource).toContain("Review install, update, enable and disable activity recorded by Extension Drawer.");

      expect(aboutSource).toContain("Backup &amp; Data:");
      expect(aboutSource).toContain("Export configuration, extension lists and history, and restore configuration.");

      expect(aboutSource).toContain("Developer Workspace:");
      expect(aboutSource).toContain("Optional advanced tools for local builds, GitHub, Chrome Web Store listings, Google Analytics, and Store-extension ZIP download.");
    });

    it("does not call Site Rules 'AutoState' anywhere in user-facing About copy", () => {
      expect(aboutSource).not.toContain("AutoState");
      expect(aboutSource).not.toContain("autostate");
    });

    it("provides reusable entry to reopen Getting started / Welcome", () => {
      expect(aboutSource).toContain("Getting started");
      expect(aboutSource).toContain("aboutWelcomeBtn");
    });
  });

  describe("3. Minimal First-Run Welcome / Getting Started Flow", () => {
    const welcomeSource = fs.readFileSync("src/popup/components/WelcomeView.tsx", "utf8");
    const serviceWorkerSource = fs.readFileSync("src/background/service-worker.ts", "utf8");

    it("WelcomeView contains exact requested title, description, and primary sections", () => {
      expect(welcomeSource).toContain("Extension Drawer");
      expect(welcomeSource).toContain("Manage, organize and automate your Chrome extensions from one place.");
      expect(welcomeSource).toContain("Manage extensions");
      expect(welcomeSource).toContain("Search, sort, enable, disable and inspect extensions.");
      expect(welcomeSource).toContain("Organize with Groups");
      expect(welcomeSource).toContain("Keep related extensions together and control them as a set.");
      expect(welcomeSource).toContain("Site Rules");
      expect(welcomeSource).toContain("Automatically turn extensions on or off for specific websites.");
      expect(welcomeSource).toContain("History &amp; Backup");
      expect(welcomeSource).toContain("Review Extension Drawer activity and keep portable backups.");
      expect(welcomeSource).toContain("Developer tools · Optional");
      expect(welcomeSource).toContain("Developer Workspace can connect local builds, GitHub, Chrome Web Store listings and analytics when needed.");
      expect(welcomeSource).toContain("Start quick tour");
      expect(welcomeSource).toContain("About 1 minute");
      expect(welcomeSource).toContain("Skip and open Extension Drawer");
      expect(welcomeSource).toContain("welcomeStartTourBtn");
      expect(welcomeSource).toContain("welcomeSkipBtn");
    });

    it("WelcomeView produces zero optional-permission or OAuth requests", () => {
      expect(welcomeSource).not.toContain("chrome.permissions");
      expect(welcomeSource).not.toContain("requestAnalyticsPermissions");
      expect(welcomeSource).not.toContain("requestDownloadPermissions");
      expect(welcomeSource).not.toContain("chrome.identity");
      expect(welcomeSource).not.toContain("getAuthToken");
      expect(welcomeSource).not.toContain("fetch(");
    });

    it("service-worker opens Welcome tab only on details.reason === 'install' and persists welcome_seen", () => {
      expect(serviceWorkerSource).toContain("details.reason === 'install'");
      expect(serviceWorkerSource).toContain("getWelcomeSeen()");
      expect(serviceWorkerSource).toContain("setWelcomeSeen(true)");
      expect(serviceWorkerSource).toContain("manager/manager.html#welcome");
      // Must not open on update
      expect(serviceWorkerSource).not.toContain("details.reason === 'update'");
    });

    it("verifies storage persistence for getWelcomeSeen and setWelcomeSeen", async () => {
      expect(await getWelcomeSeen()).toBe(false);
      await setWelcomeSeen(true);
      expect(await getWelcomeSeen()).toBe(true);
      expect(fakeStorage[STORAGE_KEYS.WELCOME_SEEN]).toBe(true);
    });
  });

  describe("4. Four Primary Extension Sorting Modes", () => {
    const extA: ExtensionInfo = {
      id: "id_a",
      name: "Alpha Ext",
      enabled: false,
    } as ExtensionInfo;

    const extB: ExtensionInfo = {
      id: "id_b",
      name: "Beta Ext",
      enabled: true,
    } as ExtensionInfo;

    const extC: ExtensionInfo = {
      id: "id_c",
      name: "Charlie Ext",
      enabled: true,
    } as ExtensionInfo;

    const extD: ExtensionInfo = {
      id: "id_d",
      name: "Delta Ext",
      enabled: false,
    } as ExtensionInfo;

    const history: HistoryRecord[] = [
      { id: "h1", extensionId: "id_a", extensionName: "Alpha Ext", extensionVersion: "1.0", event: "installed", timestamp: 1000, source: "user" },
      { id: "h2", extensionId: "id_a", extensionName: "Alpha Ext", extensionVersion: "1.1", event: "updated", timestamp: 5000, source: "user" },
      { id: "h3", extensionId: "id_b", extensionName: "Beta Ext", extensionVersion: "1.0", event: "installed", timestamp: 3000, source: "user" },
      { id: "h4", extensionId: "id_c", extensionName: "Charlie Ext", extensionVersion: "1.0", event: "enabled", timestamp: 7000, source: "user" },
      // extD has no history records at all
    ];

    it("Mode 1: Recently installed / updated sorts by newest installed/updated event with deterministic Name A-Z fallback", () => {
      // id_a newest installed/updated = 5000 (updated)
      // id_b newest installed/updated = 3000 (installed)
      // id_c only has 'enabled' event (not installed/updated) -> timestamp = 0
      // id_d has no history -> timestamp = 0
      // id_c and id_d tie at 0 -> Name A-Z secondary: "Charlie Ext", "Delta Ext"
      const sorted = sortExtensions([extD, extC, extB, extA], "recently_installed", history);
      expect(sorted.map((e) => e.id)).toEqual(["id_a", "id_b", "id_c", "id_d"]);
    });

    it("Mode 2: Enabled first partitions by enabled status then Name A-Z", () => {
      // Enabled: Beta Ext, Charlie Ext
      // Disabled: Alpha Ext, Delta Ext
      const sorted = sortExtensions([extA, extD, extC, extB], "enabled_first", history);
      expect(sorted.map((e) => e.id)).toEqual(["id_b", "id_c", "id_a", "id_d"]);
    });

    it("Mode 3: Recently changed sorts by latest management event timestamp with deterministic fallback", () => {
      // id_c: latest event = 7000 (enabled)
      // id_a: latest event = 5000 (updated)
      // id_b: latest event = 3000 (installed)
      // id_d: no history = 0 -> placed last
      const sorted = sortExtensions([extD, extB, extA, extC], "recently_changed", history);
      expect(sorted.map((e) => e.id)).toEqual(["id_c", "id_a", "id_b", "id_d"]);
    });

    it("Mode 4: Name A–Z sorts in strict alphabetical order", () => {
      const sorted = sortExtensions([extD, extB, extA, extC], "name_asc", history);
      expect(sorted.map((e) => e.name)).toEqual([
        "Alpha Ext",
        "Beta Ext",
        "Charlie Ext",
        "Delta Ext",
      ]);
    });

    it("verifies no 'Most used' claim or proxy exists in sort options or help", () => {
      const selectorSource = fs.readFileSync("src/popup/components/Selector.tsx", "utf8");
      expect(selectorSource).not.toContain("Most used");
      expect(selectorSource).not.toContain("most_used");
      expect(selectorSource).not.toContain("Most changes");
      expect(selectorSource).not.toContain("First seen");
    });
  });
});
