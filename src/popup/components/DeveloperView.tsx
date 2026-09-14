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

      {/* Main Data Grid Table or Empty State */}
      {!hasContent ? (
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
        <div className="dev-table-container">
          <table className="dev-table" aria-label="Developer Projects and Builds">
            <thead>
              <tr className="dev-table-header">
                <th className="col-project">Project</th>
                <th className="col-local">Local / Test</th>
                <th className="col-github">GitHub</th>
                <th className="col-store">Store</th>
                <th className="col-analytics">Analytics</th>
                <th className="col-package">Package</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Configured Projects */}
              {projects.map((proj) => {
                const localExt = proj.localExtensionId
                  ? extensions.find((e) => e.id === proj.localExtensionId)
                  : null;
                const isLocalReloading = proj.localExtensionId
                  ? reloadingIds.has(proj.localExtensionId)
                  : false;

                return (
                  <tr
                    key={proj.id}
                    className="dev-table-row dev-project-row"
                    onClick={() => handleStartEdit(proj)}
                    title="Click row to edit project"
                  >
                    {/* Project Name & Icon */}
                    <td className="col-project">
                      <div className="dev-cell dev-cell-project">
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
                        <div className="dev-project-info">
                          <span className="dev-project-name" title={proj.name}>
                            {proj.name}
                          </span>
                          <div className="dev-project-badges">
                            {localExt && (
                              <span className="dev-chip-badge" title="Unpacked development extension">
                                DEV
                              </span>
                            )}
                            {proj.cwsExtensionId && (
                              <span className="dev-pill dev-pill-published" title="Store listing configured">
                                Published
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Local / Test Build */}
                    <td className="col-local" onClick={(e) => e.stopPropagation()}>
                      <div className="dev-cell dev-cell-local">
                        {proj.localExtensionId ? (
                          localExt ? (
                            <div className="dev-local-compact">
                              <div className="dev-local-top">
                                <span className="dev-local-meta">
                                  DEV · v{localExt.version}
                                </span>
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
                              </div>
                              <div className="dev-local-bottom">
                                <span className="dev-id-mono" title={localExt.id}>
                                  ID: {localExt.id.slice(0, 8)}...
                                </span>
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
                                      size={15}
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
                                    <MaterialSymbol
                                      name="settings"
                                      size={15}
                                      color={themeMainColor}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="dev-cell-unlinked"
                              title={`Missing extension ID: ${proj.localExtensionId}`}
                            >
                              <span className="dev-pill dev-pill-warning">Missing build</span>
                              <span className="dev-id-mono">
                                ID: {proj.localExtensionId.slice(0, 8)}...
                              </span>
                            </div>
                          )
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs dev-cell-link-btn"
                            onClick={() => handleStartEdit(proj)}
                          >
                            <MaterialSymbol name="add" size={13} />
                            <span>Link Local</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* GitHub */}
                    <td className="col-github" onClick={(e) => e.stopPropagation()}>
                      <div className="dev-cell dev-cell-github">
                        {proj.githubUrl ? (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="dev-link-pill"
                            title={proj.githubUrl}
                          >
                            <MaterialSymbol name="code" size={14} color={themeMainColor} />
                            <span className="dev-link-text">
                              {cleanGithubDisplay(proj.githubUrl)}
                            </span>
                            <MaterialSymbol
                              name="open_in_new"
                              size={12}
                              color="var(--text-muted)"
                            />
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs dev-cell-link-btn"
                            onClick={() => handleStartEdit(proj)}
                          >
                            <MaterialSymbol name="add" size={13} />
                            <span>Link</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Store */}
                    <td className="col-store" onClick={(e) => e.stopPropagation()}>
                      <div className="dev-cell dev-cell-store">
                        {proj.cwsExtensionId ? (
                          <a
                            href={`https://chromewebstore.google.com/detail/${proj.cwsExtensionId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="dev-link-pill"
                            title={`Store ID: ${proj.cwsExtensionId}`}
                          >
                            <MaterialSymbol name="storefront" size={14} color={themeMainColor} />
                            <span className="dev-link-text">Listing</span>
                            <MaterialSymbol
                              name="open_in_new"
                              size={12}
                              color="var(--text-muted)"
                            />
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs dev-cell-link-btn"
                            onClick={() => handleStartEdit(proj)}
                          >
                            <MaterialSymbol name="add" size={13} />
                            <span>Link</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Analytics */}
                    <td className="col-analytics" onClick={(e) => e.stopPropagation()}>
                      <div className="dev-cell dev-cell-analytics">
                        {proj.gaPropertyId ? (
                          <span
                            className="dev-pill dev-pill-ga4"
                            title={`GA4 Property: ${proj.gaPropertyId} (Google Analytics Data API v1beta integration planned)`}
                          >
                            <MaterialSymbol name="analytics" size={13} />
                            <span>GA4 linked</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs dev-cell-link-btn"
                            onClick={() => handleStartEdit(proj)}
                          >
                            <MaterialSymbol name="add" size={13} />
                            <span>Link</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Package */}
                    <td className="col-package" onClick={(e) => e.stopPropagation()}>
                      <div className="dev-cell dev-cell-package">
                        <span
                          className="dev-pill dev-pill-muted"
                          title="Direct CRX/ZIP package downloading requires additional browser permissions (downloads). Implementation planned."
                        >
                          Not enabled
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="dev-cell dev-cell-actions">
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
                    </td>
                  </tr>
                );
              })}

              {/* Unlinked Development Extensions Section */}
              {unlinkedDevExtensions.length > 0 && (
                <tr className="dev-section-divider-row">
                  <td colSpan={7}>
                    <div className="dev-section-divider-content">
                      <MaterialSymbol name="science" size={16} color={themeMainColor} />
                      <span className="dev-section-divider-title">
                        Unlinked Development Extensions ({unlinkedDevExtensions.length})
                      </span>
                      <span className="dev-section-divider-desc">
                        Detected unpacked test builds not yet associated with a project.
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {/* All Unlinked Development Extensions rendered as table rows */}
              {unlinkedDevExtensions.map((ext) => {
                const isLocalReloading = reloadingIds.has(ext.id);

                return (
                  <tr key={ext.id} className="dev-table-row dev-unlinked-row">
                    {/* Project */}
                    <td className="col-project">
                      <div className="dev-cell dev-cell-project">
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
                        <div className="dev-project-info">
                          <span className="dev-project-name" title={ext.name}>
                            {ext.name}
                          </span>
                          <div className="dev-project-badges">
                            <span className="dev-chip-badge" title="Unpacked development extension">
                              DEV
                            </span>
                            <span className="dev-pill dev-pill-neutral">Unlinked</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Local / Test */}
                    <td className="col-local">
                      <div className="dev-cell dev-cell-local">
                        <div className="dev-local-compact">
                          <div className="dev-local-top">
                            <span className="dev-local-meta">
                              DEV · v{ext.version}
                            </span>
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
                                {ext.enabled ? "ON" : "OFF"}
                              </span>
                            </div>
                          </div>
                          <div className="dev-local-bottom">
                            <span className="dev-id-mono" title={ext.id}>
                              ID: {ext.id.slice(0, 8)}...
                            </span>
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
                                  size={15}
                                  color={
                                    ext.enabled
                                      ? themeMainColor
                                      : "var(--text-muted, #888)"
                                  }
                                />
                              </button>
                              <button
                                type="button"
                                className="action-icon-btn"
                                onClick={() => onOpenDetails(ext.id)}
                                title="Open Chrome details"
                                aria-label="Open Chrome details"
                              >
                                <MaterialSymbol
                                  name="settings"
                                  size={15}
                                  color={themeMainColor}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* GitHub */}
                    <td className="col-github">
                      <div className="dev-cell dev-cell-github">
                        <span className="dev-cell-empty-dash">&mdash;</span>
                      </div>
                    </td>

                    {/* Store */}
                    <td className="col-store">
                      <div className="dev-cell dev-cell-store">
                        <span className="dev-cell-empty-dash">&mdash;</span>
                      </div>
                    </td>

                    {/* Analytics */}
                    <td className="col-analytics">
                      <div className="dev-cell dev-cell-analytics">
                        <span className="dev-cell-empty-dash">&mdash;</span>
                      </div>
                    </td>

                    {/* Package */}
                    <td className="col-package">
                      <div className="dev-cell dev-cell-package">
                        <span className="dev-cell-empty-dash">&mdash;</span>
                      </div>
                    </td>

                    {/* Actions: Set Up button */}
                    <td className="col-actions">
                      <div className="dev-cell dev-cell-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-xs dev-setup-btn"
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
                          <MaterialSymbol name="add" size={14} color="#ffffff" />
                          <span>Set up</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
