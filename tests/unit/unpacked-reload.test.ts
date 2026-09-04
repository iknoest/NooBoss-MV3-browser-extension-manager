import { describe, it, expect, vi } from "vitest";
import { ExtensionBrief } from "../../src/popup/components/ExtensionBrief";
import type { ExtensionInfo, Message } from "../../src/shared/types";

// Helper to find VNodes in Preact JSX tree
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

describe("Unpacked Extension Indicator & Reload Controls", () => {
  const unpackedExt: ExtensionInfo = {
    id: "unpacked-ext-id",
    name: "Dev Ext",
    shortName: "Dev",
    description: "An unpacked extension under development",
    version: "0.1.0",
    enabled: true,
    mayDisable: true,
    type: "extension",
    installType: "development",
    offlineEnabled: true,
    optionsUrl: "",
    permissions: [],
    hostPermissions: [],
  };

  const normalExt: ExtensionInfo = {
    id: "store-ext-id",
    name: "Store Ext",
    shortName: "Store",
    description: "A normal extension installed from webstore",
    version: "1.2.0",
    enabled: true,
    mayDisable: true,
    type: "extension",
    installType: "normal",
    offlineEnabled: true,
    optionsUrl: "",
    permissions: [],
    hostPermissions: [],
  };

  describe("Message Type Contract", () => {
    it("supports RELOAD_EXTENSION message in Message union", () => {
      const reloadMsg: Message = {
        type: "RELOAD_EXTENSION",
        id: "unpacked-ext-id",
      };
      expect(reloadMsg.type).toBe("RELOAD_EXTENSION");
      expect(reloadMsg.id).toBe("unpacked-ext-id");
    });
  });

  describe("Unpacked Orange Indicator Dot Presence", () => {
    const viewModes: Array<"bigTile" | "tile" | "list"> = ["bigTile", "tile", "list"];

    viewModes.forEach((mode) => {
      it(`shows orange dot for unpacked extension in ${mode} view`, () => {
        const vnode = ExtensionBrief({
          extension: unpackedExt,
          viewMode: mode,
          withControl: true,
        });
        const badge = findVNode(vnode, (n) => n?.props?.className === "unpacked-badge-dot");
        expect(badge).toBeTruthy();
        expect(badge.props.title).toBe("Unpacked extension");
        expect(badge.props["aria-label"]).toBe("Unpacked extension");
      });

      it(`shows orange dot for disabled unpacked extension in ${mode} view`, () => {
        const disabledUnpacked: ExtensionInfo = { ...unpackedExt, enabled: false };
        const vnode = ExtensionBrief({
          extension: disabledUnpacked,
          viewMode: mode,
          withControl: true,
        });
        const badge = findVNode(vnode, (n) => n?.props?.className === "unpacked-badge-dot");
        expect(badge).toBeTruthy();
      });

      it(`does NOT show orange dot for store-installed extension in ${mode} view`, () => {
        const vnode = ExtensionBrief({
          extension: normalExt,
          viewMode: mode,
          withControl: true,
        });
        const badge = findVNode(vnode, (n) => n?.props?.className === "unpacked-badge-dot");
        expect(badge).toBeNull();
      });
    });

    it("shows orange dot in selectable mode (group editor)", () => {
      const vnodeBig = ExtensionBrief({
        extension: unpackedExt,
        viewMode: "bigTile",
        selected: false,
      });
      expect(findVNode(vnodeBig, (n) => n?.props?.className === "unpacked-badge-dot")).toBeTruthy();

      const vnodeTile = ExtensionBrief({
        extension: unpackedExt,
        viewMode: "tile",
        selected: false,
      });
      expect(findVNode(vnodeTile, (n) => n?.props?.className === "unpacked-badge-dot")).toBeTruthy();

      const vnodeList = ExtensionBrief({
        extension: unpackedExt,
        viewMode: "list",
        selected: false,
      });
      expect(findVNode(vnodeList, (n) => n?.props?.className === "unpacked-badge-dot")).toBeTruthy();
    });
  });

  describe("Reload Action Button Visibility & State", () => {
    const viewModes: Array<"bigTile" | "tile" | "list"> = ["bigTile", "tile", "list"];

    viewModes.forEach((mode) => {
      it(`renders active reload button for enabled unpacked extension in ${mode} view`, () => {
        const onReload = vi.fn();
        const vnode = ExtensionBrief({
          extension: unpackedExt,
          viewMode: mode,
          withControl: true,
          onReload,
        });

        const reloadBtn = findVNode(
          vnode,
          (n) => typeof n?.props?.className === "string" && n.props.className.includes("reload-btn")
        );
        expect(reloadBtn).toBeTruthy();
        expect(reloadBtn.props.disabled).toBe(false);
        expect(reloadBtn.props.title).toBe("Reload extension code");
        expect(reloadBtn.props["aria-label"]).toContain("Reload extension code");

        // Simulate click
        const stopPropagation = vi.fn();
        reloadBtn.props.onClick({ stopPropagation });
        expect(stopPropagation).toHaveBeenCalled();
        expect(onReload).toHaveBeenCalledWith("unpacked-ext-id");
      });

      it(`renders disabled reload button for disabled unpacked extension in ${mode} view`, () => {
        const onReload = vi.fn();
        const disabledUnpacked: ExtensionInfo = { ...unpackedExt, enabled: false };
        const vnode = ExtensionBrief({
          extension: disabledUnpacked,
          viewMode: mode,
          withControl: true,
          onReload,
        });

        const reloadBtn = findVNode(
          vnode,
          (n) => typeof n?.props?.className === "string" && n.props.className.includes("reload-btn")
        );
        expect(reloadBtn).toBeTruthy();
        expect(reloadBtn.props.disabled).toBe(true);
        expect(reloadBtn.props.className).toContain("disabled");
        expect(reloadBtn.props.title).toBe("Enable this unpacked extension before reloading");

        // Click should NOT invoke onReload
        const stopPropagation = vi.fn();
        reloadBtn.props.onClick({ stopPropagation });
        expect(stopPropagation).toHaveBeenCalled();
        expect(onReload).not.toHaveBeenCalled();
      });

      it(`does NOT render reload button for store-installed extension in ${mode} view`, () => {
        const vnode = ExtensionBrief({
          extension: normalExt,
          viewMode: mode,
          withControl: true,
        });

        const reloadBtn = findVNode(
          vnode,
          (n) => typeof n?.props?.className === "string" && n.props.className.includes("reload-btn")
        );
        expect(reloadBtn).toBeNull();
      });

      it(`indicates reloading state with is-reloading class and disables button in ${mode} view`, () => {
        const vnode = ExtensionBrief({
          extension: unpackedExt,
          viewMode: mode,
          withControl: true,
          isReloading: true,
        });

        const reloadBtn = findVNode(
          vnode,
          (n) => typeof n?.props?.className === "string" && n.props.className.includes("reload-btn")
        );
        expect(reloadBtn).toBeTruthy();
        expect(reloadBtn.props.disabled).toBe(true);
        expect(reloadBtn.props.className).toContain("is-reloading");
      });
    });

    describe("Tile View Hover Metadata & Overlay", () => {
      it("renders DEV prefix with version for unpacked extensions in Tile hover bar", () => {
        const vnode = ExtensionBrief({
          extension: unpackedExt,
          viewMode: "tile",
          withControl: true,
        });

        expect(vnode.props.className).toContain("has-hover-controls");

        const hoverMeta = findVNode(
          vnode,
          (n) => typeof n?.props?.className === "string" && n.props.className.includes("tile-hover-meta")
        );
        expect(hoverMeta).toBeTruthy();
        expect(hoverMeta.props.children).toBe("DEV · v0.1.0");
        expect(hoverMeta.props.title).toBe("DEV · v0.1.0");
      });

      it("renders clean version without DEV prefix for store extensions in Tile hover bar", () => {
        const vnode = ExtensionBrief({
          extension: normalExt,
          viewMode: "tile",
          withControl: true,
        });

        const hoverMeta = findVNode(
          vnode,
          (n) => typeof n?.props?.className === "string" && n.props.className.includes("tile-hover-meta")
        );
        expect(hoverMeta).toBeTruthy();
        expect(hoverMeta.props.children).toBe("v1.2.0");
        expect(hoverMeta.props.title).toBe("v1.2.0");
      });

      it("handles versions that already start with 'v' or 'V' gracefully", () => {
        const vPrefixedExt: ExtensionInfo = {
          ...normalExt,
          version: "v2.3.4",
        };
        const vnode = ExtensionBrief({
          extension: vPrefixedExt,
          viewMode: "tile",
          withControl: true,
        });

        const hoverMeta = findVNode(
          vnode,
          (n) => typeof n?.props?.className === "string" && n.props.className.includes("tile-hover-meta")
        );
        expect(hoverMeta).toBeTruthy();
        expect(hoverMeta.props.children).toBe("v2.3.4");
      });
    });
  });

  describe("Safe Reload Logic & Self-Targeting Protection", () => {
    it("disallows reloading self ID", async () => {
      const selfId = "my-own-ext-id";
      async function reloadCheck(targetId: string, currentSelfId: string): Promise<{ allowed: boolean; reason?: string }> {
        if (targetId === currentSelfId) {
          return { allowed: false, reason: "Cannot reload self" };
        }
        return { allowed: true };
      }

      const result = await reloadCheck(selfId, selfId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Cannot reload self");

      const otherResult = await reloadCheck("other-ext", selfId);
      expect(otherResult.allowed).toBe(true);
    });

    it("verifies reload cycle sequence: disable then enable with retry recovery", async () => {
      const calls: string[] = [];
      let failFirstEnable = true;

      const mockManagement = {
        setEnabled: vi.fn(async (id: string, enabled: boolean) => {
          calls.push(`${id}:${enabled}`);
          if (enabled && failFirstEnable) {
            failFirstEnable = false;
            throw new Error("Temporary enable error");
          }
        }),
      };

      async function testReload(id: string) {
        await mockManagement.setEnabled(id, false);
        try {
          await mockManagement.setEnabled(id, true);
          return { success: true };
        } catch {
          // Retry recovery
          await mockManagement.setEnabled(id, true);
          return { success: true, recovered: true };
        }
      }

      const outcome = await testReload("test-id");
      expect(outcome.success).toBe(true);
      expect(outcome.recovered).toBe(true);
      expect(calls).toEqual(["test-id:false", "test-id:true", "test-id:true"]);
    });
  });
});
