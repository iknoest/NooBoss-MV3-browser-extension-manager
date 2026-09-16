import { useState, useEffect } from "preact/hooks";
import type { DeveloperProject, ExtensionInfo } from "../../shared/types";
import { generateId } from "../../shared/types";
import { MaterialSymbol } from "./MaterialSymbols";
import { ExtensionSwitch } from "./ExtensionBrief";
import {
  fetchGA4Report,
  cleanPropertyId,
  type GA4ReportResult,
} from "../../shared/ga4-client";
import {
  getGA4MetricsMap,
  saveProjectGA4Metrics,
  clearProjectGA4Metrics,
  type StoredGA4MetricsRecord,
} from "../../shared/storage";

export interface DeveloperViewProps {
  projects: DeveloperProject[];
  extensions: ExtensionInfo[];
  selfExtension?: ExtensionInfo | null;
  onSaveProject: (project: DeveloperProject) => void;
  onDeleteProject: (id: string) => void;
  onToggleExtension: (id: string, enabled: boolean) => void;
  onReloadExtension: (id: string) => void;
  reloadingIds?: Set<string>;
  onOpenDetails: (id: string) => void;
  themeMainColor?: string;
}

export function getAllDevExtensions(
  extensions: ExtensionInfo[],
  selfExtension?: ExtensionInfo | null
): ExtensionInfo[] {
  const dev = extensions.filter((e) => e.installType === "development");
  if (
    selfExtension &&
    selfExtension.installType === "development" &&
    !dev.some((e) => e.id === selfExtension.id)
  ) {
    dev.push(selfExtension);
  }
  return dev;
}

export function getUnlinkedDevExtensions(
  extensions: ExtensionInfo[],
  projects: DeveloperProject[],
  selfExtension?: ExtensionInfo | null
): ExtensionInfo[] {
  const linkedLocalIds = new Set(
    projects.map((p) => p.localExtensionId).filter(Boolean) as string[]
  );
  const allDev = getAllDevExtensions(extensions, selfExtension);
  return allDev.filter((e) => !linkedLocalIds.has(e.id));
}

export function DeveloperView({
  projects,
  extensions,
  selfExtension,
  onSaveProject,
  onDeleteProject,
  onToggleExtension,
  onReloadExtension,
  reloadingIds = new Set(),
  onOpenDetails,
  themeMainColor = "#1a73e8",
}: DeveloperViewProps) {
  const [editingProject, setEditingProject] = useState<Partial<DeveloperProject> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // GA4 Live Tracking state
  const [metricsMap, setMetricsMap] = useState<Record<string, StoredGA4MetricsRecord>>({});
  const [connectingProjectIds, setConnectingProjectIds] = useState<Set<string>>(new Set());
  const [projectErrors, setProjectErrors] = useState<Record<string, string>>({});
  const [connectModalProject, setConnectModalProject] = useState<DeveloperProject | null>(null);
  const [isConnectingModal, setIsConnectingModal] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Load stored GA4 metrics on mount / project update
  useEffect(() => {
    let isMounted = true;
    getGA4MetricsMap()
      .then((map) => {
        if (isMounted && map) {
          setMetricsMap(map);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [projects]);

  // Escape key handler for delete confirmation modal
  useEffect(() => {
    if (!deleteConfirmId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDeleteConfirmId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteConfirmId]);

  const handleOpenConnectModal = (project: DeveloperProject) => {
    setConnectModalProject(project);
    setModalError(null);
    setIsConnectingModal(false);
  };

  const handleConfirmConnect = async () => {
    if (!connectModalProject) return;
    const propId = cleanPropertyId(connectModalProject.gaPropertyId);
    if (!propId) return;
    const proj = connectModalProject;
    setIsConnectingModal(true);
    setModalError(null);
    setConnectingProjectIds((prev) => new Set(prev).add(proj.id));

    try {
      const result = await fetchGA4Report(propId, true);
      const record: StoredGA4MetricsRecord = {
        propertyId: propId,
        visitors: result.visitors,
        views: result.views,
        engagementRate: result.engagementRate,
        newUsers: result.newUsers,
        visitorsTrend: result.visitorsTrend,
        viewsTrend: result.viewsTrend,
        engagementTrend: result.engagementTrend,
        newUsersTrend: result.newUsersTrend,
        activeUsers: result.activeUsers,
        eventCount: result.eventCount,
        keyEvents: result.keyEvents,
        fetchedAt: result.fetchedAt,
      };
      await saveProjectGA4Metrics(proj.id, record);
      setMetricsMap((prev) => ({ ...prev, [proj.id]: record }));
      setProjectErrors((prev) => {
        const copy = { ...prev };
        delete copy[proj.id];
        return copy;
      });
      setConnectModalProject(null);
    } catch (err: any) {
      const msg = err?.message || "Failed to connect to Google Analytics.";
      setModalError(msg);
      setProjectErrors((prev) => ({ ...prev, [proj.id]: msg }));
    } finally {
      setIsConnectingModal(false);
      setConnectingProjectIds((prev) => {
        const copy = new Set(prev);
        copy.delete(proj.id);
        return copy;
      });
    }
  };

  const handleRefreshGA4 = async (project: DeveloperProject) => {
    const propId = cleanPropertyId(project.gaPropertyId);
    if (!propId) return;
    setConnectingProjectIds((prev) => new Set(prev).add(project.id));
    try {
      let result: GA4ReportResult;
      try {
        result = await fetchGA4Report(propId, false);
      } catch {
        // If non-interactive token retrieval fails, fall back to interactive since user explicitly clicked Refresh
        result = await fetchGA4Report(propId, true);
      }
      const record: StoredGA4MetricsRecord = {
        propertyId: propId,
        visitors: result.visitors,
        views: result.views,
        engagementRate: result.engagementRate,
        newUsers: result.newUsers,
        visitorsTrend: result.visitorsTrend,
        viewsTrend: result.viewsTrend,
        engagementTrend: result.engagementTrend,
        newUsersTrend: result.newUsersTrend,
        activeUsers: result.activeUsers,
        eventCount: result.eventCount,
        keyEvents: result.keyEvents,
        fetchedAt: result.fetchedAt,
      };
      await saveProjectGA4Metrics(project.id, record);
      setMetricsMap((prev) => ({ ...prev, [project.id]: record }));
      setProjectErrors((prev) => {
        const copy = { ...prev };
        delete copy[project.id];
        return copy;
      });
    } catch (err: any) {
      const msg = err?.message || "Refresh failed.";
      setProjectErrors((prev) => ({ ...prev, [project.id]: msg }));
    } finally {
      setConnectingProjectIds((prev) => {
        const copy = new Set(prev);
        copy.delete(project.id);
        return copy;
      });
    }
  };

  const handleDisconnectGA4 = async (projectId: string) => {
    await clearProjectGA4Metrics(projectId);
    setMetricsMap((prev) => {
      const copy = { ...prev };
      delete copy[projectId];
      return copy;
    });
    setProjectErrors((prev) => {
      const copy = { ...prev };
      delete copy[projectId];
      return copy;
    });
  };

  // Unlinked unpacked extensions detection (no arbitrary cap)
  const unlinkedDevExtensions = getUnlinkedDevExtensions(extensions, projects, selfExtension);

  const handleStartAdd = (prefill?: Partial<DeveloperProject>) => {
    setEditingProject(
      prefill || {
        id: `devproj_${generateId()}`,
        name: "",
        localExtensionId: "",
        cwsExtensionId: "",
        githubUrl: "",
        gaPropertyId: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    );
  };

  const handleStartEdit = (project: DeveloperProject) => {
    setEditingProject({ ...project });
  };

  const handleSaveModal = (projectData: Partial<DeveloperProject>) => {
    if (!projectData.name?.trim()) return;
    const now = Date.now();
    const finalProject: DeveloperProject = {
      id: projectData.id || `devproj_${generateId()}`,
      name: projectData.name.trim(),
      localExtensionId: projectData.localExtensionId?.trim() || undefined,
      cwsExtensionId: cleanCwsId(projectData.cwsExtensionId?.trim() || ""),
      githubUrl: projectData.githubUrl?.trim() || undefined,
      gaPropertyId: projectData.gaPropertyId?.trim() || undefined,
      createdAt: projectData.createdAt || now,
      updatedAt: now,
    };
    onSaveProject(finalProject);
    setEditingProject(null);
  };

  const hasContent = projects.length > 0 || unlinkedDevExtensions.length > 0;

  return (
    <div className="developer-workspace-view">
      {/* Header */}
      <header className="developer-header">
        <div className="developer-header-title-block">
          <h2 className="developer-title">Developer Workspace</h2>
          <p className="developer-subtitle">
            Connect local test extensions to GitHub repositories, Chrome Web Store items, and Google Analytics.
          </p>
        </div>
        <div className="dev-header-actions">
          <a
            href="https://chrome.google.com/webstore/devconsole/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary dev-cws-dashboard-btn"
            title="Open Chrome Web Store Developer Dashboard"
          >
            <span>Open CWS Dashboard</span>
            <MaterialSymbol name="open_in_new" size={15} color="currentColor" />
          </a>
          <button
            type="button"
            className="btn btn-primary dev-add-project-btn"
            onClick={() => handleStartAdd()}
            style={{ backgroundColor: themeMainColor }}
          >
            <MaterialSymbol name="add" size={18} color="#ffffff" />
            <span>Add Project</span>
          </button>
        </div>
      </header>

      {/* Main Content: Compact Project List or Empty State */}
      {!hasContent ? (
        <div className="dev-empty-state">
          <div className="dev-empty-icon-circle">
            <MaterialSymbol name="developer_board" size={36} color={themeMainColor} />
          </div>
          <h3 className="dev-empty-title">No Developer Projects Yet</h3>
          <p className="dev-empty-desc">
            Organize and bridge your extensions across local development, GitHub source repository, Chrome Web Store release listings, and Google Analytics telemetry.
          </p>
          <div className="dev-empty-actions">
            <a
              href="https://chrome.google.com/webstore/devconsole/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary dev-cws-dashboard-btn"
              title="Open Chrome Web Store Developer Dashboard"
            >
              <span>Open CWS Dashboard</span>
              <MaterialSymbol name="open_in_new" size={15} color="currentColor" />
            </a>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleStartAdd()}
              style={{ backgroundColor: themeMainColor }}
            >
              <MaterialSymbol name="add" size={18} color="#ffffff" />
              <span>Create Your First Project</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="dev-workspace-content">
          {/* Configured Projects List */}
          {projects.length > 0 && (
            <div className="dev-project-list" aria-label="Developer Projects">
              {projects.map((proj) => {
                const localExt = proj.localExtensionId
                  ? (selfExtension && proj.localExtensionId === selfExtension.id
                      ? selfExtension
                      : extensions.find((e) => e.id === proj.localExtensionId))
                  : null;
                const isSelf = Boolean(selfExtension && proj.localExtensionId === selfExtension.id);
                const isLocalReloading = proj.localExtensionId
                  ? reloadingIds.has(proj.localExtensionId)
                  : false;
                const isConnecting = connectingProjectIds.has(proj.id);
                const storedRecord = metricsMap[proj.id];
                const isConnected = !!(
                  storedRecord &&
                  proj.gaPropertyId &&
                  storedRecord.propertyId === cleanPropertyId(proj.gaPropertyId)
                );
                const projectError = projectErrors[proj.id];

                return (
                  <article
                    key={proj.id}
                    className="dev-project-row"
                    onClick={() => handleStartEdit(proj)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleStartEdit(proj);
                      }
                    }}
                    title="Click row to edit project details and bindings"
                  >
                    {/* Primary Line: Identity + Local Test State + Actions */}
                    <div className="dev-row-primary">
                      {/* Left: Project Identity */}
                      <div className="dev-row-identity">
                        <div className="dev-project-icon-frame">
                          {localExt?.icons && localExt.icons.length > 0 ? (
                            <img
                              src={localExt.icons[localExt.icons.length - 1].url}
                              alt=""
                              className="dev-project-icon"
                            />
                          ) : (
                            <MaterialSymbol name="terminal" size={20} color={themeMainColor} />
                          )}
                        </div>
                        <span className="dev-project-name" title={proj.name}>
                          {proj.name}
                        </span>
                        <div className="dev-project-badges">
                          {localExt && (
                            <span className="dev-chip-badge" title="Linked unpacked development build">
                              DEV
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle / Right: Concise Local / Test State */}
                      <div className="dev-row-local" onClick={(e) => e.stopPropagation()}>
                        {proj.localExtensionId ? (
                          localExt ? (
                            <div className="dev-local-state-group">
                              <span className={`dev-local-tag ${isSelf ? "dev-self-tag" : ""}`}>
                                {isSelf ? `DEV · v${localExt.version} · This extension` : `DEV · v${localExt.version}`}
                              </span>
                              {isSelf ? (
                                <span
                                  className="status-pill enabled dev-self-runtime-pill"
                                  title="Extension Drawer is the active runtime and cannot be disabled"
                                >
                                  Runtime ON · Active build
                                </span>
                              ) : (
                                <div className="dev-switch-wrap">
                                  <ExtensionSwitch
                                    id={localExt.id}
                                    enabled={localExt.enabled}
                                    onToggle={onToggleExtension}
                                    size="small"
                                  />
                                  <span
                                    className={`status-pill ${localExt.enabled ? "enabled" : "disabled"}`}
                                  >
                                    {localExt.enabled ? "Runtime ON" : "Runtime OFF"}
                                  </span>
                                </div>
                              )}
                              <div className="dev-local-controls">
                                <button
                                  type="button"
                                  className={`action-icon-btn reload-btn ${!localExt.enabled && !isSelf ? "disabled" : ""} ${isLocalReloading ? "is-reloading" : ""}`}
                                  disabled={(!localExt.enabled && !isSelf) || isLocalReloading}
                                  onClick={() => onReloadExtension(localExt.id)}
                                  title={
                                    isSelf
                                      ? "Reload Extension Drawer runtime (calls chrome.runtime.reload())"
                                      : localExt.enabled
                                      ? "Reload extension code"
                                      : "Enable this extension before reloading"
                                  }
                                  aria-label="Reload extension"
                                >
                                  <MaterialSymbol
                                    name="refresh"
                                    size={16}
                                    color={
                                      localExt.enabled || isSelf
                                        ? themeMainColor
                                        : "var(--text-muted, #888)"
                                    }
                                  />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span
                              className="dev-pill dev-pill-warning"
                              title={`Extension ID: ${proj.localExtensionId}`}
                            >
                              Missing build
                            </span>
                          )
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs dev-link-local-btn"
                            onClick={() => handleStartEdit(proj)}
                            title="Link an unpacked local test build"
                          >
                            <MaterialSymbol name="add" size={13} />
                            <span>Local test build</span>
                          </button>
                        )}
                      </div>

                      {/* Far Right: Edit / Delete Affordance */}
                      <div className="dev-row-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="action-icon-btn dev-row-action-btn"
                          onClick={() => handleStartEdit(proj)}
                          title="Edit project bindings"
                          aria-label="Edit project"
                        >
                          <MaterialSymbol name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn dev-row-action-btn dev-delete-btn"
                          onClick={() => setDeleteConfirmId(proj.id)}
                          title="Remove project from Developer Workspace"
                          aria-label="Remove project"
                        >
                          <MaterialSymbol name="delete" size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Secondary Line: Compact Integration Status Chips */}
                    <div className="dev-row-secondary" onClick={(e) => e.stopPropagation()}>
                      <div className="dev-chips-group">
                        {/* GitHub Status Chip */}
                        {proj.githubUrl ? (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="dev-status-chip dev-chip-linked"
                            title={`GitHub: ${cleanGithubDisplay(proj.githubUrl)} (opens repository)`}
                          >
                            <MaterialSymbol name="code" size={13} color="var(--theme-main, #1a73e8)" />
                            <span className="dev-chip-label">GitHub linked</span>
                            <MaterialSymbol name="open_in_new" size={11} color="var(--text-muted)" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="dev-status-chip dev-chip-unlinked"
                            onClick={() => handleStartEdit(proj)}
                            title="Link a GitHub repository"
                          >
                            <MaterialSymbol name="add" size={12} color="var(--text-muted)" />
                            <span className="dev-chip-label">GitHub not linked</span>
                          </button>
                        )}

                        {/* Store Status Chip */}
                        {proj.cwsExtensionId ? (
                          <a
                            href={`https://chromewebstore.google.com/detail/${proj.cwsExtensionId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="dev-status-chip dev-chip-linked"
                            title={`Chrome Web Store: ${proj.cwsExtensionId} (opens listing)`}
                          >
                            <MaterialSymbol name="storefront" size={13} color="var(--theme-main, #1a73e8)" />
                            <span className="dev-chip-label">Store linked</span>
                            <MaterialSymbol name="open_in_new" size={11} color="var(--text-muted)" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="dev-status-chip dev-chip-unlinked"
                            onClick={() => handleStartEdit(proj)}
                            title="Link a Chrome Web Store item ID"
                          >
                            <MaterialSymbol name="add" size={12} color="var(--text-muted)" />
                            <span className="dev-chip-label">Store not linked</span>
                          </button>
                        )}

                        {/* Analytics Status Chip */}
                        {!proj.gaPropertyId ? (
                          <button
                            type="button"
                            className="dev-status-chip dev-chip-unlinked"
                            onClick={() => handleStartEdit(proj)}
                            title="Link a Google Analytics Property ID"
                          >
                            <MaterialSymbol name="add" size={12} color="var(--text-muted)" />
                            <span className="dev-chip-label">Analytics not linked</span>
                          </button>
                        ) : isConnecting ? (
                          <span className="dev-status-chip dev-chip-bound" title="Connecting to Store analytics...">
                            <MaterialSymbol name="sync" size={13} className="spin-icon" color="var(--theme-main, #1a73e8)" />
                            <span className="dev-chip-label">Store analytics · Connecting…</span>
                          </span>
                        ) : isConnected ? (
                          <button
                            type="button"
                            className="dev-status-chip dev-chip-connected"
                            onClick={() => handleStartEdit(proj)}
                            title={`Google Analytics Property: ${proj.gaPropertyId} · Store analytics connected (Last 28 days)`}
                          >
                            <span className="dev-status-dot connected" />
                            <span className="dev-chip-label">Store analytics · Connected</span>
                          </button>
                        ) : projectError ? (
                          <button
                            type="button"
                            className="dev-status-chip dev-chip-error"
                            onClick={() => handleOpenConnectModal(proj)}
                            title={`Store analytics error: ${projectError}`}
                          >
                            <span className="dev-status-dot error" />
                            <span className="dev-chip-label">Store analytics · Error</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="dev-status-chip dev-chip-bound dev-chip-actionable"
                            onClick={() => handleOpenConnectModal(proj)}
                            title={`Google Analytics Property: ${proj.gaPropertyId} · Click to connect store listing analytics`}
                          >
                            <span className="dev-status-dot idle" />
                            <span className="dev-chip-label">Store analytics · Not connected</span>
                          </button>
                        )}

                        {/* Package Status Chip */}
                        <span
                          className="dev-status-chip dev-chip-locked"
                          title="Direct CRX/ZIP package downloading requires additional browser permissions (downloads). Integration pending approval."
                        >
                          <MaterialSymbol name="lock" size={12} color="var(--text-muted)" />
                          <span className="dev-chip-label">Package: not enabled</span>
                        </span>
                      </div>

                      {/* Google Analytics 4 Performance Summary Line */}
                      {proj.gaPropertyId && (
                        <div
                          className={`dev-ga4-metrics-bar ${
                            isConnected
                              ? "dev-ga4-metrics-connected"
                              : projectError
                              ? "dev-ga4-metrics-error"
                              : ""
                          }`}
                          title={
                            isConnected
                              ? `Store listing analytics (Last 28 days vs Previous 28 days via GA4 Data API v1beta). Last fetched: ${new Date(storedRecord.fetchedAt).toLocaleTimeString()}`
                              : projectError
                              ? `Error: ${projectError}`
                              : "Store listing analytics (GA4 Data API v1beta). Click Connect to authorize read-only reporting."
                          }
                        >
                          <div className="dev-ga4-period-label">Store analytics · 28d</div>
                          <div className="dev-ga4-metric-divider" />
                          <div className="dev-ga4-metric-cell">
                            <span className="dev-ga4-metric-name">Visitors</span>
                            <span className="dev-ga4-metric-value">
                              {isConnected && (storedRecord?.visitors ?? storedRecord?.activeUsers) !== undefined && (storedRecord?.visitors ?? storedRecord?.activeUsers) !== null
                                ? (storedRecord.visitors ?? storedRecord.activeUsers)
                                : "—"}
                            </span>
                            {isConnected && storedRecord?.hasPreviousBaseline && storedRecord?.visitorsTrend && (
                              <span className={`dev-trend-badge ${storedRecord.visitorsTrend === "0%" ? "neutral" : ""}`}>
                                {storedRecord.visitorsTrend}
                              </span>
                            )}
                          </div>
                          <div className="dev-ga4-metric-divider" />
                          <div className="dev-ga4-metric-cell">
                            <span className="dev-ga4-metric-name">Views</span>
                            <span className="dev-ga4-metric-value">
                              {isConnected && (storedRecord?.views ?? storedRecord?.eventCount) !== undefined && (storedRecord?.views ?? storedRecord?.eventCount) !== null
                                ? (storedRecord.views ?? storedRecord.eventCount)
                                : "—"}
                            </span>
                            {isConnected && storedRecord?.hasPreviousBaseline && storedRecord?.viewsTrend && (
                              <span className={`dev-trend-badge ${storedRecord.viewsTrend === "0%" ? "neutral" : ""}`}>
                                {storedRecord.viewsTrend}
                              </span>
                            )}
                          </div>
                          <div className="dev-ga4-metric-divider" />
                          <div className="dev-ga4-metric-cell">
                            <span className="dev-ga4-metric-name">Engagement</span>
                            <span className="dev-ga4-metric-value">
                              {isConnected && storedRecord?.engagementRate !== undefined && storedRecord?.engagementRate !== null
                                ? `${Math.round(storedRecord.engagementRate * 100)}%`
                                : "—"}
                            </span>
                            {isConnected && storedRecord?.hasPreviousBaseline && storedRecord?.engagementTrend && (
                              <span className={`dev-trend-badge ${storedRecord.engagementTrend === "0pt" ? "neutral" : ""}`}>
                                {storedRecord.engagementTrend}
                              </span>
                            )}
                          </div>
                          {isConnected && !storedRecord?.hasPreviousBaseline && (
                            <>
                              <div className="dev-ga4-metric-divider" />
                              <span className="dev-ga4-baseline-note">No previous-period baseline</span>
                            </>
                          )}
                          <div className="dev-ga4-metric-status">
                            {isConnected ? (
                              <button
                                type="button"
                                className="dev-ga4-refresh-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRefreshGA4(proj);
                                }}
                                disabled={isConnecting}
                                title="Refresh 28-day store listing analytics"
                                aria-label="Refresh metrics"
                              >
                                <MaterialSymbol name="refresh" size={12} className={isConnecting ? "spin-icon" : ""} />
                                <span>Refresh</span>
                              </button>
                            ) : isConnecting ? (
                              <span className="dev-ga4-status-badge">Connecting…</span>
                            ) : projectError ? (
                              <button
                                type="button"
                                className="dev-ga4-connect-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenConnectModal(proj);
                                }}
                                title="Retry connecting to Google Analytics"
                              >
                                <span>Reconnect</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="dev-ga4-connect-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenConnectModal(proj);
                                }}
                                title="Connect Google Analytics (read-only)"
                              >
                                <MaterialSymbol name="login" size={12} />
                                <span>Connect</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Unlinked Development Extensions Section */}
          {unlinkedDevExtensions.length > 0 && (
            <section className="dev-unlinked-section" aria-label="Unlinked Test Extensions">
              <div className="dev-section-header">
                <MaterialSymbol name="science" size={16} color={themeMainColor} />
                <span className="dev-section-title">
                  Unlinked Development Extensions ({unlinkedDevExtensions.length})
                </span>
                <span className="dev-section-desc">
                  Detected unpacked test builds not yet associated with a project.
                </span>
              </div>

              <div className="dev-unlinked-list">
                {unlinkedDevExtensions.map((ext) => {
                  const isLocalReloading = reloadingIds.has(ext.id);
                  const isSelf = Boolean(selfExtension && ext.id === selfExtension.id);

                  return (
                    <article key={ext.id} className="dev-unlinked-row">
                      {/* Left: Identity */}
                      <div className="dev-row-identity">
                        <div className="dev-project-icon-frame">
                          {ext.icons && ext.icons.length > 0 ? (
                            <img
                              src={ext.icons[ext.icons.length - 1].url}
                              alt=""
                              className="dev-project-icon"
                            />
                          ) : (
                            <MaterialSymbol name="science" size={20} color={themeMainColor} />
                          )}
                        </div>
                        <span className="dev-project-name" title={ext.name}>
                          {ext.name}
                        </span>
                        <span className="dev-chip-badge" title="Unpacked development extension">
                          DEV
                        </span>
                        {isSelf && (
                          <span className="dev-chip-badge dev-self-tag" title="Extension Drawer runtime">
                            This extension
                          </span>
                        )}
                        <span className="dev-pill dev-pill-neutral">Unlinked</span>
                      </div>

                      {/* Middle: Concise Local State */}
                      <div className="dev-row-local">
                        <div className="dev-local-state-group">
                          <span className={`dev-local-tag ${isSelf ? "dev-self-tag" : ""}`}>
                            {isSelf ? `DEV · v${ext.version} · This extension` : `DEV · v${ext.version}`}
                          </span>
                          {isSelf ? (
                            <span
                              className="status-pill enabled dev-self-runtime-pill"
                              title="Extension Drawer is the active runtime and cannot be disabled"
                            >
                              Runtime ON · Active build
                            </span>
                          ) : (
                            <div className="dev-switch-wrap">
                              <ExtensionSwitch
                                id={ext.id}
                                enabled={ext.enabled}
                                onToggle={onToggleExtension}
                                size="small"
                              />
                              <span
                                className={`status-pill ${ext.enabled ? "enabled" : "disabled"}`}
                              >
                                {ext.enabled ? "Runtime ON" : "Runtime OFF"}
                              </span>
                            </div>
                          )}
                          <div className="dev-local-controls">
                            <button
                              type="button"
                              className={`action-icon-btn reload-btn ${!ext.enabled && !isSelf ? "disabled" : ""} ${isLocalReloading ? "is-reloading" : ""}`}
                              disabled={(!ext.enabled && !isSelf) || isLocalReloading}
                              onClick={() => onReloadExtension(ext.id)}
                              title={
                                isSelf
                                  ? "Reload Extension Drawer runtime (calls chrome.runtime.reload())"
                                  : ext.enabled
                                  ? "Reload extension code"
                                  : "Enable this extension before reloading"
                              }
                              aria-label="Reload extension"
                            >
                              <MaterialSymbol
                                name="refresh"
                                size={16}
                                color={
                                  ext.enabled || isSelf
                                    ? themeMainColor
                                    : "var(--text-muted, #888)"
                                }
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Primary Set up Action */}
                      <div className="dev-row-setup-action">
                        <button
                          type="button"
                          className="btn btn-primary dev-setup-btn"
                          onClick={() =>
                            handleStartAdd({
                              id: `devproj_${generateId()}`,
                              name: ext.name,
                              localExtensionId: ext.id,
                              createdAt: Date.now(),
                              updatedAt: Date.now(),
                            })
                          }
                          style={{ backgroundColor: themeMainColor }}
                          title={`Create developer project for ${ext.name}`}
                        >
                          <MaterialSymbol name="add" size={16} color="#ffffff" />
                          <span>Set up</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Project Editor Modal */}
      {editingProject && (
        <ProjectEditorModal
          project={editingProject}
          extensions={extensions}
          selfExtension={selfExtension}
          metricsRecord={editingProject.id ? metricsMap[editingProject.id] : undefined}
          onSave={handleSaveModal}
          onClose={() => setEditingProject(null)}
          onOpenDetails={onOpenDetails}
          onConnectGA4={(proj) => handleOpenConnectModal(proj)}
          onRefreshGA4={(proj) => handleRefreshGA4(proj)}
          onDisconnectGA4={(projId) => handleDisconnectGA4(projId)}
          themeMainColor={themeMainColor}
        />
      )}

      {/* GA4 Connect Modal */}
      {connectModalProject && (
        <GA4ConnectModal
          project={connectModalProject}
          isOpen={!!connectModalProject}
          isConnecting={isConnectingModal}
          error={modalError}
          onClose={() => {
            if (!isConnectingModal) {
              setConnectModalProject(null);
            }
          }}
          onConfirmConnect={handleConfirmConnect}
          themeMainColor={themeMainColor}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="subwindow-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-title">Remove project from Developer Workspace?</div>
            <p className="dev-delete-confirm-text">
              This removes only the project's Developer Workspace links, analytics settings, and local project metadata. The extension itself will remain installed and unchanged.
            </p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary dev-delete-confirm-btn"
                onClick={() => {
                  onDeleteProject(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
              >
                Remove project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Project Editor Modal Component ──────────────────────────

interface ProjectEditorModalProps {
  project: Partial<DeveloperProject>;
  extensions: ExtensionInfo[];
  selfExtension?: ExtensionInfo | null;
  metricsRecord?: StoredGA4MetricsRecord | null;
  onSave: (proj: Partial<DeveloperProject>) => void;
  onClose: () => void;
  onOpenDetails?: (id: string) => void;
  onConnectGA4?: (project: DeveloperProject) => void;
  onRefreshGA4?: (project: DeveloperProject) => void;
  onDisconnectGA4?: (projectId: string) => void;
  themeMainColor: string;
}

function ProjectEditorModal({
  project,
  extensions,
  selfExtension,
  metricsRecord,
  onSave,
  onClose,
  onOpenDetails,
  onConnectGA4,
  onRefreshGA4,
  onDisconnectGA4,
  themeMainColor,
}: ProjectEditorModalProps) {
  const [name, setName] = useState(project.name || "");
  const [localExtensionId, setLocalExtensionId] = useState(project.localExtensionId || "");
  const [cwsExtensionId, setCwsExtensionId] = useState(project.cwsExtensionId || "");
  const [githubUrl, setGithubUrl] = useState(project.githubUrl || "");
  const [gaPropertyId, setGaPropertyId] = useState(project.gaPropertyId || "");
  const [customLocalId, setCustomLocalId] = useState(false);

  // ONLY unpacked development extensions are eligible as local test builds
  const devExtensions = getAllDevExtensions(extensions, selfExtension);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...project,
      name: name.trim(),
      localExtensionId: localExtensionId.trim() || undefined,
      cwsExtensionId: cleanCwsId(cwsExtensionId.trim()),
      githubUrl: githubUrl.trim() || undefined,
      gaPropertyId: cleanPropertyId(gaPropertyId.trim()) || undefined,
    });
  };

  const handleConnectClick = () => {
    const currentProject: DeveloperProject = {
      id: project.id || `devproj_${generateId()}`,
      name: name.trim() || project.name || "Untitled Project",
      localExtensionId: localExtensionId.trim() || undefined,
      cwsExtensionId: cleanCwsId(cwsExtensionId.trim()),
      githubUrl: githubUrl.trim() || undefined,
      gaPropertyId: cleanPropertyId(gaPropertyId.trim()) || undefined,
      createdAt: project.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    onSave(currentProject);
    onConnectGA4?.(currentProject);
  };

  const handleCwsInput = (val: string) => {
    // If a full webstore URL is pasted, extract the ID immediately
    setCwsExtensionId(cleanCwsId(val) || "");
  };

  const isEdit = Boolean(project.createdAt);

  return (
    <div className="subwindow-overlay" onClick={onClose}>
      <div
        className="subwindow-box dev-editor-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dev-modal-title"
      >
        <div className="subwindow-header">
          <div className="subwindow-title" id="dev-modal-title">
            {isEdit ? "Edit Developer Project" : "Add Developer Project"}
          </div>
          <button
            type="button"
            className="action-icon-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <MaterialSymbol name="close" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dev-editor-form">
          {/* Project Name */}
          <div className="settings-row">
            <div className="settings-row-text">
              <label className="settings-label" htmlFor="dev-proj-name">
                Project Name
              </label>
              <span className="settings-description">Display name for this extension project.</span>
            </div>
            <div className="settings-control">
              <input
                id="dev-proj-name"
                type="text"
                className="settings-input dev-input-text"
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder="e.g. My Chrome Extension"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Local / Test Extension Binding */}
          <div className="settings-row">
            <div className="settings-row-text">
              <label className="settings-label" htmlFor="dev-proj-local-ext">
                Local Test Extension
              </label>
              <span className="settings-description">
                Only unpacked development extensions can be linked as local test builds.
              </span>
            </div>
            <div className="settings-control dev-select-control">
              {!customLocalId ? (
                <select
                  id="dev-proj-local-ext"
                  className="settings-select"
                  value={localExtensionId}
                  onChange={(e) => {
                    const val = (e.target as HTMLSelectElement).value;
                    if (val === "__custom__") {
                      setCustomLocalId(true);
                    } else {
                      setLocalExtensionId(val);
                      // Auto-fill project name if empty
                      if (!name) {
                        const match = devExtensions.find((x) => x.id === val);
                        if (match) setName(match.name);
                      }
                    }
                  }}
                >
                  <option value="">(None linked)</option>
                  {devExtensions.length > 0 && (
                    <optgroup label="Unpacked / Development Extensions">
                      {devExtensions.map((e) => {
                        const isThisSelf = Boolean(selfExtension && e.id === selfExtension.id);
                        return (
                          <option key={e.id} value={e.id}>
                            {isThisSelf
                              ? `[DEV] ${e.name} · This extension`
                              : `[DEV] ${e.name} (${e.id.slice(0, 8)}...)`}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  <option value="__custom__">Enter custom extension ID...</option>
                </select>
              ) : (
                <div className="dev-custom-id-input-wrap">
                  <input
                    type="text"
                    className="settings-input dev-input-text"
                    value={localExtensionId}
                    onInput={(e) => setLocalExtensionId((e.target as HTMLInputElement).value)}
                    placeholder="Enter 32-character extension ID"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => setCustomLocalId(false)}
                    title="Return to dropdown"
                  >
                    List
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* If linked to a local extension, offer quick Chrome details action */}
          {localExtensionId && onOpenDetails && (
            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-label">Chrome Management</span>
                <span className="settings-description">Open extension details in chrome://extensions.</span>
              </div>
              <div className="settings-control">
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => onOpenDetails(localExtensionId)}
                  title="Open Chrome details page"
                >
                  <MaterialSymbol name="open_in_new" size={13} />
                  <span>Open Chrome details</span>
                </button>
              </div>
            </div>
          )}

          {/* GitHub URL */}
          <div className="settings-row">
            <div className="settings-row-text">
              <label className="settings-label" htmlFor="dev-proj-github">
                GitHub Repository URL
              </label>
              <span className="settings-description">Link to the source repository.</span>
            </div>
            <div className="settings-control">
              <input
                id="dev-proj-github"
                type="text"
                className="settings-input dev-input-text"
                value={githubUrl}
                onInput={(e) => setGithubUrl((e.target as HTMLInputElement).value)}
                placeholder="https://github.com/owner/repo"
              />
            </div>
          </div>

          {/* Chrome Web Store Extension ID */}
          <div className="settings-row">
            <div className="settings-row-text">
              <label className="settings-label" htmlFor="dev-proj-cws">
                Chrome Web Store Item ID
              </label>
              <span className="settings-description">
                The 32-character published store item ID or full store URL.
              </span>
            </div>
            <div className="settings-control">
              <input
                id="dev-proj-cws"
                type="text"
                className="settings-input dev-input-text"
                value={cwsExtensionId}
                onInput={(e) => handleCwsInput((e.target as HTMLInputElement).value)}
                placeholder="e.g. kgenlcljnnalkmbhlolfomnfpdmnnapi or store URL"
              />
            </div>
          </div>

          {/* Google Analytics Property ID */}
          <div className="settings-row">
            <div className="settings-row-text">
              <label className="settings-label" htmlFor="dev-proj-ga">
                Google Analytics Property ID
              </label>
              <span className="settings-description">
                GA4 property ID for Chrome Web Store listing telemetry.
              </span>
            </div>
            <div className="settings-control">
              <input
                id="dev-proj-ga"
                type="text"
                className="settings-input dev-input-text"
                value={gaPropertyId}
                onInput={(e) => setGaPropertyId((e.target as HTMLInputElement).value)}
                placeholder="e.g. 553647047 or properties/553647047"
              />
            </div>
          </div>

          {/* GA4 Connection Actions */}
          {cleanPropertyId(gaPropertyId) && isEdit && project.id && (
            <div className="dev-editor-ga-actions">
              {metricsRecord ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span className="dev-status-chip dev-chip-connected">
                      <span className="dev-status-dot connected" />
                      <span className="dev-chip-label">Store analytics · Connected</span>
                    </span>
                    <button
                      type="button"
                      className="dev-ga4-refresh-btn"
                      onClick={() => {
                        const currentProject: DeveloperProject = {
                          ...(project as DeveloperProject),
                          gaPropertyId: cleanPropertyId(gaPropertyId.trim()) || undefined,
                        };
                        onRefreshGA4?.(currentProject);
                      }}
                    >
                      <MaterialSymbol name="refresh" size={13} />
                      <span>Refresh data</span>
                    </button>
                    <button
                      type="button"
                      className="dev-ga4-refresh-btn"
                      onClick={() => onDisconnectGA4?.(project.id!)}
                    >
                      <MaterialSymbol name="link_off" size={13} />
                      <span>Disconnect</span>
                    </button>
                  </div>

                  <div className="dev-editor-metrics-grid">
                    <div className="dev-editor-metric-card">
                      <span className="dev-editor-metric-title">Visitors</span>
                      <span className="dev-editor-metric-val">
                        {(metricsRecord.visitors ?? metricsRecord.activeUsers) !== undefined && (metricsRecord.visitors ?? metricsRecord.activeUsers) !== null
                          ? (metricsRecord.visitors ?? metricsRecord.activeUsers)
                          : "—"}
                      </span>
                    </div>
                    <div className="dev-editor-metric-card">
                      <span className="dev-editor-metric-title">Views</span>
                      <span className="dev-editor-metric-val">
                        {(metricsRecord.views ?? metricsRecord.eventCount) !== undefined && (metricsRecord.views ?? metricsRecord.eventCount) !== null
                          ? (metricsRecord.views ?? metricsRecord.eventCount)
                          : "—"}
                      </span>
                    </div>
                    <div className="dev-editor-metric-card">
                      <span className="dev-editor-metric-title">Engagement</span>
                      <span className="dev-editor-metric-val">
                        {metricsRecord.engagementRate !== undefined && metricsRecord.engagementRate !== null
                          ? `${Math.round(metricsRecord.engagementRate * 100)}%`
                          : "—"}
                      </span>
                    </div>
                    <div className="dev-editor-metric-card">
                      <span className="dev-editor-metric-title">New users</span>
                      <span className="dev-editor-metric-val">
                        {metricsRecord.newUsers !== undefined && metricsRecord.newUsers !== null
                          ? metricsRecord.newUsers
                          : "—"}
                      </span>
                    </div>
                    {!metricsRecord.hasPreviousBaseline && (
                      <div className="dev-editor-baseline-note">No previous-period baseline</div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="dev-ga4-connect-btn"
                  onClick={handleConnectClick}
                >
                  <MaterialSymbol name="login" size={13} />
                  <span>Connect Store Analytics</span>
                </button>
              )}
            </div>
          )}

          {/* Integration & Packaging Specification Notice */}
          <div className="dev-modal-spec-notice">
            <div className="dev-modal-spec-item">
              <MaterialSymbol name="analytics" size={15} color="var(--text-muted)" />
              <span>
                <strong>Store analytics:</strong> Read-only access queries <em>Visitors</em>, <em>Views</em>, <em>Engagement rate</em>, and <em>New users</em> over the last 28 days vs the previous 28 days via Google Analytics Data API v1beta.
              </span>
            </div>
            <div className="dev-modal-spec-item">
              <MaterialSymbol name="archive" size={15} color="var(--text-muted)" />
              <span>
                <strong>Store Package:</strong> Package downloads require additional browser permissions.
              </span>
            </div>
          </div>

          <div className="dev-modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim()}
              style={{ backgroundColor: themeMainColor }}
            >
              {isEdit ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── GA4 Connect Modal Component ─────────────────────────────

interface GA4ConnectModalProps {
  project: DeveloperProject;
  isOpen: boolean;
  isConnecting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirmConnect: () => void;
  themeMainColor: string;
}

function GA4ConnectModal({
  project,
  isOpen,
  isConnecting,
  error,
  onClose,
  onConfirmConnect,
  themeMainColor,
}: GA4ConnectModalProps) {
  if (!isOpen) return null;

  const propId = cleanPropertyId(project.gaPropertyId);

  return (
    <div className="subwindow-overlay" onClick={onClose}>
      <div
        className="subwindow-box dev-ga4-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ga4-modal-title"
      >
        <div className="subwindow-header">
          <div className="subwindow-title" id="ga4-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MaterialSymbol name="analytics" size={20} color={themeMainColor} />
            <span>Connect Store Analytics (Read-Only)</span>
          </div>
          <button
            type="button"
            className="action-icon-btn"
            onClick={onClose}
            aria-label="Close"
            disabled={isConnecting}
          >
            <MaterialSymbol name="close" size={18} />
          </button>
        </div>

        <div className="dev-ga4-modal-body">
          <p className="dev-ga4-modal-lead">
            Extension Drawer will request <strong>read-only access</strong> via Chrome Identity OAuth to fetch 28-day Chrome Web Store listing telemetry for <strong>{project.name}</strong>.
          </p>

          {!propId && (
            <div className="dev-ga4-warning-box">
              <MaterialSymbol name="warning" size={16} color="#b06000" />
              <span>A valid Google Analytics Property ID (numeric) is required before connecting. Please edit the project to set the property ID.</span>
            </div>
          )}

          <div className="dev-ga4-spec-summary">
            <div className="dev-ga4-spec-row">
              <span className="dev-ga4-spec-key">Target GA4 Property</span>
              <span className="dev-ga4-spec-val">
                <code>{propId ? `properties/${propId}` : "Not specified"}</code>
              </span>
            </div>
            <div className="dev-ga4-spec-row">
              <span className="dev-ga4-spec-key">Reporting Period</span>
              <span className="dev-ga4-spec-val">Last 28 days vs Previous 28 days</span>
            </div>
            <div className="dev-ga4-spec-row">
              <span className="dev-ga4-spec-key">Primary KPIs</span>
              <span className="dev-ga4-spec-val">Visitors, Views, Engagement rate, New users</span>
            </div>
            <div className="dev-ga4-spec-row">
              <span className="dev-ga4-spec-key">OAuth Permission Scope</span>
              <span className="dev-ga4-spec-val"><code>https://www.googleapis.com/auth/analytics.readonly</code></span>
            </div>
          </div>

          <div className="dev-ga4-privacy-note">
            <MaterialSymbol name="lock" size={16} color="var(--color-success, #1e8e3e)" />
            <span>
              Extension Drawer requests read-only reporting access. No code or tracking pixels are injected into your pages, and no changes are made to your Google Analytics account. Tokens are securely managed by Chrome Identity and never saved to storage.
            </span>
          </div>

          {error && (
            <div className="dev-ga4-error-box" role="alert">
              <MaterialSymbol name="error" size={16} color="var(--color-danger, #d93025)" />
              <div className="dev-ga4-error-content">
                <strong>Connection failed:</strong>
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="dev-modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isConnecting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirmConnect}
            disabled={isConnecting || !propId}
            style={{ backgroundColor: themeMainColor, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {isConnecting ? (
              <>
                <MaterialSymbol name="sync" size={15} className="spin-icon" />
                <span>Connecting…</span>
              </>
            ) : (
              <>
                <MaterialSymbol name="login" size={15} />
                <span>Authorize &amp; Connect</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────

function cleanCwsId(input: string): string | undefined {
  if (!input) return undefined;
  // If user pasted a full CWS URL:
  // e.g. https://chromewebstore.google.com/detail/<title>/<32-char-id>
  // e.g. https://chrome.google.com/webstore/detail/<title>/<32-char-id>
  const match = input.match(/([a-p]{32})/i);
  if (match) {
    return match[1].toLowerCase();
  }
  return input.trim() || undefined;
}

function cleanGithubDisplay(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("github.com")) {
      const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/");
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
      }
    }
  } catch {
    // Return original string if not a valid URL
  }
  return url;
}
