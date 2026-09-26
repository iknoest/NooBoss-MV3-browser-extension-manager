import { useState, useEffect, useCallback } from "preact/hooks";
import type {
  ExtensionInfo,
  ExtensionGroup,
  AutoStateRule,
  HistoryRecord,
  AppSettings,
  PendingAutoStateChange,
  DeveloperProject,
} from "../../shared/types";
import { DEFAULT_SETTINGS } from "../../shared/types";
import { Navigator, type MainLocation } from "./Navigator";
import { Selector } from "./Selector";
import { AutoStateView } from "./AutoStateView";
import { HistoryView } from "./HistoryView";
import { DeveloperView } from "./DeveloperView";
import { OptionsView } from "./OptionsView";
import { AboutView } from "./AboutView";
import { WelcomeView } from "./WelcomeView";
import { WalkthroughOverlay } from "./WalkthroughOverlay";
import { SubWindow } from "./SubWindow";
import { exportHistoryCSV } from "../../shared/history-export";
import { downloadExtensionZip, isValidCwsId } from "../../shared/package-downloader";
import "./nooboss.css";

export interface NooBossAppProps {
  isFullManager?: boolean;
}

export function NooBossApp({ isFullManager = false }: NooBossAppProps) {
  // Default startup landing page is Extensions, or Welcome if #welcome
  const [mainLocation, setMainLocation] = useState<MainLocation>(() => {
    if (typeof window !== "undefined" && (window.location.hash === "#welcome" || window.location.search.includes("page=welcome"))) {
      return "welcome";
    }
    return "extensions";
  });

  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [groups, setGroups] = useState<ExtensionGroup[]>([]);
  const [rules, setRules] = useState<AutoStateRule[]>([]);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [pendingChanges, setPendingChanges] = useState<PendingAutoStateChange[]>([]);
  const [developerProjects, setDeveloperProjects] = useState<DeveloperProject[]>([]);
  const [selfExtension, setSelfExtension] = useState<ExtensionInfo | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [viewMode, setViewMode] = useState<"tile" | "bigTile" | "list">("bigTile");
  const [focusedGroupId, setFocusedGroupId] = useState<string | null>(null);
  const [subWindow, setSubWindow] = useState<{ display: "" | "extension" | "group"; targetId: string }>({
    display: "",
    targetId: "",
  });
  const [reloadingId, setReloadingId] = useState<string | null>(null);
  const [downloadingZipIds, setDownloadingZipIds] = useState<Set<string>>(new Set());
  const [downloadNotice, setDownloadNotice] = useState<{ message: string; isError: boolean } | null>(null);

  // Guided Walkthrough Tour State
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(1);
  const [tourSubStep, setTourSubStep] = useState<"history" | "backup">("history");

  const handleStartTour = () => {
    setIsTourActive(true);
    setTourStep(1);
    setTourSubStep("history");
    setMainLocation("extensions");
    if (typeof window !== "undefined" && window.location.hash === "#welcome") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  const handleTourNext = () => {
    if (tourStep === 1) {
      setTourStep(2);
      setMainLocation("extensions");
    } else if (tourStep === 2) {
      setTourStep(3);
      setMainLocation("autostate");
    } else if (tourStep === 3) {
      setTourStep(4);
      setTourSubStep("history");
      setMainLocation("history");
    } else if (tourStep === 4) {
      setTourStep(5);
      setMainLocation("extensions");
    }
  };

  const handleTourBack = () => {
    if (tourStep === 5) {
      setTourStep(4);
      setTourSubStep("history");
      setMainLocation("history");
    } else if (tourStep === 4) {
      if (tourSubStep === "backup") {
        setTourSubStep("history");
        setMainLocation("history");
      } else {
        setTourStep(3);
        setMainLocation("autostate");
      }
    } else if (tourStep === 3) {
      setTourStep(2);
      setMainLocation("extensions");
    } else if (tourStep === 2) {
      setTourStep(1);
      setMainLocation("extensions");
    }
  };

  const handleTourShowBackup = () => {
    setTourSubStep("backup");
    setMainLocation("options");
  };

  const handleTourFinish = () => {
    setIsTourActive(false);
    setTourStep(1);
    setTourSubStep("history");
    setMainLocation("extensions");
  };

  const handleTourSkip = () => {
    setIsTourActive(false);
    setTourStep(1);
    setTourSubStep("history");
    setMainLocation("extensions");
  };

  const handleFocusGroup = (groupId: string | null) => {
    setFocusedGroupId(groupId);
    if (groupId) {
      setMainLocation("extensions");
    }
  };

  const resolvedAccent = settings.accentColor || "#1a73e8";

  // Auto-redirect if developer mode disabled while on developer page
  useEffect(() => {
    if (dataLoaded && !settings.developerMode && mainLocation === "developer") {
      setMainLocation("extensions");
    }
  }, [dataLoaded, settings.developerMode, mainLocation]);

  // Handle #welcome in URL hash
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleHashChange = () => {
      if (window.location.hash === "#welcome") {
        setMainLocation("welcome");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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

      const [exts, grps, rls, hist, setts, pending, projs] = await Promise.all([
        chrome.runtime.sendMessage({ type: "GET_EXTENSIONS" }),
        chrome.runtime.sendMessage({ type: "GET_GROUPS" }),
        chrome.runtime.sendMessage({ type: "GET_AUTOSTATE_RULES" }),
        chrome.runtime.sendMessage({ type: "GET_HISTORY" }),
        chrome.runtime.sendMessage({ type: "GET_SETTINGS" }),
        chrome.runtime.sendMessage({ type: "GET_PENDING_CHANGES" }),
        chrome.runtime.sendMessage({ type: "GET_DEVELOPER_PROJECTS" }),
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
      const resolvedProjects = Array.isArray(projs) ? projs : projs?.projects || [];

      setExtensions(resolvedExts);
      setGroups(resolvedGrps);
      setRules(resolvedRules);
      setHistoryRecords(resolvedHist);
      setSettings(resolvedSetts);
      setPendingChanges(resolvedPending);
      setDeveloperProjects(resolvedProjects);

      try {
        let selfInfo: ExtensionInfo | null = null;
        if (typeof chrome !== "undefined" && chrome.management?.getSelf) {
          selfInfo = (await chrome.management.getSelf()) as ExtensionInfo;
        } else if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
          selfInfo = (await chrome.runtime.sendMessage({ type: "GET_SELF" })) as ExtensionInfo;
        }
        if (selfInfo) {
          setSelfExtension(selfInfo);
        }
      } catch {
        // Ignore in test environments
      }

      setDataLoaded(true);

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
    // Check URL parameters for direct subpage linking (e.g. ?page=options or ?page=autostate)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get("page");
      if (pageParam === "overview") {
        // Overview redirects to extensions
        setMainLocation("extensions");
      } else if (pageParam === "autoState" || pageParam === "autostate") {
        setMainLocation("autostate");
      } else if (pageParam === "developer") {
        setMainLocation("developer");
      } else if (pageParam && ["extensions", "history", "developer", "options", "about"].includes(pageParam)) {
        setMainLocation(pageParam as MainLocation);
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
    if ((selfExtension && id === selfExtension.id) || (typeof chrome !== "undefined" && chrome.runtime?.id && id === chrome.runtime.id)) {
      console.warn("[NooBoss] Cannot toggle running extension self build");
      return;
    }
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

  const handleReloadExtension = async (id: string) => {
    const isSelf = (selfExtension && id === selfExtension.id) || (typeof chrome !== "undefined" && chrome.runtime?.id && id === chrome.runtime.id);
    if (isSelf) {
      if (typeof chrome !== "undefined" && chrome.runtime?.reload) {
        chrome.runtime.reload();
        return;
      }
      return;
    }
    const ext = extensions.find((e) => e.id === id);
    if (!ext || !ext.enabled || ext.installType !== "development") {
      return;
    }
    setReloadingId(id);
    try {
      if (typeof chrome !== "undefined" && chrome.management?.setEnabled) {
        await chrome.management.setEnabled(id, false);
        try {
          await chrome.management.setEnabled(id, true);
        } catch (enableErr) {
          console.error(`[NooBoss] Re-enable failed for ${id}, attempting recovery:`, enableErr);
          try {
            await chrome.management.setEnabled(id, true);
          } catch (recErr) {
            console.error(`[NooBoss] Recovery enable attempt failed for ${id}:`, recErr);
          }
        }
      } else if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        await chrome.runtime.sendMessage({ type: "RELOAD_EXTENSION", id });
      }
    } catch (err) {
      console.error("[NooBoss] Reload extension failed:", err);
    } finally {
      setReloadingId(null);
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

  // Group actions: one-shot command directly dispatched to eligible members
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
          console.warn(`[NooBoss] Group command: ${eligibleIds.length - failed.length} changed, ${failed.length} failed`);
        }
      } else if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        await chrome.runtime.sendMessage({ type: "TOGGLE_GROUP", id, enabled });
      }
    } catch (err) {
      console.error("[NooBoss] Group command error:", err);
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

  const handleCopyGroup = async (id: string) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;
    const newGroup: ExtensionGroup = {
      ...group,
      id: "group_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      name: group.name + " (Copy)",
      createdAt: Date.now(),
    };
    await chrome.runtime?.sendMessage?.({ type: "CREATE_GROUP", name: newGroup.name, group: newGroup });
    await loadData();
  };

  const handleDeleteGroup = async (id: string) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;
    if (window.confirm(`Are you sure you want to delete group "${group.name}"?`)) {
      setGroups((prev) => prev.filter((g) => g.id !== id));
      await chrome.runtime?.sendMessage?.({ type: "DELETE_GROUP", id });
      await loadData();
    }
  };

  // AutoState actions
  const handleSaveRules = async (newRules: AutoStateRule[]) => {
    setRules(newRules);
    await chrome.runtime?.sendMessage?.({ type: "SAVE_AUTOSTATE_RULES", rules: newRules });
    await loadData();
  };

  const handleApplyPending = async (changeId: string) => {
    await chrome.runtime?.sendMessage?.({ type: "APPLY_PENDING_CHANGE", changeId });
    await loadData();
  };

  const handleDismissPending = async (changeId: string) => {
    await chrome.runtime?.sendMessage?.({ type: "DISMISS_PENDING_CHANGE", changeId });
    await loadData();
  };

  // Developer Projects
  const handleSaveDeveloperProject = async (project: DeveloperProject) => {
    setDeveloperProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = project;
        return next;
      }
      return [...prev, project];
    });
    await chrome.runtime?.sendMessage?.({ type: "SAVE_DEVELOPER_PROJECT", project });
    await loadData();
  };

  const handleDeleteDeveloperProject = async (id: string) => {
    setDeveloperProjects((prev) => prev.filter((p) => p.id !== id));
    await chrome.runtime?.sendMessage?.({ type: "DELETE_DEVELOPER_PROJECT", id });
    await loadData();
  };

  // Options & Settings
  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (!updated.developerMode && mainLocation === "developer") {
      setMainLocation("extensions");
    }
    await chrome.runtime?.sendMessage?.({ type: "SAVE_SETTINGS", settings: updated });
    await loadData();
  };

  const handleClearHistory = async () => {
    setHistoryRecords([]);
    await chrome.runtime?.sendMessage?.({ type: "CLEAR_HISTORY" });
    await loadData();
  };

  const handleExportData = async () => {
    try {
      const res = await chrome.runtime?.sendMessage?.({ type: "EXPORT_DATA" });
      const exportObj =
        res && typeof res === "object" && !("error" in res)
          ? ("data" in res && res.data && typeof res.data === "object" ? res.data : res)
          : null;

      if (exportObj && typeof exportObj === "object" && "version" in exportObj) {
        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `extension-drawer-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        console.error("[Extension Drawer] Export failed or returned invalid data:", res);
      }
    } catch (err) {
      console.error("[Extension Drawer] Export error:", err);
    }
  };

  const handleImportData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await chrome.runtime?.sendMessage?.({ type: "IMPORT_DATA", data });
      if (res?.success) {
        alert("Configuration imported successfully!");
        await loadData();
      } else {
        alert("Import failed: " + (res?.error || "Invalid format"));
      }
    } catch {
      alert("Failed to parse JSON file.");
    }
  };

  // View Mode Change
  const handleChangeViewMode = async (mode: "tile" | "bigTile" | "list") => {
    setViewMode(mode);
    const updated = { ...settings, viewMode: mode };
    setSettings(updated);
    await chrome.runtime?.sendMessage?.({ type: "SAVE_SETTINGS", settings: updated });
  };

  const handleOpenSubWindow = (type: "extension" | "group", id: string) => {
    setSubWindow({ display: type, targetId: id });
  };

  const handleCloseSubWindow = () => {
    setSubWindow({ display: "", targetId: "" });
  };

  const handleDownloadZip = useCallback(async (ext: ExtensionInfo) => {
    if (!ext.id || !isValidCwsId(ext.id)) return;
    setDownloadingZipIds((prev) => new Set(prev).add(ext.id));
    setDownloadNotice(null);
    try {
      const result = await downloadExtensionZip({
        extensionId: ext.id,
        name: ext.name,
        version: ext.version,
      });
      if (result.success) {
        setDownloadNotice({
          message: `Downloaded ${result.filename || "extension.zip"}`,
          isError: false,
        });
        setTimeout(() => setDownloadNotice(null), 4000);
      } else {
        setDownloadNotice({
          message: result.error || "Download failed.",
          isError: true,
        });
        setTimeout(() => setDownloadNotice(null), 5000);
      }
    } catch (err: any) {
      setDownloadNotice({
        message: err?.message || "Download failed.",
        isError: true,
      });
      setTimeout(() => setDownloadNotice(null), 5000);
    } finally {
      setDownloadingZipIds((prev) => {
        const next = new Set(prev);
        next.delete(ext.id);
        return next;
      });
    }
  }, []);

  return (
    <div
      className={`nooboss-app ${isFullManager ? "full-manager" : "popup-mode"}`}
      style={{ minHeight: "100%", width: "100%" }}
    >
      {/* Top Navigator */}
      <Navigator
        mainLocation={mainLocation}
        onNavigateMain={setMainLocation}
        themeMainColor={resolvedAccent}
        developerMode={settings.developerMode ?? false}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Extensions View */}
        {mainLocation === "extensions" && (
          <div className="nb-page">
            <Selector
              extensions={extensions}
              groups={groups}
              history={historyRecords}
              viewMode={viewMode}
              onChangeViewMode={handleChangeViewMode}
              actionBar={true}
              withControl={true}
              onToggleExtension={handleToggleExtension}
              onReloadExtension={handleReloadExtension}
              reloadingId={reloadingId}
              onOpenOptions={handleOpenOptions}
              onOpenDetails={handleOpenDetails}
              onUninstallExtension={handleUninstall}
              onToggleGroup={handleToggleGroup}
              onCopyGroup={handleCopyGroup}
              onDeleteGroup={handleDeleteGroup}
              onCreateGroup={handleCreateGroup}
              onOpenSubWindow={handleOpenSubWindow}
              focusedGroupId={focusedGroupId}
              onFocusGroup={handleFocusGroup}
              themeMainColor={resolvedAccent}
              developerMode={settings.developerMode ?? false}
              onDownloadZip={handleDownloadZip}
              downloadingZipIds={downloadingZipIds}
            />
          </div>
        )}

        {/* AutoState View */}
        {mainLocation === "autostate" && (
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
            extensions={extensions}
            onClearHistory={handleClearHistory}
            onOpenSubWindow={handleOpenSubWindow}
            themeMainColor={resolvedAccent}
          />
        )}

        {/* Developer View */}
        {mainLocation === "developer" && settings.developerMode && (
          <DeveloperView
            projects={developerProjects}
            extensions={extensions}
            selfExtension={selfExtension}
            onSaveProject={handleSaveDeveloperProject}
            onDeleteProject={handleDeleteDeveloperProject}
            onToggleExtension={handleToggleExtension}
            onReloadExtension={handleReloadExtension}
            reloadingIds={reloadingId ? new Set([reloadingId]) : new Set()}
            onOpenDetails={handleOpenDetails}
            themeMainColor={resolvedAccent}
          />
        )}

        {/* Options View */}
        {mainLocation === "options" && (
          <OptionsView
            settings={settings}
            extensions={extensions}
            historyRecords={historyRecords}
            onSaveSettings={handleSaveSettings}
            onClearHistory={handleClearHistory}
            onExportData={handleExportData}
            onExportHistory={() => exportHistoryCSV(historyRecords)}
            onImportData={handleImportData}
            themeMainColor={resolvedAccent}
          />
        )}

        {/* About View */}
        {mainLocation === "about" && (
          <AboutView
            themeMainColor={resolvedAccent}
            onOpenWelcome={() => setMainLocation("welcome")}
          />
        )}

        {/* Welcome View */}
        {mainLocation === "welcome" && (
          <WelcomeView
            onStartTour={handleStartTour}
            onSkipAndOpen={() => {
              setMainLocation("extensions");
              if (typeof window !== "undefined" && window.location.hash === "#welcome") {
                history.replaceState(null, "", window.location.pathname + window.location.search);
              }
            }}
            onOpenExtensions={() => {
              setMainLocation("extensions");
              if (typeof window !== "undefined" && window.location.hash === "#welcome") {
                history.replaceState(null, "", window.location.pathname + window.location.search);
              }
            }}
            themeMainColor={resolvedAccent}
          />
        )}
      </div>

      {/* Guided Walkthrough Overlay */}
      {isTourActive && (
        <WalkthroughOverlay
          currentStep={tourStep}
          subStep={tourSubStep}
          onNext={handleTourNext}
          onBack={handleTourBack}
          onSkip={handleTourSkip}
          onFinish={handleTourFinish}
          onShowBackup={handleTourShowBackup}
          themeMainColor={resolvedAccent}
        />
      )}

      {/* Modal SubWindow */}
      <SubWindow
        display={subWindow.display}
        targetId={subWindow.targetId}
        extensions={extensions}
        groups={groups}
        history={historyRecords}
        onClose={handleCloseSubWindow}
        onToggleExtension={handleToggleExtension}
        onToggleGroup={handleToggleGroup}
        onOpenOptions={handleOpenOptions}
        onOpenDetails={handleOpenDetails}
        onUninstallExtension={handleUninstall}
        onUpdateGroup={handleUpdateGroup}
        onFocusGroup={handleFocusGroup}
        themeMainColor={resolvedAccent}
        developerMode={settings.developerMode ?? false}
        onReloadExtension={handleReloadExtension}
        onDownloadZip={handleDownloadZip}
        downloadingZipIds={downloadingZipIds}
      />

      {/* Non-blocking Download Notice Toast */}
      {downloadNotice && (
        <div className={`nb-toast ${downloadNotice.isError ? "toast-error" : "toast-success"}`}>
          <span>{downloadNotice.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setDownloadNotice(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
