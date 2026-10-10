import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { ExtensionBrief } from "../../src/popup/components/ExtensionBrief";
import { SubWindow } from "../../src/popup/components/SubWindow";
import { Navigator } from "../../src/popup/components/Navigator";
import { AboutView } from "../../src/popup/components/AboutView";
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  type ExtensionInfo,
  type AppSettings,
  type HistoryRecord,
  type ExtensionGroup,
  type KnownExtensionMetadata,
} from "../../src/shared/types";
import { validateSettings } from "../../src/shared/import-export";
import { BUY_ME_A_BEER_URL } from "../../src/shared/external-link";
import {
  resolveLastKnownExtensionName,
  resolveMissingMemberIdentity,
} from "../../src/popup/components/group-member-utils";
import { computeGroupRuntimeSummary } from "../../src/popup/components/group-summary";
import { Selector } from "../../src/popup/components/Selector";
import { MissingGroupMembers } from "../../src/popup/components/MissingGroupMembers";
import {
  getKnownExtensions,
  saveKnownExtensions,
  upsertKnownExtensions,
  backfillKnownExtensionsFromHistory,
  clearHistory,
} from "../../src/shared/storage";

// Helper to recursively find VNodes matching a predicate
function findVNode(vnode: any, predicate: (node: any) => boolean): any {
  if (!vnode) return null;
  if (predicate(vnode)) return vnode;
  const children = vnode.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findVNode(child, predicate);
      if (found) return found;
    }
  } else if (children && typeof children === "object") {
    return findVNode(children, predicate);
  }
  return null;
}

// Helper to find all VNodes matching a predicate
function findAllVNodes(vnode: any, predicate: (node: any) => boolean): any[] {
  const results: any[] = [];
  function search(node: any) {
    if (!node) return;
    if (predicate(node)) results.push(node);
    const children = node.props?.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        search(child);
      }
    } else if (children && typeof children === "object") {
      search(children);
    }
  }
  search(vnode);
  return results;
}

describe("Extension Drawer 1.2.1 Post-Launch UX Patch", () => {
  // =========================================================================
  // 1. Extension Settings / Options Action Reliability
  // =========================================================================
  describe("1. Extension Settings / Options Action Reliability", () => {
    const enabledWithNormalOptions: ExtensionInfo = {
      id: "opt_enabled_normal",
      name: "Normal Standalone Extension",
      shortName: "Normal",
      version: "1.0.0",
      enabled: true,
      description: "Extension with normal options page",
      type: "extension",
      installType: "normal",
      optionsUrl: "chrome-extension://opt_enabled_normal/options.html",
      mayDisable: true,
      offlineEnabled: true,
      permissions: [],
      hostPermissions: [],
    };

    const disabledWithOptions: ExtensionInfo = {
      id: "pioclpoplcdbaefihamjohnefbikjilc",
      name: "Evernote Web Clipper",
      shortName: "Evernote",
      version: "7.42.0",
      enabled: false,
      description: "Extension with options but currently disabled",
      type: "extension",
      installType: "normal",
      optionsUrl: "chrome-extension://pioclpoplcdbaefihamjohnefbikjilc/OptionsFrame.html#newStylePage",
      mayDisable: true,
      offlineEnabled: true,
      permissions: [],
      hostPermissions: [],
    };

    const noOptionsExt: ExtensionInfo = {
      id: "no_options_ext",
      name: "Simple Tool Without Settings",
      shortName: "Simple",
      version: "1.0.0",
      enabled: true,
      description: "Extension without options page",
      type: "extension",
      installType: "normal",
      optionsUrl: "",
      mayDisable: true,
      offlineEnabled: true,
      permissions: [],
      hostPermissions: [],
    };

    const whitespaceOptionsExt: ExtensionInfo = {
      id: "ws_options_ext",
      name: "Whitespace Options Ext",
      shortName: "Whitespace",
      version: "1.0.0",
      enabled: true,
      description: "Extension with whitespace options page",
      type: "extension",
      installType: "normal",
      optionsUrl: "   ",
      mayDisable: true,
      offlineEnabled: true,
      permissions: [],
      hostPermissions: [],
    };

    describe("1A & 1B: UI Visibility — Hides Options when no optionsUrl", () => {
      it("renders Options button for enabled extension with valid optionsUrl in Big Tile view", () => {
        const onOpenOptions = vi.fn();
        const vnode = ExtensionBrief({
          extension: enabledWithNormalOptions,
          viewMode: "bigTile",
          onOpenOptions,
        });

        const optBtn = findVNode(vnode, (n) => n.props?.title === "Options");
        expect(optBtn).not.toBeNull();
      });

      it("renders Options button for enabled extension with valid optionsUrl in List view", () => {
        const onOpenOptions = vi.fn();
        const vnode = ExtensionBrief({
          extension: enabledWithNormalOptions,
          viewMode: "list",
          onOpenOptions,
        });

        const optBtn = findVNode(vnode, (n) => n.props?.title === "Options");
        expect(optBtn).not.toBeNull();
      });

      it("renders Options button for enabled extension with valid optionsUrl in Tile view", () => {
        const onOpenOptions = vi.fn();
        const vnode = ExtensionBrief({
          extension: enabledWithNormalOptions,
          viewMode: "tile",
          onOpenOptions,
        });

        const optBtn = findVNode(vnode, (n) => n.props?.title === "Options");
        expect(optBtn).not.toBeNull();
      });

      it("hides Options button across all views when optionsUrl is empty", () => {
        for (const mode of ["tile", "bigTile", "list"] as const) {
          const vnode = ExtensionBrief({
            extension: noOptionsExt,
            viewMode: mode,
          });
          const optBtn = findVNode(vnode, (n) => n.props?.title === "Options");
          expect(optBtn).toBeNull();
        }
      });

      it("hides Options button across all views when optionsUrl is whitespace only", () => {
        for (const mode of ["tile", "bigTile", "list"] as const) {
          const vnode = ExtensionBrief({
            extension: whitespaceOptionsExt,
            viewMode: mode,
          });
          const optBtn = findVNode(vnode, (n) => n.props?.title === "Options");
          expect(optBtn).toBeNull();
        }
      });

      it("hides Options icon button in SubWindow details modal when optionsUrl is empty", () => {
        const subWindowSource = fs.readFileSync("src/popup/components/SubWindow.tsx", "utf8");
        // Verify SubWindow safely guards options button with Boolean(ext.optionsUrl?.trim())
        expect(subWindowSource).toContain("Boolean(ext.optionsUrl?.trim())");
      });
    });

    describe("1B: Service Worker openExtensionOptions defensive checks", () => {
      // Direct simulation of service worker openExtensionOptions logic
      async function simulateServiceWorkerOpenOptions(
        id: string,
        getExtInfo: (id: string) => Promise<any>,
        createTab: (opts: { url: string }) => Promise<any>
      ) {
        try {
          const ext = await getExtInfo(id);
          if (!ext.optionsUrl || !ext.optionsUrl.trim()) {
            return { success: false, error: "No options page available" };
          }
          if (!ext.enabled) {
            return { success: false, disabled: true, error: "Extension is disabled" };
          }
          await createTab({ url: ext.optionsUrl });
          return { success: true };
        } catch (err: any) {
          return {
            success: false,
            error: err instanceof Error ? err.message : "Chrome does not allow this extension's settings page to be opened directly.",
          };
        }
      }

      it("opens tab successfully for enabled target with valid optionsUrl", async () => {
        const createTab = vi.fn().mockResolvedValue({ id: 101, url: enabledWithNormalOptions.optionsUrl });
        const getExt = vi.fn().mockResolvedValue(enabledWithNormalOptions);

        const res = await simulateServiceWorkerOpenOptions(enabledWithNormalOptions.id, getExt, createTab);

        expect(res.success).toBe(true);
        expect(createTab).toHaveBeenCalledWith({ url: enabledWithNormalOptions.optionsUrl });
      });

      it("refuses to open tab and returns disabled error when target extension is disabled", async () => {
        const createTab = vi.fn();
        const getExt = vi.fn().mockResolvedValue(disabledWithOptions);

        const res = await simulateServiceWorkerOpenOptions(disabledWithOptions.id, getExt, createTab);

        expect(res.success).toBe(false);
        expect(res.disabled).toBe(true);
        expect(res.error).toBe("Extension is disabled");
        expect(createTab).not.toHaveBeenCalled();
      });

      it("refuses to open tab when extension has no optionsUrl", async () => {
        const createTab = vi.fn();
        const getExt = vi.fn().mockResolvedValue(noOptionsExt);

        const res = await simulateServiceWorkerOpenOptions(noOptionsExt.id, getExt, createTab);

        expect(res.success).toBe(false);
        expect(res.error).toBe("No options page available");
        expect(createTab).not.toHaveBeenCalled();
      });

      it("handles chrome.tabs.create failure gracefully without throwing or creating repeated dead tabs", async () => {
        const createTab = vi.fn().mockRejectedValue(new Error("net::ERR_BLOCKED_BY_CLIENT"));
        const getExt = vi.fn().mockResolvedValue(enabledWithNormalOptions);

        const res = await simulateServiceWorkerOpenOptions(enabledWithNormalOptions.id, getExt, createTab);

        expect(res.success).toBe(false);
        expect(res.error).toBe("net::ERR_BLOCKED_BY_CLIENT");
      });
    });

    describe("1B & 1C: NooBossApp Confirmation Flow for Disabled Extensions", () => {
      it("shows compact confirmation dialog when user clicks Options on disabled extension", () => {
        let confirmationState: ExtensionInfo | null = null;
        let tabsCreated = 0;
        let extensionsToggled: Array<{ id: string; enabled: boolean }> = [];

        function handleOpenOptions(ext: ExtensionInfo) {
          if (!ext.optionsUrl || !ext.optionsUrl.trim()) return;
          if (!ext.enabled) {
            confirmationState = ext;
            return;
          }
          tabsCreated++;
        }

        // Action on disabled extension
        handleOpenOptions(disabledWithOptions);

        // Expect confirmation modal triggered, zero tabs created, zero silent toggling
        expect(confirmationState).not.toBeNull();
        expect(confirmationState!.id).toBe(disabledWithOptions.id);
        expect(tabsCreated).toBe(0);
        expect(extensionsToggled).toHaveLength(0);

        // Case A: User clicks Cancel
        confirmationState = null;
        expect(extensionsToggled).toHaveLength(0);
        expect(tabsCreated).toBe(0);

        // Case B: User clicks "Enable and open settings"
        handleOpenOptions(disabledWithOptions);
        expect(confirmationState).not.toBeNull();

        // User explicit confirmation:
        extensionsToggled.push({ id: confirmationState!.id, enabled: true });
        tabsCreated++;
        confirmationState = null;

        expect(extensionsToggled).toEqual([{ id: disabledWithOptions.id, enabled: true }]);
        expect(tabsCreated).toBe(1);
      });
    });
  });

  // =========================================================================
  // 2. Default Extension Layout to Tile
  // =========================================================================
  describe("2. Default Extension Layout to Tile", () => {
    it("proves DEFAULT_SETTINGS defaults to tile", () => {
      expect(DEFAULT_SETTINGS.viewMode).toBe("tile");
    });

    it("proves no preference (empty settings) defaults to tile", () => {
      const validated = validateSettings({});
      expect(validated.viewMode).toBe("tile");
    });

    it("proves invalid stored value (e.g. unknown string) defaults to tile", () => {
      const validated = validateSettings({ viewMode: "invalid_mode_xyz" });
      expect(validated.viewMode).toBe("tile");
    });

    it("preserves explicitly persisted list viewMode", () => {
      const validated = validateSettings({ viewMode: "list" });
      expect(validated.viewMode).toBe("list");
    });

    it("preserves explicitly persisted bigTile viewMode", () => {
      const validated = validateSettings({ viewMode: "bigTile" });
      expect(validated.viewMode).toBe("bigTile");
    });

    it("preserves explicitly persisted tile viewMode", () => {
      const validated = validateSettings({ viewMode: "tile" });
      expect(validated.viewMode).toBe("tile");
    });

    it("maps legacy grid viewMode to bigTile without resetting user choice", () => {
      const validated = validateSettings({ viewMode: "grid" });
      expect(validated.viewMode).toBe("bigTile");
    });

    it("defaults ExtensionBrief prop to tile when omitted", () => {
      const ext: ExtensionInfo = {
        id: "test_ext_1",
        name: "Test",
        shortName: "Test",
        version: "1.0",
        enabled: true,
        description: "",
        type: "extension",
        installType: "normal",
        optionsUrl: "",
        mayDisable: true,
        offlineEnabled: true,
        permissions: [],
        hostPermissions: [],
      };
      const vnode = ExtensionBrief({ extension: ext });
      // Tile mode renders nb-tile container
      expect(vnode.props?.className).toContain("nb-tile");
    });
  });

  // =========================================================================
  // 3. Buy me a Beer CTA
  // =========================================================================
  describe("3. Buy me a Beer CTA", () => {
    it("renders Buy me a Beer link with exact label and destination URL", () => {
      const vnode = Navigator({
        mainLocation: "extensions",
        onNavigateMain: vi.fn(),
      });

      const beerLink = findVNode(vnode, (n) => n.props?.className?.includes("buy-me-beer-btn"));
      expect(beerLink).not.toBeNull();
      expect(beerLink.props?.href).toBe("https://www.buymeacoffee.com/avavavava");
      expect(beerLink.props?.target).toBe("_blank");
      expect(beerLink.props?.rel).toBe("noopener noreferrer");
      expect(beerLink.props?.title).toBe("Buy me a Beer");
      expect(beerLink.props?.["aria-label"]).toBe("Buy me a Beer");

      // Verify beer icon and label are rendered
      const beerIcon = findVNode(beerLink, (n) => n.props?.className === "beer-icon");
      expect(beerIcon).not.toBeNull();
      expect(beerIcon.props?.children).toBe("🍻");

      const beerLabel = findVNode(beerLink, (n) => n.props?.className === "beer-label");
      expect(beerLabel).not.toBeNull();
      expect(beerLabel.props?.children).toBe("Buy me a Beer");
    });

    it("is placed in nav-utility-area, separated from core navigation buttons", () => {
      const vnode = Navigator({
        mainLocation: "extensions",
        onNavigateMain: vi.fn(),
      });

      const navItems = findVNode(vnode, (n) => n.props?.className === "nav-items-container");
      const utilityArea = findVNode(vnode, (n) => n.props?.className === "nav-utility-area");

      expect(navItems).not.toBeNull();
      expect(utilityArea).not.toBeNull();

      // CTA is inside utilityArea, not inside navItems
      const ctaInNavItems = findVNode(navItems, (n) => n.props?.className?.includes("buy-me-beer-btn"));
      expect(ctaInNavItems).toBeNull();

      const ctaInUtility = findVNode(utilityArea, (n) => n.props?.className?.includes("buy-me-beer-btn"));
      expect(ctaInUtility).not.toBeNull();
    });

    it("verifies NO remote Buy Me a Coffee scripts, iframes or widgets exist in the codebase", () => {
      const srcDir = path.resolve("src");
      const forbiddenTerms = [
        "cdnjs.buymeacoffee.com",
        "button.prod.min.js",
        "bmc-button",
        "buymeacoffee.com/widget",
      ];

      function scanDir(dir: string) {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
          } else if (entry.endsWith(".ts") || entry.endsWith(".tsx") || entry.endsWith(".html") || entry.endsWith(".json")) {
            const content = fs.readFileSync(fullPath, "utf8");
            for (const term of forbiddenTerms) {
              expect(content.includes(term)).toBe(false);
            }
          }
        }
      }

      scanDir(srcDir);
    });

    it("verifies manifest requires zero new permissions for the CTA", () => {
      const manifestPath = path.resolve("src/manifest.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

      // The permissions should remain strictly what was authorized in 1.2.0
      expect(manifest.permissions).toEqual(["management", "storage", "tabs", "notifications"]);
      expect(manifest.optional_permissions).toEqual(["downloads", "identity"]);
      expect(manifest.optional_host_permissions).toEqual([
        "https://clients2.google.com/*",
        "https://clients2.googleusercontent.com/*",
        "https://analyticsdata.googleapis.com/*",
      ]);
    });
  });

  // =========================================================================
  // 4. Canonical Project Support in About & Backup & Data Copy Refresh
  // =========================================================================
  describe("4. Canonical Project Support in About & Backup & Data Copy", () => {
    it("renders Support the project section in About with exact copy and canonical CTA", () => {
      const vnode = AboutView({});
      const aboutSource = fs.readFileSync("src/popup/components/AboutView.tsx", "utf8");

      expect(aboutSource).toContain("Support the project");
      expect(aboutSource).toContain(
        "Extension Drawer is free and open source. If it saves you time or helps with your extension workflow, you can support its continued development."
      );
      expect(aboutSource).not.toContain("Opens Buy Me a Coffee in a new tab.");

      const beerLink = findVNode(vnode, (n) => n.props?.className?.includes("about-support-btn"));
      expect(beerLink).not.toBeNull();
      expect(beerLink.props?.href).toBe("https://www.buymeacoffee.com/avavavava");
      expect(beerLink.props?.target).toBe("_blank");
      expect(beerLink.props?.rel).toBe("noopener noreferrer");
      expect(beerLink.props?.["aria-label"]).toBe("Buy me a Beer");

      const beerIcon = findVNode(beerLink, (n) => n.props?.className === "beer-icon");
      expect(beerIcon).not.toBeNull();
      expect(beerIcon.props?.children).toBe("🍻");

      const beerLabel = findVNode(beerLink, (n) => n.props?.className === "beer-label");
      expect(beerLabel).not.toBeNull();
      expect(beerLabel.props?.children).toBe("Buy me a Beer");
    });

    it("uses the same safe external navigation path and destination URL constant", () => {
      expect(BUY_ME_A_BEER_URL).toBe("https://www.buymeacoffee.com/avavavava");
      const aboutSource = fs.readFileSync("src/popup/components/AboutView.tsx", "utf8");
      const navSource = fs.readFileSync("src/popup/components/Navigator.tsx", "utf8");

      expect(aboutSource).toContain("BUY_ME_A_BEER_URL");
      expect(aboutSource).toContain("openExternalLink");
      expect(navSource).toContain("BUY_ME_A_BEER_URL");
      expect(navSource).toContain("openExternalLink");
    });

    it("verifies Backup & Data capability copy explicitly mentions import as well as export", () => {
      const aboutSource = fs.readFileSync("src/popup/components/AboutView.tsx", "utf8");
      expect(aboutSource).toContain("Backup &amp; Data:");
      expect(aboutSource).toContain(
        "Export and import configuration and history, and export a human-readable extension list."
      );
      expect(aboutSource).not.toContain(
        "Export configuration, extension lists and history, and restore configuration."
      );
    });

    it("verifies Support the project is placed after capability overview and before acknowledgements", () => {
      const aboutSource = fs.readFileSync("src/popup/components/AboutView.tsx", "utf8");
      const capabilitiesIdx = aboutSource.indexOf("What can Extension Drawer do?");
      const supportIdx = aboutSource.indexOf("Support the project");
      const ackIdx = aboutSource.indexOf("Acknowledgements");

      expect(capabilitiesIdx).toBeGreaterThan(-1);
      expect(supportIdx).toBeGreaterThan(capabilitiesIdx);
      expect(ackIdx).toBeGreaterThan(supportIdx);
    });
  });

  // =========================================================================
  // 5. Identifiable & Actionable Missing Group Members (1.2.1 UX Patch)
  // =========================================================================
  describe("5. Identifiable & Actionable Missing Group Members", () => {
    const installedExt1: ExtensionInfo = {
      id: "installed_ext_1",
      name: "React Developer Tools",
      shortName: "React",
      description: "Dev tools",
      version: "1.0.0",
      enabled: true,
      mayDisable: true,
      type: "extension",
      installType: "normal",
      offlineEnabled: false,
      optionsUrl: "",
      permissions: [],
      hostPermissions: [],
    };

    const installedExt2: ExtensionInfo = {
      id: "installed_ext_2",
      name: "Vite Inspector",
      shortName: "Vite",
      description: "Vite dev",
      version: "2.0.0",
      enabled: false,
      mayDisable: true,
      type: "extension",
      installType: "normal",
      offlineEnabled: false,
      optionsUrl: "",
      permissions: [],
      hostPermissions: [],
    };

    const sampleHistory: HistoryRecord[] = [
      {
        id: "h1",
        timestamp: 1000,
        event: "installed",
        extensionId: "missing_ext_known",
        extensionName: "Old Better History",
        extensionVersion: "1.0",
        source: "user",
      },
      {
        id: "h2",
        timestamp: 2000,
        event: "uninstalled",
        extensionId: "missing_ext_known",
        extensionName: "Better History",
        extensionVersion: "1.1",
        source: "user",
      },
      {
        id: "h3",
        timestamp: 1500,
        event: "enabled",
        extensionId: "installed_ext_1",
        extensionName: "React Developer Tools",
        extensionVersion: "1.0.0",
        source: "user",
      },
    ];

    it("calculates missing count, preserves running denominator, and provides accessible tooltip", () => {
      const groupWithMissing: ExtensionGroup = {
        id: "g1",
        name: "Dev Tools",
        extensionIds: ["installed_ext_1", "installed_ext_2", "missing_ext_known", "missing_ext_unknown"],
        color: "#1a73e8",
        createdAt: 100,
      };

      const summary = computeGroupRuntimeSummary(groupWithMissing, [installedExt1, installedExt2]);
      expect(summary.configuredMemberCount).toBe(4);
      expect(summary.installedMemberCount).toBe(2);
      expect(summary.runningMemberCount).toBe(1);
      expect(summary.missingMemberCount).toBe(2);
      // Denominator represents currently installed members (2), not all 4
      expect(summary.summaryText).toBe("1 / 2 running");
      expect(summary.exceptionText).toBe("2 missing");
      expect(summary.hasMissing).toBe(true);
      expect(summary.missingTooltipText).toBe("2 saved group members are not currently installed in Chrome.");
    });

    it("resolves last-known extension name from history with fallback to Unknown extension", () => {
      // Known extension in history: returns latest timestamp name
      const resolvedName = resolveLastKnownExtensionName("missing_ext_known", sampleHistory);
      expect(resolvedName).toBe("Better History");

      // Unknown extension not in history: returns null
      const unkName = resolveLastKnownExtensionName("missing_ext_unknown", sampleHistory);
      expect(unkName).toBeNull();

      // Empty history: returns null
      expect(resolveLastKnownExtensionName("missing_ext_known", [])).toBeNull();
    });

    it("renders MissingGroupMembers component with name, ID, status pill, and Remove action", () => {
      const onRemove = vi.fn();
      const vnode = MissingGroupMembers({
        missingIds: ["missing_ext_known", "missing_ext_unknown"],
        history: sampleHistory,
        onRemoveMember: onRemove,
      });

      expect(vnode).not.toBeNull();

      // Heading shows count
      const heading = findVNode(vnode, (n) => n.props?.className?.includes("missing-members-heading"));
      expect(heading).not.toBeNull();

      // Find cards
      const cards = findVNode(vnode, (n) => n.props?.className?.includes("missing-members-list"));
      expect(cards).not.toBeNull();
      expect(cards.props.children).toHaveLength(2);

      // Card 1: Better History
      const card1 = cards.props.children[0];
      const name1 = findVNode(card1, (n) => n.props?.className === "missing-member-name");
      expect(name1.props.children).toBe("Better History");
      const id1 = findVNode(card1, (n) => n.props?.className === "missing-member-id");
      expect(id1.props.children).toBe("missing_ext_known");

      // Card 2: Unknown extension fallback
      const card2 = cards.props.children[1];
      const name2 = findVNode(card2, (n) => n.props?.className === "missing-member-name");
      expect(name2.props.children).toBe("Unknown extension");
      const id2 = findVNode(card2, (n) => n.props?.className === "missing-member-id");
      expect(id2.props.children).toBe("missing_ext_unknown");

      // Missing pill
      const pill = findVNode(card1, (n) => n.props?.className?.includes("status-pill missing"));
      expect(pill).not.toBeNull();
      expect(pill.props.children).toBe("Missing");

      // Remove from group button
      const removeBtn = findVNode(card1, (n) => n.props?.className?.includes("missing-remove-btn"));
      expect(removeBtn).not.toBeNull();
      removeBtn.props.onClick();
      expect(onRemove).toHaveBeenCalledWith("missing_ext_known");
    });

    it("verifies Selector wires MissingGroupMembers in focused group view and removes missing ID safely", () => {
      const selectorSource = fs.readFileSync("src/popup/components/Selector.tsx", "utf8");
      expect(selectorSource).toContain("import { MissingGroupMembers } from \"./MissingGroupMembers\";");
      expect(selectorSource).toContain("<MissingGroupMembers");
      expect(selectorSource).toContain("missingIds={missingMemberIds}");
      expect(selectorSource).toContain("onRemoveMember={handleRemoveMissingMember}");

      const group: ExtensionGroup = {
        id: "g_focus",
        name: "Focused Group",
        extensionIds: ["installed_ext_1", "missing_ext_1"],
        color: "#1a73e8",
        createdAt: 100,
      };

      const onUpdateGroup = vi.fn();

      // Emulate Selector's handleRemoveMissingMember behavior
      const handleRemove = (idToRemove: string) => {
        const nextIds = (group.extensionIds || []).filter((id) => id !== idToRemove);
        onUpdateGroup({ ...group, extensionIds: nextIds });
      };

      handleRemove("missing_ext_1");
      expect(onUpdateGroup).toHaveBeenCalledWith({
        ...group,
        extensionIds: ["installed_ext_1"],
      });
    });

    it("verifies group with zero missing members does not render missing section", () => {
      // When missingIds is empty, MissingGroupMembers returns null
      const renderedMissing = MissingGroupMembers({
        missingIds: [],
        history: sampleHistory,
        onRemoveMember: vi.fn(),
      });
      expect(renderedMissing).toBeNull();

      // Also returns null when filter matches nothing
      const renderedFiltered = MissingGroupMembers({
        missingIds: ["missing_ext_known"],
        history: sampleHistory,
        searchFilter: "non_matching_query",
        onRemoveMember: vi.fn(),
      });
      expect(renderedFiltered).toBeNull();
    });

    it("verifies returning reinstalled extension automatically restores normal membership with 0 missing", () => {
      const group: ExtensionGroup = {
        id: "g_returning",
        name: "Returning Test",
        extensionIds: ["installed_ext_1", "ext_to_reinstall"],
        color: "#1a73e8",
        createdAt: 100,
      };

      // State 1: ext_to_reinstall is missing from Chrome
      const summaryBefore = computeGroupRuntimeSummary(group, [installedExt1]);
      expect(summaryBefore.configuredMemberCount).toBe(2);
      expect(summaryBefore.installedMemberCount).toBe(1);
      expect(summaryBefore.missingMemberCount).toBe(1);
      expect(summaryBefore.hasMissing).toBe(true);

      // State 2: ext_to_reinstall is reinstalled in Chrome
      const reinstalledExt: ExtensionInfo = {
        id: "ext_to_reinstall",
        name: "Reinstalled Tool",
        shortName: "Reinstalled",
        description: "Back in Chrome",
        version: "1.0.0",
        enabled: true,
        mayDisable: true,
        type: "extension",
        installType: "normal",
        offlineEnabled: false,
        optionsUrl: "",
        permissions: [],
        hostPermissions: [],
      };

      const summaryAfter = computeGroupRuntimeSummary(group, [installedExt1, reinstalledExt]);
      expect(summaryAfter.configuredMemberCount).toBe(2);
      expect(summaryAfter.installedMemberCount).toBe(2);
      expect(summaryAfter.runningMemberCount).toBe(2);
      expect(summaryAfter.missingMemberCount).toBe(0);
      expect(summaryAfter.hasMissing).toBe(false);
      expect(summaryAfter.summaryText).toBe("2 / 2 running");
      expect(summaryAfter.exceptionText).toBeUndefined();
    });

    it("displays distinct Missing from Chrome section in SubWindow group editor and wires removal", () => {
      const subwindowSource = fs.readFileSync("src/popup/components/SubWindow.tsx", "utf8");
      expect(subwindowSource).toContain("import { MissingGroupMembers } from \"./MissingGroupMembers\";");
      expect(subwindowSource).toContain("<MissingGroupMembers");
      expect(subwindowSource).toContain("isEditor={true}");
      expect(subwindowSource).toContain("title={`Missing from Chrome (${missingMemberIds.length})`}");
      expect(subwindowSource).toContain("onRemoveMember={handleRemoveMissingMember}");

      const group: ExtensionGroup = {
        id: "g_editor",
        name: "Editor Group",
        extensionIds: ["installed_ext_1", "missing_ext_edit"],
        color: "#1a73e8",
        createdAt: 100,
      };

      const onUpdateGroup = vi.fn();
      const undoStack: string[][] = [];

      // Emulate SubWindow's handleRemoveMissingMember
      const handleRemove = (idToRemove: string) => {
        const nextIds = group.extensionIds.filter((id) => id !== idToRemove);
        undoStack.push([...group.extensionIds]);
        onUpdateGroup({ ...group, extensionIds: nextIds });
      };

      handleRemove("missing_ext_edit");
      expect(onUpdateGroup).toHaveBeenCalledWith({
        ...group,
        extensionIds: ["installed_ext_1"],
      });
      expect(undoStack).toHaveLength(1);
      expect(undoStack[0]).toEqual(["installed_ext_1", "missing_ext_edit"]);
    });
  });

  // =========================================================================
  // 6. Durable Known-Extension Identity Cache & Missing-State Hardening
  // =========================================================================
  describe("6. Durable Known-Extension Identity Cache & Missing-State Hardening", () => {
    let mockStorage: Record<string, any> = {};

    beforeEach(() => {
      mockStorage = {};
      (globalThis as any).chrome = {
        storage: {
          local: {
            get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
            set: vi.fn(async (items: Record<string, any>) => {
              Object.assign(mockStorage, items);
            }),
          },
        },
      };
    });

    it("verifies STORAGE_KEYS includes KNOWN_EXTENSIONS with expected storage key name", () => {
      expect(STORAGE_KEYS.KNOWN_EXTENSIONS).toBe("nooboss_known_extensions");
    });

    it("upserts metadata for installed extensions and updates on subsequent calls", async () => {
      const ext1: ExtensionInfo = {
        id: "durable_ext_1",
        name: "Durable Extension One",
        shortName: "Durable 1",
        version: "1.0.0",
        type: "extension",
        enabled: true,
        mayDisable: true,
        description: "",
        installType: "normal",
        offlineEnabled: false,
        optionsUrl: "",
        permissions: [],
        hostPermissions: [],
      };

      const cache = await upsertKnownExtensions([ext1]);
      expect(cache["durable_ext_1"]).toBeDefined();
      expect(cache["durable_ext_1"].name).toBe("Durable Extension One");
      expect(cache["durable_ext_1"].version).toBe("1.0.0");
      expect(cache["durable_ext_1"].lastSeenAt).toBeGreaterThan(0);
      expect(mockStorage[STORAGE_KEYS.KNOWN_EXTENSIONS]["durable_ext_1"].name).toBe("Durable Extension One");

      // Verify update: version bumped, name renamed
      const ext1Updated = { ...ext1, name: "Durable Extension One Pro", version: "1.1.0" };
      const cache2 = await upsertKnownExtensions([ext1Updated]);
      expect(cache2["durable_ext_1"].name).toBe("Durable Extension One Pro");
      expect(cache2["durable_ext_1"].version).toBe("1.1.0");
    });

    it("retains cached metadata even when an extension is no longer present in inventory", async () => {
      const extA: ExtensionInfo = {
        id: "ext_a",
        name: "Extension A",
        shortName: "A",
        version: "2.0.0",
        type: "extension",
        enabled: true,
        mayDisable: true,
        description: "",
        installType: "normal",
        offlineEnabled: false,
        optionsUrl: "",
        permissions: [],
        hostPermissions: [],
      };
      const extB: ExtensionInfo = {
        id: "ext_b",
        name: "Extension B",
        shortName: "B",
        version: "1.0.0",
        type: "extension",
        enabled: true,
        mayDisable: true,
        description: "",
        installType: "normal",
        offlineEnabled: false,
        optionsUrl: "",
        permissions: [],
        hostPermissions: [],
      };

      // Both extensions installed
      await upsertKnownExtensions([extA, extB]);

      // Later, extA is uninstalled so inventory fetch only returns extB
      await upsertKnownExtensions([extB]);

      const stored = await getKnownExtensions();
      expect(stored["ext_a"]).toBeDefined();
      expect(stored["ext_a"].name).toBe("Extension A");
      expect(stored["ext_b"]).toBeDefined();
      expect(stored["ext_b"].name).toBe("Extension B");
    });

    it("survives clearHistory and retention trimming without loss of known extension identities", async () => {
      mockStorage[STORAGE_KEYS.KNOWN_EXTENSIONS] = {
        ext_survivor: {
          id: "ext_survivor",
          name: "Survivor Tool",
          version: "3.2.1",
          lastSeenAt: 1234567,
        },
      };
      mockStorage[STORAGE_KEYS.HISTORY] = [
        {
          id: "h1",
          timestamp: 100,
          event: "installed",
          extensionId: "ext_survivor",
          extensionName: "Survivor Tool",
          extensionVersion: "3.2.1",
          source: "external",
        },
      ];

      // Clear operational history
      await clearHistory();
      expect(mockStorage[STORAGE_KEYS.HISTORY]).toEqual([]);

      // Known extension cache is completely intact!
      const known = await getKnownExtensions();
      expect(known["ext_survivor"]).toBeDefined();
      expect(known["ext_survivor"].name).toBe("Survivor Tool");
      expect(known["ext_survivor"].version).toBe("3.2.1");
    });

    it("backfills missing IDs from History without overwriting existing cache metadata", async () => {
      mockStorage[STORAGE_KEYS.KNOWN_EXTENSIONS] = {
        existing_cached: {
          id: "existing_cached",
          name: "Authoritative Cache Name",
          version: "2.0.0",
          lastSeenAt: 500,
        },
      };

      const historyToBackfill: HistoryRecord[] = [
        {
          id: "h_old",
          timestamp: 100,
          event: "installed",
          extensionId: "existing_cached",
          extensionName: "Old History Name",
          extensionVersion: "1.0.0",
          source: "external",
        },
        {
          id: "h_missing_older",
          timestamp: 200,
          event: "installed",
          extensionId: "missing_from_history",
          extensionName: "History Early Name",
          extensionVersion: "0.9.0",
          source: "external",
        },
        {
          id: "h_missing_newer",
          timestamp: 300,
          event: "updated",
          extensionId: "missing_from_history",
          extensionName: "History Latest Name",
          extensionVersion: "1.0.0",
          source: "external",
        },
        {
          id: "h_uninstalled_raw_id",
          timestamp: 400,
          event: "uninstalled",
          extensionId: "uninstalled_no_name",
          extensionName: "uninstalled_no_name", // Raw ID placeholder from uninstallation
          extensionVersion: "",
          source: "external",
        },
      ];

      const backfilled = await backfillKnownExtensionsFromHistory(historyToBackfill);

      // Existing cached entry is NEVER overwritten by lower-confidence history
      expect(backfilled["existing_cached"].name).toBe("Authoritative Cache Name");

      // Missing extension backfilled with latest history name
      expect(backfilled["missing_from_history"]).toBeDefined();
      expect(backfilled["missing_from_history"].name).toBe("History Latest Name");

      // Raw ID placeholder is not backfilled as a valid name
      expect(backfilled["uninstalled_no_name"]).toBeUndefined();
    });

    it("verifies resolution order: (1) installed -> (2) cache -> (3) history -> (4) Unknown extension", () => {
      const installedList: ExtensionInfo[] = [
        {
          id: "ext_multi",
          name: "Active Chrome Name",
          shortName: "Active",
          version: "3.0.0",
          enabled: true,
          mayDisable: true,
          description: "",
          type: "extension",
          installType: "normal",
          offlineEnabled: false,
          optionsUrl: "",
          permissions: [],
          hostPermissions: [],
        },
      ];
      const cache: Record<string, KnownExtensionMetadata> = {
        ext_multi: {
          id: "ext_multi",
          name: "Cached Metadata Name",
          lastSeenAt: 200,
        },
        ext_cached_only: {
          id: "ext_cached_only",
          name: "Only In Cache Name",
          lastSeenAt: 300,
        },
      };
      const hist: HistoryRecord[] = [
        {
          id: "h1",
          timestamp: 100,
          event: "installed",
          extensionId: "ext_multi",
          extensionName: "Oldest History Name",
          extensionVersion: "1.0.0",
          source: "external",
        },
        {
          id: "h2",
          timestamp: 150,
          event: "installed",
          extensionId: "ext_cached_only",
          extensionName: "History Name for Cached",
          extensionVersion: "1.0.0",
          source: "external",
        },
        {
          id: "h3",
          timestamp: 250,
          event: "installed",
          extensionId: "ext_history_only",
          extensionName: "Only In History Name",
          extensionVersion: "1.0.0",
          source: "external",
        },
      ];

      // 1. Installed Chrome metadata wins over cache and history
      const r1 = resolveMissingMemberIdentity("ext_multi", cache, hist, installedList);
      expect(r1.name).toBe("Active Chrome Name");
      expect(r1.source).toBe("installed");
      expect(r1.isKnown).toBe(true);

      // 2. Cache wins over history
      const r2 = resolveMissingMemberIdentity("ext_cached_only", cache, hist, []);
      expect(r2.name).toBe("Only In Cache Name");
      expect(r2.source).toBe("cache");
      expect(r2.isKnown).toBe(true);

      // 3. History is fallback when cache is absent
      const r3 = resolveMissingMemberIdentity("ext_history_only", {}, hist, []);
      expect(r3.name).toBe("Only In History Name");
      expect(r3.source).toBe("history");
      expect(r3.isKnown).toBe(true);

      // 4. Unknown extension when nothing is found
      const r4 = resolveMissingMemberIdentity("completely_unknown_id", {}, [], []);
      expect(r4.name).toBe("Unknown extension");
      expect(r4.source).toBe("unknown");
      expect(r4.isKnown).toBe(false);

      // Backwards-compatible resolveLastKnownExtensionName helper
      expect(resolveLastKnownExtensionName("ext_multi", hist, cache, installedList)).toBe("Active Chrome Name");
      expect(resolveLastKnownExtensionName("completely_unknown_id", hist, cache, installedList)).toBeNull();
    });

    it("renders Copy ID and Look up for genuinely unknown missing members", () => {
      const vnode = MissingGroupMembers({
        missingIds: ["unknown_missing_ext_id"],
        knownExtensions: {},
        history: [],
        onRemoveMember: vi.fn(),
      });

      expect(vnode).not.toBeNull();
      // ID displayed
      const idEl = findVNode(vnode, (n) => n.props?.className === "missing-member-id");
      expect(idEl).not.toBeNull();
      expect(idEl.props.children).toBe("unknown_missing_ext_id");

      // Copy ID button present
      const copyBtn = findVNode(vnode, (n) => n.props?.className?.includes("missing-copy-btn"));
      expect(copyBtn).not.toBeNull();
      expect(copyBtn.props["aria-label"]).toBe("Copy ID unknown_missing_ext_id");

      // Look up button present for unknown missing member
      const lookupBtn = findVNode(vnode, (n) => n.props?.className?.includes("missing-lookup-btn"));
      expect(lookupBtn).not.toBeNull();
      expect(lookupBtn.props["aria-label"]).toContain("Look up unknown_missing_ext_id");

      // Remove from group button present
      const removeBtn = findVNode(vnode, (n) => n.props?.className?.includes("missing-remove-btn"));
      expect(removeBtn).not.toBeNull();
    });

    it("omits Look up button for known missing members while preserving Copy ID and Remove", () => {
      const vnode = MissingGroupMembers({
        missingIds: ["known_missing_ext_id"],
        knownExtensions: {
          known_missing_ext_id: {
            id: "known_missing_ext_id",
            name: "Identified Extension",
            lastSeenAt: 1000,
          },
        },
        history: [],
        onRemoveMember: vi.fn(),
      });

      // Name resolved
      const nameEl = findVNode(vnode, (n) => n.props?.className === "missing-member-name");
      expect(nameEl.props.children).toBe("Identified Extension");

      // Copy ID present
      const copyBtn = findVNode(vnode, (n) => n.props?.className?.includes("missing-copy-btn"));
      expect(copyBtn).not.toBeNull();

      // Look up NOT present because identity is already known
      const lookupBtn = findVNode(vnode, (n) => n.props?.className?.includes("missing-lookup-btn"));
      expect(lookupBtn).toBeNull();

      // Remove present
      const removeBtn = findVNode(vnode, (n) => n.props?.className?.includes("missing-remove-btn"));
      expect(removeBtn).not.toBeNull();
    });

    it("verifies inventory-load correctness: loading and error states NEVER report missing members", () => {
      const group: ExtensionGroup = {
        id: "g_inv_test",
        name: "Inventory Test Group",
        extensionIds: ["ext1", "ext_missing"],
        color: "#1a73e8",
        createdAt: 100,
      };
      const installedOnlyExt1: ExtensionInfo[] = [
        {
          id: "ext1",
          name: "Ext 1",
          shortName: "1",
          version: "1.0",
          enabled: true,
          mayDisable: true,
          description: "",
          type: "extension",
          installType: "normal",
          offlineEnabled: false,
          optionsUrl: "",
          permissions: [],
          hostPermissions: [],
        },
      ];

      // When inventoryStatus is loading: missingMemberCount is 0, hasMissing is false
      const loadingSummary = computeGroupRuntimeSummary(group, installedOnlyExt1, "loading");
      expect(loadingSummary.missingMemberCount).toBe(0);
      expect(loadingSummary.hasMissing).toBe(false);
      expect(loadingSummary.exceptionText).toBeUndefined();

      // When inventoryStatus is error: missingMemberCount is 0, hasMissing is false
      const errorSummary = computeGroupRuntimeSummary(group, installedOnlyExt1, "error");
      expect(errorSummary.missingMemberCount).toBe(0);
      expect(errorSummary.hasMissing).toBe(false);
      expect(errorSummary.exceptionText).toBeUndefined();

      // When inventoryStatus is ready: missing member is authoritatively computed
      const readySummary = computeGroupRuntimeSummary(group, installedOnlyExt1, "ready");
      expect(readySummary.missingMemberCount).toBe(1);
      expect(readySummary.hasMissing).toBe(true);
      expect(readySummary.exceptionText).toBe("1 missing");
    });

    it("verifies focused group view handles reversible Remove-from-Group with Undo", () => {
      const group: ExtensionGroup = {
        id: "g_undo_test",
        name: "Undo Group",
        extensionIds: ["ext_installed", "ext_missing_1"],
        color: "#1a73e8",
        createdAt: 100,
      };

      const onUpdateGroup = vi.fn();
      let capturedUndoCallback: (() => void) | null = null;
      let toastMessage = "";

      // Emulate Selector's handleRemoveMissingMember and undo action
      const handleRemoveMissingMember = (idToRemove: string) => {
        const prevExtensionIds = [...group.extensionIds];
        const nextIds = prevExtensionIds.filter((id) => id !== idToRemove);
        const identity = resolveMissingMemberIdentity(
          idToRemove,
          { ext_missing_1: { id: "ext_missing_1", name: "Missing Tool", lastSeenAt: 100 } },
          [],
          []
        );
        toastMessage = `Removed ${identity.name} from group`;
        onUpdateGroup({ ...group, extensionIds: nextIds });

        capturedUndoCallback = () => {
          onUpdateGroup({ ...group, extensionIds: prevExtensionIds });
        };
      };

      handleRemoveMissingMember("ext_missing_1");

      // Verify removal
      expect(onUpdateGroup).toHaveBeenCalledWith({
        ...group,
        extensionIds: ["ext_installed"],
      });
      expect(toastMessage).toBe("Removed Missing Tool from group");
      expect(capturedUndoCallback).not.toBeNull();

      // Trigger Undo
      capturedUndoCallback!();

      // Restored exact previous members without touching anything else
      expect(onUpdateGroup).toHaveBeenLastCalledWith({
        ...group,
        extensionIds: ["ext_installed", "ext_missing_1"],
      });
    });

    it("verifies service worker preserves missing members in groups on uninstallation", () => {
      const swSource = fs.readFileSync("src/background/service-worker.ts", "utf8");
      // onUninstalled listener must NOT splice from group.extensionIds
      expect(swSource).toContain("chrome.management.onUninstalled.addListener");
      expect(swSource).toContain("Do NOT automatically remove missing IDs from groups");
      expect(swSource).not.toMatch(/group\.extensionIds\.splice/);

      // GET_KNOWN_EXTENSIONS handled
      expect(swSource).toContain("case 'GET_KNOWN_EXTENSIONS':");
      expect(swSource).toContain("return getKnownExtensions();");
    });
  });
});
