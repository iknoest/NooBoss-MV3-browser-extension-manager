import type { HistoryRecord, KnownExtensionMetadata, ExtensionInfo } from "../../shared/types";
import { MaterialSymbol } from "./MaterialSymbols";
import { resolveMissingMemberIdentity } from "./group-member-utils";

export interface MissingGroupMembersProps {
  missingIds: string[];
  history?: HistoryRecord[];
  knownExtensions?: Record<string, KnownExtensionMetadata>;
  installedExtensions?: ExtensionInfo[];
  searchFilter?: string;
  onRemoveMember: (extensionId: string) => void;
  title?: string;
  themeMainColor?: string;
  isEditor?: boolean;
}

export function MissingGroupMembers({
  missingIds,
  history = [],
  knownExtensions = {},
  installedExtensions = [],
  searchFilter,
  onRemoveMember,
  title,
  themeMainColor: _themeMainColor,
  isEditor = false,
}: MissingGroupMembersProps) {
  if (!missingIds || missingIds.length === 0) {
    return null;
  }

  const handleCopyId = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(id).catch(() => {});
    }
    const btn = e.currentTarget as HTMLButtonElement | null;
    if (btn) {
      const originalText = btn.innerText;
      btn.innerText = "Copied";
      btn.setAttribute("aria-label", `Copied ID ${id}`);
      setTimeout(() => {
        if (btn) {
          btn.innerText = originalText || "Copy ID";
          btn.setAttribute("aria-label", `Copy ID ${id}`);
        }
      }, 2000);
    }
  };

  const handleLookupId = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const url = `https://chromewebstore.google.com/search?q=${encodeURIComponent(id)}`;
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const filteredIds = searchFilter && searchFilter.trim()
    ? missingIds.filter((id) => {
        const identity = resolveMissingMemberIdentity(id, knownExtensions, history, installedExtensions);
        const name = identity.name;
        const q = searchFilter.trim().toLowerCase();
        return name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
      })
    : missingIds;

  if (filteredIds.length === 0) {
    return null;
  }

  const sectionTitle = title || `Missing from Chrome (${missingIds.length})`;

  return (
    <div className={`missing-group-members-section ${isEditor ? "in-editor" : "in-focus"}`}>
      <h3 className="nb-heading missing-members-heading">
        <MaterialSymbol name="extension_off" size={18} color="var(--text-secondary)" fallback="help" />
        <span>{sectionTitle}</span>
      </h3>
      <div className="missing-members-list">
        {filteredIds.map((id) => {
          const identity = resolveMissingMemberIdentity(id, knownExtensions, history, installedExtensions);
          const displayName = identity.name;
          const isKnown = identity.isKnown;

          return (
            <div key={id} className="missing-member-card">
              <div className="missing-member-icon-wrapper">
                <MaterialSymbol name="extension_off" size={20} color="var(--text-muted)" fallback="help" />
              </div>
              <div className="missing-member-info">
                <span className="missing-member-name" title={displayName}>
                  {displayName}
                </span>
                <span className="missing-member-id" title={id}>
                  {id}
                </span>
              </div>
              <div className="missing-member-actions">
                <span
                  className="status-pill missing"
                  title="This extension is saved as part of the group but not currently installed in Chrome."
                >
                  Missing
                </span>
                <button
                  type="button"
                  className="btn btn-secondary action-btn missing-copy-btn"
                  onClick={(e) => handleCopyId(e as unknown as MouseEvent, id)}
                  title="Copy extension ID to clipboard"
                  aria-label={`Copy ID ${id}`}
                >
                  <MaterialSymbol name="content_copy" size={14} />
                  <span>Copy ID</span>
                </button>
                {!isKnown && (
                  <button
                    type="button"
                    className="btn btn-secondary action-btn missing-lookup-btn"
                    onClick={(e) => handleLookupId(e as unknown as MouseEvent, id)}
                    title="Look up extension in Chrome Web Store"
                    aria-label={`Look up ${id} in Chrome Web Store`}
                  >
                    <MaterialSymbol name="travel_explore" size={14} fallback="search" />
                    <span>Look up</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary action-btn missing-remove-btn"
                  onClick={() => onRemoveMember(id)}
                  title="Remove from group"
                  aria-label={`Remove ${displayName} (${id}) from group`}
                >
                  <MaterialSymbol name="delete" size={14} />
                  <span>Remove from group</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
