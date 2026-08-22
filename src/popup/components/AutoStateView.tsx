import { useState } from "preact/hooks";
import type { ExtensionInfo, ExtensionGroup, AutoStateRule, PendingAutoStateChange, AppSettings } from "../../shared/types";
import { Selector } from "./Selector";
import { GL } from "./i18n";
import { Edity, Removy, Groupy } from "./icons";

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
  themeMainColor,
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
            <Groupy color={themeMainColor} style={{ width: "24px", height: "24px" }} />
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
              style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "4px" }}
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
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            padding: "8px 12px",
            marginBottom: "16px",
            borderRadius: "4px",
          }}
        >
          <strong style={{ color: "#92400e", display: "block", marginBottom: "4px" }}>
            Assisted Mode: {pendingChanges.length} Pending State Changes
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
                  className="nb-btn"
                  style={{ minWidth: "50px", fontSize: "12px", padding: "2px 8px" }}
                  onClick={() => onApplyPending?.(change.extensionId, change.targetEnabled)}
                >
                  Apply
                </button>
                <button
                  className="nb-btn inActive"
                  style={{ minWidth: "50px", fontSize: "12px", padding: "2px 8px" }}
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
      <h2 className="nb-heading" style={{ fontSize: "24px" }}>{GL("rules")}</h2>
      <table
        id="rules"
        style={{
          width: "100%",
          tableLayout: "fixed",
          fontSize: "14px",
          borderCollapse: "collapse",
          marginBottom: "20px",
        }}
      >
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ width: "30px", padding: "6px 0" }}>#</th>
            <th style={{ width: "160px" }}>{GL("target_s")}</th>
            <th style={{ width: "120px" }}>{GL("action")}</th>
            <th style={{ width: "220px" }}>{GL("match")}</th>
            <th style={{ width: "80px" }}>{GL("pattern")}</th>
            <th style={{ width: "50px", textAlign: "center" }}></th>
            <th style={{ width: "36px", textAlign: "center" }}></th>
            <th style={{ width: "36px", textAlign: "center" }}></th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule, idx) => {
            const actionKey = rule.action.replace("WhileMatched", "").replace("Matched", "");
            return (
              <tr key={rule.id} style={{ borderBottom: "1px solid #f0f0f0", height: "40px" }}>
                <td>{idx + 1}</td>
                <td style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                  {renderTargetIcons(rule.targets)}
                </td>
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {GL(actionKey)}
                </td>
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {rule.pattern}
                </td>
                <td>{GL(rule.isWildcard ? "wildcard" : "RegExp")}</td>
              <td style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  id={`rule-switch-${rule.id}`}
                  className="switch-input"
                  checked={rule.enabled}
                  onChange={() => handleToggleRule(rule.id)}
                />
                <label htmlFor={`rule-switch-${rule.id}`} className="switch-label" />
              </td>
              <td style={{ textAlign: "center" }}>
                <Edity
                  color={themeMainColor}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  onClick={() => handleEditRule(rule)}
                />
              </td>
              <td style={{ textAlign: "center" }}>
                <Removy
                  color={themeMainColor}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  onClick={() => handleDeleteRule(rule.id)}
                />
              </td>
            </tr>
            );
          })}
          {rules.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: "16px", textAlign: "center", color: "#888" }}>
                No AutoState rules configured.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* New / Edit Rule Section */}
      <h2 className="nb-heading" style={{ fontSize: "24px" }}>
        {editingId ? "Edit Rule" : GL("new_rule")}
      </h2>

      <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: "100px", fontWeight: "bold" }}>{GL("target_s")}</div>
          <div style={{ flex: 1, minHeight: "30px", display: "flex", alignItems: "center" }}>
            {ruleTargets.length > 0 ? (
              renderTargetIcons(ruleTargets)
            ) : (
              <span style={{ color: "#999", fontStyle: "italic" }}>Select targets below</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: "100px", fontWeight: "bold" }}>{GL("action")}</div>
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

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: "100px", fontWeight: "bold" }}>{GL("match")}</div>
          <input
            style={{ width: "350px" }}
            placeholder="URL or regex (e.g. github.com)"
            value={rulePattern}
            onInput={(e) => setRulePattern((e.target as HTMLInputElement).value)}
          />
          <button
            className="nb-btn"
            style={{ marginLeft: "12px", fontSize: "13px" }}
            onClick={handleSetCurrentWebsite}
          >
            {GL("set_as_current_website")}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: "100px", fontWeight: "bold" }}>{GL("pattern")}</div>
          <select
            value={ruleIsWildcard ? "wildcard" : "RegExp"}
            onChange={(e) => setRuleIsWildcard((e.target as HTMLSelectElement).value === "wildcard")}
          >
            <option value="RegExp">{GL("RegExp")}</option>
            <option value="wildcard">{GL("wildcard")}</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <button className="nb-btn" onClick={handleAddOrUpdateRule}>
          {editingId ? "Update rule" : GL("add_rule")}
        </button>
        {editingId && (
          <button
            className="nb-btn inActive"
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

      {/* Embedded Target Selector */}
      <h2 className="nb-heading" style={{ fontSize: "20px" }}>{GL("select_target_s")}</h2>
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
