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
  // Default startup landing page is Extensions / Manage (not Overview)
  const [mainLocation, setMainLocation] = useState<MainLocation>("extensions");
  const [subLocation, setSubLocation] = useState<SubLocation>("manage");

  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [groups, setGroups] = useState<ExtensionGroup[]>([]);
  const [rules, setRules] = useState<AutoStateRule[]>([]);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [pendingChanges, setPendingChanges] = useState<PendingAutoStateChange[]>([]);

  const [viewMode, setViewMode] = useState<"tile" | "bigTile" | "list">("bigTile");
  const [subWindow, setSubWindow] = useState<{ display: "" | "extension" | "group"; targetId: string }>({
    display: "",
    targetId: "",
  });

  const resolvedAccent = settings.accentColor || "#1a73e8";

  // Dynamic Appearance (System / Light / Dark) and Accent Color
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--theme-main", resolvedAccent);

    const updateTheme = () => {
      if (settings.theme === "dark") {
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
      } else if (settings.theme === "light") {
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
      } else {
        // System
        root.style.colorScheme = "light dark";
        const prefersDark =
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.setAttribute("data-theme", prefersDark ? "dark" : "light");
      }
    };

    updateTheme();

    if (settings.theme === "system" && typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => updateTheme();
      mediaQuery.addEventListener?.("change", handler);
      return () => mediaQuery.removeEventListener?.("change", handler);
    }
  }, [settings.theme, resolvedAccent]);

  // Load all initial data from service worker
  const loadData = useCallback(async () => {
    try {
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
        return;
      }

      const [exts, grps, rls, hist, setts, pending] = await Promise.all([
        chrome.runtime.sendMessage({ type: "GET_EXTENSIONS" }),
        chrome.runtime.sendMessage({ type: "GET_GROUPS" }),
        chrome.runtime.sendMessage({ type: "GET_AUTOSTATE_RULES" }),
        chrome.runtime.sendMessage({ type: "GET_HISTORY" }),
        chrome.runtime.sendMessage({ type: "GET_SETTINGS" }),
        chrome.runtime.sendMessage({ type: "GET_PENDING_CHANGES" }),
      ]);

      const resolvedExts = Array.isArray(exts) ? exts : exts?.extensions || [];
      const resolvedGrps = Array.isArray(grps) ? grps : grps?.groups || [];
      const resolvedRules = Array.isArray(rls) ? rls : rls?.rules || [];
      const resolvedHist = Array.isArray(hist) ? hist : hist?.records || [];
      const resolvedSetts =
        setts && typeof setts === "object" && !Array.isArray(setts)
          ? (setts.settings || setts)
          : DEFAULT_SETTINGS;
      const resolvedPending = Array.isArray(pending) ? pending : pending?.changes || [];

      setExtensions(resolvedExts);
      setGroups(resolvedGrps);
      setRules(resolvedRules);
      setHistoryRecords(resolvedHist);
      setSettings(resolvedSetts);
      setPendingChanges(resolvedPending);

      if (resolvedSetts.viewMode === "grid" || resolvedSetts.viewMode === "bigTile") {
        setViewMode("bigTile");
      } else if (resolvedSetts.viewMode === "tile") {
        setViewMode("tile");
      } else if (resolvedSetts.viewMode === "list") {
        setViewMode("list");
      }
    } catch (e) {
      console.warn("[NooBoss] Failed to load data:", e);
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

  // Extension actions: direct management call preserves user-gesture context in popup
  const handleToggleExtension = async (id: string, enabled: boolean) => {
    setExtensions((prev) =>
      prev.map((ext) => (ext.id === id ? { ...ext, enabled } : ext))
    );
    try {
      if (typeof chrome !== "undefined" && chrome.management?.setEnabled) {
        await chrome.management.setEnabled(id, enabled);
      } else if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        await chrome.runtime.sendMessage({ type: "TOGGLE_EXTENSION", id, enabled });
      }
    } catch (err) {
      console.error("[NooBoss] Direct setEnabled failed:", err);
    } finally {
      await loadData();
    }
  };

  const handleOpenOptions = async (id: string) => {
    await chrome.runtime?.sendMessage?.({ type: "OPEN_OPTIONS", id });
  };

  const handleOpenDetails = async (id: string) => {
    await chrome.runtime?.sendMessage?.({ type: "OPEN_CHROME_DETAILS", id });
  };

  const handleUninstall = async (id: string) => {
    try {
      if (typeof chrome !== "undefined" && chrome.management?.uninstall) {
        await chrome.management.uninstall(id, { showConfirmDialog: true });
      } else {
        await chrome.runtime?.sendMessage?.({ type: "UNINSTALL_EXTENSION", id });
      }
    } catch (err) {
      console.warn("[NooBoss] Uninstall cancelled or failed:", err);
    } finally {
      await loadData();
    }
  };

  // Group actions: synchronously dispatch all member operations in click gesture
  const handleToggleGroup = async (id: string, enabled: boolean) => {
    const group = groups.find((g) => g.id === id);
    if (!group || group.extensionIds.length === 0) return;

    try {
      if (typeof chrome !== "undefined" && chrome.management?.setEnabled) {
        const selfId = chrome.runtime?.id;
        const eligibleIds = group.extensionIds.filter((extId) => extId !== selfId);
        const operations = eligibleIds.map(async (extId) => {
          try {
            await chrome.management.setEnabled(extId, enabled);
            return { id: extId, success: true };
          } catch (err) {
            return { id: extId, success: false, error: err instanceof Error ? err.message : String(err) };
          }
        });
        const results = await Promise.all(operations);
        const failed = results.filter((r) => !r.success);
        if (failed.length > 0) {
          console.warn(`[NooBoss] Group toggle: ${eligibleIds.length - failed.length} changed, ${failed.length} failed`);
        }
      } else if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        await chrome.runtime.sendMessage({ type: "TOGGLE_GROUP", id, enabled });
      }
    } catch (err) {
      console.error("[NooBoss] Group toggle error:", err);
    } finally {
      await loadData();
    }
  };

  const handleCreateGroup = async () => {
    const name = window.prompt("Enter new group name:", "New Group");
    if (!name) return;
    const res = await chrome.runtime?.sendMessage?.({ type: "CREATE_GROUP", name });
    await loadData();
    if (res?.group) {
      setSubWindow({ display: "group", targetId: res.group.id });
    }
  };

  const handleUpdateGroup = async (group: ExtensionGroup) => {
    setGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)));
    await chrome.runtime?.sendMessage?.({ type: "UPDATE_GROUP", group });
    await loadData();
  };

  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    setGroups((prev) => prev.filter((g) => g.id !== id));
    await chrome.runtime?.sendMessage?.({ type: "DELETE_GROUP", id });
    await loadData();
  };

  const handleCopyGroup = async (id: string) => {
    const original = groups.find((g) => g.id === id);
    if (!original) return;
    const newName = original.name + " (Copy)";
    const res = await chrome.runtime?.sendMessage?.({ type: "CREATE_GROUP", name: newName });
    if (res?.group && original.extensionIds.length > 0) {
      await chrome.runtime?.sendMessage?.({
        type: "UPDATE_GROUP",
        group: {
          ...res.group,
          extensionIds: [...original.extensionIds],
          color: original.color,
          icon: original.icon,
        },
      });
    }
    await loadData();
  };

  // AutoState rules
  const handleSaveRules = async (newRules: AutoStateRule[]) => {
    setRules(newRules);
    await chrome.runtime?.sendMessage?.({ type: "SAVE_AUTOSTATE_RULES", rules: newRules });
    await loadData();
  };

  const handleApplyPending = async (extensionId: string, enabled: boolean) => {
    await chrome.runtime?.sendMessage?.({ type: "APPLY_PENDING_CHANGE", extensionId, enabled });
    await loadData();
  };

  const handleDismissPending = async (extensionId: string) => {
    await chrome.runtime?.sendMessage?.({ type: "DISMISS_PENDING_CHANGE", extensionId });
    await loadData();
  };

  // History actions
  const handleClearHistory = async () => {
    setHistoryRecords([]);
    await chrome.runtime?.sendMessage?.({ type: "CLEAR_HISTORY" });
    await loadData();
  };

  // Settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await chrome.runtime?.sendMessage?.({ type: "SAVE_SETTINGS", settings: newSettings });
    await loadData();
  };

  // Export / Import
  const handleExportData = async () => {
    const res = await chrome.runtime?.sendMessage?.({ type: "EXPORT_DATA" });
    const exportObj = res?.data || res;
    if (exportObj && (exportObj.version || exportObj.groups)) {
      const json = JSON.stringify(exportObj, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NooBoss_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const res = await chrome.runtime?.sendMessage?.({ type: "IMPORT_DATA", data });
        if (res?.success) {
          alert("Settings and groups imported successfully!");
          await loadData();
        } else {
          alert("Failed to import: " + (res?.error || "Invalid file format"));
        }
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleChangeViewMode = (mode: "tile" | "bigTile" | "list") => {
    setViewMode(mode);
    const updatedSettings: AppSettings = {
      ...settings,
      viewMode: mode,
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
    <div
      className={`nooboss-app ${isFullManager ? "full-manager" : "popup-mode"}`}
      style={{ minHeight: "100%", width: "100%" }}
    >
      {/* Top Navigator */}
      <Navigator
        mainLocation={mainLocation}
        subLocation={subLocation}
        onNavigateMain={setMainLocation}
        onNavigateSub={setSubLocation}
        themeMainColor={resolvedAccent}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Overview View */}
        {mainLocation === "overview" && (
          <OverviewView
            extensions={extensions}
            groups={groups}
            rules={rules}
            themeMainColor={resolvedAccent}
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
              themeMainColor={resolvedAccent}
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
            themeMainColor={resolvedAccent}
          />
        )}

        {/* History View */}
        {mainLocation === "history" && (
          <HistoryView
            records={historyRecords}
            onClearHistory={handleClearHistory}
            onOpenSubWindow={handleOpenSubWindow}
            themeMainColor={resolvedAccent}
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
            themeMainColor={resolvedAccent}
          />
        )}

        {/* About View */}
        {mainLocation === "about" && <AboutView themeMainColor={resolvedAccent} />}
      </div>

      {/* Modal SubWindow */}
      <SubWindow
        display={subWindow.display}
        targetId={subWindow.targetId}
        extensions={extensions}
        groups={groups}
        onClose={handleCloseSubWindow}
        onToggleExtension={handleToggleExtension}
        onToggleGroup={handleToggleGroup}
        onOpenOptions={handleOpenOptions}
        onOpenDetails={handleOpenDetails}
        onUninstallExtension={handleUninstall}
        onUpdateGroup={handleUpdateGroup}
        themeMainColor={resolvedAccent}
      />
    </div>
  );
}
