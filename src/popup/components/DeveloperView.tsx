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

  // Unlinked unpacked extensions detection
  const linkedLocalIds = new Set(
    projects.map((p) => p.localExtensionId).filter(Boolean) as string[]
  );
  const unlinkedDevExtensions = extensions.filter(
    (e) => e.installType === "development" && !linkedLocalIds.has(e.id)
  );

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
        <button
          type="button"
          className="btn btn-primary dev-add-project-btn"
          onClick={() => handleStartAdd()}
          style={{ backgroundColor: themeMainColor }}
        >
          <MaterialSymbol name="add" size={18} color="#ffffff" />
          <span>Add Project</span>
        </button>
      </header>

      {/* Unlinked unpacked extensions notification banner */}
      {unlinkedDevExtensions.length > 0 && (
        <div className="dev-banner-card">
          <div className="dev-banner-icon-slot">
            <MaterialSymbol name="science" size={20} color={themeMainColor} />
          </div>
          <div className="dev-banner-body">
            <div className="dev-banner-title">
              {unlinkedDevExtensions.length === 1
                ? "1 unpacked development extension detected"
                : `${unlinkedDevExtensions.length} unpacked development extensions detected`}
            </div>
            <div className="dev-banner-desc">
              Create a workspace project to bind this test build to its repository and store item.
            </div>
            <div className="dev-banner-actions">
              {unlinkedDevExtensions.slice(0, 3).map((ext) => (
                <button
                  key={ext.id}
                  type="button"
                  className="btn btn-secondary dev-quick-create-btn"
                  onClick={() =>
                    handleStartAdd({
                      id: `devproj_${generateId()}`,
                      name: ext.name,
                      localExtensionId: ext.id,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    })
                  }
                >
                  <MaterialSymbol name="add" size={14} />
                  <span>Create for &ldquo;{ext.name}&rdquo;</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Project list or Empty state */}
      {projects.length === 0 ? (
        <div className="dev-empty-state">
          <div className="dev-empty-icon-circle">
            <MaterialSymbol name="developer_board" size={36} color={themeMainColor} />
          </div>
          <h3 className="dev-empty-title">No Developer Projects Yet</h3>
          <p className="dev-empty-desc">
            Organize and bridge your extensions across local development, GitHub source repository, Chrome Web Store release listings, and Google Analytics telemetry.
          </p>
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
      ) : (
        <div className="dev-project-list">
          {projects.map((proj) => {
            const localExt = proj.localExtensionId
              ? extensions.find((e) => e.id === proj.localExtensionId)
              : null;
            const isLocalReloading = proj.localExtensionId
              ? reloadingIds.has(proj.localExtensionId)
              : false;

            return (
              <article key={proj.id} className="dev-project-card">
                {/* Project Card Header */}
                <div className="dev-project-card-header">
                  <div className="dev-project-identity">
                    <div className="dev-project-icon-frame">
                      {localExt?.icons && localExt.icons.length > 0 ? (
                        <img
                          src={localExt.icons[localExt.icons.length - 1].url}
                          alt={proj.name}
                          className="dev-project-icon"
                        />
                      ) : (
                        <MaterialSymbol name="terminal" size={24} color={themeMainColor} />
                      )}
                    </div>
                    <div>
                      <h3 className="dev-project-name">{proj.name}</h3>
                      <div className="dev-project-meta">
                        {localExt && (
                          <span className="dev-chip-badge" title="Unpacked extension">
                            DEV
                          </span>
                        )}
                        <span className="dev-meta-text">
                          Last updated {new Date(proj.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="dev-project-actions">
                    <button
                      type="button"
                      className="btn btn-secondary dev-card-btn"
                      onClick={() => handleStartEdit(proj)}
                      title="Edit project bindings"
                      aria-label="Edit project"
                    >
                      <MaterialSymbol name="edit" size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary dev-card-btn dev-delete-btn"
                      onClick={() => setDeleteConfirmId(proj.id)}
                      title="Delete project"
                      aria-label="Delete project"
                    >
                      <MaterialSymbol name="delete" size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* 5-Column Integration Grid */}
                <div className="dev-project-grid">
                  {/* 1. Local / Test Extension */}
                  <div className="dev-grid-tile">
                    <div className="dev-tile-header">
                      <MaterialSymbol name="science" size={16} color={themeMainColor} />
                      <h4>Local / Test Extension</h4>
                    </div>
                    <div className="dev-tile-body">
                      {proj.localExtensionId ? (
                        localExt ? (
                          <div className="dev-local-card">
                            <div className="dev-local-info">
                              <span className="dev-local-name" title={localExt.name}>
                                {localExt.name}
                              </span>
                              <span className="dev-local-version">v{localExt.version}</span>
                            </div>
                            <div className="dev-local-status-row">
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
                                  {localExt.enabled ? "ON" : "OFF"}
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
                                <button
                                  type="button"
                                  className="action-icon-btn"
                                  onClick={() => onOpenDetails(localExt.id)}
                                  title="Open Chrome details"
                                  aria-label="Open Chrome details"
                                >
                                  <MaterialSymbol name="settings" size={16} color={themeMainColor} />
                                </button>
                              </div>
                            </div>
                            <div className="dev-id-mono" title={localExt.id}>
                              ID: {localExt.id}
                            </div>
                          </div>
                        ) : (
                          <div className="dev-missing-card">
                            <span className="dev-pill dev-pill-warning">Extension Not Found</span>
                            <div className="dev-id-mono">ID: {proj.localExtensionId}</div>
                            <p className="dev-tile-subtext">The extension may have been removed.</p>
                          </div>
                        )
                      ) : (
                        <div className="dev-unbound-card">
                          <p className="dev-tile-subtext">No local development extension linked.</p>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStartEdit(proj)}
                          >
                            Link Local Extension
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. GitHub Repository */}
                  <div className="dev-grid-tile">
                    <div className="dev-tile-header">
                      <MaterialSymbol name="code" size={16} color={themeMainColor} />
                      <h4>GitHub Repository</h4>
                    </div>
                    <div className="dev-tile-body">
                      {proj.githubUrl ? (
                        <div className="dev-bound-card">
                          <div className="dev-link-preview" title={proj.githubUrl}>
                            {cleanGithubDisplay(proj.githubUrl)}
                          </div>
                          <div className="dev-bound-status-row">
                            <span className="dev-pill dev-pill-neutral">Not connected</span>
                            <a
                              href={proj.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm dev-link-action"
                            >
                              <MaterialSymbol name="open_in_new" size={14} />
                              <span>Open GitHub</span>
                            </a>
                          </div>
                          <p className="dev-tile-subtext">
                            Repo linked. Live CI/releases require API integration approval.
                          </p>
                        </div>
                      ) : (
                        <div className="dev-unbound-card">
                          <p className="dev-tile-subtext">No GitHub repository linked.</p>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStartEdit(proj)}
                          >
                            Link Repository
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Chrome Web Store */}
                  <div className="dev-grid-tile">
                    <div className="dev-tile-header">
                      <MaterialSymbol name="storefront" size={16} color={themeMainColor} />
                      <h4>Chrome Web Store</h4>
                    </div>
                    <div className="dev-tile-body">
                      {proj.cwsExtensionId ? (
                        <div className="dev-bound-card">
                          <div className="dev-id-mono" title={proj.cwsExtensionId}>
                            ID: {proj.cwsExtensionId}
                          </div>
                          <div className="dev-bound-status-row">
                            <span className="dev-pill dev-pill-neutral">Listing linked</span>
                            <a
                              href={`https://chromewebstore.google.com/detail/${proj.cwsExtensionId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm dev-link-action"
                            >
                              <MaterialSymbol name="open_in_new" size={14} />
                              <span>Open Store Listing</span>
                            </a>
                          </div>
                          <p className="dev-tile-subtext">
                            Store item linked. Publication API requires integration approval.
                          </p>
                        </div>
                      ) : (
                        <div className="dev-unbound-card">
                          <p className="dev-tile-subtext">No Chrome Web Store ID linked.</p>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStartEdit(proj)}
                          >
                            Link Store ID
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Google Analytics */}
                  <div className="dev-grid-tile">
                    <div className="dev-tile-header">
                      <MaterialSymbol name="analytics" size={16} color={themeMainColor} />
                      <h4>Google Analytics</h4>
                    </div>
                    <div className="dev-tile-body">
                      {proj.gaPropertyId ? (
                        <div className="dev-bound-card">
                          <div className="dev-id-mono">Property: {proj.gaPropertyId}</div>
                          <div className="dev-bound-status-row">
                            <span className="dev-pill dev-pill-neutral">Analytics not connected</span>
                          </div>
                          <div className="dev-metrics-reserved-grid">
                            <div className="dev-metric-slot">
                              <span className="dev-metric-label">Users</span>
                              <span className="dev-metric-val">&mdash;</span>
                              <span className="dev-metric-hint">API required</span>
                            </div>
                            <div className="dev-metric-slot">
                              <span className="dev-metric-label">Sessions</span>
                              <span className="dev-metric-val">&mdash;</span>
                              <span className="dev-metric-hint">API required</span>
                            </div>
                            <div className="dev-metric-slot">
                              <span className="dev-metric-label">Engagement</span>
                              <span className="dev-metric-val">&mdash;</span>
                              <span className="dev-metric-hint">API required</span>
                            </div>
                            <div className="dev-metric-slot">
                              <span className="dev-metric-label">Events</span>
                              <span className="dev-metric-val">&mdash;</span>
                              <span className="dev-metric-hint">API required</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="dev-unbound-card">
                          <p className="dev-tile-subtext">No Analytics property linked.</p>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStartEdit(proj)}
                          >
                            Link Analytics
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. Package / Store ZIP Area */}
                  <div className="dev-grid-tile dev-grid-tile-package">
                    <div className="dev-tile-header">
                      <MaterialSymbol name="inventory_2" size={16} color={themeMainColor} />
                      <h4>Store Package</h4>
                    </div>
                    <div className="dev-tile-body">
                      <div className="dev-package-card">
                        <div className="dev-package-status-row">
                          <button
                            type="button"
                            className="btn btn-secondary dev-package-download-btn disabled"
                            disabled
                            title="Permission setup required"
                          >
                            <MaterialSymbol name="download" size={16} color="var(--text-muted)" />
                            <span>Download store package</span>
                          </button>
                          <span className="dev-pill dev-pill-warning">Permission setup required</span>
                        </div>
                        <p className="dev-tile-subtext">
                          Downloading CRX/ZIP packages directly requires additional browser permissions (downloads/management). Ready for integration approval.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Project Editor Modal */}
      {editingProject && (
        <ProjectEditorModal
          project={editingProject}
          extensions={extensions}
          onSave={handleSaveModal}
          onClose={() => setEditingProject(null)}
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
  themeMainColor: string;
}

function ProjectEditorModal({
  project,
  extensions,
  onSave,
  onClose,
  themeMainColor,
}: ProjectEditorModalProps) {
  const [name, setName] = useState(project.name || "");
  const [localExtensionId, setLocalExtensionId] = useState(project.localExtensionId || "");
  const [cwsExtensionId, setCwsExtensionId] = useState(project.cwsExtensionId || "");
  const [githubUrl, setGithubUrl] = useState(project.githubUrl || "");
  const [gaPropertyId, setGaPropertyId] = useState(project.gaPropertyId || "");
  const [customLocalId, setCustomLocalId] = useState(false);

  // Development extensions grouped first
  const devExtensions = extensions.filter((e) => e.installType === "development");
  const otherExtensions = extensions.filter((e) => e.installType !== "development");

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
            <label className="settings-label" htmlFor="dev-proj-name">
              <span className="settings-title">Project Name *</span>
              <span className="settings-desc">A recognizable display name for this project.</span>
            </label>
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
            <label className="settings-label" htmlFor="dev-proj-local-ext">
              <span className="settings-title">Local Test Extension</span>
              <span className="settings-desc">Link to an installed unpacked development build.</span>
            </label>
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
                        const match = extensions.find((x) => x.id === val);
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
                  {otherExtensions.length > 0 && (
                    <optgroup label="Other Installed Extensions">
                      {otherExtensions.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.id.slice(0, 8)}...)
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
                    Select from installed
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* GitHub URL */}
          <div className="settings-row">
            <label className="settings-label" htmlFor="dev-proj-github">
              <span className="settings-title">GitHub Repository URL</span>
              <span className="settings-desc">Link to the source repository.</span>
            </label>
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
            <label className="settings-label" htmlFor="dev-proj-cws">
              <span className="settings-title">Chrome Web Store Item ID</span>
              <span className="settings-desc">
                The 32-character published store item ID or full store URL.
              </span>
            </label>
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
            <label className="settings-label" htmlFor="dev-proj-ga">
              <span className="settings-title">Google Analytics Property ID</span>
              <span className="settings-desc">
                GA4 property ID for extension telemetry.
              </span>
            </label>
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
