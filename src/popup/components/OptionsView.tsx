import { useState } from "preact/hooks";
import type { AppSettings, ExtensionInfo } from "../../shared/types";

export interface OptionsViewProps {
  settings: AppSettings;
  extensions?: ExtensionInfo[];
  onSaveSettings: (settings: AppSettings) => void;
  onClearHistory: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  themeMainColor?: string;
}

const ACCENT_PRESETS: Record<string, string> = {
  default: "#1a73e8",
  blue: "#2563eb",
  purple: "#9333ea",
  green: "#16a34a",
  orange: "#ea580c",
};

export function OptionsView({
  settings,
  extensions = [],
  onSaveSettings,
  onClearHistory,
  onExportData,
  onImportData,
  themeMainColor = "#1a73e8",
}: OptionsViewProps) {
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  const handleUpdateSetting = <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
    onSaveSettings({ ...settings, [key]: val });
  };

  const handleAccentPresetChange = (preset: AppSettings["accentPreset"]) => {
    if (!preset) return;
    if (preset === "custom") {
      onSaveSettings({
        ...settings,
        accentPreset: "custom",
        accentColor: settings.accentColor || "#1a73e8",
      });
    } else {
      const color = ACCENT_PRESETS[preset] || ACCENT_PRESETS.default;
      onSaveSettings({
        ...settings,
        accentPreset: preset,
        accentColor: color,
      });
    }
  };

  const handleCustomColorChange = (hex: string) => {
    onSaveSettings({
      ...settings,
      accentPreset: "custom",
      accentColor: hex,
    });
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

  return (
    <div className="options-container">
      {/* 1. Appearance Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Appearance</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Theme Mode</span>
              <span className="settings-description">Choose how NooBoss appears</span>
            </div>
            <div className="settings-control">
              <select
                className="settings-select"
                value={settings.theme}
                onChange={(e) =>
                  handleUpdateSetting(
                    "theme",
                    (e.target as HTMLSelectElement).value as AppSettings["theme"]
                  )
                }
              >
                <option value="system">System (Follows OS/Browser)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Accent Color</span>
              <span className="settings-description">Color used for active controls and highlights</span>
            </div>
            <div className="settings-control accent-control-group">
              <select
                className="settings-select"
                value={settings.accentPreset || "default"}
                onChange={(e) =>
                  handleAccentPresetChange(
                    (e.target as HTMLSelectElement).value as AppSettings["accentPreset"]
                  )
                }
              >
                <option value="default">Default (System Blue)</option>
                <option value="blue">Blue</option>
                <option value="purple">Purple</option>
                <option value="green">Green</option>
                <option value="orange">Orange</option>
                <option value="custom">Custom Color...</option>
              </select>

              {settings.accentPreset === "custom" && (
                <input
                  type="color"
                  className="settings-color-input"
                  value={settings.accentColor || themeMainColor}
                  onChange={(e) => handleCustomColorChange((e.target as HTMLInputElement).value)}
                  title="Choose custom accent color"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. AutoState Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">AutoState Engine</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Enable AutoState</span>
              <span className="settings-description">
                Automatically manage extensions based on active website URLs
              </span>
            </div>
            <div className="settings-control">
              <input
                type="checkbox"
                id="setting-autostate-enable"
                className="switch-input"
                checked={settings.autoStateEnabled}
                onChange={(e) =>
                  handleUpdateSetting("autoStateEnabled", (e.target as HTMLInputElement).checked)
                }
              />
              <label htmlFor="setting-autostate-enable" className="switch-label" />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Operation Mode</span>
              <span className="settings-description">
                How state changes are applied when URL rules match
              </span>
            </div>
            <div className="settings-control">
              <select
                className="settings-select"
                value={settings.autoStateMode}
                onChange={(e) =>
                  handleUpdateSetting(
                    "autoStateMode",
                    (e.target as HTMLSelectElement).value as AppSettings["autoStateMode"]
                  )
                }
              >
                <option value="automatic">Automatic (Apply Immediately)</option>
                <option value="assisted">Assisted (Ask for Confirmation)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Notifications Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Notifications</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Installation Alerts</span>
              <span className="settings-description">Notify when extensions are installed or uninstalled</span>
            </div>
            <div className="settings-control">
              <input
                type="checkbox"
                id="setting-notify-install"
                className="switch-input"
                checked={settings.notifyInstallUninstall}
                onChange={(e) =>
                  handleUpdateSetting("notifyInstallUninstall", (e.target as HTMLInputElement).checked)
                }
              />
              <label htmlFor="setting-notify-install" className="switch-label" />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">State Change Alerts</span>
              <span className="settings-description">Notify when extensions are enabled or disabled</span>
            </div>
            <div className="settings-control">
              <input
                type="checkbox"
                id="setting-notify-state"
                className="switch-input"
                checked={settings.notifyStateChange}
                onChange={(e) =>
                  handleUpdateSetting("notifyStateChange", (e.target as HTMLInputElement).checked)
                }
              />
              <label htmlFor="setting-notify-state" className="switch-label" />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">AutoState Alerts</span>
              <span className="settings-description">Notify when AutoState rules trigger changes</span>
            </div>
            <div className="settings-control">
              <input
                type="checkbox"
                id="setting-notify-autostate"
                className="switch-input"
                checked={settings.notifyAutoState}
                onChange={(e) =>
                  handleUpdateSetting("notifyAutoState", (e.target as HTMLInputElement).checked)
                }
              />
              <label htmlFor="setting-notify-autostate" className="switch-label" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. History Tracking Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">History Tracking</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Track Installed Events</span>
            </div>
            <div className="settings-control">
              <input
                type="checkbox"
                id="setting-hist-install"
                className="switch-input"
                checked={settings.historyTrackInstall}
                onChange={(e) =>
                  handleUpdateSetting("historyTrackInstall", (e.target as HTMLInputElement).checked)
                }
              />
              <label htmlFor="setting-hist-install" className="switch-label" />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Track Uninstalled Events</span>
            </div>
            <div className="settings-control">
              <input
                type="checkbox"
                id="setting-hist-uninstall"
                className="switch-input"
                checked={settings.historyTrackUninstall}
                onChange={(e) =>
                  handleUpdateSetting("historyTrackUninstall", (e.target as HTMLInputElement).checked)
                }
              />
              <label htmlFor="setting-hist-uninstall" className="switch-label" />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Track Enable/Disable Events</span>
            </div>
            <div className="settings-control">
              <input
                type="checkbox"
                id="setting-hist-enable"
                className="switch-input"
                checked={settings.historyTrackEnable}
                onChange={(e) =>
                  handleUpdateSetting("historyTrackEnable", (e.target as HTMLInputElement).checked)
                }
              />
              <label htmlFor="setting-hist-enable" className="switch-label" />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Max Records Limit</span>
              <span className="settings-description">Maximum number of history records to preserve</span>
            </div>
            <div className="settings-control">
              <input
                type="number"
                className="settings-number-input"
                min="100"
                max="50000"
                step="100"
                value={settings.historyMaxRecords}
                onChange={(e) =>
                  handleUpdateSetting("historyMaxRecords", parseInt((e.target as HTMLInputElement).value, 10) || 5000)
                }
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Clear Activity History</span>
              <span className="settings-description">Erase all recorded extension management history</span>
            </div>
            <div className="settings-control">
              {!confirmClearHistory ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => setConfirmClearHistory(true)}
                >
                  Clear History...
                </button>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      onClearHistory();
                      setConfirmClearHistory(false);
                    }}
                  >
                    Confirm Erase
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setConfirmClearHistory(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Backup & Data Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Backup & Data</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Export Configuration</span>
              <span className="settings-description">Export groups, AutoState rules, and preferences to JSON</span>
            </div>
            <div className="settings-control">
              <button className="btn btn-secondary" onClick={onExportData}>
                Export JSON
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Export Extension List</span>
              <span className="settings-description">Export a human-readable HTML list of your extensions</span>
            </div>
            <div className="settings-control">
              <button className="btn btn-secondary" onClick={handleExportHtml}>
                Export HTML
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-label">Import Backup</span>
              <span className="settings-description">Restore groups and settings from a JSON file</span>
            </div>
            <div className="settings-control">
              <label className="btn btn-secondary" style={{ cursor: "pointer", margin: 0 }}>
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
