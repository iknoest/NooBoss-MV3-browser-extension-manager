import type { ExtensionGroup, ExtensionInfo } from "../../shared/types";
import { Optioney, Removy, Copyy } from "./icons";
import { MaterialSymbol } from "./MaterialSymbols";
import { GroupStateToggle } from "./GroupStateToggle";

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
      return <MaterialSymbol name={group.icon.name} size={size} color={color || "currentColor"} />;
    }
    if (group.icon.type === "custom" && group.icon.dataUrl) {
      return (
        <img
          className="group-custom-icon"
          src={group.icon.dataUrl}
          alt={group.name}
          style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain", borderRadius: "4px" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      );
    }
  }
  if (typeof group.icon === "string" && group.icon.trim()) {
    return <MaterialSymbol name={group.icon} size={size} color={color || "currentColor"} />;
  }
  // Default robust fallback
  return <MaterialSymbol name="folder" size={size} color={color || "currentColor"} />;
}

export function GroupBrief({
  group,
  allExtensions = [],
  viewMode = "tile",
  withControl = true,
  selected = null,
  onToggleGroup,
  onCopyGroup,
  onDeleteGroup,
  onSelect,
  onOpenSubWindow,
  themeMainColor,
}: GroupBriefProps) {
  const isSelectable = selected !== null;
  const isSelected = selected === true;

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

  // --- Big Tile View ---
  if (viewMode === "bigTile" && !isSelectable) {
    return (
      <div className="nb-big-tile group-card">
        <div className="group-icon-wrapper" onClick={handleOpenDetail}>
          {renderGroupIcon(group, 36, themeMainColor)}
        </div>
        <div className="item-meta">
          <span className="item-name" onClick={handleOpenDetail} title={group.name}>
            {group.name}
          </span>
          <span className="item-sub-info">{group.extensionIds.length} extension(s)</span>
        </div>
        {withControl && (
          <div className="item-controls">
            {onToggleGroup && (
              <GroupStateToggle
                groupId={group.id}
                extensionIds={group.extensionIds}
                allExtensions={allExtensions}
                onToggleGroup={onToggleGroup}
                size="small"
              />
            )}
            <Copyy
              color={themeMainColor}
              onClick={(e) => {
                e.stopPropagation();
                onCopyGroup?.(group.id);
              }}
              title="Copy group"
            />
            <Optioney
              color={themeMainColor}
              onClick={handleOpenDetail}
              title="Edit group"
            />
            <Removy
              color={themeMainColor}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteGroup?.(group.id);
              }}
              title="Delete group"
            />
          </div>
        )}
      </div>
    );
  }

  // --- List View ---
  if (viewMode === "list" && !isSelectable) {
    return (
      <div className="nb-list-row group-row">
        {withControl && onToggleGroup && (
          <div className="list-switch">
            <GroupStateToggle
              groupId={group.id}
              extensionIds={group.extensionIds}
              allExtensions={allExtensions}
              onToggleGroup={onToggleGroup}
              size="small"
            />
          </div>
        )}
        <div className="list-icon-wrapper" onClick={handleOpenDetail}>
          {renderGroupIcon(group, 22, themeMainColor)}
        </div>
        <span className="list-name" onClick={handleOpenDetail} title={group.name}>
          {group.name}
        </span>
        <span className="list-version">{group.extensionIds.length} extension(s)</span>
        {withControl && (
          <div className="list-actions">
            <Copyy
              color={themeMainColor}
              onClick={() => onCopyGroup?.(group.id)}
              title="Copy group"
            />
            <Optioney
              color={themeMainColor}
              onClick={handleOpenDetail}
              title="Edit group"
            />
            <Removy
              color={themeMainColor}
              onClick={() => onDeleteGroup?.(group.id)}
              title="Delete group"
            />
          </div>
        )}
      </div>
    );
  }

  // --- Default Tile View (76x76 3D Flip) ---
  return (
    <div
      className={`nb-tile group-tile ${isSelectable ? "selectable " + (isSelected ? "is-selected" : "not-selected") : ""}`}
      onClick={handleCardClick}
    >
      <div className="flip-card">
        <div className="card-front">
          <div className="group-icon-center" onClick={handleOpenDetail}>
            {renderGroupIcon(group, 36, themeMainColor)}
          </div>
          <span
            className="item-name-front"
            onClick={handleOpenDetail}
            title={group.name}
          >
            {group.name}
          </span>
        </div>

        {!isSelectable && (
          <div className="card-back">
            {withControl && (
              <div className="item-controls">
                {onToggleGroup && (
                  <GroupStateToggle
                    groupId={group.id}
                    extensionIds={group.extensionIds}
                    allExtensions={allExtensions}
                    onToggleGroup={onToggleGroup}
                    size="small"
                  />
                )}
                <Copyy
                  color={themeMainColor}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyGroup?.(group.id);
                  }}
                  title="Copy"
                />
                <Optioney
                  color={themeMainColor}
                  onClick={handleOpenDetail}
                  title="Edit"
                />
                <Removy
                  color={themeMainColor}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteGroup?.(group.id);
                  }}
                  title="Delete"
                />
              </div>
            )}
            <span
              className="item-name-back"
              onClick={handleOpenDetail}
              title={group.name}
            >
              {group.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
