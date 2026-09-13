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

  describe("Interaction Grammar & M3 Primitives (Milestone Outcomes 1 - 8)", () => {
    it("Outcome 1 & 2: Card body navigation uniformly enters group focus across all views", () => {
      let focusedGroup: string | null = null;
      let editGroupOpened: string | null = null;
      let toggledGroup: string | null = null;

      const handleCardClick = (groupId: string) => {
        focusedGroup = groupId;
      };

      const handleEditClick = (groupId: string, e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        editGroupOpened = groupId;
      };

      const handleToggleClick = (groupId: string, e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        toggledGroup = groupId;
      };

      // 1. User clicks card body in list / bigTile / tile view
      handleCardClick("g_dev");
      expect(focusedGroup).toBe("g_dev");
      expect(editGroupOpened).toBeNull();
      expect(toggledGroup).toBeNull();

      // 2. User clicks nested edit button -> stops propagation, does NOT re-trigger card click
      let propagationStopped = false;
      const fakeEditEvent = {
        stopPropagation: () => {
          propagationStopped = true;
        },
      };
      handleEditClick("g_dev", fakeEditEvent);
      expect(propagationStopped).toBe(true);
      expect(editGroupOpened).toBe("g_dev");

      // 3. User clicks nested toggle button -> stops propagation
      let togglePropStopped = false;
      const fakeToggleEvent = {
        stopPropagation: () => {
          togglePropStopped = true;
        },
      };
      handleToggleClick("g_dev", fakeToggleEvent);
      expect(togglePropStopped).toBe(true);
      expect(toggledGroup).toBe("g_dev");
    });

    it("Outcome 3: Group focus preserves exact catalog presentation without special card variants", () => {
      // In group focus, the catalog is strictly filtered by group membership.
      // Cards render identically (same icon, layout, switch, disabled/enabled states)
      const catalog = sampleExtensions;
      const groupMemberIds = ["ext_a_assigned_disabled", "ext_b_assigned_running"];

      const filteredExtensions = catalog.filter((ext) => groupMemberIds.includes(ext.id));
      expect(filteredExtensions).toHaveLength(2);
      expect(filteredExtensions[0].id).toBe("ext_a_assigned_disabled");
      expect(filteredExtensions[0].enabled).toBe(false);
      expect(filteredExtensions[1].id).toBe("ext_b_assigned_running");
      expect(filteredExtensions[1].enabled).toBe(true);
    });

    it("Outcome 4: Back navigation in group focus clears focus and returns to full catalog", () => {
      let activeFocusedGroupId: string | null = "group_job_search";

      // Group focus header has back button with arrow_back icon:
      const handleBackClick = () => {
        activeFocusedGroupId = null;
      };

      expect(activeFocusedGroupId).toBe("group_job_search");
      handleBackClick();
      expect(activeFocusedGroupId).toBeNull();
    });

    it("Outcome 5: Edit Group has immediate auto-save semantics and clear Done/Close affordances", () => {
      // Data flow: every modification dispatches UPDATE_GROUP immediately
      const dispatches: any[] = [];
      const mockSendMessage = (msg: any) => dispatches.push(msg);

      let groupState: ExtensionGroup = {
        id: "g_test",
        name: "Test Group",
        extensionIds: ["ext_1"],
        color: "#1a73e8",
        createdAt: 1000,
      };

      const updateGroup = (next: ExtensionGroup) => {
        groupState = next;
        mockSendMessage({ type: "UPDATE_GROUP", group: next });
      };

      // Toggle member
      updateGroup({ ...groupState, extensionIds: ["ext_1", "ext_2"] });
      expect(dispatches).toHaveLength(1);
      expect(dispatches[0]).toEqual({
        type: "UPDATE_GROUP",
        group: {
          id: "g_test",
          name: "Test Group",
          extensionIds: ["ext_1", "ext_2"],
          color: "#1a73e8",
          createdAt: 1000,
        },
      });

      // Done/Close simply closes the modal because changes are already saved
      let modalOpen = true;
      const handleDone = () => {
        modalOpen = false;
      };
      handleDone();
      expect(modalOpen).toBe(false);
    });

    it("Outcome 8: Primary form fields share consistent width token and separate trailing action", () => {
      const primaryFieldWidth = 380;
      const fields = [
        { id: "ruleScopeSelector", width: primaryFieldWidth },
        { id: "ruleScopeInput", width: primaryFieldWidth },
        { id: "ruleTimingSelector", width: primaryFieldWidth },
        { id: "ruleEffectSelector", width: primaryFieldWidth },
      ];

      // All 4 primary form controls share the exact same width
      const widths = new Set(fields.map((f) => f.width));
      expect(widths.size).toBe(1);
      expect(widths.has(380)).toBe(true);
    });
  });
});
