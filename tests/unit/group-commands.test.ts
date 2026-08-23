import { describe, it, expect } from "vitest";
import { computeGroupRuntimeSummary } from "../../src/popup/components/group-summary";
import type { ExtensionGroup, ExtensionInfo, AutoStateRule } from "../../src/shared/types";

describe("Group Command Model & Runtime Accounting", () => {
  const sampleExtensions: ExtensionInfo[] = [
    { id: "ext1", name: "Ext 1", version: "1.0", enabled: true, type: "extension", installType: "normal", mayDisable: true },
    { id: "ext2", name: "Ext 2", version: "1.0", enabled: false, type: "extension", installType: "normal", mayDisable: true },
    { id: "ext3", name: "Ext 3", version: "1.0", enabled: true, type: "extension", installType: "normal", mayDisable: true },
    { id: "ext_unavail", name: "Policy Protected Ext", version: "1.0", enabled: true, type: "extension", installType: "admin", mayDisable: false },
  ] as ExtensionInfo[];

  describe("Group Runtime Summary", () => {
    it("computes all running state accurately (3 / 3 running)", () => {
      const group: ExtensionGroup = {
        id: "g1",
        name: "Active Group",
        extensionIds: ["ext1", "ext3"],
        color: "#1a73e8",
        createdAt: 1000,
      };
      const summary = computeGroupRuntimeSummary(group, sampleExtensions);
      expect(summary.configuredMemberCount).toBe(2);
      expect(summary.installedMemberCount).toBe(2);
      expect(summary.runningMemberCount).toBe(2);
      expect(summary.summaryText).toBe("2 / 2 running");
      expect(summary.exceptionText).toBeUndefined();
    });

    it("computes partial running state accurately without mixed flag (1 / 2 running)", () => {
      const group: ExtensionGroup = {
        id: "g2",
        name: "Partial Group",
        extensionIds: ["ext1", "ext2"],
        color: "#1a73e8",
        createdAt: 1000,
      };
      const summary = computeGroupRuntimeSummary(group, sampleExtensions);
      expect(summary.configuredMemberCount).toBe(2);
      expect(summary.installedMemberCount).toBe(2);
      expect(summary.runningMemberCount).toBe(1);
      expect(summary.summaryText).toBe("1 / 2 running");
      expect(summary.exceptionText).toBeUndefined();
    });

    it("handles missing/uninstalled extensions by excluding from Y and noting missing count", () => {
      const group: ExtensionGroup = {
        id: "g3",
        name: "Group With Ghost Ext",
        extensionIds: ["ext1", "ext2", "ghost_ext_404"],
        color: "#1a73e8",
        createdAt: 1000,
      };
      const summary = computeGroupRuntimeSummary(group, sampleExtensions);
      expect(summary.configuredMemberCount).toBe(3);
      expect(summary.installedMemberCount).toBe(2);
      expect(summary.runningMemberCount).toBe(1);
      expect(summary.missingMemberCount).toBe(1);
      expect(summary.summaryText).toBe("1 / 2 running");
      expect(summary.exceptionText).toBe("1 missing");
    });

    it("handles unavailable extensions by including in Y and noting unavailable count", () => {
      const group: ExtensionGroup = {
        id: "g4",
        name: "Group With Admin Ext",
        extensionIds: ["ext1", "ext_unavail"],
        color: "#1a73e8",
        createdAt: 1000,
      };
      const summary = computeGroupRuntimeSummary(group, sampleExtensions);
      expect(summary.configuredMemberCount).toBe(2);
      expect(summary.installedMemberCount).toBe(2);
      expect(summary.runningMemberCount).toBe(2);
      expect(summary.unavailableMemberCount).toBe(1);
      expect(summary.summaryText).toBe("2 / 2 running");
      expect(summary.exceptionText).toBe("1 unavailable");
    });

    it("handles both missing and unavailable extensions concurrently", () => {
      const group: ExtensionGroup = {
        id: "g5",
        name: "Complex Group",
        extensionIds: ["ext1", "ext_unavail", "ghost_ext_999"],
        color: "#1a73e8",
        createdAt: 1000,
      };
      const summary = computeGroupRuntimeSummary(group, sampleExtensions);
      expect(summary.configuredMemberCount).toBe(3);
      expect(summary.installedMemberCount).toBe(2);
      expect(summary.runningMemberCount).toBe(2);
      expect(summary.summaryText).toBe("2 / 2 running");
      expect(summary.exceptionText).toBe("1 unavailable · 1 missing");
    });
  });

  describe("Bulk Command Execution Semantics", () => {
    it("dispatches OFF command to all eligible members from a partial state", async () => {
      const exts = JSON.parse(JSON.stringify(sampleExtensions)) as ExtensionInfo[];
      const group: ExtensionGroup = {
        id: "g_cmd",
        name: "Command Group",
        extensionIds: ["ext1", "ext2", "ext3"],
        color: "#1a73e8",
        createdAt: 1000,
      };

      // Initially 2 / 3 running
      let summary = computeGroupRuntimeSummary(group, exts);
      expect(summary.summaryText).toBe("2 / 3 running");

      // Execute OFF command
      const targetEnabled = false;
      const eligibleIds = group.extensionIds;
      eligibleIds.forEach((id) => {
        const found = exts.find((e) => e.id === id);
        if (found && found.mayDisable !== false) {
          found.enabled = targetEnabled;
        }
      });

      summary = computeGroupRuntimeSummary(group, exts);
      expect(summary.summaryText).toBe("0 / 3 running");
    });

    it("dispatches ON command to all eligible members from a partial state", async () => {
      const exts = JSON.parse(JSON.stringify(sampleExtensions)) as ExtensionInfo[];
      const group: ExtensionGroup = {
        id: "g_cmd",
        name: "Command Group",
        extensionIds: ["ext1", "ext2", "ext3"],
        color: "#1a73e8",
        createdAt: 1000,
      };

      // Initially 2 / 3 running
      let summary = computeGroupRuntimeSummary(group, exts);
      expect(summary.summaryText).toBe("2 / 3 running");

      // Execute ON command
      const targetEnabled = true;
      const eligibleIds = group.extensionIds;
      eligibleIds.forEach((id) => {
        const found = exts.find((e) => e.id === id);
        if (found && found.mayDisable !== false) {
          found.enabled = targetEnabled;
        }
      });

      summary = computeGroupRuntimeSummary(group, exts);
      expect(summary.summaryText).toBe("3 / 3 running");
    });

    it("unavailable member does not prevent OFF command from disabling other members", async () => {
      const exts = JSON.parse(JSON.stringify(sampleExtensions)) as ExtensionInfo[];
      const group: ExtensionGroup = {
        id: "g_unavail_cmd",
        name: "Admin Group",
        extensionIds: ["ext1", "ext_unavail"],
        color: "#1a73e8",
        createdAt: 1000,
      };

      // Initially 2 / 2 running · 1 unavailable
      let summary = computeGroupRuntimeSummary(group, exts);
      expect(summary.summaryText).toBe("2 / 2 running");
      expect(summary.exceptionText).toBe("1 unavailable");

      // Execute OFF command
      group.extensionIds.forEach((id) => {
        const found = exts.find((e) => e.id === id);
        if (found && found.mayDisable !== false) {
          found.enabled = false;
        }
      });

      // ext1 becomes false, ext_unavail remains true
      summary = computeGroupRuntimeSummary(group, exts);
      expect(summary.summaryText).toBe("1 / 2 running");
      expect(summary.exceptionText).toBe("1 unavailable");
    });

    it("overlapping groups do not fight or enforce state on each other", () => {
      const exts = [
        { id: "gpt", name: "ChatGPT", enabled: true, type: "extension", mayDisable: true },
        { id: "note", name: "NotebookLM", enabled: true, type: "extension", mayDisable: true },
        { id: "docs", name: "Google Docs", enabled: true, type: "extension", mayDisable: true },
      ] as ExtensionInfo[];

      const aiGroup: ExtensionGroup = {
        id: "ai",
        name: "AI Group",
        extensionIds: ["gpt", "note"],
        color: "#1a73e8",
        createdAt: 1000,
      };
      const workGroup: ExtensionGroup = {
        id: "work",
        name: "Work Group",
        extensionIds: ["gpt", "docs"],
        color: "#1a73e8",
        createdAt: 1000,
      };

      // Work group issues OFF command
      workGroup.extensionIds.forEach((id) => {
        const found = exts.find((e) => e.id === id);
        if (found) found.enabled = false;
      });

      // AI group simply updates count to 1 / 2 without reversing anything
      const aiSummary = computeGroupRuntimeSummary(aiGroup, exts);
      const workSummary = computeGroupRuntimeSummary(workGroup, exts);

      expect(workSummary.summaryText).toBe("0 / 2 running");
      expect(aiSummary.summaryText).toBe("1 / 2 running");
    });

    it("AutoState changes member state and updates group summary without rollback", () => {
      const exts = [
        { id: "ext1", name: "Ext 1", enabled: true, type: "extension", mayDisable: true },
        { id: "ext2", name: "Ext 2", enabled: true, type: "extension", mayDisable: true },
      ] as ExtensionInfo[];

      const group: ExtensionGroup = {
        id: "g_auto",
        name: "Auto Group",
        extensionIds: ["ext1", "ext2"],
        color: "#1a73e8",
        createdAt: 1000,
      };

      expect(computeGroupRuntimeSummary(group, exts).summaryText).toBe("2 / 2 running");

      // AutoState rule triggers and disables ext2
      const targetExt = exts.find((e) => e.id === "ext2")!;
      targetExt.enabled = false;

      expect(computeGroupRuntimeSummary(group, exts).summaryText).toBe("1 / 2 running");
    });
  });
});
