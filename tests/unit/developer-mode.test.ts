import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import { ExtensionBrief } from "../../src/popup/components/ExtensionBrief";
import { DEFAULT_SETTINGS } from "../../src/shared/types";
import { validateSettings, createExportData, validateImportData } from "../../src/shared/import-export";
import type { ExtensionInfo } from "../../src/shared/types";

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

describe("Developer Mode v1", () => {
  const unpackedExt: ExtensionInfo = {
    id: "unpacked-dev-123",
    name: "My Local Plugin",
    shortName: "LocalDev",
    description: "An unpacked extension under local development",
    version: "0.2.1",
    enabled: true,
    mayDisable: true,
    type: "extension",
    installType: "development",
    offlineEnabled: true,
    optionsUrl: "options.html",
    permissions: [],
    hostPermissions: [],
  };

  const storeExt: ExtensionInfo = {
    id: "store-pkg-456",
    name: "Awesome Productivity Tool",
    shortName: "Productivity",
    description: "A normal extension installed from the Chrome Web Store",
    version: "2.4.0",
    enabled: true,
    mayDisable: true,
    type: "extension",
    installType: "normal",
    offlineEnabled: true,
    optionsUrl: "options.html",
    permissions: [],
    hostPermissions: [],
  };

  describe("Outcome 1 — Settings, Persistence & Options View", () => {
    it("defaults developerMode to false in DEFAULT_SETTINGS", () => {
      expect(DEFAULT_SETTINGS.developerMode).toBe(false);
    });

    it("validates and preserves developerMode boolean in validateSettings", () => {
      const validTrue = validateSettings({ developerMode: true });
      expect(validTrue.developerMode).toBe(true);

      const validFalse = validateSettings({ developerMode: false });
      expect(validFalse.developerMode).toBe(false);

      // Rejects non-boolean values and falls back to default false
      const invalidType = validateSettings({ developerMode: "yes" as any });
      expect(invalidType.developerMode).toBe(false);
    });

    it("preserves developerMode through import/export lifecycle", () => {
      const exportData = createExportData([], [], {
        ...DEFAULT_SETTINGS,
        developerMode: true,
      });
      expect(exportData.settings.developerMode).toBe(true);

      const imported = validateImportData(exportData);
      expect(imported.settings.developerMode).toBe(true);
    });

    it("OptionsView source defines Developer Mode section with switch and required copy", () => {
      const optionsSource = fs.readFileSync("src/popup/components/OptionsView.tsx", "utf8");
      expect(optionsSource).toContain('id="setting-developer-mode"');
      expect(optionsSource).toContain("Developer Mode");
      expect(optionsSource).toContain("Show developer tools and extension package actions.");
      expect(optionsSource).toContain("settings.developerMode ?? false");
    });
  });

  describe("Outcome 2 — Unpacked Extensions Behavior", () => {
    const viewModes: Array<"bigTile" | "tile" | "list"> = ["bigTile", "tile", "list"];

    viewModes.forEach((mode) => {
      it(`hides developer affordances when Developer Mode is OFF (default) in ${mode} view`, () => {
        const vnode = ExtensionBrief({
          extension: unpackedExt,
          viewMode: mode,
          developerMode: false,
          withControl: true,
        });

        // No DEV chip
        const devChip = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("dev-chip-badge"));
        expect(devChip).toBeNull();

        // No orange dot
        const dot = findVNode(vnode, (n) => n?.props?.className === "unpacked-badge-dot");
        expect(dot).toBeNull();

        // No reload button
        const reloadBtn = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("reload-btn"));
        expect(reloadBtn).toBeNull();

        // No dev actions menu
        const devMenu = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("dev-menu-container"));
        expect(devMenu).toBeNull();
      });

      it(`shows DEV badge and Developer Reload when Developer Mode is ON in ${mode} view`, () => {
        const onReload = vi.fn();
        const vnode = ExtensionBrief({
          extension: unpackedExt,
          viewMode: mode,
          developerMode: true,
          withControl: true,
          onReload,
        });

        // DEV chip is present
        const devChip = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("dev-chip-badge"));
        expect(devChip).toBeTruthy();
        expect(devChip.props.children).toBe("DEV");

        // Orange dot indicator is present
        const dot = findVNode(vnode, (n) => n?.props?.className === "unpacked-badge-dot");
        expect(dot).toBeTruthy();

        // Developer Reload button is present
        const reloadBtn = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("reload-btn"));
        expect(reloadBtn).toBeTruthy();
        expect(reloadBtn.props.title).toBe("Reload extension code");

        // Does NOT show store package menu for unpacked
        const devMenu = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("dev-menu-container"));
        expect(devMenu).toBeNull();
      });
    });
  });

  describe("Outcome 3 — Store-Installed Extensions Behavior", () => {
    const viewModes: Array<"bigTile" | "tile" | "list"> = ["bigTile", "tile", "list"];

    viewModes.forEach((mode) => {
      it(`hides developer actions menu when Developer Mode is OFF (default) in ${mode} view`, () => {
        const vnode = ExtensionBrief({
          extension: storeExt,
          viewMode: mode,
          developerMode: false,
          withControl: true,
        });

        const devMenu = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("dev-menu-container"));
        expect(devMenu).toBeNull();

        const reloadBtn = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("reload-btn"));
        expect(reloadBtn).toBeNull();

        const devChip = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("dev-chip-badge"));
        expect(devChip).toBeNull();
      });

      it(`exposes developer actions menu when Developer Mode is ON in ${mode} view`, () => {
        const vnode = ExtensionBrief({
          extension: storeExt,
          viewMode: mode,
          developerMode: true,
          withControl: true,
        });

        // Dev menu container should be present
        const devMenu = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("dev-menu-container"));
        expect(devMenu).toBeTruthy();

        // All menu item text nodes
        const allTextNodes = findAllVNodes(devMenu, (n) => typeof n?.props?.children === "string");
        const allText = allTextNodes.map((n) => n.props.children).join(" ");

        // Open store page action
        expect(allText).toContain("Open store page");

        // Open extension details action
        expect(allText).toContain("Open extension details");

        // Download store package action
        expect(allText).toContain("Download store package");

        // Exact required disabled reason copy
        expect(allText).toContain("Store package download requires additional browser permission.");

        // Disabled button present in menu
        const disabledBtn = findVNode(devMenu, (n) => n?.type === "button" && n?.props?.disabled === true);
        expect(disabledBtn).toBeTruthy();
        expect(disabledBtn.props.title).toBe("Store package download requires additional browser permission.");
      });
    });
  });

  describe("Outcome 4 & 5 — Architecture, App Wiring & SubWindow Contracts", () => {
    it("NooBossApp passes developerMode to Selector and SubWindow", () => {
      const appSource = fs.readFileSync("src/popup/components/NooBossApp.tsx", "utf8");
      expect(appSource).toContain("developerMode={settings.developerMode ?? false}");
      expect(appSource).toContain("onReloadExtension={handleReloadExtension}");
    });

    it("Selector accepts and forwards developerMode to all catalog item maps", () => {
      const selectorSource = fs.readFileSync("src/popup/components/Selector.tsx", "utf8");
      expect(selectorSource).toContain("developerMode?: boolean;");
      expect(selectorSource).toContain("developerMode={developerMode}");
    });

    it("SubWindow implements developer affordances according to mode and installType", () => {
      const subWindowSource = fs.readFileSync("src/popup/components/SubWindow.tsx", "utf8");
      expect(subWindowSource).toContain("developerMode?: boolean;");
      expect(subWindowSource).toContain("onReloadExtension?: (id: string) => Promise<void> | void;");
      // DEV chip for unpacked
      expect(subWindowSource).toContain('developerMode && ext.installType === "development"');
      expect(subWindowSource).toContain('DEV');
      // Developer reload for unpacked
      expect(subWindowSource).toContain('onReloadExtension?.(ext.id)');
      // Developer actions section for store extensions
      expect(subWindowSource).toContain('Open store page');
      expect(subWindowSource).toContain('Open extension details');
      expect(subWindowSource).toContain('Download store package');
      expect(subWindowSource).toContain('Store package download requires additional browser permission.');
    });

    it("CSS contains styles for developer chips, menu popover, and disabled notes", () => {
      const cssSource = fs.readFileSync("src/popup/components/nooboss.css", "utf8");
      expect(cssSource).toContain(".dev-chip-badge");
      expect(cssSource).toContain(".dev-actions-popover");
      expect(cssSource).toContain(".dev-menu-item");
      expect(cssSource).toContain(".dev-note-text");
    });
  });
});

