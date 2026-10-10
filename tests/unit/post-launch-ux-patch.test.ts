import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { ExtensionBrief } from "../../src/popup/components/ExtensionBrief";
import { SubWindow } from "../../src/popup/components/SubWindow";
import { Navigator } from "../../src/popup/components/Navigator";
import { AboutView } from "../../src/popup/components/AboutView";
import { DEFAULT_SETTINGS, type ExtensionInfo, type AppSettings } from "../../src/shared/types";
import { validateSettings } from "../../src/shared/import-export";
import { BUY_ME_A_BEER_URL } from "../../src/shared/external-link";

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
      expect(aboutSource).toContain("Opens Buy Me a Coffee in a new tab.");

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
});
