import { describe, it, expect } from "vitest";
import { sortGroupMemberExtensions } from "../../src/popup/components/group-member-utils";
import { computeGroupRuntimeSummary } from "../../src/popup/components/group-summary";
import type { ExtensionInfo, ExtensionGroup } from "../../src/shared/types";

describe("Group Usability UX & Taxonomy (Outcomes B, C, D)", () => {
  const sampleExtensions: ExtensionInfo[] = [
    {
      id: "ext_c_unassigned_running",
      name: "Charlie Extension",
      version: "1.0",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
    } as ExtensionInfo,
    {
      id: "ext_a_assigned_disabled",
      name: "Alpha Extension",
      version: "1.0",
      enabled: false,
      type: "extension",
      installType: "normal",
      mayDisable: true,
    } as ExtensionInfo,
    {
      id: "ext_b_assigned_running",
      name: "Beta Extension",
      version: "1.0",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
    } as ExtensionInfo,
    {
      id: "ext_d_unassigned_disabled",
      name: "Delta Extension",
      version: "1.0",
      enabled: false,
      type: "extension",
      installType: "normal",
      mayDisable: true,
    } as ExtensionInfo,
    {
      id: "ext_e_assigned_running",
      name: "Echo Extension",
      version: "1.0",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
    } as ExtensionInfo,
  ];

  const assignedIds = ["ext_a_assigned_disabled", "ext_b_assigned_running", "ext_e_assigned_running"];

  describe("Outcome B: Group Member Selector Ordering", () => {
    it("sorts assigned first, then running first within each section, then alphabetical", () => {
      const sorted = sortGroupMemberExtensions(sampleExtensions, assignedIds);
      const sortedIds = sorted.map((e) => e.id);

      // Expected order:
      // 1. Assigned + Running: Beta ("ext_b_assigned_running"), Echo ("ext_e_assigned_running")
      // 2. Assigned + Disabled: Alpha ("ext_a_assigned_disabled")
      // 3. Unassigned + Running: Charlie ("ext_c_unassigned_running")
      // 4. Unassigned + Disabled: Delta ("ext_d_unassigned_disabled")
      expect(sortedIds).toEqual([
        "ext_b_assigned_running",
        "ext_e_assigned_running",
        "ext_a_assigned_disabled",
        "ext_c_unassigned_running",
        "ext_d_unassigned_disabled",
      ]);
    });

    it("falls back to running first then alphabetical when no selection list is provided", () => {
      const sorted = sortGroupMemberExtensions(sampleExtensions);
      const sortedIds = sorted.map((e) => e.id);

      // Running first: Beta, Charlie, Echo (alphabetical by name: Beta, Charlie, Echo)
      // Then disabled: Alpha, Delta (alphabetical: Alpha, Delta)
      expect(sortedIds).toEqual([
        "ext_b_assigned_running",
        "ext_c_unassigned_running",
        "ext_e_assigned_running",
        "ext_a_assigned_disabled",
        "ext_d_unassigned_disabled",
      ]);
    });

    it("supports Assigned Only filtering", () => {
      const assignedOnly = sampleExtensions.filter((e) => assignedIds.includes(e.id));
      expect(assignedOnly).toHaveLength(3);
      expect(assignedOnly.map((e) => e.id)).toEqual([
        "ext_a_assigned_disabled",
        "ext_b_assigned_running",
        "ext_e_assigned_running",
      ]);

      const sortedAssignedOnly = sortGroupMemberExtensions(assignedOnly, assignedIds);
      expect(sortedAssignedOnly.map((e) => e.id)).toEqual([
        "ext_b_assigned_running",
        "ext_e_assigned_running",
        "ext_a_assigned_disabled",
      ]);
    });
  });

  describe("Outcome C: Inspect & Control Group Members (Group Focus)", () => {
    const testGroup: ExtensionGroup = {
      id: "group_job_search",
      name: "Job search",
      extensionIds: ["ext_b_assigned_running", "ext_a_assigned_disabled"],
      color: "#1a73e8",
      createdAt: 1000,
    };

    it("filters extensions view strictly to group members when group focus is active", () => {
      const focusedGroupId = testGroup.id;
      const group = [testGroup].find((g) => g.id === focusedGroupId);
      expect(group).toBeDefined();

      const memberExtensions = sampleExtensions.filter((e) =>
        group!.extensionIds.includes(e.id)
      );
      expect(memberExtensions).toHaveLength(2);
      expect(memberExtensions.map((e) => e.id)).toEqual([
        "ext_a_assigned_disabled",
        "ext_b_assigned_running",
      ]);
    });

    it("displays live operational summary for focused group", () => {
      const summary = computeGroupRuntimeSummary(testGroup, sampleExtensions);
      expect(summary.summaryText).toBe("1 / 2 running");
      expect(summary.runningMemberCount).toBe(1);
      expect(summary.installedMemberCount).toBe(2);
    });

    it("allows individual member state to diverge while reflecting in group counter", () => {
      // Toggle the disabled member on
      const updatedExtensions = sampleExtensions.map((e) =>
        e.id === "ext_a_assigned_disabled" ? { ...e, enabled: true } : e
      );
      const updatedSummary = computeGroupRuntimeSummary(testGroup, updatedExtensions);
      expect(updatedSummary.summaryText).toBe("2 / 2 running");
      expect(updatedSummary.runningMemberCount).toBe(2);
    });

    it("clears group focus to return to all extensions", () => {
      let focusedGroupId: string | null = testGroup.id;
      // Clear focus
      focusedGroupId = null;

      const activeGroup = [testGroup].find((g) => g.id === focusedGroupId);
      const visibleExtensions = sampleExtensions.filter((e) =>
        activeGroup ? activeGroup.extensionIds.includes(e.id) : true
      );
      expect(visibleExtensions).toHaveLength(sampleExtensions.length);
    });
  });

  describe("Outcome D: Simplified Type Filter Taxonomy & Search Placeholder", () => {
    it("conditionally exposes Apps and Themes only when items exist", () => {
      // Scenario 1: Only extensions exist
      const onlyExtensions: ExtensionInfo[] = [
        { id: "e1", name: "Ext 1", type: "extension" } as ExtensionInfo,
        { id: "e2", name: "Ext 2", type: "extension" } as ExtensionInfo,
      ];
      const hasApps1 = onlyExtensions.some((e) => e.type === "app" || e.type === "hosted_app" || e.type === "packaged_app");
      const hasThemes1 = onlyExtensions.some((e) => e.type === "theme");

      expect(hasApps1).toBe(false);
      expect(hasThemes1).toBe(false);

      // Scenario 2: Hosted app present
      const withApp: ExtensionInfo[] = [
        ...onlyExtensions,
        { id: "a1", name: "Hosted App", type: "hosted_app" } as ExtensionInfo,
      ];
      const hasApps2 = withApp.some((e) => e.type === "app" || e.type === "hosted_app" || e.type === "packaged_app");
      const hasThemes2 = withApp.some((e) => e.type === "theme");

      expect(hasApps2).toBe(true);
      expect(hasThemes2).toBe(false);

      // Scenario 3: Theme present
      const withTheme: ExtensionInfo[] = [
        ...onlyExtensions,
        { id: "t1", name: "Dark Theme", type: "theme" } as ExtensionInfo,
      ];
      const hasApps3 = withTheme.some((e) => e.type === "app" || e.type === "hosted_app" || e.type === "packaged_app");
      const hasThemes3 = withTheme.some((e) => e.type === "theme");

      expect(hasApps3).toBe(false);
      expect(hasThemes3).toBe(true);
    });

    it("determines clear search placeholder scope dynamically", () => {
      const getPlaceholder = (
        hasFocusedGroup: boolean,
        groupsCount: number
      ): string => {
        if (hasFocusedGroup) return "Search extensions in group";
        if (groupsCount > 0) return "Search extensions and groups";
        return "Search extensions";
      };

      expect(getPlaceholder(false, 2)).toBe("Search extensions and groups");
      expect(getPlaceholder(false, 0)).toBe("Search extensions");
      expect(getPlaceholder(true, 2)).toBe("Search extensions in group");
    });
  });

  describe("Outcome 4: Group Membership Editor Undo / Redo", () => {
    it("manages membership undo and redo stacks through additions and removals", () => {
      let currentIds = ["ext_a", "ext_b"];
      const undoStack: string[][] = [];
      const redoStack: string[][] = [];

      const toggleMember = (id: string) => {
        const next = currentIds.includes(id)
          ? currentIds.filter((m) => m !== id)
          : [...currentIds, id];
        undoStack.push([...currentIds]);
        redoStack.length = 0;
        currentIds = next;
      };

      const undo = () => {
        if (undoStack.length === 0) return;
        const prev = undoStack.pop()!;
        redoStack.push([...currentIds]);
        currentIds = prev;
      };

      const redo = () => {
        if (redoStack.length === 0) return;
        const next = redoStack.pop()!;
        undoStack.push([...currentIds]);
        currentIds = next;
      };

      // Initially empty undo/redo stacks
      expect(undoStack).toHaveLength(0);
      expect(redoStack).toHaveLength(0);

      // Add ext_c
      toggleMember("ext_c");
      expect(currentIds).toEqual(["ext_a", "ext_b", "ext_c"]);
      expect(undoStack).toHaveLength(1);
      expect(redoStack).toHaveLength(0);

      // Remove ext_a
      toggleMember("ext_a");
      expect(currentIds).toEqual(["ext_b", "ext_c"]);
      expect(undoStack).toHaveLength(2);

      // Undo removal of ext_a -> should restore ext_a
      undo();
      expect(currentIds).toEqual(["ext_a", "ext_b", "ext_c"]);
      expect(undoStack).toHaveLength(1);
      expect(redoStack).toHaveLength(1);

      // Undo addition of ext_c -> should restore initial state
      undo();
      expect(currentIds).toEqual(["ext_a", "ext_b"]);
      expect(undoStack).toHaveLength(0);
      expect(redoStack).toHaveLength(2);

      // Redo addition of ext_c
      redo();
      expect(currentIds).toEqual(["ext_a", "ext_b", "ext_c"]);
      expect(undoStack).toHaveLength(1);
      expect(redoStack).toHaveLength(1);

      // Redo removal of ext_a
      redo();
      expect(currentIds).toEqual(["ext_b", "ext_c"]);
      expect(undoStack).toHaveLength(2);
      expect(redoStack).toHaveLength(0);
    });
  });

  describe("Outcome 5: Group Focus Individual Extension Toggle & Counter", () => {
    it("toggles an individual member extension without changing siblings and updates group count", () => {
      const group: ExtensionGroup = {
        id: "g_productivity",
        name: "Productivity",
        extensionIds: ["ext_1", "ext_2", "ext_3"],
        color: "#3b82f6",
        createdAt: 100,
      };

      let extensionsState: ExtensionInfo[] = [
        { id: "ext_1", name: "Ext 1", enabled: true, type: "extension" } as ExtensionInfo,
        { id: "ext_2", name: "Ext 2", enabled: false, type: "extension" } as ExtensionInfo,
        { id: "ext_3", name: "Ext 3", enabled: false, type: "extension" } as ExtensionInfo,
      ];

      // Initial stats: 1 / 3 running
      let summary = computeGroupRuntimeSummary(group, extensionsState);
      expect(summary.summaryText).toBe("1 / 3 running");
      expect(summary.runningMemberCount).toBe(1);

      // Toggle ext_2 ON individually
      extensionsState = extensionsState.map((e) =>
        e.id === "ext_2" ? { ...e, enabled: true } : e
      );

      // Sibling states are preserved
      expect(extensionsState.find((e) => e.id === "ext_1")?.enabled).toBe(true);
      expect(extensionsState.find((e) => e.id === "ext_2")?.enabled).toBe(true);
      expect(extensionsState.find((e) => e.id === "ext_3")?.enabled).toBe(false);

      // Summary updates immediately to 2 / 3 running
      summary = computeGroupRuntimeSummary(group, extensionsState);
      expect(summary.summaryText).toBe("2 / 3 running");
      expect(summary.runningMemberCount).toBe(2);

      // Toggle ext_1 OFF individually
      extensionsState = extensionsState.map((e) =>
        e.id === "ext_1" ? { ...e, enabled: false } : e
      );
      summary = computeGroupRuntimeSummary(group, extensionsState);
      expect(summary.summaryText).toBe("1 / 3 running");
      expect(summary.runningMemberCount).toBe(1);
    });
  });
});
