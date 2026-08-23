import { useState } from "preact/hooks";
import type { ExtensionInfo, ExtensionGroup, AutoStateRule, PendingAutoStateChange, AppSettings } from "../../shared/types";
import { Selector } from "./Selector";
import { GL } from "./i18n";
import { Edity, Removy, Groupy } from "./icons";
import { ExtensionSwitch } from "./ExtensionBrief";

export interface AutoStateViewProps {
  extensions: ExtensionInfo[];
  groups: ExtensionGroup[];
  rules: AutoStateRule[];
  settings?: AppSettings;
  pendingChanges?: PendingAutoStateChange[];
  viewMode?: "tile" | "bigTile" | "list";
  onChangeViewMode?: (mode: "tile" | "bigTile" | "list") => void;
  onSaveRules: (rules: AutoStateRule[]) => void;
  onApplyPending?: (extensionId: string, enabled: boolean) => void;
  onDismissPending?: (extensionId: string) => void;
  themeMainColor?: string;
}

export function AutoStateView({
  extensions = [],
  groups = [],
  rules = [],
  settings: _settings,
  pendingChanges = [],
  viewMode = "tile",
  onChangeViewMode,
  onSaveRules,
  onApplyPending,
  onDismissPending,
  themeMainColor = "#1a73e8",
}: AutoStateViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ruleAction, setRuleAction] = useState<AutoStateRule["action"]>("enableOnlyWhileMatched");
  const [rulePattern, setRulePattern] = useState<string>("");
  const [ruleIsWildcard, setRuleIsWildcard] = useState<boolean>(false);
  const [ruleTargets, setRuleTargets] = useState<string[]>([]);

  const handleToggleTarget = (id: string) => {
    setRuleTargets((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSetCurrentWebsite = async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (tabs && tabs[0] && tabs[0].url) {
          const u = new URL(tabs[0].url);
          setRulePattern(u.origin);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleAddOrUpdateRule = () => {
    if (!rulePattern && ruleTargets.length === 0) return;

    if (editingId) {
      // Update existing
      const updated = rules.map((r) =>
        r.id === editingId
          ? {
              ...r,
              action: ruleAction,
              pattern: rulePattern,
              isWildcard: ruleIsWildcard,
              targets: ruleTargets,
            }
          : r
      );
      onSaveRules(updated);
      setEditingId(null);
    } else {
      // Create new
      const newRule: AutoStateRule = {
        id: "rule_" + Date.now().toString(36),
        enabled: true,
        name: rulePattern || "New Rule",
        pattern: rulePattern,
        isWildcard: ruleIsWildcard,
        targets: ruleTargets,
        action: ruleAction,
        priority: rules.length + 1,
        createdAt: Date.now(),
      };
      onSaveRules([...rules, newRule]);
    }

    // Reset form
    setRuleTargets([]);
    setRulePattern("");
    setRuleAction("enableOnlyWhileMatched");
    setRuleIsWildcard(false);
  };

  const handleEditRule = (rule: AutoStateRule) => {
    setEditingId(rule.id);
    setRuleAction(rule.action);
    setRulePattern(rule.pattern);
    setRuleIsWildcard(rule.isWildcard);
    setRuleTargets([...rule.targets]);
  };

  const handleDeleteRule = (ruleId: string) => {
    onSaveRules(rules.filter((r) => r.id !== ruleId));
    if (editingId === ruleId) {
      setEditingId(null);
      setRuleTargets([]);
      setRulePattern("");
    }
  };

  const handleToggleRule = (ruleId: string) => {
    const updated = rules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    onSaveRules(updated);
  };

  // Helper to render target icon list
  const renderTargetIcons = (targetIds: string[]) => {
    return targetIds.map((id) => {
      if (id.startsWith("group_") || id.startsWith("NooBoss-Group")) {
        const grp = groups.find((g) => g.id === id);
        return (
          <span
            key={id}
            title={grp ? grp.name : id}
            style={{ display: "inline-block", marginRight: "6px", verticalAlign: "middle" }}
          >
            <Groupy color={themeMainColor} style={{ width: "22px", height: "22px" }} />
          </span>
        );
      }
      const ext = extensions.find((e) => e.id === id);
      const iconUrl = ext?.icons && ext.icons.length > 0 ? ext.icons[ext.icons.length - 1].url : "";
      return (
        <span
          key={id}
          title={ext ? ext.name : id}
          style={{ display: "inline-block", marginRight: "6px", verticalAlign: "middle" }}
        >
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={ext?.name}
              style={{ width: "22px", height: "22px", objectFit: "contain", borderRadius: "3px" }}
            />
          ) : (
            <span style={{ fontSize: "16px" }}>🧩</span>
          )}
        </span>
      );
    });
  };

  return (
    <div className="nb-page">
      {/* MV3 Pending Changes Banner (if in assisted mode) */}
      {pendingChanges.length > 0 && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            padding: "10px 14px",
            marginBottom: "16px",
            borderRadius: "var(--radius-md)",
          }}
        >
          <strong style={{ color: "#b45309", display: "block", marginBottom: "4px" }}>
            Assisted Mode: {pendingChanges.length} Pending State Change{pendingChanges.length > 1 ? "s" : ""}
          </strong>
          {pendingChanges.map((change) => (
            <div
              key={change.extensionId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: "12px",
              }}
            >
              <span>
                {change.extensionName}: turn <strong>{change.targetEnabled ? "ON" : "OFF"}</strong> (rule: {change.ruleName})
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className="btn btn-primary"
                  style={{ height: "26px", fontSize: "11px", padding: "0 8px" }}
                  onClick={() => onApplyPending?.(change.extensionId, change.targetEnabled)}
                >
                  Apply
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ height: "26px", fontSize: "11px", padding: "0 8px" }}
                  onClick={() => onDismissPending?.(change.extensionId)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rules Table */}
      <h2 className="nb-heading">{GL("rules")}</h2>
      <div className="history-table-wrapper" style={{ marginBottom: "24px" }}>
        <table className="nb-table history-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>#</th>
              <th style={{ width: "160px" }}>{GL("target_s")}</th>
              <th style={{ width: "130px" }}>{GL("action")}</th>
              <th>{GL("match")}</th>
              <th style={{ width: "90px" }}>{GL("pattern")}</th>
              <th style={{ width: "50px", textAlign: "center" }}>State</th>
              <th style={{ width: "40px", textAlign: "center" }}></th>
              <th style={{ width: "40px", textAlign: "center" }}></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, idx) => {
              const actionKey = rule.action.replace("WhileMatched", "").replace("Matched", "");
              return (
                <tr key={rule.id} className="history-row">
                  <td>{idx + 1}</td>
                  <td style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                    {renderTargetIcons(rule.targets)}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {GL(actionKey)}
                  </td>
                  <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <code>{rule.pattern}</code>
                  </td>
                  <td>
                    <span className="history-badge event-update">
                      {GL(rule.isWildcard ? "wildcard" : "RegExp")}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <ExtensionSwitch
                      id={rule.id}
                      enabled={rule.enabled}
                      onToggle={() => handleToggleRule(rule.id)}
                      size="small"
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="action-icon-btn"
                      onClick={() => handleEditRule(rule)}
                      title="Edit Rule"
                      aria-label="Edit Rule"
                    >
                      <Edity color={themeMainColor} size={16} />
                    </button>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="action-icon-btn"
                      onClick={() => handleDeleteRule(rule.id)}
                      title="Delete Rule"
                      aria-label="Delete Rule"
                    >
                      <Removy color={themeMainColor} size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rules.length === 0 && (
              <tr>
                <td colSpan={8} className="history-empty-cell">
                  No AutoState rules configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New / Edit Rule Section */}
      <h2 className="nb-heading">
        {editingId ? "Edit Rule" : GL("new_rule")}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px", background: "var(--bg-secondary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "100px", fontWeight: 600, color: "var(--text-secondary)" }}>{GL("target_s")}</div>
          <div style={{ flex: 1, minHeight: "32px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
            {ruleTargets.length > 0 ? (
              renderTargetIcons(ruleTargets)
            ) : (
              <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "12px" }}>Select targets below</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "100px", fontWeight: 600, color: "var(--text-secondary)" }}>{GL("action")}</div>
          <select
            value={ruleAction}
            onChange={(e) => setRuleAction((e.target as HTMLSelectElement).value as AutoStateRule["action"])}
          >
            <option value="enableOnlyWhileMatched">{GL("enableOnly")}</option>
            <option value="disableOnlyWhileMatched">{GL("disableOnly")}</option>
            <option value="enableWhenMatched">{GL("enableWhen")}</option>
            <option value="disableWhenMatched">{GL("disableWhen")}</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "100px", fontWeight: 600, color: "var(--text-secondary)" }}>{GL("match")}</div>
          <input
            style={{ width: "320px" }}
            placeholder="URL or regex (e.g. github.com)"
            value={rulePattern}
            onInput={(e) => setRulePattern((e.target as HTMLInputElement).value)}
          />
          <button
            className="btn btn-secondary action-btn"
            style={{ fontSize: "12px" }}
            onClick={handleSetCurrentWebsite}
          >
            {GL("set_as_current_website")}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "100px", fontWeight: 600, color: "var(--text-secondary)" }}>{GL("pattern")}</div>
          <select
            value={ruleIsWildcard ? "wildcard" : "RegExp"}
            onChange={(e) => setRuleIsWildcard((e.target as HTMLSelectElement).value === "wildcard")}
          >
            <option value="RegExp">{GL("RegExp")}</option>
            <option value="wildcard">{GL("wildcard")}</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button className="btn btn-primary action-btn" onClick={handleAddOrUpdateRule}>
            {editingId ? "Update rule" : GL("add_rule")}
          </button>
          {editingId && (
            <button
              className="btn btn-secondary action-btn"
              onClick={() => {
                setEditingId(null);
                setRuleTargets([]);
                setRulePattern("");
              }}
            >
              {GL("cancel")}
            </button>
          )}
        </div>
      </div>

      {/* Embedded Target Selector */}
      <h2 className="nb-heading">{GL("select_target_s")}</h2>
      <Selector
        extensions={extensions}
        groups={groups}
        viewMode={viewMode}
        onChangeViewMode={onChangeViewMode}
        actionBar={true}
        withControl={false}
        selectedList={ruleTargets}
        onSelect={handleToggleTarget}
        themeMainColor={themeMainColor}
      />
    </div>
  );
}
