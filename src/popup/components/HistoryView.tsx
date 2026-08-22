import { useState } from "preact/hooks";
import type { HistoryRecord } from "../../shared/types";
import { GL, timeAgo } from "./i18n";

export interface HistoryViewProps {
  records: HistoryRecord[];
  onClearHistory: () => void;
  onOpenSubWindow?: (type: "extension", id: string) => void;
  themeMainColor?: string;
}

export function HistoryView({
  records = [],
  onClearHistory,
  onOpenSubWindow,
  themeMainColor,
}: HistoryViewProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [maxDisplay, setMaxDisplay] = useState(40);

  const handleEmpty = () => {
    onClearHistory();
    setShowConfirm(false);
  };

  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);
  const displayed = sortedRecords.slice(0, maxDisplay);

  return (
    <div className="nb-page">
      <div style={{ marginBottom: "14px" }}>
        <button className="nb-btn" onClick={() => setShowConfirm(true)}>
          {GL("empty_history")}
        </button>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          textAlign: "left",
        }}
      >
        <thead>
          <tr style={{ borderBottom: `1px solid ${themeMainColor || "#c393dc"}`, height: "30px" }}>
            <th style={{ width: "130px" }}>{GL("when")}</th>
            <th style={{ width: "90px" }}>{GL("event")}</th>
            <th style={{ width: "40px" }}>{GL("icon")}</th>
            <th style={{ width: "320px" }}>{GL("name")}</th>
            <th>{GL("version")}</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((rec) => (
            <tr
              key={rec.id}
              style={{
                borderBottom: "1px solid #f0f0f0",
                height: "36px",
                transition: "background 0.15s",
              }}
            >
              <td style={{ color: "#666" }}>{timeAgo(rec.timestamp)}</td>
              <td style={{ fontWeight: 500 }}>
                {rec.event.charAt(0).toUpperCase() + rec.event.slice(1)}
              </td>
              <td>
                <span style={{ fontSize: "16px", verticalAlign: "middle" }}>🧩</span>
              </td>
              <td>
                <span
                  style={{
                    color: themeMainColor || "#c393dc",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                  onClick={() => onOpenSubWindow?.("extension", rec.extensionId)}
                  title={rec.extensionName}
                >
                  {rec.extensionName}
                </span>
              </td>
              <td style={{ color: "#777" }}>{rec.extensionVersion}</td>
            </tr>
          ))}
          {displayed.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                No history records yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {sortedRecords.length > maxDisplay && (
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button
            className="nb-btn"
            style={{ fontSize: "12px", minWidth: "120px" }}
            onClick={() => setMaxDisplay((m) => m + 30)}
          >
            Load More ({sortedRecords.length - maxDisplay} remaining)
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="subwindow-overlay" onClick={() => setShowConfirm(false)}>
          <div
            style={{
              width: "300px",
              padding: "20px",
              background: "#fff",
              textAlign: "center",
              boxShadow: "0 0 16px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "16px", marginBottom: "16px" }}>{GL("are_you_sure")}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
              <button className="nb-btn" onClick={handleEmpty}>
                {GL("confirm")}
              </button>
              <button className="nb-btn inActive" onClick={() => setShowConfirm(false)}>
                {GL("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
