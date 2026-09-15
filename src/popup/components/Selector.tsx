import { useState, useMemo, useEffect } from "preact/hooks";
import type { ExtensionInfo, ExtensionGroup, HistoryRecord } from "../../shared/types";
import { ExtensionBrief } from "./ExtensionBrief";
import { GroupBrief, renderGroupIcon } from "./GroupBrief";
import { GL } from "./i18n";
import { Listy, Tiley, BigTiley, Cleary, Optioney } from "./icons";
import { MaterialSymbol } from "./MaterialSymbols";
import { sortGroupMemberExtensions } from "./group-member-utils";
import { computeGroupRuntimeSummary } from "./group-summary";
import { GroupCommandControl } from "./GroupCommandControl";

export type SortMode = "default" | "name_asc" | "recently_changed" | "most_changed" | "first_seen";

export function getExtensionHistoryStats(
  extensions: ExtensionInfo[],
  history: HistoryRecord[] = []
): {
  recentlyChangedMap: Map<string, number>;
  mostChangedMap: Map<string, number>;
  firstSeenMap: Map<string, number>;
} {
  const recentlyChangedMap = new Map<string, number>();
  const mostChangedMap = new Map<string, number>();
  const earliestInstalledMap = new Map<string, number>();
  const earliestAnyEventMap = new Map<string, number>();

  for (const rec of history) {
    const id = rec.extensionId;
    // Recently changed: latest management event timestamp
    const prevRecent = recentlyChangedMap.get(id) ?? 0;
    if (rec.timestamp > prevRecent) {
      recentlyChangedMap.set(id, rec.timestamp);
    }

    // Most changed: count of recorded management events
    mostChangedMap.set(id, (mostChangedMap.get(id) ?? 0) + 1);

    // Earliest installed event or fallback to earliest event recorded
    if (rec.event === "installed") {
      const prevInst = earliestInstalledMap.get(id);
      if (prevInst === undefined || rec.timestamp < prevInst) {
        earliestInstalledMap.set(id, rec.timestamp);
      }
    }
    const prevAny = earliestAnyEventMap.get(id);
    if (prevAny === undefined || rec.timestamp < prevAny) {
      earliestAnyEventMap.set(id, rec.timestamp);
    }
  }

  const firstSeenMap = new Map<string, number>();
  for (const ext of extensions) {
    const installedTime = earliestInstalledMap.get(ext.id);
    if (installedTime !== undefined) {
      firstSeenMap.set(ext.id, installedTime);
    } else {
      const anyTime = earliestAnyEventMap.get(ext.id);
      if (anyTime !== undefined) {
        firstSeenMap.set(ext.id, anyTime);
      }
    }
  }

  return { recentlyChangedMap, mostChangedMap, firstSeenMap };
}

export function sortExtensions(
  list: ExtensionInfo[],
  sortMode: SortMode,
  history: HistoryRecord[] = [],
  selectedList?: string[] | null
): ExtensionInfo[] {
  if (sortMode === "default") {
    if (selectedList) {
      return sortGroupMemberExtensions(list, selectedList);
    }
    return list;
  }

  const { recentlyChangedMap, mostChangedMap, firstSeenMap } = getExtensionHistoryStats(list, history);

  const sorted = [...list];

  switch (sortMode) {
    case "name_asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      break;

    case "recently_changed":
      sorted.sort((a, b) => {
        const aTime = recentlyChangedMap.get(a.id) ?? 0;
        const bTime = recentlyChangedMap.get(b.id) ?? 0;
        if (aTime > 0 && bTime > 0) {
          if (bTime !== aTime) return bTime - aTime;
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        }
        if (aTime > 0) return -1;
        if (bTime > 0) return 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
      break;

    case "most_changed":
      sorted.sort((a, b) => {
        const aCount = mostChangedMap.get(a.id) ?? 0;
        const bCount = mostChangedMap.get(b.id) ?? 0;
        if (aCount > 0 && bCount > 0) {
          if (bCount !== aCount) return bCount - aCount;
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        }
        if (aCount > 0) return -1;
        if (bCount > 0) return 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
      break;

    case "first_seen":
      sorted.sort((a, b) => {
        const aTime = firstSeenMap.get(a.id) ?? 0;
        const bTime = firstSeenMap.get(b.id) ?? 0;
        if (aTime > 0 && bTime > 0) {
          if (bTime !== aTime) return bTime - aTime;
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        }
        if (aTime > 0) return -1;
        if (bTime > 0) return 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
      break;
  }

  return sorted;
}

export interface SelectorProps {
  allowedViewModes?: Array<"list" | "bigTile" | "tile">;
  extensions: ExtensionInfo[];
  groups?: ExtensionGroup[];
  history?: HistoryRecord[];
  viewMode?: "tile" | "bigTile" | "list";
  onChangeViewMode?: (mode: "tile" | "bigTile" | "list") => void;
  actionBar?: boolean;
  withControl?: boolean;
  selectedList?: string[];
  selectionNoun?: "assigned" | "selected";
  focusedGroupId?: string | null;
  onFocusGroup?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  onUndoMembership?: () => void;
  onRedoMembership?: () => void;
  canUndoMembership?: boolean;
  canRedoMembership?: boolean;
  onToggleExtension?: (id: string, enabled: boolean) => void;
  onReloadExtension?: (id: string) => Promise<void> | void;
  reloadingId?: string | null;
  onOpenOptions?: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  onUninstallExtension?: (id: string) => void;
  onToggleGroup?: (id: string, enabled: boolean) => void;
  onCopyGroup?: (id: string) => void;
  onDeleteGroup?: (id: string) => void;
  onCreateGroup?: () => void;
  onOpenSubWindow?: (type: "extension" | "group", id: string) => void;
  themeMainColor?: string;
  filterTypeOnly?: string;
  developerMode?: boolean;
}

export function Selector({
  extensions = [],
  groups = [],
  viewMode = "tile",
  onChangeViewMode,
  allowedViewModes = ["list", "bigTile", "tile"],
  actionBar = true,
  withControl = true,
  selectedList,
  selectionNoun = "assigned",
  focusedGroupId,
  onFocusGroup,
  onSelect,
  onUndoMembership,
  onRedoMembership,
  canUndoMembership = false,
  canRedoMembership = false,
  onToggleExtension,
  onReloadExtension,
  reloadingId,
  onOpenOptions,
  onOpenDetails,
  onUninstallExtension,
  onToggleGroup,
  onCopyGroup,
  onDeleteGroup,
  onCreateGroup,
  onOpenSubWindow,
  themeMainColor,
  filterTypeOnly,
  developerMode = false,
  history = [],
}: SelectorProps) {
  const [internalFocusedGroupId, setInternalFocusedGroupId] = useState<string | null>(null);
  const activeFocusedGroupId = focusedGroupId !== undefined ? focusedGroupId : internalFocusedGroupId;
  const setActiveFocusedGroupId = onFocusGroup || setInternalFocusedGroupId;
  const [filterAssignedOnly, setFilterAssignedOnly] = useState<boolean>(false);

  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterName, setFilterName] = useState<string>("");
  const [filterRunningState, setFilterRunningState] = useState<"all" | "enabled" | "attention">("all");
  const [undoStack, setUndoStack] = useState<Array<Record<string, boolean>>>([]);
  const [redoStack, setRedoStack] = useState<Array<Record<string, boolean>>>([]);

  // Keyboard shortcut: Escape clears active group focus
  useEffect(() => {
    if (!activeFocusedGroupId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveFocusedGroupId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFocusedGroupId, setActiveFocusedGroupId]);

  const focusedGroup = useMemo(() => {
    return activeFocusedGroupId ? groups.find((g) => g.id === activeFocusedGroupId) || null : null;
  }, [activeFocusedGroupId, groups]);

  const hasApps = useMemo(
    () => extensions.some((e) => e.type === "app" || e.type === "hosted_app" || e.type === "packaged_app"),
    [extensions]
  );
  const hasThemes = useMemo(() => extensions.some((e) => e.type === "theme"), [extensions]);

  const searchPlaceholder = useMemo(() => {
    if (focusedGroup) return GL("search_extensions_in_group");
    if (groups.length > 0) return GL("search_extensions_and_groups");
    return GL("search_extensions");
  }, [focusedGroup, groups.length]);

  const totalExtensionsCount = extensions.length;
  const runningExtensionsCount = extensions.filter((e) => e.enabled).length;
  const attentionExtensionsCount = extensions.filter((e) => e.mayDisable === false).length;

  // Filtered extensions
  const filteredExtensions = useMemo(() => {
    const list = extensions.filter((ext) => {
      // If focused on a group, strictly limit to that group's members
      if (focusedGroup && !focusedGroup.extensionIds.includes(ext.id)) {
        return false;
      }
      // If Assigned Only filter active, only include items present in selectedList
      if (filterAssignedOnly && selectedList && !selectedList.includes(ext.id)) {
        return false;
      }
      if (filterTypeOnly && ext.installType !== filterTypeOnly) {
        if (filterTypeOnly === "chromeWebStoreExtensionOnly" && ext.installType === "development") {
          return false;
        }
      }
      if (filterName && !ext.name.toLowerCase().includes(filterName.toLowerCase())) {
        return false;
      }
      if (filterRunningState === "enabled" && !ext.enabled) {
        return false;
      }
      if (filterRunningState === "attention" && ext.mayDisable !== false) {
        return false;
      }
      if (filterType === "all") return true;
      if (filterType === "group") return false;
      if (filterType === "app") return ext.type === "app" || ext.type === "hosted_app" || ext.type === "packaged_app";
      if (filterType === "extension") return ext.type === "extension";
      if (filterType === "theme") return ext.type === "theme";
      return true;
    });

    return sortExtensions(list, sortMode, history, selectedList);
  }, [
    extensions,
    focusedGroup,
    filterAssignedOnly,
    selectedList,
    filterTypeOnly,
    filterName,
    filterRunningState,
    filterType,
    sortMode,
    history,
  ]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    if (focusedGroup) return [];
    if (filterType !== "all" && filterType !== "group") return [];
    if (filterRunningState === "attention") return [];
    return groups.filter((g) => {
      if (filterName && !g.name.toLowerCase().includes(filterName.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [groups, focusedGroup, filterType, filterName, filterRunningState]);

  // Split into categories
  const extensionList = filteredExtensions.filter((e) => e.type === "extension");
  const appList = filteredExtensions.filter((e) => e.type === "app" || e.type === "hosted_app" || e.type === "packaged_app");
  const themeList = filteredExtensions.filter((e) => e.type === "theme");

  const handleBulkEnable = () => {
    const prevState: Record<string, boolean> = {};
    filteredExtensions.forEach((ext) => {
      if (!ext.enabled) {
        prevState[ext.id] = false;
        onToggleExtension?.(ext.id, true);
      }
    });
    if (Object.keys(prevState).length > 0) {
      setUndoStack((s) => [...s, prevState]);
      setRedoStack([]);
    }
  };

  const handleBulkDisable = () => {
    const prevState: Record<string, boolean> = {};
    filteredExtensions.forEach((ext) => {
      if (ext.enabled) {
        prevState[ext.id] = true;
        onToggleExtension?.(ext.id, false);
      }
    });
    if (Object.keys(prevState).length > 0) {
      setUndoStack((s) => [...s, prevState]);
      setRedoStack([]);
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const nextUndo = [...undoStack];
    const top = nextUndo.pop()!;
    const nextRedo: Record<string, boolean> = {};

    Object.entries(top).forEach(([id, wasEnabled]) => {
      const ext = extensions.find((e) => e.id === id);
      if (ext) {
        nextRedo[id] = ext.enabled;
        onToggleExtension?.(id, wasEnabled);
      }
    });

    setUndoStack(nextUndo);
    setRedoStack((s) => [...s, nextRedo]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextRedo = [...redoStack];
    const top = nextRedo.pop()!;
    const nextUndo: Record<string, boolean> = {};

    Object.entries(top).forEach(([id, targetEnabled]) => {
      const ext = extensions.find((e) => e.id === id);
      if (ext) {
        nextUndo[id] = ext.enabled;
        onToggleExtension?.(id, targetEnabled);
      }
    });

    setRedoStack(nextRedo);
    setUndoStack((s) => [...s, nextUndo]);
  };

  return (
    <div className="selector-root">
      {actionBar && (
        <>
          <div className="action-bar">
            <select
              id="typeFilter"
              value={filterType}
              onChange={(e) => setFilterType((e.target as HTMLSelectElement).value)}
            >
              <option value="all">
                {groups.length === 0
                  ? (hasApps || hasThemes ? "All items" : "All extensions")
                  : GL("everything")}
              </option>
              {groups.length > 0 && <option value="group">{GL("groups")}</option>}
              <option value="extension">{GL("extensions")}</option>
              {hasApps && <option value="app">{GL("apps")}</option>}
              {hasThemes && <option value="theme">{GL("themes")}</option>}
            </select>

            <div className="name-filter-wrapper">
              <input
                id="nameFilter"
                placeholder={searchPlaceholder}
                value={filterName}
                onInput={(e) => setFilterName((e.target as HTMLInputElement).value)}
              />
              {filterName && (
                <span className="clear-name-filter" onClick={() => setFilterName("")}>
                  <Cleary color={themeMainColor} />
                </span>
              )}
            </div>

            <select
              id="sortModeSelect"
              className="sort-select"
              value={sortMode}
              onChange={(e) => setSortMode((e.target as HTMLSelectElement).value as SortMode)}
              aria-label="Sort extensions"
            >
              <option value="default">Default</option>
              <option value="name_asc">Name A–Z</option>
              <option value="recently_changed">Recently changed</option>
              <option value="most_changed">Most changed</option>
              <option value="first_seen">First seen</option>
            </select>

            {withControl && (
              <div className="action-buttons-group">
                <button
                  type="button"
                  className="action-icon-btn toolbar-icon-btn"
                  onClick={handleBulkEnable}
                  title="Enable all filtered extensions"
                  aria-label="Enable all filtered extensions"
                >
                  <MaterialSymbol name="visibility" size={20} color="currentColor" />
                </button>
                <button
                  type="button"
                  className="action-icon-btn toolbar-icon-btn"
                  onClick={handleBulkDisable}
                  title="Disable all filtered extensions"
                  aria-label="Disable all filtered extensions"
                >
                  <MaterialSymbol name="visibility_off" size={20} color="currentColor" />
                </button>
                <button
                  type="button"
                  className="action-icon-btn toolbar-icon-btn"
                  disabled={undoStack.length === 0}
                  onClick={handleUndo}
                  title="Undo"
                  aria-label="Undo"
                >
                  <MaterialSymbol name="undo" size={18} color="currentColor" />
                </button>
                <button
                  type="button"
                  className="action-icon-btn toolbar-icon-btn"
                  disabled={redoStack.length === 0}
                  onClick={handleRedo}
                  title="Redo"
                  aria-label="Redo"
                >
                  <MaterialSymbol name="redo" size={18} color="currentColor" />
                </button>
                {onCreateGroup && (
                  <button className="btn btn-primary action-btn" onClick={onCreateGroup}>
                    + {GL("new_group")}
                  </button>
                )}
              </div>
            )}

            <div className="view-mode-switcher">
              {allowedViewModes.includes("list") && (
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => onChangeViewMode?.("list")}
                  title="List view"
                >
                  <Listy color="currentColor" size={18} />
                </button>
              )}
              {allowedViewModes.includes("bigTile") && (
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === "bigTile" ? "active" : ""}`}
                  onClick={() => onChangeViewMode?.("bigTile")}
                  title="Big tile view"
                >
                  <BigTiley color="currentColor" size={18} />
                </button>
              )}
              {allowedViewModes.includes("tile") && (
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === "tile" ? "active" : ""}`}
                  onClick={() => onChangeViewMode?.("tile")}
                  title="Tile view"
                >
                  <Tiley color="currentColor" size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Selection Status Bar in Group Editor / AutoState */}
          {selectedList && (
            <div className="selection-status-bar">
              <span className="assigned-count-badge">
                <strong>{selectedList.length}</strong> {selectionNoun === "selected" ? "selected" : "assigned"}
              </span>

              {onUndoMembership && (
                <div className="membership-history-controls" style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                  <button
                    type="button"
                    className="action-icon-btn toolbar-icon-btn membership-undo-btn"
                    disabled={!canUndoMembership}
                    onClick={onUndoMembership}
                    title="Undo membership change"
                    aria-label="Undo membership change"
                  >
                    <MaterialSymbol name="undo" size={16} color="currentColor" />
                  </button>
                  <button
                    type="button"
                    className="action-icon-btn toolbar-icon-btn membership-redo-btn"
                    disabled={!canRedoMembership}
                    onClick={onRedoMembership}
                    title="Redo membership change"
                    aria-label="Redo membership change"
                  >
                    <MaterialSymbol name="redo" size={16} color="currentColor" />
                  </button>
                </div>
              )}
              <button
                type="button"
                className={`assigned-only-toggle-btn ${filterAssignedOnly ? "active" : ""}`}
                onClick={() => setFilterAssignedOnly((prev) => !prev)}
                aria-pressed={filterAssignedOnly}
                title={filterAssignedOnly ? "Show all extensions" : `Show ${selectionNoun === "selected" ? "selected" : "assigned"} only`}
              >
                <MaterialSymbol
                  name={filterAssignedOnly ? "check_box" : "check_box_outline_blank"}
                  size={16}
                />
                <span>{selectionNoun === "selected" ? "Selected only" : GL("assigned_only")}</span>
              </button>
            </div>
          )}

          {/* Compact Operational Summary Bar with Fast Destinations */}
          {totalExtensionsCount > 0 && (
            <div className="operational-summary-bar">
              <div className="summary-pills-group">
                <button
                  type="button"
                  className={`summary-pill-btn ${filterRunningState === "enabled" ? "active" : ""}`}
                  onClick={() =>
                    setFilterRunningState((curr) => (curr === "enabled" ? "all" : "enabled"))
                  }
                  title="Click to filter running extensions"
                >
                  <span className="summary-dot running-dot" />
                  {runningExtensionsCount} / {totalExtensionsCount} running
                </button>
                {attentionExtensionsCount > 0 && (
                  <>
                    <span className="summary-separator">·</span>
                    <button
                      type="button"
                      className={`summary-pill-btn attention ${filterRunningState === "attention" ? "active" : ""}`}
                      onClick={() =>
                        setFilterRunningState((curr) => (curr === "attention" ? "all" : "attention"))
                      }
                      title="Click to filter extensions needing attention"
                    >
                      <span className="summary-dot attention-dot" />
                      {attentionExtensionsCount} extension{attentionExtensionsCount > 1 ? "s" : ""} needs attention
                    </button>
                  </>
                )}
              </div>
              <div className="summary-destination-actions">
                <button
                  type="button"
                  className="destination-icon-btn"
                  onClick={() => {
                    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
                      chrome.tabs.create({ url: "chrome://extensions/" });
                    } else if (typeof window !== "undefined") {
                      window.open("chrome://extensions/", "_blank");
                    }
                  }}
                  title="Open Chrome extensions"
                  aria-label="Open Chrome extensions"
                >
                  <MaterialSymbol name="extension" size={18} />
                </button>
                <button
                  type="button"
                  className="destination-icon-btn"
                  onClick={() => {
                    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
                      chrome.tabs.create({ url: "https://chromewebstore.google.com/" });
                    } else if (typeof window !== "undefined") {
                      window.open("https://chromewebstore.google.com/", "_blank");
                    }
                  }}
                  title="Open Chrome Web Store"
                  aria-label="Open Chrome Web Store"
                >
                  <MaterialSymbol name="storefront" size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Group Focus Context Navigation Header (Outcome 4) */}
      {focusedGroup && (
        <div className="group-focus-banner" role="region" aria-label={`Filtered by group: ${focusedGroup.name}`}>
          <button
            type="button"
            className="group-focus-back-btn action-icon-btn"
            onClick={() => setActiveFocusedGroupId(null)}
            title="Back to all extensions"
            aria-label="Back to all extensions"
          >
            <MaterialSymbol name="arrow_back" size={20} color="currentColor" />
          </button>
          <div className="group-focus-info">
            <span className="group-focus-icon">
              {renderGroupIcon(focusedGroup, 20, themeMainColor)}
            </span>
            <span className="group-focus-name">{focusedGroup.name}</span>
            <span className="group-focus-separator">·</span>
            <span className="group-focus-stats">
              {computeGroupRuntimeSummary(focusedGroup, extensions).summaryText}
              {computeGroupRuntimeSummary(focusedGroup, extensions).exceptionText && (
                <span className="exception-text"> · {computeGroupRuntimeSummary(focusedGroup, extensions).exceptionText}</span>
              )}
            </span>
          </div>
          <div className="group-focus-actions">
            {onToggleGroup && (
              <GroupCommandControl
                group={focusedGroup}
                allExtensions={extensions}
                onToggleGroup={onToggleGroup}
                size="small"
              />
            )}
            <button
              type="button"
              className="action-icon-btn group-focus-edit-btn"
              onClick={() => onOpenSubWindow?.("group", focusedGroup.id)}
              title="Edit group definition and membership"
              aria-label="Edit group definition and membership"
            >
              <Optioney color={themeMainColor} size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Group Focus Empty State */}
      {focusedGroup && extensionList.length === 0 && appList.length === 0 && themeList.length === 0 && (
        <div className="group-focus-empty-state">
          <p>No extensions are assigned to this group yet.</p>
          <button
            type="button"
            className="btn btn-secondary action-btn"
            onClick={() => onOpenSubWindow?.("group", focusedGroup.id)}
          >
            Edit group membership
          </button>
        </div>
      )}

      {/* Groups Section */}
      {filteredGroups.length > 0 && (
        <div id="groupList" className="extension-container">
          <h2 className="nb-heading">{GL("group")}</h2>
          <div className={viewMode === "tile" ? "tile-grid" : viewMode === "bigTile" ? "big-tile-grid" : "list-container"}>
            {filteredGroups.map((group) => (
              <GroupBrief
                key={group.id}
                group={group}
                allExtensions={extensions}
                viewMode={viewMode}
                withControl={withControl}
                selected={selectedList ? selectedList.includes(group.id) : null}
                onSelect={onSelect}
                onToggleGroup={onToggleGroup}
                onCopyGroup={onCopyGroup}
                onDeleteGroup={onDeleteGroup}
                onOpenSubWindow={onOpenSubWindow}
                onFocusGroup={(id) => setActiveFocusedGroupId(id)}
                themeMainColor={themeMainColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Extensions Section */}
      {extensionList.length > 0 && (
        <div id="extList" className="extension-container">
          <h2 className="nb-heading">{GL("extension")}</h2>
          <div className={viewMode === "tile" ? "tile-grid" : viewMode === "bigTile" ? "big-tile-grid" : "list-container"}>
            {extensionList.map((ext) => (
              <ExtensionBrief
                key={ext.id}
                extension={ext}
                viewMode={viewMode}
                withControl={withControl}
                selected={selectedList ? selectedList.includes(ext.id) : null}
                onSelect={onSelect}
                onToggle={onToggleExtension}
                onReload={onReloadExtension}
                isReloading={reloadingId === ext.id}
                onOpenOptions={onOpenOptions}
                onOpenDetails={onOpenDetails}
                onUninstall={onUninstallExtension}
                onOpenSubWindow={onOpenSubWindow}
                themeMainColor={themeMainColor}
                developerMode={developerMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Apps Section */}
      {appList.length > 0 && (
        <div id="appList" className="extension-container">
          <h2 className="nb-heading">{GL("app")}</h2>
          <div className={viewMode === "tile" ? "tile-grid" : viewMode === "bigTile" ? "big-tile-grid" : "list-container"}>
            {appList.map((app) => (
              <ExtensionBrief
                key={app.id}
                extension={app}
                viewMode={viewMode}
                withControl={withControl}
                selected={selectedList ? selectedList.includes(app.id) : null}
                onSelect={onSelect}
                onToggle={onToggleExtension}
                onReload={onReloadExtension}
                isReloading={reloadingId === app.id}
                onOpenOptions={onOpenOptions}
                onOpenDetails={onOpenDetails}
                onUninstall={onUninstallExtension}
                onOpenSubWindow={onOpenSubWindow}
                themeMainColor={themeMainColor}
                developerMode={developerMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Themes Section */}
      {themeList.length > 0 && (
        <div id="themeList" className="extension-container">
          <h2 className="nb-heading">{GL("theme")}</h2>
          <div className={viewMode === "tile" ? "tile-grid" : viewMode === "bigTile" ? "big-tile-grid" : "list-container"}>
            {themeList.map((theme) => (
              <ExtensionBrief
                key={theme.id}
                extension={theme}
                viewMode={viewMode}
                withControl={withControl}
                selected={selectedList ? selectedList.includes(theme.id) : null}
                onSelect={onSelect}
                onToggle={onToggleExtension}
                onReload={onReloadExtension}
                isReloading={reloadingId === theme.id}
                onOpenOptions={onOpenOptions}
                onOpenDetails={onOpenDetails}
                onUninstall={onUninstallExtension}
                onOpenSubWindow={onOpenSubWindow}
                themeMainColor={themeMainColor}
                developerMode={developerMode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
