import { useState, useMemo } from "preact/hooks";
import type { ExtensionInfo, ExtensionGroup } from "../../shared/types";
import { ExtensionBrief } from "./ExtensionBrief";
import { GroupBrief } from "./GroupBrief";
import { GL } from "./i18n";
import { Listy, Tiley, BigTiley, Cleary } from "./icons";
import { MaterialSymbol } from "./MaterialSymbols";

export interface SelectorProps {
  allowedViewModes?: Array<"list" | "bigTile" | "tile">;
  extensions: ExtensionInfo[];
  groups?: ExtensionGroup[];
  viewMode?: "tile" | "bigTile" | "list";
  onChangeViewMode?: (mode: "tile" | "bigTile" | "list") => void;
  actionBar?: boolean;
  withControl?: boolean;
  selectedList?: string[];
  onSelect?: (id: string) => void;
  onToggleExtension?: (id: string, enabled: boolean) => void;
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
  onSelect,
  onToggleExtension,
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
}: SelectorProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterName, setFilterName] = useState<string>("");
  const [filterRunningState, setFilterRunningState] = useState<"all" | "enabled" | "attention">("all");
  const [undoStack, setUndoStack] = useState<Array<Record<string, boolean>>>([]);
  const [redoStack, setRedoStack] = useState<Array<Record<string, boolean>>>([]);

  const totalExtensionsCount = extensions.length;
  const runningExtensionsCount = extensions.filter((e) => e.enabled).length;
  const attentionExtensionsCount = extensions.filter((e) => e.mayDisable === false).length;

  // Filtered extensions
  const filteredExtensions = useMemo(() => {
    return extensions.filter((ext) => {
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
  }, [extensions, filterType, filterName, filterTypeOnly, filterRunningState]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    if (filterType !== "all" && filterType !== "group") return [];
    if (filterRunningState === "attention") return [];
    return groups.filter((g) => {
      if (filterName && !g.name.toLowerCase().includes(filterName.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [groups, filterType, filterName, filterRunningState]);

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
              <option value="all">{GL("all")}</option>
              {groups.length > 0 && <option value="group">{GL("group")}</option>}
              <option value="app">{GL("app")}</option>
              <option value="extension">{GL("extension")}</option>
              <option value="theme">{GL("theme")}</option>
            </select>

            <div className="name-filter-wrapper">
              <input
                id="nameFilter"
                placeholder={GL("name")}
                value={filterName}
                onInput={(e) => setFilterName((e.target as HTMLInputElement).value)}
              />
              {filterName && (
                <span className="clear-name-filter" onClick={() => setFilterName("")}>
                  <Cleary color={themeMainColor} />
                </span>
              )}
            </div>

            {withControl && (
              <div className="action-buttons-group">
                <button
                  type="button"
                  className="action-icon-btn toolbar-icon-btn"
                  onClick={handleBulkEnable}
                  title="Enable all filtered extensions"
                  aria-label="Enable all filtered extensions"
                >
                  <MaterialSymbol name="toggle_on" size={20} color="currentColor" />
                </button>
                <button
                  type="button"
                  className="action-icon-btn toolbar-icon-btn"
                  onClick={handleBulkDisable}
                  title="Disable all filtered extensions"
                  aria-label="Disable all filtered extensions"
                >
                  <MaterialSymbol name="toggle_off" size={20} color="currentColor" />
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

          {/* Compact Operational Summary Bar */}
          {totalExtensionsCount > 0 && (
            <div className="operational-summary-bar">
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
          )}
        </>
      )}

      {/* Groups Section */}
      {filteredGroups.length > 0 && (
        <div id="groupList" className="extension-container">
          <h2 className="nb-heading">{GL("group")}</h2>
          <div className={viewMode === "tile" ? "tile-grid" : viewMode === "bigTile" ? (selectedList !== undefined ? "modal-big-tile-grid" : "big-tile-grid") : "list-container"}>
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
          <div className={viewMode === "tile" ? "tile-grid" : viewMode === "bigTile" ? (selectedList !== undefined ? "modal-big-tile-grid" : "big-tile-grid") : "list-container"}>
            {extensionList.map((ext) => (
              <ExtensionBrief
                key={ext.id}
                extension={ext}
                viewMode={viewMode}
                withControl={withControl}
                selected={selectedList ? selectedList.includes(ext.id) : null}
                onSelect={onSelect}
                onToggle={onToggleExtension}
                onOpenOptions={onOpenOptions}
                onOpenDetails={onOpenDetails}
                onUninstall={onUninstallExtension}
                onOpenSubWindow={onOpenSubWindow}
                themeMainColor={themeMainColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Apps Section */}
      {appList.length > 0 && (
        <div id="appList" className="extension-container">
          <h2 className="nb-heading">{GL("app")}</h2>
          <div className={viewMode === "tile" ? "tile-grid" : viewMode === "bigTile" ? (selectedList !== undefined ? "modal-big-tile-grid" : "big-tile-grid") : "list-container"}>
            {appList.map((app) => (
              <ExtensionBrief
                key={app.id}
                extension={app}
                viewMode={viewMode}
                withControl={withControl}
                selected={selectedList ? selectedList.includes(app.id) : null}
                onSelect={onSelect}
                onToggle={onToggleExtension}
                onOpenOptions={onOpenOptions}
                onOpenDetails={onOpenDetails}
                onUninstall={onUninstallExtension}
                onOpenSubWindow={onOpenSubWindow}
                themeMainColor={themeMainColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Themes Section */}
      {themeList.length > 0 && (
        <div id="themeList" className="extension-container">
          <h2 className="nb-heading">{GL("theme")}</h2>
          <div className={viewMode === "tile" ? "tile-grid" : viewMode === "bigTile" ? (selectedList !== undefined ? "modal-big-tile-grid" : "big-tile-grid") : "list-container"}>
            {themeList.map((theme) => (
              <ExtensionBrief
                key={theme.id}
                extension={theme}
                viewMode={viewMode}
                withControl={withControl}
                selected={selectedList ? selectedList.includes(theme.id) : null}
                onSelect={onSelect}
                onToggle={onToggleExtension}
                onOpenOptions={onOpenOptions}
                onOpenDetails={onOpenDetails}
                onUninstall={onUninstallExtension}
                onOpenSubWindow={onOpenSubWindow}
                themeMainColor={themeMainColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
