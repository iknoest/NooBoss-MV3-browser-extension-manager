import { useState } from "preact/hooks";
import type { ExtensionInfo, ExtensionGroup, GroupIcon, HistoryRecord, KnownExtensionMetadata } from "../../shared/types";
import { Selector } from "./Selector";
import { GL } from "./i18n";
import { Optioney, Removy, Chromey, Closey, Edity } from "./icons";
import { renderGroupIcon } from "./GroupBrief";
import { GroupIconPicker } from "./GroupIconPicker";
import { GroupCommandControl } from "./GroupCommandControl";
import { computeGroupRuntimeSummary } from "./group-summary";
import { ExtensionSwitch } from "./ExtensionBrief";
import { MaterialSymbol } from "./MaterialSymbols";
import { isValidCwsId } from "../../shared/package-downloader";
import { MissingGroupMembers } from "./MissingGroupMembers";

export interface SubWindowProps {
  display: "" | "extension" | "group";
  targetId: string;
  extensions?: ExtensionInfo[];
  groups?: ExtensionGroup[];
  history?: HistoryRecord[];
  onClose: () => void;
  onToggleExtension?: (id: string, enabled: boolean) => void;
  onToggleGroup?: (id: string, enabled: boolean) => void;
  onOpenOptions?: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  onUninstallExtension?: (id: string) => void;
  onUpdateGroup?: (group: ExtensionGroup) => void;
  onFocusGroup?: (groupId: string) => void;
  themeMainColor?: string;
  developerMode?: boolean;
  onReloadExtension?: (id: string) => Promise<void> | void;
  onDownloadZip?: (ext: ExtensionInfo) => Promise<void> | void;
  downloadingZipIds?: Set<string>;
  knownExtensions?: Record<string, KnownExtensionMetadata>;
  inventoryStatus?: 'loading' | 'ready' | 'error';
}

export function SubWindow({
  display,
  targetId,
  extensions = [],
  groups = [],
  history = [],
  onClose,
  onToggleExtension,
  onToggleGroup,
  onOpenOptions,
  onOpenDetails,
  onUninstallExtension,
  onUpdateGroup,
  onFocusGroup: _onFocusGroup,
  themeMainColor = "#1a73e8",
  developerMode = false,
  onReloadExtension,
  onDownloadZip,
  downloadingZipIds,
  knownExtensions = {},
  inventoryStatus = "ready",
}: SubWindowProps) {
  const [editorViewMode, setEditorViewMode] = useState<"list" | "bigTile">("list");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const [membershipUndoStack, setMembershipUndoStack] = useState<string[][]>([]);
  const [membershipRedoStack, setMembershipRedoStack] = useState<string[][]>([]);

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
                <ExtensionSwitch
                  id={ext.id}
                  enabled={ext.enabled}
                  onToggle={onToggleExtension}
                  size="medium"
                />
              )}
              {developerMode && ext.installType === "development" && (
                <button
                  type="button"
                  className={`action-icon-btn reload-btn ${!ext.enabled ? "disabled" : ""}`}
                  disabled={!ext.enabled}
                  onClick={() => onReloadExtension?.(ext.id)}
                  title={ext.enabled ? "Reload extension code" : "Enable this unpacked extension before reloading"}
                  aria-label="Reload extension code"
                >
                  <MaterialSymbol name="refresh" size={18} color={ext.enabled ? themeMainColor : "var(--text-muted, #888)"} />
                </button>
              )}
              {Boolean(ext.optionsUrl?.trim()) && (
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
              {ext.installType === "normal" && isValidCwsId(ext.id) && onDownloadZip && (
                <button
                  type="button"
                  className={`action-icon-btn subwindow-ctrl-btn ${downloadingZipIds?.has(ext.id) ? "is-downloading" : ""}`}
                  disabled={downloadingZipIds?.has(ext.id)}
                  onClick={() => onDownloadZip(ext)}
                  title="Download ZIP package from Chrome Web Store"
                  aria-label="Download ZIP package"
                >
                  <MaterialSymbol
                    name={downloadingZipIds?.has(ext.id) ? "sync" : "download"}
                    size={18}
                    className={downloadingZipIds?.has(ext.id) ? "spin-icon" : ""}
                    color={themeMainColor}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="subwindow-title-row">
            <a
              href={webstoreUrl}
              target="_blank"
              rel="noreferrer"
              className="subwindow-title"
            >
              {ext.name}
            </a>
            {developerMode && ext.installType === "development" && (
              <span className="dev-chip-badge" title="Unpacked extension (development)">
                DEV
              </span>
            )}
          </div>

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

          {developerMode && (
            <div className="subwindow-dev-section">
              <h4 className="subwindow-section-heading">Developer Actions</h4>
              <div className="subwindow-dev-actions">
                <button
                  type="button"
                  className="btn btn-secondary dev-subwindow-btn"
                  onClick={() => window.open(webstoreUrl, "_blank", "noreferrer")}
                >
                  <MaterialSymbol name="storefront" size={16} />
                  Open store page
                </button>
                <button
                  type="button"
                  className="btn btn-secondary dev-subwindow-btn"
                  onClick={() => onOpenDetails?.(ext.id)}
                >
                  <MaterialSymbol name="settings" size={16} />
                  Open extension details
                </button>
                {ext.installType === "normal" && isValidCwsId(ext.id) && onDownloadZip && (
                  <button
                    type="button"
                    className="btn btn-secondary dev-subwindow-btn"
                    disabled={downloadingZipIds?.has(ext.id)}
                    onClick={() => onDownloadZip(ext)}
                  >
                    <MaterialSymbol
                      name={downloadingZipIds?.has(ext.id) ? "sync" : "download"}
                      size={16}
                      className={downloadingZipIds?.has(ext.id) ? "spin-icon" : ""}
                    />
                    <span>{downloadingZipIds?.has(ext.id) ? "Downloading ZIP…" : "Download ZIP"}</span>
                  </button>
                )}
              </div>
            </div>
          )}
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
      setMembershipUndoStack((prev) => [...prev, [...group.extensionIds]]);
      setMembershipRedoStack([]);
      onUpdateGroup?.({ ...group, extensionIds: nextIds });
    };

    const handleUndoMembership = () => {
      if (membershipUndoStack.length === 0) return;
      const nextUndo = [...membershipUndoStack];
      const prevIds = nextUndo.pop()!;
      setMembershipRedoStack((prev) => [...prev, [...group.extensionIds]]);
      setMembershipUndoStack(nextUndo);
      onUpdateGroup?.({ ...group, extensionIds: prevIds });
    };

    const handleRedoMembership = () => {
      if (membershipRedoStack.length === 0) return;
      const nextRedo = [...membershipRedoStack];
      const nextIds = nextRedo.pop()!;
      setMembershipUndoStack((prev) => [...prev, [...group.extensionIds]]);
      setMembershipRedoStack(nextRedo);
      onUpdateGroup?.({ ...group, extensionIds: nextIds });
    };

    const isInventoryReady = inventoryStatus === "ready";
    const missingMemberIds = isInventoryReady
      ? (group.extensionIds || []).filter((id) => !extensions.some((e) => e.id === id))
      : [];

    const handleRemoveMissingMember = (idToRemove: string) => {
      const nextIds = group.extensionIds.filter((id) => id !== idToRemove);
      setMembershipUndoStack((prev) => [...prev, [...group.extensionIds]]);
      setMembershipRedoStack([]);
      onUpdateGroup?.({ ...group, extensionIds: nextIds });
    };

    return (
      <div className="subwindow-overlay" onClick={onClose}>
        <div className="subwindow-box group-subwindow" onClick={(e) => e.stopPropagation()}>
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
                  {computeGroupRuntimeSummary(group, extensions, inventoryStatus).summaryText}
                  {computeGroupRuntimeSummary(group, extensions, inventoryStatus).exceptionText && (
                    <span
                      className="exception-text"
                      title={
                        computeGroupRuntimeSummary(group, extensions, inventoryStatus).hasMissing
                          ? computeGroupRuntimeSummary(group, extensions, inventoryStatus).missingTooltipText
                          : undefined
                      }
                    >
                      {" · "}{computeGroupRuntimeSummary(group, extensions, inventoryStatus).exceptionText}
                    </span>
                  )}
                </span>
                {onToggleGroup && (
                  <GroupCommandControl
                    group={group}
                    allExtensions={extensions}
                    onToggleGroup={onToggleGroup}
                    size="small"
                    inventoryStatus={inventoryStatus}
                  />
                )}
              </div>
            </div>

            <div className="group-edit-actions">
              <button
                type="button"
                className="btn btn-primary action-btn group-done-btn"
                onClick={onClose}
                title="Finish editing (changes are saved automatically)"
                aria-label="Done editing group"
              >
                Done
              </button>
              <button
                type="button"
                className="subwindow-header-close-btn action-icon-btn"
                onClick={onClose}
                aria-label="Close"
                title="Close"
              >
                <Closey color="currentColor" style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
          </div>

          {missingMemberIds.length > 0 && (
            <MissingGroupMembers
              missingIds={missingMemberIds}
              history={history}
              knownExtensions={knownExtensions}
              installedExtensions={extensions}
              isEditor={true}
              title={`Missing from Chrome (${missingMemberIds.length})`}
              onRemoveMember={handleRemoveMissingMember}
              themeMainColor={themeMainColor}
            />
          )}

          <h3 className="subwindow-section-heading">Select extensions for this group</h3>

          <Selector
            extensions={extensions}
            groups={[]}
            history={history}
            knownExtensions={knownExtensions}
            inventoryStatus={inventoryStatus}
            onUpdateGroup={onUpdateGroup}
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
            selectionNoun="assigned"
            onSelect={handleToggleExtensionInGroup}
            onUndoMembership={handleUndoMembership}
            onRedoMembership={handleRedoMembership}
            canUndoMembership={membershipUndoStack.length > 0}
            canRedoMembership={membershipRedoStack.length > 0}
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
