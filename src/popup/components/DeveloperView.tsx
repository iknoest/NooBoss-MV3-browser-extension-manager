import { useState } from "preact/hooks";
import type { DeveloperProject, ExtensionInfo } from "../../shared/types";
import { generateId } from "../../shared/types";
import { MaterialSymbol } from "./MaterialSymbols";
import { ExtensionSwitch } from "./ExtensionBrief";

export interface DeveloperViewProps {
  projects: DeveloperProject[];
  extensions: ExtensionInfo[];
  onSaveProject: (project: DeveloperProject) => void;
  onDeleteProject: (id: string) => void;
  onToggleExtension: (id: string, enabled: boolean) => void;
  onReloadExtension: (id: string) => void;
  reloadingIds?: Set<string>;
  onOpenDetails: (id: string) => void;
  themeMainColor?: string;
}

export function getUnlinkedDevExtensions(
  extensions: ExtensionInfo[],
  projects: DeveloperProject[]
): ExtensionInfo[] {
  const linkedLocalIds = new Set(
    projects.map((p) => p.localExtensionId).filter(Boolean) as string[]
  );
  return extensions.filter(
    (e) => e.installType === "development" && !linkedLocalIds.has(e.id)
  );
}

export function DeveloperView({
  projects,
  extensions,
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

  // Unlinked unpacked extensions detection (no arbitrary cap)
  const unlinkedDevExtensions = getUnlinkedDevExtensions(extensions, projects);

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
                  ? extensions.find((e) => e.id === proj.localExtensionId)
                  : null;
                const isLocalReloading = proj.localExtensionId
                  ? reloadingIds.has(proj.localExtensionId)
                  : false;

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
                              <span className="dev-local-tag">DEV · v{localExt.version}</span>
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
                              <div className="dev-local-controls">
                                <button
                                  type="button"
                                  className={`action-icon-btn reload-btn ${!localExt.enabled ? "disabled" : ""} ${isLocalReloading ? "is-reloading" : ""}`}
                                  disabled={!localExt.enabled || isLocalReloading}
                                  onClick={() => onReloadExtension(localExt.id)}
                                  title={
                                    localExt.enabled
                                      ? "Reload extension code"
                                      : "Enable this extension before reloading"
                                  }
                                  aria-label="Reload extension"
                                >
                                  <MaterialSymbol
                                    name="refresh"
                                    size={16}
                                    color={
                                      localExt.enabled
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
                          title="Delete project"
                          aria-label="Delete project"
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

                        {/* Tracking Status Chip */}
                        {proj.gaPropertyId ? (
                          <button
                            type="button"
                            className="dev-status-chip dev-chip-bound"
                            onClick={() => handleStartEdit(proj)}
                            title={`Google Analytics Property: ${proj.gaPropertyId} (API integration approval required)`}
                          >
                            <MaterialSymbol name="analytics" size={13} color="var(--theme-main, #1a73e8)" />
                            <span className="dev-chip-label">Tracking: property linked · not connected</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="dev-status-chip dev-chip-unlinked"
                            onClick={() => handleStartEdit(proj)}
                            title="Link a Google Analytics Property ID"
                          >
                            <MaterialSymbol name="add" size={12} color="var(--text-muted)" />
                            <span className="dev-chip-label">Tracking: not linked</span>
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
                        <span className="dev-pill dev-pill-neutral">Unlinked</span>
                      </div>

                      {/* Middle: Concise Local State */}
                      <div className="dev-row-local">
                        <div className="dev-local-state-group">
                          <span className="dev-local-tag">DEV · v{ext.version}</span>
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
                          <div className="dev-local-controls">
                            <button
                              type="button"
                              className={`action-icon-btn reload-btn ${!ext.enabled ? "disabled" : ""} ${isLocalReloading ? "is-reloading" : ""}`}
                              disabled={!ext.enabled || isLocalReloading}
                              onClick={() => onReloadExtension(ext.id)}
                              title={
                                ext.enabled
                                  ? "Reload extension code"
                                  : "Enable this extension before reloading"
                              }
                              aria-label="Reload extension"
                            >
                              <MaterialSymbol
                                name="refresh"
                                size={16}
                                color={
                                  ext.enabled
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
          onSave={handleSaveModal}
          onClose={() => setEditingProject(null)}
          onOpenDetails={onOpenDetails}
          themeMainColor={themeMainColor}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="subwindow-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-title">Delete this developer project?</div>
            <p className="dev-delete-confirm-text">
              This will remove the project bindings from Extension Drawer. Installed extensions and external accounts are unaffected.
            </p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn btn-primary dev-delete-confirm-btn"
                onClick={() => {
                  onDeleteProject(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
              >
                Delete Project
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
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
  onSave: (proj: Partial<DeveloperProject>) => void;
  onClose: () => void;
  onOpenDetails?: (id: string) => void;
  themeMainColor: string;
}

function ProjectEditorModal({
  project,
  extensions,
  onSave,
  onClose,
  onOpenDetails,
  themeMainColor,
}: ProjectEditorModalProps) {
  const [name, setName] = useState(project.name || "");
  const [localExtensionId, setLocalExtensionId] = useState(project.localExtensionId || "");
  const [cwsExtensionId, setCwsExtensionId] = useState(project.cwsExtensionId || "");
  const [githubUrl, setGithubUrl] = useState(project.githubUrl || "");
  const [gaPropertyId, setGaPropertyId] = useState(project.gaPropertyId || "");
  const [customLocalId, setCustomLocalId] = useState(false);

  // ONLY unpacked development extensions are eligible as local test builds
  const devExtensions = extensions.filter((e) => e.installType === "development");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...project,
      name: name.trim(),
      localExtensionId: localExtensionId.trim() || undefined,
      cwsExtensionId: cleanCwsId(cwsExtensionId.trim()),
      githubUrl: githubUrl.trim() || undefined,
      gaPropertyId: gaPropertyId.trim() || undefined,
    });
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
        <div className="subwindow-top">
          <h3 id="dev-modal-title" className="subwindow-heading">
            {isEdit ? "Edit Developer Project" : "New Developer Project"}
          </h3>
          <button
            type="button"
            className="subwindow-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <MaterialSymbol name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dev-editor-form">
          {/* Project Name */}
          <div className="settings-row">
            <div className="settings-row-text">
              <label className="settings-label" htmlFor="dev-proj-name">
                Project Name *
              </label>
              <span className="settings-description">A recognizable display name for this project.</span>
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
                      {devExtensions.map((e) => (
                        <option key={e.id} value={e.id}>
                          [DEV] {e.name} ({e.id.slice(0, 8)}...)
                        </option>
                      ))}
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
                    placeholder="32-character extension ID"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCustomLocalId(false)}
                  >
                    Select from unpacked
                  </button>
                </div>
              )}
              {localExtensionId && onOpenDetails && (
                <div style={{ marginTop: "8px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => onOpenDetails(localExtensionId)}
                    title="Open extension details in chrome://extensions"
                  >
                    <MaterialSymbol name="open_in_new" size={13} />
                    <span style={{ marginLeft: "4px" }}>Open Chrome details</span>
                  </button>
                </div>
              )}
            </div>
          </div>

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
                GA4 property ID for extension telemetry.
              </span>
            </div>
            <div className="settings-control">
              <input
                id="dev-proj-ga"
                type="text"
                className="settings-input dev-input-text"
                value={gaPropertyId}
                onInput={(e) => setGaPropertyId((e.target as HTMLInputElement).value)}
                placeholder="e.g. 123456789 or properties/123456789"
              />
            </div>
          </div>

          {/* Integration & Packaging Specification Notice */}
          <div className="dev-modal-spec-notice">
            <div className="dev-modal-spec-item">
              <MaterialSymbol name="analytics" size={15} color="var(--text-muted)" />
              <span>
                <strong>Google Analytics:</strong> Property linked. Live reporting requires Data API permissions.
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
