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

    it("OptionsView defines Developer Workspace toggle switch", () => {
      const optionsSource = fs.readFileSync("src/popup/components/OptionsView.tsx", "utf8");
      expect(optionsSource).toContain('id="setting-developer-mode"');
      expect(optionsSource).toContain("Show Developer workspace");
      expect(optionsSource).toContain("Adds the Developer tab for managing local builds, source links, store releases, analytics, and packages.");
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
      expect(devSource).toContain("GitHub linked");
      expect(devSource).toContain("GitHub not linked");
      expect(devSource).toContain("Store linked");
      expect(devSource).toContain("Store not linked");
      expect(devSource).toContain("Store analytics · Not connected");
      expect(devSource).toContain("Analytics not linked");
      expect(devSource).toContain("Store analytics · Connected");
      expect(devSource).toContain("Store analytics · Error");
      expect(devSource).toContain("Package: not enabled");
      expect(devSource).toContain("Runtime ON");
      expect(devSource).toContain("Open CWS Dashboard");

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

    it("includes self-extension when installType is development and excludes when store/normal", () => {
      const selfDev: ExtensionInfo = {
        id: "onkcjpfgllpfbimnchjehboikhippnka",
        name: "Extension Drawer",
        shortName: "Extension Drawer",
        description: "Development build of Extension Drawer",
        version: "1.1.0",
        enabled: true,
        mayDisable: true,
        type: "extension",
        installType: "development",
        offlineEnabled: true,
        optionsUrl: "options.html",
        permissions: [],
        hostPermissions: [],
      };

      const selfStore: ExtensionInfo = {
        ...selfDev,
        installType: "normal",
      };

      // When self is unpacked/development, it appears in unlinked dev extensions (single appearance, no dups)
      const unlinkedWithSelfDev = getUnlinkedDevExtensions([unpackedExt], [], selfDev);
      expect(unlinkedWithSelfDev).toHaveLength(2);
      expect(unlinkedWithSelfDev.some((e) => e.id === selfDev.id)).toBe(true);

      // Deduplication check: if already in extensions list, should not duplicate
      const unlinkedDedupe = getUnlinkedDevExtensions([unpackedExt, selfDev], [], selfDev);
      expect(unlinkedDedupe).toHaveLength(2);

      // When self is normal/store install, it must NOT appear in dev extensions
      const unlinkedWithSelfStore = getUnlinkedDevExtensions([unpackedExt], [], selfStore);
      expect(unlinkedWithSelfStore).toHaveLength(1);
      expect(unlinkedWithSelfStore.some((e) => e.id === selfStore.id)).toBe(false);
    });

    it("excludes normal store extensions from local test selector in ProjectEditorModal", () => {
      const devSource = fs.readFileSync("src/popup/components/DeveloperView.tsx", "utf8");
      // Must filter ONLY development extensions using getAllDevExtensions
      expect(devSource).toContain("const devExtensions = getAllDevExtensions(extensions, selfExtension);");
      // Must not create an optgroup for other extensions
      expect(devSource).not.toContain("otherExtensions.map");
    });

    it("NooBossApp wires DeveloperView with project CRUD handlers, selfExtension, and routing", () => {
      const appSource = fs.readFileSync("src/popup/components/NooBossApp.tsx", "utf8");
      expect(appSource).toContain("DeveloperView");
      expect(appSource).toContain("selfExtension={selfExtension}");
      expect(appSource).toContain("handleSaveDeveloperProject");
      expect(appSource).toContain("handleDeleteDeveloperProject");
      expect(appSource).toContain("mainLocation === \"developer\" && settings.developerMode");
      expect(appSource).toContain("GET_DEVELOPER_PROJECTS");
      // Safeguard self from accidental disabling
      expect(appSource).toContain("selfExtension && id === selfExtension.id");
      // Reload self routes to chrome.runtime.reload()
      expect(appSource).toContain("chrome.runtime.reload()");
    });

    it("service-worker.ts handles developer project messages, GET_SELF, and backup export/import", () => {
      const swSource = fs.readFileSync("src/background/service-worker.ts", "utf8");
      expect(swSource).toContain("GET_DEVELOPER_PROJECTS");
      expect(swSource).toContain("SAVE_DEVELOPER_PROJECT");
      expect(swSource).toContain("DELETE_DEVELOPER_PROJECT");
      expect(swSource).toContain("GET_SELF");
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

  describe("Outcome 7 — Project Deletion Safety and Information Design Simplification", () => {
    it("verifies service-worker.ts cleans up GA metrics on DELETE_DEVELOPER_PROJECT without touching chrome.management", () => {
      const swSource = fs.readFileSync("src/background/service-worker.ts", "utf8");
      const deleteBlock = swSource.slice(
        swSource.indexOf("case 'DELETE_DEVELOPER_PROJECT':"),
        swSource.indexOf("case 'EXPORT_DATA':")
      );

      // Must clean up project GA metrics
      expect(deleteBlock).toContain("clearProjectGA4Metrics(message.id)");
      expect(deleteBlock).toContain("saveDeveloperProjects(filtered)");

      // Invariant: MUST NOT invoke chrome.management uninstall or setEnabled
      expect(deleteBlock).not.toContain("chrome.management.uninstall");
      expect(deleteBlock).not.toContain("uninstallExtension");
      expect(deleteBlock).not.toContain("chrome.management.setEnabled");
      expect(deleteBlock).not.toContain("toggleExtension");
    });

    it("verifies project deletion semantics preserve installed extension state and clean GA metrics", async () => {
      const {
        saveDeveloperProjects,
        getDeveloperProjects,
        saveProjectGA4Metrics,
        getProjectGA4Metrics,
        clearProjectGA4Metrics,
      } = await import("../../src/shared/storage");

      let fakeStorage: Record<string, any> = {};
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
        management: {
          getAll: vi.fn().mockResolvedValue([
            { id: "ext-1", name: "Local Dev Plugin", installType: "development", enabled: true },
            { id: "ext-2", name: "Store Ext", installType: "normal", enabled: true },
          ]),
          uninstall: vi.fn(),
          setEnabled: vi.fn(),
        },
      };

      const project1: DeveloperProject = {
        id: "proj-1",
        name: "Dev Project 1",
        localExtensionId: "ext-1",
        createdAt: 1000,
        updatedAt: 1000,
      };
      const project2: DeveloperProject = {
        id: "proj-2",
        name: "Dev Project 2",
        localExtensionId: "ext-2",
        createdAt: 2000,
        updatedAt: 2000,
      };

      await saveDeveloperProjects([project1, project2]);
      await saveProjectGA4Metrics("proj-1", {
        propertyId: "553647047",
        visitors: 10,
        views: 20,
        engagementRate: 0.5,
        newUsers: 5,
        fetchedAt: Date.now(),
      });
      await saveProjectGA4Metrics("proj-2", {
        propertyId: "552797256",
        visitors: 30,
        views: 60,
        engagementRate: 0.3,
        newUsers: 15,
        fetchedAt: Date.now(),
      });

      // Simulate DELETE_DEVELOPER_PROJECT action for proj-1
      const currentProjects = await getDeveloperProjects();
      const filtered = currentProjects.filter((p) => p.id !== "proj-1");
      await saveDeveloperProjects(filtered);
      await clearProjectGA4Metrics("proj-1");

      // Verify proj-1 is deleted from projects
      const remainingProjects = await getDeveloperProjects();
      expect(remainingProjects).toHaveLength(1);
      expect(remainingProjects[0].id).toBe("proj-2");

      // Verify proj-1 GA metrics are removed while proj-2 remains
      const p1Metrics = await getProjectGA4Metrics("proj-1");
      const p2Metrics = await getProjectGA4Metrics("proj-2");
      expect(p1Metrics).toBeNull();
      expect(p2Metrics).not.toBeNull();
      expect(p2Metrics?.propertyId).toBe("552797256");

      // Invariant: chrome.management.uninstall and setEnabled were NEVER called
      expect((globalThis as any).chrome.management.uninstall).not.toHaveBeenCalled();
      expect((globalThis as any).chrome.management.setEnabled).not.toHaveBeenCalled();

      // Installed extensions inventory remains completely intact
      const installed = await (globalThis as any).chrome.management.getAll();
      expect(installed).toHaveLength(2);
      expect(installed[0].id).toBe("ext-1");
      expect(installed[0].enabled).toBe(true);
    });

    it("verifies Delete Confirmation Dialog copy, Material-3 actions, and Escape key dismissal", () => {
      const devSource = fs.readFileSync("src/popup/components/DeveloperView.tsx", "utf8");

      // Modal title and body copy
      expect(devSource).toContain("Remove project from Developer Workspace?");
      expect(devSource).toContain(
        "This removes only the project's Developer Workspace links, analytics settings, and local project metadata. The extension itself will remain installed and unchanged."
      );

      // Buttons
      expect(devSource).toContain("Remove project");
      expect(devSource).toContain("dev-delete-confirm-btn");
      expect(devSource).toContain("Cancel");

      // Escape key handler
      expect(devSource).toContain('if (e.key === "Escape")');
      expect(devSource).toContain("setDeleteConfirmId(null)");

      // Verify M3 CSS styling in nooboss.css
      const cssSource = fs.readFileSync("src/popup/components/nooboss.css", "utf8");
      expect(cssSource).toContain(".confirm-modal-box {");
      expect(cssSource).toContain(".confirm-modal-title {");
      expect(cssSource).toContain(".confirm-modal-actions {");
      expect(cssSource).toContain(".dev-delete-confirm-text {");
      expect(cssSource).toContain(".dev-delete-confirm-btn {");
      expect(cssSource).toContain("#d93025");
    });

    it("verifies main row analytics displays 3 KPIs, removes New users, and renders single zero-baseline note", () => {
      const devSource = fs.readFileSync("src/popup/components/DeveloperView.tsx", "utf8");

      // Locate the main row metrics bar
      const metricsBarStart = devSource.indexOf('className={`dev-ga4-metrics-bar');
      const metricsBarEnd = devSource.indexOf('</article>', metricsBarStart);
      const metricsBarBlock = devSource.slice(metricsBarStart, metricsBarEnd);

      // Main row has exactly 3 primary KPIs
      expect(metricsBarBlock).toContain("Visitors");
      expect(metricsBarBlock).toContain("Views");
      expect(metricsBarBlock).toContain("Engagement");

      // New users MUST NOT be in the compact main row
      expect(metricsBarBlock).not.toContain("New users");

      // Main row has single zero-baseline note
      expect(metricsBarBlock).toContain("No previous-period baseline");
      expect(metricsBarBlock).toContain("dev-ga4-baseline-note");

      // Clarified scope label
      expect(metricsBarBlock).toContain("Store analytics · 28d");

      // New users IS in ProjectEditorModal under the metrics grid
      const editorStart = devSource.indexOf("function ProjectEditorModal");
      const editorBlock = devSource.slice(editorStart);
      expect(editorBlock).toContain("dev-editor-metrics-grid");
      expect(editorBlock).toContain("New users");
      expect(editorBlock).toContain("GA4 property ID for Chrome Web Store listing telemetry.");

      // Neutral styling for connected metrics bar (no green container fill or border)
      const cssSource = fs.readFileSync("src/popup/components/nooboss.css", "utf8");
      const connectedBarCss = cssSource.slice(
        cssSource.indexOf(".dev-ga4-metrics-bar.dev-ga4-metrics-connected {"),
        cssSource.indexOf(".dev-ga4-metrics-bar.dev-ga4-metrics-error {")
      );
      expect(connectedBarCss).not.toContain("rgba(30, 142, 62");
      expect(connectedBarCss).toContain("var(--border-subtle)");
      expect(connectedBarCss).toContain("var(--bg-secondary)");
    });
  });
});

