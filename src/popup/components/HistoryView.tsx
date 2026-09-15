import { useState } from "preact/hooks";
import type { HistoryRecord, ExtensionInfo } from "../../shared/types";
import { GL, timeAgo } from "./i18n";
import { MaterialSymbol } from "./MaterialSymbols";

export type HistoryEventFilter = "all" | "installed" | "uninstalled" | "enabled" | "disabled" | "updated";

export interface HistoryViewProps {
  records: HistoryRecord[];
  extensions?: ExtensionInfo[];
  onClearHistory: () => void;
  onOpenSubWindow?: (type: "extension", id: string) => void;
  themeMainColor?: string;
}

export function HistoryView({
  records = [],
  extensions = [],
  onClearHistory,
  onOpenSubWindow,
  themeMainColor: _themeMainColor,
}: HistoryViewProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [maxDisplay, setMaxDisplay] = useState(40);
  const [eventFilter, setEventFilter] = useState<HistoryEventFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleEmpty = () => {
    onClearHistory();
    setShowConfirm(false);
  };

  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);
  const filteredRecords = sortedRecords.filter((rec) => {
    if (eventFilter !== "all" && rec.event !== eventFilter) {
      return false;
    }
    if (searchQuery.trim() && !rec.extensionName.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
      return false;
    }
    return true;
  });
  const displayed = filteredRecords.slice(0, maxDisplay);

  const getExtensionIcon = (extId: string, name: string) => {
    const ext = extensions.find((e) => e.id === extId);
    if (ext && ext.icons && ext.icons.length > 0) {
      return (
        <img
          src={ext.icons[ext.icons.length - 1].url}
          alt={name}
          className="history-inline-icon"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = "none";
          }}
        />
      );
    }
    return (
      <span className="history-inline-fallback">
        <MaterialSymbol name="extension" size={16} color="var(--text-muted)" />
      </span>
    );
  };

  return (
    <div className="nb-page">
      <div className="history-toolbar">
        <select
          id="historyEventFilter"
          className="history-event-filter"
          value={eventFilter}
          onChange={(e) => {
            setEventFilter((e.target as HTMLSelectElement).value as HistoryEventFilter);
            setMaxDisplay(40);
          }}
          aria-label="Filter history by event type"
        >
          <option value="all">All events</option>
          <option value="installed">Installed</option>
          <option value="uninstalled">Uninstalled</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
          <option value="updated">Updated</option>
        </select>

        <div className="history-search-wrapper">
          <input
            id="historySearch"
            type="text"
            className="history-search-input"
            placeholder="Search by extension name..."
            value={searchQuery}
            onInput={(e) => {
              setSearchQuery((e.target as HTMLInputElement).value);
              setMaxDisplay(40);
            }}
            aria-label="Search history by extension name"
          />
          {searchQuery && (
            <span
              className="clear-history-search"
              onClick={() => setSearchQuery("")}
              title="Clear search"
              role="button"
              tabIndex={0}
              aria-label="Clear search"
            >
              <MaterialSymbol name="close" size={16} color="var(--text-muted)" />
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn btn-secondary action-btn history-clear-btn"
          onClick={() => setShowConfirm(true)}
        >
          {GL("empty_history")}
        </button>
      </div>

      <div className="history-table-wrapper">
        <table className="nb-table history-table">
          <thead>
            <tr>
              <th style={{ width: "130px" }}>{GL("when")}</th>
              <th style={{ width: "100px" }}>{GL("event")}</th>
              <th>{GL("name")}</th>
              <th style={{ width: "100px" }}>{GL("version")}</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((rec) => (
              <tr key={rec.id} className="history-row">
                <td className="history-when">{timeAgo(rec.timestamp)}</td>
                <td className="history-event">
                  <span className={`history-badge event-${rec.event}`}>
                    {rec.event.charAt(0).toUpperCase() + rec.event.slice(1)}
                  </span>
                </td>
                <td className="history-name-cell">
                  <div
                    className="history-name-wrap clickable"
                    onClick={() => onOpenSubWindow?.("extension", rec.extensionId)}
                    title={rec.extensionName}
                  >
                    {getExtensionIcon(rec.extensionId, rec.extensionName)}
                    <span className="history-ext-name">{rec.extensionName}</span>
                  </div>
                </td>
                <td className="history-version">{rec.extensionVersion}</td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={4} className="history-empty-cell">
                  {records.length === 0
                    ? "No history records yet."
                    : "No events match the current filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredRecords.length > maxDisplay && (
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button
            type="button"
            className="btn btn-secondary action-btn"
            style={{ fontSize: "12px", minWidth: "120px" }}
            onClick={() => setMaxDisplay((m) => m + 30)}
          >
            Load More ({filteredRecords.length - maxDisplay} remaining)
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="subwindow-overlay" onClick={() => setShowConfirm(false)}>
          <div
            className="confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-title">{GL("are_you_sure")}</div>
            <div className="confirm-modal-actions">
              <button className="btn btn-primary" onClick={handleEmpty}>
                {GL("confirm")}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                {GL("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
