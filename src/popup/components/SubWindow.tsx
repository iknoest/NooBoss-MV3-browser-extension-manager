import type { ExtensionInfo, ExtensionGroup } from "../../shared/types";
import { Selector } from "./Selector";
import { GL } from "./i18n";
import { Switchy, Optioney, Removy, Chromey, Closey } from "./icons";

export interface SubWindowProps {
  display: "" | "extension" | "group";
  targetId: string;
  extensions: ExtensionInfo[];
  groups: ExtensionGroup[];
  onClose: () => void;
  onToggleExtension?: (id: string, enabled: boolean) => void;
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
  onOpenOptions,
  onOpenDetails,
  onUninstallExtension,
  onUpdateGroup,
  themeMainColor = "#c393dc",
}: SubWindowProps) {
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
          <div style={{ position: "absolute", right: "16px", top: "16px", cursor: "pointer" }} onClick={onClose}>
            <Closey color={themeMainColor} style={{ width: "24px", height: "24px" }} />
          </div>

          {/* Action Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
            <a href={webstoreUrl} target="_blank" rel="noreferrer">
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt={ext.name}
                  style={{ width: "72px", height: "72px", objectFit: "contain", borderRadius: "8px" }}
                />
              ) : (
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    background: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    borderRadius: "8px",
                  }}
                >
                  🧩
                </div>
              )}
            </a>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {ext.type !== "theme" && (
                <Switchy
                  color={themeMainColor}
                  style={{ width: "36px", height: "36px", cursor: "pointer" }}
                  onClick={() => onToggleExtension?.(ext.id, !ext.enabled)}
                  title={ext.enabled ? "Disable" : "Enable"}
                />
              )}
              {ext.optionsUrl && (
                <Optioney
                  color={themeMainColor}
                  style={{ width: "36px", height: "36px", cursor: "pointer" }}
                  onClick={() => onOpenOptions?.(ext.id)}
                  title="Options"
                />
              )}
              <Removy
                color={themeMainColor}
                style={{ width: "36px", height: "36px", cursor: "pointer" }}
                onClick={() => {
                  onUninstallExtension?.(ext.id);
                  onClose();
                }}
                title="Uninstall"
              />
              <Chromey
                color={themeMainColor}
                style={{ width: "36px", height: "36px", cursor: "pointer" }}
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
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: themeMainColor,
              textDecoration: "none",
              display: "block",
              borderBottom: `1px solid ${themeMainColor}`,
              paddingBottom: "6px",
              marginBottom: "16px",
            }}
          >
            {ext.name}
          </a>

          {/* Brief Table */}
          <table style={{ width: "100%", fontSize: "13px", lineHeight: "1.8", marginBottom: "20px" }}>
            <tbody>
              <tr>
                <td style={{ width: "140px", fontWeight: "bold", color: "#666" }}>{GL("version")}</td>
                <td>{ext.version}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", color: "#666" }}>{GL("state")}</td>
                <td>{ext.enabled ? GL("enabled") : GL("disabled")}</td>
              </tr>
              {memberGroups && (
                <tr>
                  <td style={{ fontWeight: "bold", color: "#666" }}>{GL("group")}</td>
                  <td>{memberGroups}</td>
                </tr>
              )}
              <tr>
                <td style={{ fontWeight: "bold", color: "#666" }}>{GL("description")}</td>
                <td>{ext.description || "No description provided."}</td>
              </tr>
            </tbody>
          </table>

          {/* Details Heading */}
          <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: "16px 0 8px 0", color: "#333" }}>
            {GL("detail")}
          </h3>

          <table style={{ width: "100%", fontSize: "13px", lineHeight: "1.8" }}>
            <tbody>
              <tr>
                <td style={{ width: "140px", fontWeight: "bold", color: "#666" }}>{GL("id")}</td>
                <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{ext.id}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", color: "#666" }}>{GL("type")}</td>
                <td>{ext.type}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", color: "#666" }}>{GL("install_type")}</td>
                <td>{ext.installType}</td>
              </tr>
              {ext.homepageUrl && (
                <tr>
                  <td style={{ fontWeight: "bold", color: "#666" }}>{GL("homepage_url")}</td>
                  <td>
                    <a href={ext.homepageUrl} target="_blank" rel="noreferrer" style={{ color: themeMainColor }}>
                      {ext.homepageUrl}
                    </a>
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ fontWeight: "bold", color: "#666" }}>{GL("may_disable")}</td>
                <td>{ext.mayDisable ? "True" : "False"}</td>
              </tr>
              {ext.permissions && ext.permissions.length > 0 && (
                <tr>
                  <td style={{ fontWeight: "bold", color: "#666", verticalAlign: "top" }}>{GL("permissions")}</td>
                  <td>
                    <ul style={{ margin: 0, paddingLeft: "16px" }}>
                      {ext.permissions.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
              {ext.hostPermissions && ext.hostPermissions.length > 0 && (
                <tr>
                  <td style={{ fontWeight: "bold", color: "#666", verticalAlign: "top" }}>{GL("host_permissions")}</td>
                  <td>
                    <ul style={{ margin: 0, paddingLeft: "16px" }}>
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

    const handleToggleExtensionInGroup = (extId: string) => {
      const isMember = group.extensionIds.includes(extId);
      const nextIds = isMember
        ? group.extensionIds.filter((id) => id !== extId)
        : [...group.extensionIds, extId];
      onUpdateGroup?.({ ...group, extensionIds: nextIds });
    };

    return (
      <div className="subwindow-overlay" onClick={onClose}>
        <div className="subwindow-box" onClick={(e) => e.stopPropagation()}>
          <div style={{ position: "absolute", right: "16px", top: "16px", cursor: "pointer" }} onClick={onClose}>
            <Closey color={themeMainColor} style={{ width: "24px", height: "24px" }} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <input
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                width: "80%",
                borderBottom: `2px solid ${themeMainColor}`,
                color: "#222",
              }}
              value={group.name}
              onInput={(e) => handleNameChange((e.target as HTMLInputElement).value)}
            />
          </div>

          <div style={{ fontSize: "14px", marginBottom: "16px", color: "#666" }}>
            {group.extensionIds.length} extension(s) in group
          </div>

          <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "16px 0 8px 0" }}>
            Select extensions for this group
          </h3>

          <Selector
            extensions={extensions}
            viewMode="tile"
            actionBar={true}
            withControl={false}
            selectedList={group.extensionIds}
            onSelect={handleToggleExtensionInGroup}
            themeMainColor={themeMainColor}
          />
        </div>
      </div>
    );
  }

  return null;
}
