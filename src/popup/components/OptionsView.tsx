import { useState } from "preact/hooks";
import type { AppSettings, ExtensionInfo } from "../../shared/types";
import { GL } from "./i18n";

export interface OptionsViewProps {
  settings: AppSettings;
  extensions?: ExtensionInfo[];
  onSaveSettings: (settings: AppSettings) => void;
  onClearHistory: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  themeMainColor?: string;
}

export function OptionsView({
  settings,
  extensions = [],
  onSaveSettings,
  onClearHistory,
  onExportData,
  onImportData,
  themeMainColor = "#c393dc",
}: OptionsViewProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    experience: true,
    experienceTheme: true,
    extensions: true,
    extensionsNotifications: true,
    extensionsHistory: true,
    extensionsAutoState: true,
    advanced: true,
    advancedClean: true,
    advancedBackup: true,
  });

  const [confirmModal, setConfirmModal] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdateSetting = <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
    onSaveSettings({ ...settings, [key]: val });
  };

  const handleExportHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Exported Extensions</title></head>
<body>
<h1>My Chrome Extensions</h1>
<ul>
${extensions.map((e) => `<li><a href="https://chrome.google.com/webstore/detail/${e.id}">${e.name}</a> (${e.version}) - ${e.enabled ? "Enabled" : "Disabled"}</li>`).join("\n")}
</ul>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Extensions.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) {
      onImportData(files[0]);
    }
  };

  const renderSectionHeader = (key: string, title: string, level = 1) => {
    const isOpen = !!openSections[key];
    const fontSize = level === 1 ? "20px" : level === 2 ? "16px" : "14px";
    return (
      <div
        style={{
          fontSize,
          fontWeight: "bold",
          cursor: "pointer",
          margin: "12px 0 6px 0",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          fontFamily: level === 1 ? "Georgia, serif, system-ui" : "inherit",
          color: level === 1 ? "#222" : "inherit",
        }}
        onClick={() => toggleSection(key)}
      >
        <span>{title}</span>
        <span
          style={{
            marginLeft: "6px",
            fontSize: "0.8em",
            opacity: 0.5,
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        >
          ▼
        </span>
      </div>
    );
  };

  return (
    <div className="nb-page" style={{ userSelect: "none", paddingBottom: "32px" }}>
      {/* Experience Section */}
      <section>
        {renderSectionHeader("experience", GL("experience"), 1)}
        {openSections["experience"] && (
          <div style={{ paddingLeft: "20px" }}>
            {renderSectionHeader("experienceTheme", GL("theme"), 2)}
            {openSections["experienceTheme"] && (
              <div style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ width: "120px" }}>{GL("main_color")}</span>
                  <input
                    type="color"
                    value={themeMainColor}
                    onChange={(e) => {
                      // Save theme color
                      document.documentElement.style.setProperty("--theme-main", (e.target as HTMLInputElement).value);
                    }}
                    style={{ width: "40px", height: "24px", padding: 0, border: "none", cursor: "pointer" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ width: "120px" }}>Theme Preset</span>
                  <select
                    value={settings.theme}
                    onChange={(e) => handleUpdateSetting("theme", (e.target as HTMLSelectElement).value as AppSettings["theme"])}
                  >
                    <option value="system">System Default (Lilac)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Extensions Section */}
      <section>
        {renderSectionHeader("extensions", GL("extensions"), 1)}
        {openSections["extensions"] && (
          <div style={{ paddingLeft: "20px" }}>
            {/* Notifications */}
            {renderSectionHeader("extensionsNotifications", GL("notifications"), 2)}
            {openSections["extensionsNotifications"] && (
              <div style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={settings.notifyStateChange}
                    onChange={(e) => handleUpdateSetting("notifyStateChange", (e.target as HTMLInputElement).checked)}
                    style={{ marginRight: "8px" }}
                  />
                  <span>{GL("notify_state_change")}</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={settings.notifyInstallUninstall}
                    onChange={(e) => handleUpdateSetting("notifyInstallUninstall", (e.target as HTMLInputElement).checked)}
                    style={{ marginRight: "8px" }}
                  />
                  <span>{GL("notify_installation")}</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={settings.notifyAutoState}
                    onChange={(e) => handleUpdateSetting("notifyAutoState", (e.target as HTMLInputElement).checked)}
                    style={{ marginRight: "8px" }}
                  />
                  <span>{GL("notify_extension_state_change")}</span>
                </label>
              </div>
            )}

            {/* History */}
            {renderSectionHeader("extensionsHistory", GL("history"), 2)}
            {openSections["extensionsHistory"] && (
              <div style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={settings.historyTrackInstall}
                    onChange={(e) => handleUpdateSetting("historyTrackInstall", (e.target as HTMLInputElement).checked)}
                    style={{ marginRight: "8px" }}
                  />
                  <span>{GL("record_installation")}</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={settings.historyTrackUninstall}
                    onChange={(e) => handleUpdateSetting("historyTrackUninstall", (e.target as HTMLInputElement).checked)}
                    style={{ marginRight: "8px" }}
                  />
                  <span>{GL("record_removal")}</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={settings.historyTrackEnable}
                    onChange={(e) => handleUpdateSetting("historyTrackEnable", (e.target as HTMLInputElement).checked)}
                    style={{ marginRight: "8px" }}
                  />
                  <span>{GL("record_enable")}</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={settings.historyTrackDisable}
                    onChange={(e) => handleUpdateSetting("historyTrackDisable", (e.target as HTMLInputElement).checked)}
                    style={{ marginRight: "8px" }}
                  />
                  <span>{GL("record_disable")}</span>
                </label>
              </div>
            )}

            {/* AutoState */}
            {renderSectionHeader("extensionsAutoState", GL("autoState"), 2)}
            {openSections["extensionsAutoState"] && (
              <div style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={settings.autoStateEnabled}
                    onChange={(e) => handleUpdateSetting("autoStateEnabled", (e.target as HTMLInputElement).checked)}
                    style={{ marginRight: "8px" }}
                  />
                  <span>{GL("autoState")} Enabled</span>
                </label>

                <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
                  <span style={{ width: "120px" }}>AutoState Mode</span>
                  <select
                    value={settings.autoStateMode}
                    onChange={(e) => handleUpdateSetting("autoStateMode", (e.target as HTMLSelectElement).value as AppSettings["autoStateMode"])}
                  >
                    <option value="automatic">Automatic (Direct)</option>
                    <option value="assisted">Assisted (Pending Confirmation)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Advanced Section */}
      <section>
        {renderSectionHeader("advanced", GL("advanced"), 1)}
        {openSections["advanced"] && (
          <div style={{ paddingLeft: "20px" }}>
            {/* Clean */}
            {renderSectionHeader("advancedClean", GL("clean"), 2)}
            {openSections["advancedClean"] && (
              <div style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <button className="nb-btn" onClick={() => setConfirmModal("clean_history")}>
                    {GL("empty_history")}
                  </button>
                </div>
                <div>
                  <button className="nb-btn" onClick={() => setConfirmModal("reset_all")}>
                    {GL("reset_everything")}
                  </button>
                </div>
              </div>
            )}

            {/* Backup */}
            {renderSectionHeader("advancedBackup", GL("backup"), 2)}
            {openSections["advancedBackup"] && (
              <div style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <button className="nb-btn" onClick={handleExportHtml}>
                    {GL("export_extensions_to_html")}
                  </button>
                </div>
                <div>
                  <button className="nb-btn" onClick={onExportData}>
                    {GL("export_options")}
                  </button>
                </div>
                <div>
                  <input
                    id="upload-options-file"
                    type="file"
                    accept=".json,.options"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <button className="nb-btn" onClick={() => document.getElementById("upload-options-file")?.click()}>
                    {GL("import_options")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="subwindow-overlay" onClick={() => setConfirmModal(null)}>
          <div
            style={{
              width: "300px",
              padding: "20px",
              background: "#fff",
              textAlign: "center",
              boxShadow: "0 0 16px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "16px", marginBottom: "16px" }}>{GL("are_you_sure")}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
              <button
                className="nb-btn"
                onClick={() => {
                  if (confirmModal === "clean_history") {
                    onClearHistory();
                  } else if (confirmModal === "reset_all") {
                    onClearHistory();
                    // Reset settings
                  }
                  setConfirmModal(null);
                }}
              >
                {GL("confirm")}
              </button>
              <button className="nb-btn inActive" onClick={() => setConfirmModal(null)}>
                {GL("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
