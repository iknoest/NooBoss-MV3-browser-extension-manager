import type { ExtensionGroup } from "../../shared/types";
import { Groupy, Switchy, Optioney, Removy, Copyy } from "./icons";

export interface GroupBriefProps {
  group: ExtensionGroup;
  viewMode?: "tile" | "bigTile" | "list";
  withControl?: boolean;
  selected?: boolean | null;
  iconUrl?: string;
  onToggleGroup?: (id: string, enabled: boolean) => void;
  onCopyGroup?: (id: string) => void;
  onDeleteGroup?: (id: string) => void;
  onSelect?: (id: string) => void;
  onOpenSubWindow?: (type: "group", id: string) => void;
  themeMainColor?: string;
}

export function GroupBrief({
  group,
  viewMode = "tile",
  withControl = true,
  selected = null,
  iconUrl,
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
      <div className="nb-big-tile">
        {iconUrl ? (
          <img
            className="group-icon"
            src={iconUrl}
            alt={group.name}
            onClick={handleOpenDetail}
            title={group.name}
          />
        ) : (
          <Groupy
            className="group-icon"
            color={themeMainColor}
            onClick={handleOpenDetail}
            title={group.name}
          />
        )}
        <span
          className="item-name"
          onClick={handleOpenDetail}
          title={group.name}
        >
          {group.name}
        </span>
        {withControl && (
          <div className="item-controls">
            <Switchy
              color={themeMainColor}
              onClick={(e) => {
                e.stopPropagation();
                onToggleGroup?.(group.id, true);
              }}
              title="Enable all in group"
            />
            <Switchy
              color={themeMainColor}
              style={{ filter: "invert(1) brightness(0.8)" }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleGroup?.(group.id, false);
              }}
              title="Disable all in group"
            />
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
      <div className="nb-list-row">
        {withControl && (
          <div className="list-switch" style={{ display: "flex", gap: "6px" }}>
            <Switchy
              color={themeMainColor}
              onClick={() => onToggleGroup?.(group.id, true)}
              title="Enable all in group"
            />
            <Switchy
              color={themeMainColor}
              style={{ filter: "invert(1) brightness(0.8)" }}
              onClick={() => onToggleGroup?.(group.id, false)}
              title="Disable all in group"
            />
          </div>
        )}
        {iconUrl ? (
          <img
            className="list-icon"
            src={iconUrl}
            alt={group.name}
            onClick={handleOpenDetail}
          />
        ) : (
          <Groupy
            className="list-icon"
            color={themeMainColor}
            onClick={handleOpenDetail}
          />
        )}
        <span
          className="list-name"
          onClick={handleOpenDetail}
          title={group.name}
        >
          {group.name} ({group.extensionIds.length})
        </span>
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
      className={`nb-tile ${isSelectable ? "selectable " + (isSelected ? "is-selected" : "not-selected") : ""}`}
      onClick={handleCardClick}
    >
      <div className="flip-card">
        <div className="card-front">
          {iconUrl ? (
            <img
              className="group-icon"
              src={iconUrl}
              alt={group.name}
              onClick={handleOpenDetail}
            />
          ) : (
            <Groupy
              className="group-icon"
              color={themeMainColor}
              onClick={handleOpenDetail}
            />
          )}
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
                <Switchy
                  color={themeMainColor}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleGroup?.(group.id, true);
                  }}
                  title="Enable all"
                />
                <Switchy
                  color={themeMainColor}
                  style={{ filter: "invert(1) brightness(0.8)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleGroup?.(group.id, false);
                  }}
                  title="Disable all"
                />
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
