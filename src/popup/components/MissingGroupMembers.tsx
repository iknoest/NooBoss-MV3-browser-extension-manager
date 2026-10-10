import type { HistoryRecord } from "../../shared/types";
import { MaterialSymbol } from "./MaterialSymbols";
import { resolveLastKnownExtensionName } from "./group-member-utils";

export interface MissingGroupMembersProps {
  missingIds: string[];
  history?: HistoryRecord[];
  searchFilter?: string;
  onRemoveMember: (extensionId: string) => void;
  title?: string;
  themeMainColor?: string;
  isEditor?: boolean;
}

export function MissingGroupMembers({
  missingIds,
  history = [],
  searchFilter,
  onRemoveMember,
  title,
  themeMainColor: _themeMainColor,
  isEditor = false,
}: MissingGroupMembersProps) {
  if (!missingIds || missingIds.length === 0) {
    return null;
  }

  const filteredIds = searchFilter && searchFilter.trim()
    ? missingIds.filter((id) => {
        const name = resolveLastKnownExtensionName(id, history) || "Unknown extension";
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
          const lastName = resolveLastKnownExtensionName(id, history);
          const displayName = lastName || "Unknown extension";

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
                  className="btn btn-secondary action-btn missing-remove-btn"
                  onClick={() => onRemoveMember(id)}
                  title="Remove from group"
                  aria-label={`Remove ${displayName} (${id}) from group`}
                >
                  <MaterialSymbol name="delete" size={15} />
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
