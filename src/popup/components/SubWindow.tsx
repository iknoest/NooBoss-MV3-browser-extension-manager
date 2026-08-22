import { useState } from "preact/hooks";
import type { ExtensionInfo, ExtensionGroup, GroupIcon } from "../../shared/types";
import { Selector } from "./Selector";
import { GL } from "./i18n";
import { Switchy, Optioney, Removy, Chromey, Closey, Edity } from "./icons";
import { renderGroupIcon } from "./GroupBrief";
import { GroupIconPicker } from "./GroupIconPicker";
import { GroupStateToggle } from "./GroupStateToggle";

export interface SubWindowProps {
  display: "" | "extension" | "group";
  targetId: string;
  extensions: ExtensionInfo[];
  groups: ExtensionGroup[];
  onClose: () => void;
  onToggleExtension?: (id: string, enabled: boolean) => void;
  onToggleGroup?: (id: string, enabled: boolean) => void;
  onOpenOptions?: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  onUninstallExtension?: (id: string) => void;
  onUpdateGroup?: (group: ExtensionGroup) => void;
  themeMainColor?: string;
}

export function SubWindow({
  display,
  targetId,
  extensions = [],
  groups = [],
  onClose,
  onToggleExtension,
  onToggleGroup,
  onOpenOptions,
  onOpenDetails,
  onUninstallExtension,
  onUpdateGroup,
  themeMainColor = "#1a73e8",
}: SubWindowProps) {
  const [editorViewMode, setEditorViewMode] = useState<"list" | "bigTile">("list");
  const [showIconPicker, setShowIconPicker] = useState(false);

  if (!display || !targetId) return null;

  if (display === "extension") {
    const ext = extensions.find((e) => e.id === targetId);
    if (!ext) return null;

    const iconUrl = ext.icons && ext.icons.length > 0 ? ext.icons[ext.icons.length - 1].url : "";
    const memberGroups = groups.filter((g) => g.extensionIds.includes(ext.id)).map((g) => g.name).join(", ");
    const webstoreUrl = `https://chrome.google.com/webstore/detail/${ext.id}`;

    return (
      <div className="subwindow-overlay" onClick={onClose}>
        <div className="subwindow-box" onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button className="subwindow-close-btn" onClick={onClose} aria-label="Close">
            <Closey color="currentColor" style={{ width: "20px", height: "20px" }} />
          </button>

          {/* Action Header */}
          <div className="subwindow-action-header">
            <a href={webstoreUrl} target="_blank" rel="noreferrer" className="subwindow-icon-link">
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt={ext.name}
                  className="subwindow-ext-icon"
                />
              ) : (
                <div className="subwindow-fallback-icon">
                  {ext.name.charAt(0).toUpperCase()}
                </div>
              )}
            </a>

            <div className="subwindow-controls">
              {ext.type !== "theme" && (
                <Switchy
                  color={themeMainColor}
                  className="subwindow-ctrl-icon"
                  onClick={() => onToggleExtension?.(ext.id, !ext.enabled)}
                  title={ext.enabled ? "Disable" : "Enable"}
                />
              )}
              {ext.optionsUrl && (
                <Optioney
                  color={themeMainColor}
                  className="subwindow-ctrl-icon"
                  onClick={() => onOpenOptions?.(ext.id)}
                  title="Options"
                />
              )}
              <Removy
                color={themeMainColor}
                className="subwindow-ctrl-icon"
                onClick={() => onUninstallExtension?.(ext.id)}
                title="Uninstall"
              />
              <Chromey
                color={themeMainColor}
                className="subwindow-ctrl-icon"
                onClick={() => onOpenDetails?.(ext.id)}
                title="Chrome Details"
              />
            </div>
          </div>

          {/* Title */}
          <a
            href={webstoreUrl}
            target="_blank"
            rel="noreferrer"
            className="subwindow-title"
          >
            {ext.name}
          </a>

          {/* Brief Table */}
          <table className="subwindow-table">
            <tbody>
              <tr>
                <td className="table-label">{GL("version")}</td>
                <td className="table-value">{ext.version}</td>
              </tr>
              <tr>
                <td className="table-label">{GL("state")}</td>
                <td className="table-value">
                  <span className={`status-pill ${ext.enabled ? "enabled" : "disabled"}`}>
                    {ext.enabled ? GL("enabled") : GL("disabled")}
                  </span>
                </td>
              </tr>
              {memberGroups && (
                <tr>
                  <td className="table-label">{GL("group")}</td>
                  <td className="table-value">{memberGroups}</td>
                </tr>
              )}
              <tr>
                <td className="table-label">{GL("description")}</td>
                <td className="table-value">{ext.description || "No description provided."}</td>
              </tr>
            </tbody>
          </table>

          {/* Details Heading */}
          <h3 className="subwindow-section-heading">{GL("detail")}</h3>

          <table className="subwindow-table">
            <tbody>
              <tr>
                <td className="table-label">{GL("id")}</td>
                <td className="table-value monospace">{ext.id}</td>
              </tr>
              <tr>
                <td className="table-label">{GL("type")}</td>
                <td className="table-value">{ext.type}</td>
              </tr>
              <tr>
                <td className="table-label">{GL("install_type")}</td>
                <td className="table-value">{ext.installType}</td>
              </tr>
              {ext.homepageUrl && (
                <tr>
                  <td className="table-label">{GL("homepage_url")}</td>
                  <td className="table-value">
                    <a href={ext.homepageUrl} target="_blank" rel="noreferrer" className="accent-link">
                      {ext.homepageUrl}
                    </a>
                  </td>
                </tr>
              )}
              <tr>
                <td className="table-label">{GL("may_disable")}</td>
                <td className="table-value">{ext.mayDisable ? "True" : "False"}</td>
              </tr>
              {ext.permissions && ext.permissions.length > 0 && (
                <tr>
                  <td className="table-label align-top">{GL("permissions")}</td>
                  <td className="table-value">
                    <ul className="subwindow-list">
                      {ext.permissions.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
              {ext.hostPermissions && ext.hostPermissions.length > 0 && (
                <tr>
                  <td className="table-label align-top">{GL("host_permissions")}</td>
                  <td className="table-value">
                    <ul className="subwindow-list">
                      {ext.hostPermissions.map((hp) => (
                        <li key={hp}>{hp}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (display === "group") {
    const group = groups.find((g) => g.id === targetId);
    if (!group) return null;

    const handleNameChange = (name: string) => {
      onUpdateGroup?.({ ...group, name });
    };

    const handleIconChange = (icon: GroupIcon) => {
      onUpdateGroup?.({ ...group, icon });
    };

    const handleToggleExtensionInGroup = (extId: string) => {
      const isMember = group.extensionIds.includes(extId);
      const nextIds = isMember
        ? group.extensionIds.filter((id) => id !== extId)
        : [...group.extensionIds, extId];
      onUpdateGroup?.({ ...group, extensionIds: nextIds });
    };

    return (
      <div className="subwindow-overlay" onClick={onClose}>
        <div className="subwindow-box group-subwindow" onClick={(e) => e.stopPropagation()}>
          <button className="subwindow-close-btn" onClick={onClose} aria-label="Close">
            <Closey color="currentColor" style={{ width: "20px", height: "20px" }} />
          </button>

          <div className="group-edit-header">
            <button
              type="button"
              className="group-icon-edit-btn"
              onClick={() => setShowIconPicker(true)}
              title="Click to change group icon"
            >
              <div className="group-icon-display">
                {renderGroupIcon(group, 36, themeMainColor)}
              </div>
              <span className="icon-edit-badge">
                <Edity color="#ffffff" style={{ width: "12px", height: "12px" }} />
              </span>
            </button>

            <div className="group-edit-info">
              <input
                className="group-name-input"
                value={group.name}
                onInput={(e) => handleNameChange((e.target as HTMLInputElement).value)}
                placeholder="Group name"
              />
              <div className="group-meta-row">
                <span className="group-count-text">
                  {group.extensionIds.length} extension(s) in group
                </span>
                {onToggleGroup && (
                  <GroupStateToggle
                    groupId={group.id}
                    extensionIds={group.extensionIds}
                    allExtensions={extensions}
                    onToggleGroup={onToggleGroup}
                    size="small"
                  />
                )}
              </div>
            </div>
          </div>

          <h3 className="subwindow-section-heading">Select extensions for this group</h3>

          <Selector
            extensions={extensions}
            groups={[]}
            viewMode={editorViewMode}
            onChangeViewMode={(mode) => {
              if (mode === "list" || mode === "bigTile") {
                setEditorViewMode(mode);
              }
            }}
            allowedViewModes={["list", "bigTile"]}
            actionBar={true}
            withControl={false}
            selectedList={group.extensionIds}
            onSelect={handleToggleExtensionInGroup}
            themeMainColor={themeMainColor}
          />

          {showIconPicker && (
            <GroupIconPicker
              currentIcon={group.icon}
              onSelectIcon={handleIconChange}
              onClose={() => setShowIconPicker(false)}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
