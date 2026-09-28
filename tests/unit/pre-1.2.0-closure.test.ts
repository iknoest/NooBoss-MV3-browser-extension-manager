import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import { ExtensionBrief } from "../../src/popup/components/ExtensionBrief";
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

describe("Pre-1.2.0 UI & Terminology Closure", () => {
  const cwsExtension: ExtensionInfo = {
    id: "abcdefghijklmnopabcdefghijklmnop",
    name: "Productivity Booster Plus with Super Long Name That Could Cause Overflow in Tight Grids",
    shortName: "Booster",
    description: "CWS extension with options, ZIP download, and management",
    version: "2.4.1",
    enabled: true,
    mayDisable: true,
    type: "extension",
    installType: "normal",
    offlineEnabled: true,
    optionsUrl: "options.html",
    permissions: [],
    hostPermissions: [],
  };

  const unpackedExtension: ExtensionInfo = {
    id: "unpacked-dev-1",
    name: "Local Dev Plugin",
    shortName: "DevPlugin",
    description: "Unpacked extension under development",
    version: "0.1.0",
    enabled: true,
    mayDisable: true,
    type: "extension",
    installType: "development",
    offlineEnabled: true,
    optionsUrl: "options.html",
    permissions: [],
    hostPermissions: [],
  };

  const themeExtension: ExtensionInfo = {
    id: "theme-ext-1",
    name: "Dark Nebula Theme",
    shortName: "DarkNebula",
    description: "Browser theme",
    version: "1.0.0",
    enabled: true,
    mayDisable: true,
    type: "theme",
    installType: "normal",
    offlineEnabled: true,
    optionsUrl: "",
    permissions: [],
    hostPermissions: [],
  };

  describe("1. Tile View Action Containment", () => {
    it("renders 2-tier hover layout: switch wrap on upper tier, actions on lower tier", () => {
      const vnode = ExtensionBrief({
        extension: cwsExtension,
        viewMode: "tile",
        withControl: true,
        onToggle: vi.fn(),
        onDownloadZip: vi.fn(),
        onOpenOptions: vi.fn(),
        onUninstall: vi.fn(),
      });

      // Hover bar must exist
      const hoverBar = findVNode(vnode, (n) => n.props?.className?.includes("tile-hover-bar"));
      expect(hoverBar).toBeTruthy();

      // Controls container
      const controls = findVNode(hoverBar, (n) => n.props?.className === "tile-hover-controls");
      expect(controls).toBeTruthy();

      // Switch wrap tier
      const switchWrap = findVNode(controls, (n) => n.props?.className === "tile-hover-switch-wrap");
      expect(switchWrap).toBeTruthy();
      const switchEl = findVNode(switchWrap, (n) => n.props?.role === "switch" || n.props?.size === "small");
      expect(switchEl).toBeTruthy();
      expect(switchEl.props?.size).toBe("small");

      // Actions tier
      const actionsWrap = findVNode(controls, (n) => n.props?.className === "tile-hover-actions");
      expect(actionsWrap).toBeTruthy();

      // All action buttons in actionsWrap have tile-action-btn
      const actionButtons = findAllVNodes(actionsWrap, (n) => n.type === "button");
      expect(actionButtons.length).toBe(3); // ZIP + Options + Uninstall
      actionButtons.forEach((btn) => {
        expect(btn.props?.className).toContain("tile-action-btn");
      });
    });

    it("renders unpacked reload button with tile-action-btn class in tile view", () => {
      const vnode = ExtensionBrief({
        extension: unpackedExtension,
        viewMode: "tile",
        withControl: true,
        developerMode: true,
        onToggle: vi.fn(),
        onReload: vi.fn(),
        onOpenOptions: vi.fn(),
        onUninstall: vi.fn(),
      });

      const actionsWrap = findVNode(vnode, (n) => n.props?.className === "tile-hover-actions");
      const reloadBtn = findVNode(actionsWrap, (n) => n.props?.className?.includes("reload-btn"));
      expect(reloadBtn).toBeTruthy();
      expect(reloadBtn.props?.className).toContain("tile-action-btn");
    });

    it("disables reload button when unpacked extension is disabled", () => {
      const disabledUnpacked = { ...unpackedExtension, enabled: false };
      const vnode = ExtensionBrief({
        extension: disabledUnpacked,
        viewMode: "tile",
        withControl: true,
        developerMode: true,
        onToggle: vi.fn(),
        onReload: vi.fn(),
      });

      const actionsWrap = findVNode(vnode, (n) => n.props?.className === "tile-hover-actions");
      const reloadBtn = findVNode(actionsWrap, (n) => n.props?.className?.includes("reload-btn"));
      expect(reloadBtn).toBeTruthy();
      expect(reloadBtn.props?.disabled).toBe(true);
      expect(reloadBtn.props?.className).toContain("disabled");
    });

    it("omits switch for theme extension and retains clean action containment", () => {
      const vnode = ExtensionBrief({
        extension: themeExtension,
        viewMode: "tile",
        withControl: true,
        onUninstall: vi.fn(),
      });

      const switchWrap = findVNode(vnode, (n) => n.props?.className === "tile-hover-switch-wrap");
      expect(switchWrap).toBeNull();

      const actionsWrap = findVNode(vnode, (n) => n.props?.className === "tile-hover-actions");
      expect(actionsWrap).toBeTruthy();
      const actionButtons = findAllVNodes(actionsWrap, (n) => n.type === "button");
      expect(actionButtons.length).toBe(1); // uninstall only
      expect(actionButtons[0].props?.className).toContain("tile-action-btn");
    });

    it("omits reload button when developer mode is off", () => {
      const vnode = ExtensionBrief({
        extension: unpackedExtension,
        viewMode: "tile",
        withControl: true,
        developerMode: false,
        onToggle: vi.fn(),
        onReload: vi.fn(),
        onUninstall: vi.fn(),
      });

      const actionsWrap = findVNode(vnode, (n) => n.props?.className === "tile-hover-actions");
      const reloadBtn = findVNode(actionsWrap, (n) => n.props?.className?.includes("reload-btn"));
      expect(reloadBtn).toBeNull();
    });

    it("keeps long extension names isolated from hover actions", () => {
      const vnode = ExtensionBrief({
        extension: cwsExtension,
        viewMode: "tile",
        withControl: true,
      });

      const tileName = findVNode(vnode, (n) => n.props?.className === "tile-item-name");
      expect(tileName).toBeTruthy();
      expect(tileName.props?.children).toBe(cwsExtension.name);

      // Hover controls are completely separate from tile-body and isolated inside tile-hover-bar
      const hoverBar = findVNode(vnode, (n) => n.props?.className?.includes("tile-hover-bar"));
      expect(hoverBar).toBeTruthy();
      const hoverControls = findVNode(hoverBar, (n) => n.props?.className === "tile-hover-controls");
      expect(hoverControls).toBeTruthy();
    });
  });

  describe("2. CSS Containment & Responsive Rules", () => {
    const cssContent = fs.readFileSync("src/popup/components/nooboss.css", "utf8");

    it("defines responsive media queries on tile-grid to prevent horizontal squeeze", () => {
      expect(cssContent).toContain("@media (max-width: 720px)");
      expect(cssContent).toContain("@media (max-width: 600px)");
      expect(cssContent).toContain("@media (max-width: 480px)");
    });

    it("enforces overflow containment on nb-tile and tile-hover-bar", () => {
      expect(cssContent).toMatch(/\.nb-tile\s*\{[^}]*overflow:\s*hidden;/);
      expect(cssContent).toMatch(/\.tile-hover-bar\s*\{[^}]*overflow:\s*hidden;/);
    });

    it("structures tile-hover-controls as column with switch-wrap and actions", () => {
      expect(cssContent).toContain(".tile-hover-controls {");
      expect(cssContent).toContain("flex-direction: column;");
      expect(cssContent).toContain(".tile-hover-switch-wrap");
      expect(cssContent).toContain(".tile-hover-actions");
    });

    it("defines compact size-small switch styles with standard track and thumb", () => {
      expect(cssContent).toContain(".extension-switch.size-small");
      expect(cssContent).toContain(".extension-switch.size-small .toggle-track");
      expect(cssContent).toContain(".extension-switch.size-small .toggle-thumb");
      expect(cssContent).toContain(".extension-switch.size-small.state-on .toggle-thumb");
    });

    it("defines tile-action-btn with 28px Material hit target and disabled/spin states", () => {
      expect(cssContent).toContain(".tile-action-btn {");
      expect(cssContent).toContain("width: 28px;");
      expect(cssContent).toContain("height: 28px;");
      expect(cssContent).toContain(".tile-action-btn:disabled");
      expect(cssContent).toContain(".tile-action-btn.reload-btn.is-reloading");
    });
  });

  describe("3. Terminology Closure ('Site Rules')", () => {
    it("OptionsView notifications section uses 'Site Rules Alerts' without stale AutoState copy", () => {
      const optionsSource = fs.readFileSync("src/popup/components/OptionsView.tsx", "utf8");
      expect(optionsSource).toContain("Site Rules Alerts");
      expect(optionsSource).toContain("Notify when Site Rules trigger changes");
      expect(optionsSource).not.toContain("AutoState Alerts");
      expect(optionsSource).not.toContain("Notify when AutoState rules trigger changes");
    });

    it("OptionsView Backup & Data section references 'Site Rules' in export description", () => {
      const optionsSource = fs.readFileSync("src/popup/components/OptionsView.tsx", "utf8");
      expect(optionsSource).toContain("Export groups, Site Rules, and preferences to JSON");
      expect(optionsSource).not.toContain("Export groups, AutoState rules, and preferences to JSON");
    });

    it("service worker pending changes use 'Site Rules' as ruleName", () => {
      const swSource = fs.readFileSync("src/background/service-worker.ts", "utf8");
      expect(swSource).toContain("ruleName: 'Site Rules'");
      expect(swSource).toContain("ruleName: 'Site Rules fallback'");
      expect(swSource).not.toContain("ruleName: 'AutoState'");
      expect(swSource).not.toContain("ruleName: 'AutoState fallback'");
    });

    it("manifest.json description uses 'Site Rules'", () => {
      const manifestSource = fs.readFileSync("src/manifest.json", "utf8");
      expect(manifestSource).toContain("with Site Rules, history and local backup.");
      expect(manifestSource).not.toContain("with AutoState rules, history and local backup.");
    });
  });
});
