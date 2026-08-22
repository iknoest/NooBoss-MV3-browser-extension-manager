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
  viewMode = "bigTile",
  withControl = true,
  selected = null,
  iconUrl,
  onToggle,
  onOpenOptions,
  onOpenDetails,
  onUninstall,
  onSelect,
  onOpenSubWindow,
  themeMainColor = "#1a73e8",
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

  // --- Selectable Mode (Used inside Group Editor Member Selector) ---
  if (isSelectable) {
    if (viewMode === "bigTile") {
      return (
        <div
          className={`nb-big-tile selectable-big-tile ${disabled ? "disabled" : ""} ${isSelected ? "is-selected" : "not-selected"}`}
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              onSelect?.(extension.id);
            }
          }}
        >
          <div className="select-indicator">
            <span className={`select-box ${isSelected ? "checked" : ""}`}>
              {isSelected ? "✓" : ""}
            </span>
          </div>
          <img className="extension-icon" src={displayIcon} alt={extension.name} />
          <div className="big-tile-info">
            <span className="item-name" title={extension.name}>{extension.name}</span>
            <span className="item-version">{extension.version}</span>
          </div>
          <span className={`status-pill-badge ${extension.enabled ? "enabled" : "disabled"}`}>
            {extension.enabled ? "ON" : "OFF"}
          </span>
        </div>
      );
    }

    // Default Selectable: List View (Full Row Clickable)
    return (
      <div
        className={`nb-list-row selectable-row ${disabled ? "disabled" : ""} ${isSelected ? "is-selected" : "not-selected"}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onSelect?.(extension.id);
          }
        }}
      >
        <div className="select-indicator">
          <span className={`select-box ${isSelected ? "checked" : ""}`}>
            {isSelected ? "✓" : ""}
          </span>
        </div>
        <img className="list-icon" src={displayIcon} alt={extension.name} />
        <span className="list-name" title={extension.name}>{extension.name}</span>
        <span className="list-version">{extension.version}</span>
        <span className={`status-pill-badge ${extension.enabled ? "enabled" : "disabled"}`}>
          {extension.enabled ? "ON" : "OFF"}
        </span>
      </div>
    );
  }

  // --- Normal Big Tile View (Balanced Default Management Mode) ---
  if (viewMode === "bigTile") {
    return (
      <div className={`nb-big-tile ${disabled ? "disabled" : ""}`}>
        <img
          className="extension-icon clickable"
          src={displayIcon}
          alt={extension.name}
          onClick={handleOpenDetail}
          title={extension.name}
        />
        <div className="big-tile-content" onClick={handleOpenDetail}>
          <span className="item-name" title={extension.name}>
            {extension.name}
          </span>
          <span className="item-version">{extension.version}</span>
        </div>

        {withControl && (
          <div className="item-controls-strip">
            {extension.type !== "theme" && (
              <button
                type="button"
                className="action-icon-btn toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle?.(extension.id, !extension.enabled);
                }}
                title={extension.enabled ? "Disable extension" : "Enable extension"}
                aria-label={extension.enabled ? "Disable extension" : "Enable extension"}
              >
                <Switchy color={themeMainColor} size={18} />
              </button>
            )}
            {extension.optionsUrl && (
              <button
                type="button"
                className="action-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenOptions?.(extension.id);
                }}
                title="Options"
                aria-label="Options"
              >
                <Optioney color={themeMainColor} size={16} />
              </button>
            )}
            <button
              type="button"
              className="action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                onUninstall?.(extension.id);
              }}
              title="Uninstall"
              aria-label="Uninstall"
            >
              <Removy color={themeMainColor} size={16} />
            </button>
            <button
              type="button"
              className="action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails?.(extension.id);
              }}
              title="Chrome Details"
              aria-label="Chrome Details"
            >
              <Chromey color={themeMainColor} size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Normal List View (Highest Information Density, 44px Rows) ---
  if (viewMode === "list") {
    return (
      <div className={`nb-list-row ${disabled ? "disabled" : ""}`}>
        {withControl && extension.type !== "theme" && (
          <div className="list-switch-wrap">
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
              title={extension.enabled ? "Disable extension" : "Enable extension"}
            />
          </div>
        )}
        <img
          className="list-icon clickable"
          src={displayIcon}
          alt={extension.name}
          onClick={handleOpenDetail}
        />
        <span
          className="list-name clickable"
          onClick={handleOpenDetail}
          title={extension.name}
        >
          {extension.name}
        </span>
        <span className="list-version">{extension.version}</span>
        {withControl && (
          <div className="list-actions">
            {extension.type === "app" && (
              <button
                type="button"
                className="action-icon-btn"
                onClick={() => onOpenDetails?.(extension.id)}
                title="Launch App"
                aria-label="Launch App"
              >
                <Launchy color={themeMainColor} size={16} />
              </button>
            )}
            {extension.optionsUrl && (
              <button
                type="button"
                className="action-icon-btn"
                onClick={() => onOpenOptions?.(extension.id)}
                title="Options"
                aria-label="Options"
              >
                <Optioney color={themeMainColor} size={16} />
              </button>
            )}
            <button
              type="button"
              className="action-icon-btn"
              onClick={() => onUninstall?.(extension.id)}
              title="Uninstall"
              aria-label="Uninstall"
            >
              <Removy color={themeMainColor} size={16} />
            </button>
            <button
              type="button"
              className="action-icon-btn"
              onClick={() => onOpenDetails?.(extension.id)}
              title="Chrome Details"
              aria-label="Chrome Details"
            >
              <Chromey color={themeMainColor} size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Normal Tile View (Visual Browsing Mode, ~104x104px, Max 6 Columns) ---
  return (
    <div className={`nb-tile ${disabled ? "disabled" : ""}`} onClick={handleOpenDetail}>
      <div className="tile-body">
        <img
          className="extension-icon"
          src={displayIcon}
          alt={extension.name}
          title={extension.name}
        />
        <span className="tile-item-name" title={extension.name}>
          {extension.name}
        </span>
      </div>

      {withControl && (
        <div className="tile-hover-bar" onClick={(e) => e.stopPropagation()}>
          {extension.type !== "theme" && (
            <button
              type="button"
              className="tile-action-btn"
              onClick={() => onToggle?.(extension.id, !extension.enabled)}
              title={extension.enabled ? "Disable" : "Enable"}
              aria-label={extension.enabled ? "Disable" : "Enable"}
            >
              <Switchy color={themeMainColor} size={16} />
            </button>
          )}
          {extension.optionsUrl && (
            <button
              type="button"
              className="tile-action-btn"
              onClick={() => onOpenOptions?.(extension.id)}
              title="Options"
              aria-label="Options"
            >
              <Optioney color={themeMainColor} size={14} />
            </button>
          )}
          <button
            type="button"
            className="tile-action-btn"
            onClick={() => onUninstall?.(extension.id)}
            title="Uninstall"
            aria-label="Uninstall"
          >
            <Removy color={themeMainColor} size={14} />
          </button>
        </div>
      )}
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
