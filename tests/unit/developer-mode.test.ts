import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import { ExtensionBrief } from "../../src/popup/components/ExtensionBrief";
import { getUnlinkedDevExtensions } from "../../src/popup/components/DeveloperView";
import { Navigator } from "../../src/popup/components/Navigator";
import { DEFAULT_SETTINGS } from "../../src/shared/types";
import { validateSettings, createExportData, validateImportData } from "../../src/shared/import-export";
import type { ExtensionInfo, DeveloperProject } from "../../src/shared/types";

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

describe("Developer Workspace & Developer Mode", () => {
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

  const sampleProject: DeveloperProject = {
    id: "proj_test_1",
    name: "Test Developer Project",
    localExtensionId: "unpacked-dev-123",
    cwsExtensionId: "abcdefghijklmnopqrstuvwxyz123456",
    githubUrl: "https://github.com/test-owner/test-repo",
    gaPropertyId: "properties/987654321",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
  };

  describe("Outcome 1 — Top-Level Navigator & Settings Integration", () => {
    it("defaults developerMode to false in DEFAULT_SETTINGS", () => {
      expect(DEFAULT_SETTINGS.developerMode).toBe(false);
    });

    it("validates and preserves developerMode boolean in validateSettings", () => {
      const validTrue = validateSettings({ developerMode: true });
      expect(validTrue.developerMode).toBe(true);

      const validFalse = validateSettings({ developerMode: false });
      expect(validFalse.developerMode).toBe(false);

      const invalidType = validateSettings({ developerMode: "yes" as any });
      expect(invalidType.developerMode).toBe(false);
    });

    it("Navigator hides Developer tab when developerMode is false or undefined", () => {
      const onNavigate = vi.fn();
      const vnode = Navigator({
        mainLocation: "extensions",
        onNavigateMain: onNavigate,
        developerMode: false,
      });

      const navButtons = findAllVNodes(vnode, (n) => n?.type === "button" && typeof n?.props?.className === "string" && n.props.className.includes("nav-link"));
      const buttonLabels = navButtons.map((btn) => btn.props.children);
      expect(buttonLabels).not.toContain("Developer");
    });

    it("Navigator renders Developer tab between History and Options when developerMode is true", () => {
      const onNavigate = vi.fn();
      const vnode = Navigator({
        mainLocation: "developer",
        onNavigateMain: onNavigate,
        developerMode: true,
      });

      const navButtons = findAllVNodes(vnode, (n) => n?.type === "button" && typeof n?.props?.className === "string" && n.props.className.includes("nav-link"));
      const buttonLabels = navButtons.map((btn) => btn.props.children);
      expect(buttonLabels).toContain("Developer");

      const devIdx = buttonLabels.indexOf("Developer");
      const histIdx = buttonLabels.indexOf("History");
      const optIdx = buttonLabels.indexOf("Options");

      expect(devIdx).toBeGreaterThan(histIdx);
      expect(devIdx).toBeLessThan(optIdx);

      const devButton = navButtons[devIdx];
      expect(devButton.props.className).toContain("active");
    });

    it("OptionsView defines Developer Mode toggle switch", () => {
      const optionsSource = fs.readFileSync("src/popup/components/OptionsView.tsx", "utf8");
      expect(optionsSource).toContain('id="setting-developer-mode"');
      expect(optionsSource).toContain("Developer Mode");
      expect(optionsSource).toContain("Show developer tools and extension package actions.");
    });
  });

  describe("Outcome 2 — Developer Projects Data Model & Import/Export", () => {
    it("exports developer projects when provided", () => {
      const exportData = createExportData([], [], DEFAULT_SETTINGS, [sampleProject]);
      expect(exportData.developerProjects).toBeDefined();
      expect(exportData.developerProjects).toHaveLength(1);
      expect(exportData.developerProjects?.[0].name).toBe("Test Developer Project");
    });

    it("validates and imports developer projects properly", () => {
      const exportData = createExportData([], [], DEFAULT_SETTINGS, [sampleProject]);
      const imported = validateImportData(exportData);
      expect(imported.developerProjects).toBeDefined();
      expect(imported.developerProjects?.[0].id).toBe("proj_test_1");
      expect(imported.developerProjects?.[0].githubUrl).toBe("https://github.com/test-owner/test-repo");
    });

    it("rejects invalid developer projects format in import data", () => {
      const invalidExport = {
        version: 1,
        exportedAt: Date.now(),
        groups: [],
        autoStateRules: [],
        settings: DEFAULT_SETTINGS,
        developerProjects: [{ invalidField: 123 }],
      };
      expect(() => validateImportData(invalidExport)).toThrow(/Developer project must have a string id/);
    });
  });

  describe("Outcome 3 — Extension Card Clutter Elimination", () => {
    const viewModes: Array<"bigTile" | "tile" | "list"> = ["bigTile", "tile", "list"];

    viewModes.forEach((mode) => {
      it(`does NOT render terminal popover on normal store cards in ${mode} view`, () => {
        const vnode = ExtensionBrief({
          extension: storeExt,
          viewMode: mode,
          developerMode: true,
          withControl: true,
        });

        // No dev-menu-container on ordinary cards!
        const devMenu = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("dev-menu-container"));
        expect(devMenu).toBeNull();
      });

      it(`renders DEV badge and Reload button on unpacked extensions in ${mode} view when developerMode is ON`, () => {
        const vnode = ExtensionBrief({
          extension: unpackedExt,
          viewMode: mode,
          developerMode: true,
          withControl: true,
        });

        const devBadge = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("dev-chip-badge"));
        expect(devBadge).toBeTruthy();

        const reloadBtn = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("reload-btn"));
        expect(reloadBtn).toBeTruthy();
      });

      it(`hides DEV badge and Reload button on unpacked extensions in ${mode} view when developerMode is OFF`, () => {
        const vnode = ExtensionBrief({
          extension: unpackedExt,
          viewMode: mode,
          developerMode: false,
          withControl: true,
        });

        const devBadge = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("dev-chip-badge"));
        expect(devBadge).toBeNull();

        const reloadBtn = findVNode(vnode, (n) => typeof n?.props?.className === "string" && n.props.className.includes("reload-btn"));
        expect(reloadBtn).toBeNull();
      });
    });
  });

  describe("Outcome 4 — SubWindow Cleanliness", () => {
    it("does not render non-functional download button in SubWindow", () => {
      const subWindowSource = fs.readFileSync("src/popup/components/SubWindow.tsx", "utf8");
      expect(subWindowSource).not.toContain("Download store package");
      expect(subWindowSource).not.toContain("Store package download requires additional browser permission.");
    });
  });

  describe("Outcome 5 — Developer Workspace Compact Row & Status Chips", () => {
    it("DeveloperView defines compact 2-line project row with status chips and clean unlinked rows", () => {
      const devSource = fs.readFileSync("src/popup/components/DeveloperView.tsx", "utf8");
      // Top-level workspace branding and empty state
      expect(devSource).toContain("Developer Workspace");
      expect(devSource).toContain("No Developer Projects Yet");
      expect(devSource).toContain("Add Project");

      // Compact 2-line row architecture (not 7 compressed table columns)
      expect(devSource).toContain("dev-project-row");
      expect(devSource).toContain("dev-row-primary");
      expect(devSource).toContain("dev-row-identity");
      expect(devSource).toContain("dev-project-name");
      expect(devSource).toContain("dev-row-local");
      expect(devSource).toContain("dev-local-tag");
      expect(devSource).toContain("dev-row-actions");
      expect(devSource).toContain("dev-row-secondary");
      expect(devSource).toContain("dev-chips-group");
      expect(devSource).toContain("dev-status-chip");

      // Replaced squeezed table columns with clean status chips
      expect(devSource).not.toContain("col-project");
      expect(devSource).not.toContain("col-local");
      expect(devSource).not.toContain("col-github");
      expect(devSource).not.toContain("col-store");
      expect(devSource).not.toContain("col-analytics");
      expect(devSource).not.toContain("col-package");

      // Status chip labels
      expect(devSource).toContain("GitHub ✓");
      expect(devSource).toContain("GitHub +");
      expect(devSource).toContain("Store ✓");
      expect(devSource).toContain("Store +");
      expect(devSource).toContain("GA4 · Connect");
      expect(devSource).toContain("GA4 +");
      expect(devSource).toContain("Package locked");

      // Simplified unlinked rows without meaningless dash columns
      expect(devSource).toContain("dev-unlinked-row");
      expect(devSource).toContain("dev-setup-btn");
      expect(devSource).not.toContain("&mdash;");
      expect(devSource).toContain("Unlinked Development Extensions");
      expect(devSource).not.toContain(".slice(0, 3)");

      // Modal editor with strict unpacked local extension binding
      expect(devSource).toContain("ProjectEditorModal");
      expect(devSource).toContain("Only unpacked development extensions can be linked as local test builds.");
      expect(devSource).not.toContain("Other Installed Extensions");
      expect(devSource).toContain("cleanCwsId");
    });

    it("identifies all unlinked development extensions without arbitrary cap and filters bound projects", () => {
      // 5 unpacked development extensions
      const devExtensions: ExtensionInfo[] = Array.from({ length: 5 }, (_, i) => ({
        id: `unpacked-ext-${i + 1}`,
        name: `Dev Plugin ${i + 1}`,
        shortName: `Dev${i + 1}`,
        description: `Unpacked build ${i + 1}`,
        version: `0.${i + 1}.0`,
        enabled: true,
        mayDisable: true,
        type: "extension",
        installType: "development",
        offlineEnabled: true,
        optionsUrl: "options.html",
        permissions: [],
        hostPermissions: [],
      }));

      // When no projects are bound, all 5 must be returned (no .slice(0, 3) cap)
      const unlinked = getUnlinkedDevExtensions([...devExtensions, storeExt], []);
      expect(unlinked).toHaveLength(5);
      expect(unlinked.map((e) => e.id)).toEqual([
        "unpacked-ext-1",
        "unpacked-ext-2",
        "unpacked-ext-3",
        "unpacked-ext-4",
        "unpacked-ext-5",
      ]);

      // When one extension is bound to a project, it disappears from unlinked
      const projectWithExt1: DeveloperProject = {
        ...sampleProject,
        localExtensionId: "unpacked-ext-1",
      };
      const unlinkedAfterBind = getUnlinkedDevExtensions([...devExtensions, storeExt], [projectWithExt1]);
      expect(unlinkedAfterBind).toHaveLength(4);
      expect(unlinkedAfterBind.find((e) => e.id === "unpacked-ext-1")).toBeUndefined();
    });

    it("excludes normal store extensions from local test selector in ProjectEditorModal", () => {
      const devSource = fs.readFileSync("src/popup/components/DeveloperView.tsx", "utf8");
      // Must filter ONLY development extensions for devExtensions
      expect(devSource).toContain('const devExtensions = extensions.filter((e) => e.installType === "development");');
      // Must not create an optgroup for other extensions
      expect(devSource).not.toContain('otherExtensions.map');
    });

    it("NooBossApp wires DeveloperView with project CRUD handlers and routing", () => {
      const appSource = fs.readFileSync("src/popup/components/NooBossApp.tsx", "utf8");
      expect(appSource).toContain("DeveloperView");
      expect(appSource).toContain("handleSaveDeveloperProject");
      expect(appSource).toContain("handleDeleteDeveloperProject");
      expect(appSource).toContain("mainLocation === \"developer\" && settings.developerMode");
      expect(appSource).toContain("GET_DEVELOPER_PROJECTS");
    });

    it("service-worker.ts handles developer project messages and backup export/import", () => {
      const swSource = fs.readFileSync("src/background/service-worker.ts", "utf8");
      expect(swSource).toContain("GET_DEVELOPER_PROJECTS");
      expect(swSource).toContain("SAVE_DEVELOPER_PROJECT");
      expect(swSource).toContain("DELETE_DEVELOPER_PROJECT");
      expect(swSource).toContain("getDeveloperProjects");
      expect(swSource).toContain("saveDeveloperProjects");
    });
  });

  describe("Outcome 6 — Manager Scroll Container Fix", () => {
    it("verifies .nooboss-app.full-manager has height: 100vh and overflow: hidden", () => {
      const cssSource = fs.readFileSync("src/popup/components/nooboss.css", "utf8");
      expect(cssSource).toContain(".nooboss-app.full-manager {\n  height: 100vh;\n  width: 100%;\n  overflow: hidden;\n}");
    });
  });
});
