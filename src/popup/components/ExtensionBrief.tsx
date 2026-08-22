import type { ExtensionInfo } from "../../shared/types";
import { Switchy, Optioney, Removy, Chromey, Launchy } from "./icons";

export interface ExtensionBriefProps {
  extension: ExtensionInfo;
  viewMode?: "tile" | "bigTile" | "list";
  withControl?: boolean;
  selected?: boolean | null;
  iconUrl?: string;
  onToggle?: (id: string, enabled: boolean) => void;
  onOpenOptions?: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  onUninstall?: (id: string) => void;
  onSelect?: (id: string) => void;
  onOpenSubWindow?: (type: "extension", id: string) => void;
  themeMainColor?: string;
}

export function ExtensionBrief({
  extension,
  viewMode = "tile",
  withControl = true,
  selected = null,
  iconUrl,
  onToggle,
  onOpenOptions,
  onOpenDetails,
  onUninstall,
  onSelect,
  onOpenSubWindow,
  themeMainColor,
}: ExtensionBriefProps) {
  const isSelectable = selected !== null;
  const isSelected = selected === true;
  const disabled = !extension.enabled;

  let displayIcon = iconUrl;
  if (!displayIcon && extension.icons && extension.icons.length > 0) {
    displayIcon = extension.icons[extension.icons.length - 1].url;
  }
  if (!displayIcon) {
    displayIcon = makeFallbackIcon(extension.name);
  }

  const handleOpenDetail = (e: MouseEvent) => {
    e.stopPropagation();
    if (isSelectable) {
      onSelect?.(extension.id);
    } else {
      onOpenSubWindow?.("extension", extension.id);
    }
  };

  const handleCardClick = () => {
    if (isSelectable) {
      onSelect?.(extension.id);
    }
  };

  // --- Big Tile View ---
  if (viewMode === "bigTile" && !isSelectable) {
    return (
      <div className={`nb-big-tile ${disabled ? "disabled" : ""}`}>
        <img
          className="extension-icon"
          src={displayIcon}
          alt={extension.name}
          onClick={handleOpenDetail}
          title={extension.name}
        />
        <span
          className="item-name"
          onClick={handleOpenDetail}
          title={extension.name}
        >
          {extension.name}
        </span>
        <span className="item-version">{extension.version}</span>
        {withControl && (
          <div className="item-controls">
            {extension.type !== "theme" && (
              <Switchy
                color={themeMainColor}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle?.(extension.id, !extension.enabled);
                }}
                title={extension.enabled ? "Disable" : "Enable"}
              />
            )}
            {extension.optionsUrl && (
              <Optioney
                color={themeMainColor}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenOptions?.(extension.id);
                }}
                title="Options"
              />
            )}
            <Removy
              color={themeMainColor}
              onClick={(e) => {
                e.stopPropagation();
                onUninstall?.(extension.id);
              }}
              title="Uninstall"
            />
            <Chromey
              color={themeMainColor}
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails?.(extension.id);
              }}
              title="Chrome Details"
            />
          </div>
        )}
      </div>
    );
  }

  // --- List View ---
  if (viewMode === "list" && !isSelectable) {
    return (
      <div className={`nb-list-row ${disabled ? "disabled" : ""}`}>
        {withControl && extension.type !== "theme" && (
          <div className="list-switch">
            <input
              type="checkbox"
              id={`list-switch-${extension.id}`}
              className="switch-input"
              checked={extension.enabled}
              onChange={() => onToggle?.(extension.id, !extension.enabled)}
            />
            <label
              htmlFor={`list-switch-${extension.id}`}
              className="switch-label"
              title={extension.enabled ? "Disable" : "Enable"}
            />
          </div>
        )}
        <img
          className="list-icon"
          src={displayIcon}
          alt={extension.name}
          onClick={handleOpenDetail}
        />
        <span
          className="list-name"
          onClick={handleOpenDetail}
          title={extension.name}
        >
          {extension.name}
        </span>
        <span className="list-version">{extension.version}</span>
        {withControl && (
          <div className="list-actions">
            {extension.type === "app" && (
              <Launchy
                color={themeMainColor}
                onClick={() => onOpenDetails?.(extension.id)}
                title="Launch App"
              />
            )}
            {extension.optionsUrl && (
              <Optioney
                color={themeMainColor}
                onClick={() => onOpenOptions?.(extension.id)}
                title="Options"
              />
            )}
            <Removy
              color={themeMainColor}
              onClick={() => onUninstall?.(extension.id)}
              title="Uninstall"
            />
            <Chromey
              color={themeMainColor}
              onClick={() => onOpenDetails?.(extension.id)}
              title="Chrome Details"
            />
          </div>
        )}
      </div>
    );
  }

  // --- Default Tile View (76x76 3D Flip) ---
  return (
    <div
      className={`nb-tile ${disabled ? "disabled" : ""} ${isSelectable ? "selectable " + (isSelected ? "is-selected" : "not-selected") : ""}`}
      onClick={handleCardClick}
    >
      <div className="flip-card">
        <div className="card-front">
          <img
            className="extension-icon"
            src={displayIcon}
            alt={extension.name}
            onClick={handleOpenDetail}
          />
          <span
            className="item-name-front"
            onClick={handleOpenDetail}
            title={extension.name}
          >
            {extension.name}
          </span>
        </div>

        {!isSelectable && (
          <div className="card-back">
            {withControl && (
              <div className="item-controls">
                {extension.type !== "theme" && (
                  <Switchy
                    color={themeMainColor}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle?.(extension.id, !extension.enabled);
                    }}
                    title={extension.enabled ? "Disable" : "Enable"}
                  />
                )}
                {extension.optionsUrl && (
                  <Optioney
                    color={themeMainColor}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenOptions?.(extension.id);
                    }}
                    title="Options"
                  />
                )}
                <Removy
                  color={themeMainColor}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUninstall?.(extension.id);
                  }}
                  title="Uninstall"
                />
                <Chromey
                  color={themeMainColor}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetails?.(extension.id);
                  }}
                  title="Chrome Details"
                />
              </div>
            )}
            <span className="item-version">{extension.version}</span>
            <span
              className="item-name-back"
              onClick={handleOpenDetail}
              title={extension.name}
            >
              {extension.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function makeFallbackIcon(name: string) {
  const initial = (name || "E").charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="28" fill="#555"/>
    <text x="64" y="76" font-family="system-ui, -apple-system, sans-serif" font-size="54" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
