import type { ExtensionGroup, ExtensionInfo } from "../../shared/types";
import { Optioney, Removy, Copyy } from "./icons";
import { MaterialSymbol } from "./MaterialSymbols";
import { GroupCommandControl } from "./GroupCommandControl";
import { computeGroupRuntimeSummary } from "./group-summary";

export interface GroupBriefProps {
  group: ExtensionGroup;
  allExtensions?: ExtensionInfo[];
  viewMode?: "tile" | "bigTile" | "list";
  withControl?: boolean;
  selected?: boolean | null;
  onToggleGroup?: (id: string, enabled: boolean) => void;
  onCopyGroup?: (id: string) => void;
  onDeleteGroup?: (id: string) => void;
  onSelect?: (id: string) => void;
  onOpenSubWindow?: (type: "group", id: string) => void;
  themeMainColor?: string;
}

export function renderGroupIcon(group: ExtensionGroup, size: number = 32, color?: string) {
  if (group.icon && typeof group.icon === "object") {
    if (group.icon.type === "material" && group.icon.name) {
      return <MaterialSymbol name={group.icon.name} size={size} color={color || "currentColor"} fallback="folder" />;
    }
    if (group.icon.type === "custom" && group.icon.dataUrl) {
      return (
        <img
          className="group-custom-icon"
          src={group.icon.dataUrl}
          alt={group.name}
          style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain", borderRadius: "4px" }}
          onError={(e) => {
            const imgEl = e.currentTarget as HTMLImageElement;
            imgEl.style.display = "none";
            if (imgEl.parentElement) {
              const fallbackSpan = document.createElement("span");
              fallbackSpan.className = "material-symbols-rounded";
              fallbackSpan.style.fontSize = `${size}px`;
              fallbackSpan.textContent = "folder";
              imgEl.parentElement.appendChild(fallbackSpan);
            }
          }}
        />
      );
    }
  }
  if (typeof group.icon === "string" && group.icon.trim()) {
    return <MaterialSymbol name={group.icon} size={size} color={color || "currentColor"} fallback="folder" />;
  }
  return <MaterialSymbol name="folder" size={size} color={color || "currentColor"} fallback="folder" />;
}

export function GroupBrief({
  group,
  allExtensions = [],
  viewMode = "bigTile",
  withControl = true,
  selected = null,
  onToggleGroup,
  onCopyGroup,
  onDeleteGroup,
  onSelect,
  onOpenSubWindow,
  themeMainColor = "#1a73e8",
}: GroupBriefProps) {
  const isSelectable = selected !== null;
  const isSelected = selected === true;
  const summary = computeGroupRuntimeSummary(group, allExtensions);

  const handleOpenDetail = (e: MouseEvent) => {
    e.stopPropagation();
    if (isSelectable) {
      onSelect?.(group.id);
    } else {
      onOpenSubWindow?.("group", group.id);
    }
  };

  const handleCardClick = () => {
    if (isSelectable) {
      onSelect?.(group.id);
    }
  };

  // --- Selectable Mode (Target selection in AutoState / Group management) ---
  if (isSelectable) {
    if (viewMode === "bigTile") {
      return (
        <div
          className={`nb-big-tile group-big-tile selectable-big-tile ${isSelected ? "is-selected" : "not-selected"}`}
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              onSelect?.(group.id);
            }
          }}
        >
          <div className="select-indicator">
            <span className={`select-box ${isSelected ? "checked" : ""}`}>
              {isSelected ? "✓" : ""}
            </span>
          </div>
          <div className="group-icon-center">
            {renderGroupIcon(group, 36, themeMainColor)}
          </div>
          <div className="big-tile-content">
            <span className="item-name" title={group.name}>{group.name}</span>
            <span className="item-version">
              {summary.summaryText}
              {summary.exceptionText && <span className="exception-text"> · {summary.exceptionText}</span>}
            </span>
          </div>
        </div>
      );
    }

    if (viewMode === "tile") {
      return (
        <div
          className={`nb-tile group-tile selectable-tile ${isSelected ? "is-selected" : "not-selected"}`}
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              onSelect?.(group.id);
            }
          }}
        >
          <div className="tile-select-badge">
            <span className={`select-box ${isSelected ? "checked" : ""}`}>
              {isSelected ? "✓" : ""}
            </span>
          </div>
          <div className="tile-body">
            <div className="group-icon-center">
              {renderGroupIcon(group, 36, themeMainColor)}
            </div>
            <span className="tile-item-name" title={group.name}>
              {group.name}
            </span>
          </div>
        </div>
      );
    }

    // Default Selectable: List View
    return (
      <div
        className={`nb-list-row group-list-row selectable-row ${isSelected ? "is-selected" : "not-selected"}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onSelect?.(group.id);
          }
        }}
      >
        <div className="select-indicator">
          <span className={`select-box ${isSelected ? "checked" : ""}`}>
            {isSelected ? "✓" : ""}
          </span>
        </div>
        <div className="list-icon-wrap">
          {renderGroupIcon(group, 26, themeMainColor)}
        </div>
        <span className="list-name" title={group.name}>{group.name}</span>
        <span className="list-version">
          {summary.summaryText}
          {summary.exceptionText && <span className="exception-text"> · {summary.exceptionText}</span>}
        </span>
      </div>
    );
  }

  // --- Normal Big Tile View (2 Columns Layout) ---
  if (viewMode === "bigTile") {
    return (
      <div className="nb-big-tile group-big-tile">
        <div className="group-icon-center clickable" onClick={handleOpenDetail}>
          {renderGroupIcon(group, 36, themeMainColor)}
        </div>
        <div className="big-tile-content" onClick={handleOpenDetail}>
          <span className="item-name" title={group.name}>
            {group.name}
          </span>
          <span className="item-version">
            {summary.summaryText}
            {summary.exceptionText && <span className="exception-text"> · {summary.exceptionText}</span>}
          </span>
        </div>

        {withControl && (
          <div className="item-controls-strip">
            {onToggleGroup && (
              <GroupCommandControl
                group={group}
                allExtensions={allExtensions}
                onToggleGroup={onToggleGroup}
                size="medium"
              />
            )}
            <button
              type="button"
              className="action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                onCopyGroup?.(group.id);
              }}
              title="Duplicate Group"
              aria-label="Duplicate Group"
            >
              <Copyy color={themeMainColor} size={16} />
            </button>
            <button
              type="button"
              className="action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail(e as unknown as MouseEvent);
              }}
              title="Edit Group"
              aria-label="Edit Group"
            >
              <Optioney color={themeMainColor} size={16} />
            </button>
            <button
              type="button"
              className="action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteGroup?.(group.id);
              }}
              title="Delete Group"
              aria-label="Delete Group"
            >
              <Removy color={themeMainColor} size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Normal List View (44px Row Height) ---
  if (viewMode === "list") {
    return (
      <div className="nb-list-row group-list-row">
        {withControl && onToggleGroup && (
          <div className="list-group-toggle-wrap">
            <GroupCommandControl
              group={group}
              allExtensions={allExtensions}
              onToggleGroup={onToggleGroup}
              size="small"
            />
          </div>
        )}
        <div className="list-icon-wrap clickable" onClick={handleOpenDetail}>
          {renderGroupIcon(group, 26, themeMainColor)}
        </div>
        <span
          className="list-name clickable"
          onClick={handleOpenDetail}
          title={group.name}
        >
          {group.name}
        </span>
        <span className="list-version">
          {summary.summaryText}
          {summary.exceptionText && <span className="exception-text"> · {summary.exceptionText}</span>}
        </span>
        {withControl && (
          <div className="list-actions">
            <button
              type="button"
              className="action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                onCopyGroup?.(group.id);
              }}
              title="Duplicate Group"
              aria-label="Duplicate Group"
            >
              <Copyy color={themeMainColor} size={16} />
            </button>
            <button
              type="button"
              className="action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail(e as unknown as MouseEvent);
              }}
              title="Edit Group"
              aria-label="Edit Group"
            >
              <Optioney color={themeMainColor} size={16} />
            </button>
            <button
              type="button"
              className="action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteGroup?.(group.id);
              }}
              title="Delete Group"
              aria-label="Delete Group"
            >
              <Removy color={themeMainColor} size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Normal Tile View (Max 6 Columns) ---
  return (
    <div
      className="nb-tile group-tile"
      onClick={handleOpenDetail}
      tabIndex={0}
    >
      <div className="tile-body">
        <div className="group-icon-center">
          {renderGroupIcon(group, 36, themeMainColor)}
        </div>
        <span className="tile-item-name" title={group.name}>
          {group.name}
        </span>
      </div>

      {withControl && (
        <div className="group-tile-hover-panel" onClick={(e) => e.stopPropagation()}>
          <div className="group-tile-hover-stats">
            <span className="group-stats-running">{summary.summaryText}</span>
            {summary.exceptionText && (
              <span className="group-stats-exceptions">{summary.exceptionText}</span>
            )}
          </div>
          {onToggleGroup && (
            <GroupCommandControl
              group={group}
              allExtensions={allExtensions}
              onToggleGroup={onToggleGroup}
              size="small"
            />
          )}
          <div className="group-tile-hover-actions">
            <button
              type="button"
              className="tile-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onCopyGroup?.(group.id);
              }}
              title="Duplicate Group"
              aria-label="Duplicate Group"
            >
              <Copyy color={themeMainColor} size={14} />
            </button>
            <button
              type="button"
              className="tile-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail(e as unknown as MouseEvent);
              }}
              title="Edit Group"
              aria-label="Edit Group"
            >
              <Optioney color={themeMainColor} size={14} />
            </button>
            <button
              type="button"
              className="tile-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteGroup?.(group.id);
              }}
              title="Delete Group"
              aria-label="Delete Group"
            >
              <Removy color={themeMainColor} size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
