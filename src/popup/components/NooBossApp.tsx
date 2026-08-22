import { useState, useEffect, useCallback } from "preact/hooks";
import type {
  ExtensionInfo,
  ExtensionGroup,
  AutoStateRule,
  HistoryRecord,
  AppSettings,
  PendingAutoStateChange,
} from "../../shared/types";
import { DEFAULT_SETTINGS } from "../../shared/types";
import { Navigator, type MainLocation, type SubLocation } from "./Navigator";
import { Selector } from "./Selector";
import { AutoStateView } from "./AutoStateView";
import { HistoryView } from "./HistoryView";
import { OptionsView } from "./OptionsView";
import { AboutView } from "./AboutView";
import { OverviewView } from "./OverviewView";
import { SubWindow } from "./SubWindow";
import "./nooboss.css";

export interface NooBossAppProps {
  isFullManager?: boolean;
}

export function NooBossApp({ isFullManager = false }: NooBossAppProps) {
  const [mainLocation, setMainLocation] = useState<MainLocation>("overview");
  const [subLocation, setSubLocation] = useState<SubLocation>("manage");

  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [groups, setGroups] = useState<ExtensionGroup[]>([]);
  const [rules, setRules] = useState<AutoStateRule[]>([]);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [pendingChanges, setPendingChanges] = useState<PendingAutoStateChange[]>([]);

  const [viewMode, setViewMode] = useState<"tile" | "bigTile" | "list">("tile");
  const [subWindow, setSubWindow] = useState<{ display: "" | "extension" | "group"; targetId: string }>({
    display: "",
    targetId: "",
  });


  // Load all initial data from service worker
  const loadData = useCallback(async () => {
    try {
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
        return;
      }

      // Query extensions
      chrome.runtime.sendMessage({ type: "GET_EXTENSIONS" }, (response) => {
        if (response?.extensions) setExtensions(response.extensions);
      });

      // Query groups
      chrome.runtime.sendMessage({ type: "GET_GROUPS" }, (response) => {
        if (response?.groups) setGroups(response.groups);
      });

      // Query rules
      chrome.runtime.sendMessage({ type: "GET_AUTOSTATE_RULES" }, (response) => {
        if (response?.rules) setRules(response.rules);
      });

      // Query history
      chrome.runtime.sendMessage({ type: "GET_HISTORY" }, (response) => {
        if (response?.records) setHistoryRecords(response.records);
      });

      // Query settings
      chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
        if (response?.settings) {
          setSettings(response.settings);
          if (response.settings.viewMode === "grid") {
            setViewMode("tile");
          } else if (response.settings.viewMode === "list") {
            setViewMode("list");
          }
        }
      });

      // Query pending changes
      chrome.runtime.sendMessage({ type: "GET_PENDING_CHANGES" }, (response) => {
        if (response?.changes) setPendingChanges(response.changes);
      });
    } catch (e) {
      console.warn("Failed to load initial NooBoss data:", e);
    }
  }, []);

  useEffect(() => {
    // Check URL parameters for direct subpage linking (e.g. ?page=options or ?page=extensions)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get("page") as MainLocation | null;
      if (pageParam && ["overview", "extensions", "history", "options", "about"].includes(pageParam)) {
        setMainLocation(pageParam);
      }
      const subParam = params.get("sub") as SubLocation | null;
      if (subParam && ["manage", "autoState"].includes(subParam)) {
        setSubLocation(subParam);
      }
    }

    loadData();

    // Listen for state change broadcasts from service worker
    const messageListener = (msg: { type: string }) => {
      if (msg && msg.type === "STATE_CHANGED") {
        loadData();
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(messageListener);
      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };
    }
  }, [loadData]);

  // Extension actions
  const handleToggleExtension = (id: string, enabled: boolean) => {
    // Optimistic update
    setExtensions((prev) =>
      prev.map((ext) => (ext.id === id ? { ...ext, enabled } : ext))
    );
    chrome.runtime?.sendMessage?.({ type: "TOGGLE_EXTENSION", id, enabled });
  };

  const handleOpenOptions = (id: string) => {
    chrome.runtime?.sendMessage?.({ type: "OPEN_OPTIONS", id });
  };

  const handleOpenDetails = (id: string) => {
    chrome.runtime?.sendMessage?.({ type: "OPEN_CHROME_DETAILS", id });
  };

  const handleUninstall = (id: string) => {
    chrome.runtime?.sendMessage?.({ type: "UNINSTALL_EXTENSION", id }, () => {
      loadData();
    });
  };

  // Group actions
  const handleToggleGroup = (id: string, enabled: boolean) => {
    chrome.runtime?.sendMessage?.({ type: "TOGGLE_GROUP", id, enabled }, () => {
      loadData();
    });
  };

  const handleCreateGroup = () => {
    const name = window.prompt("Enter new group name:", "New Group");
    if (!name) return;
    chrome.runtime?.sendMessage?.({ type: "CREATE_GROUP", name }, () => {
      loadData();
    });
  };

  const handleUpdateGroup = (group: ExtensionGroup) => {
    setGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)));
    chrome.runtime?.sendMessage?.({ type: "UPDATE_GROUP", group }, () => {
      loadData();
    });
  };

  const handleDeleteGroup = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    setGroups((prev) => prev.filter((g) => g.id !== id));
    chrome.runtime?.sendMessage?.({ type: "DELETE_GROUP", id }, () => {
      loadData();
    });
  };

  const handleCopyGroup = (id: string) => {
    const original = groups.find((g) => g.id === id);
    if (!original) return;
    const newName = original.name + " (Copy)";
    chrome.runtime?.sendMessage?.({ type: "CREATE_GROUP", name: newName }, (res) => {
      if (res && original.extensionIds.length > 0) {
        // Will reload
      }
      loadData();
    });
  };

  // AutoState rules
  const handleSaveRules = (newRules: AutoStateRule[]) => {
    setRules(newRules);
    chrome.runtime?.sendMessage?.({ type: "SAVE_AUTOSTATE_RULES", rules: newRules });
  };

  const handleApplyPending = (extensionId: string, enabled: boolean) => {
    chrome.runtime?.sendMessage?.({ type: "APPLY_PENDING_CHANGE", extensionId, enabled }, () => {
      loadData();
    });
  };

  const handleDismissPending = (extensionId: string) => {
    chrome.runtime?.sendMessage?.({ type: "DISMISS_PENDING_CHANGE", extensionId }, () => {
      loadData();
    });
  };

  // History actions
  const handleClearHistory = () => {
    setHistoryRecords([]);
    chrome.runtime?.sendMessage?.({ type: "CLEAR_HISTORY" });
  };

  // Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    chrome.runtime?.sendMessage?.({ type: "SAVE_SETTINGS", settings: newSettings });
  };

  // Export / Import
  const handleExportData = () => {
    chrome.runtime?.sendMessage?.({ type: "EXPORT_DATA" }, (res) => {
      if (res?.data) {
        const json = JSON.stringify(res.data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `NooBoss_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        chrome.runtime?.sendMessage?.({ type: "IMPORT_DATA", data }, (res) => {
          if (res?.success) {
            alert("Settings and groups imported successfully!");
            loadData();
          } else {
            alert("Failed to import: " + (res?.error || "Invalid file format"));
          }
        });
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleChangeViewMode = (mode: "tile" | "bigTile" | "list") => {
    setViewMode(mode);
    const updatedSettings = {
      ...settings,
      viewMode: mode === "list" ? ("list" as const) : ("grid" as const),
    };
    handleSaveSettings(updatedSettings);
  };

  const handleOpenSubWindow = (display: "extension" | "group", targetId: string) => {
    setSubWindow({ display, targetId });
  };

  const handleCloseSubWindow = () => {
    setSubWindow({ display: "", targetId: "" });
  };

  return (
    <div className={`nooboss-root ${isFullManager ? "full-manager" : ""}`}>
      {/* Top Navigator */}
      <Navigator
        mainLocation={mainLocation}
        subLocation={subLocation}
        onNavigateMain={(loc) => setMainLocation(loc)}
        onNavigateSub={(sub) => {
          setMainLocation("extensions");
          setSubLocation(sub);
        }}
      />

      <div className="nooboss-content-wrapper">
        {/* Overview View */}
        {mainLocation === "overview" && (
          <OverviewView
            extensions={extensions}
            groups={groups}
            rules={rules}
          />
        )}

        {/* Extensions -> Manage View */}
        {mainLocation === "extensions" && subLocation === "manage" && (
          <div className="nb-page">
            <Selector
              extensions={extensions}
              groups={groups}
              viewMode={viewMode}
              onChangeViewMode={handleChangeViewMode}
              actionBar={true}
              withControl={true}
              onToggleExtension={handleToggleExtension}
              onOpenOptions={handleOpenOptions}
              onOpenDetails={handleOpenDetails}
              onUninstallExtension={handleUninstall}
              onToggleGroup={handleToggleGroup}
              onCopyGroup={handleCopyGroup}
              onDeleteGroup={handleDeleteGroup}
              onCreateGroup={handleCreateGroup}
              onOpenSubWindow={handleOpenSubWindow}
            />
          </div>
        )}

        {/* Extensions -> AutoState View */}
        {mainLocation === "extensions" && subLocation === "autoState" && (
          <AutoStateView
            extensions={extensions}
            groups={groups}
            rules={rules}
            settings={settings}
            pendingChanges={pendingChanges}
            viewMode={viewMode}
            onChangeViewMode={handleChangeViewMode}
            onSaveRules={handleSaveRules}
            onApplyPending={handleApplyPending}
            onDismissPending={handleDismissPending}
          />
        )}

        {/* History View */}
        {mainLocation === "history" && (
          <HistoryView
            records={historyRecords}
            onClearHistory={handleClearHistory}
            onOpenSubWindow={handleOpenSubWindow}
          />
        )}

        {/* Options View */}
        {mainLocation === "options" && (
          <OptionsView
            settings={settings}
            extensions={extensions}
            onSaveSettings={handleSaveSettings}
            onClearHistory={handleClearHistory}
            onExportData={handleExportData}
            onImportData={handleImportData}
          />
        )}

        {/* About View */}
        {mainLocation === "about" && <AboutView />}
      </div>

      {/* Modal SubWindow */}
      <SubWindow
        display={subWindow.display}
        targetId={subWindow.targetId}
        extensions={extensions}
        groups={groups}
        onClose={handleCloseSubWindow}
        onToggleExtension={handleToggleExtension}
        onOpenOptions={handleOpenOptions}
        onOpenDetails={handleOpenDetails}
        onUninstallExtension={handleUninstall}
        onUpdateGroup={handleUpdateGroup}
      />
    </div>
  );
}
