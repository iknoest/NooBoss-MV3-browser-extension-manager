import { useState } from "preact/hooks";
import type { ExtensionInfo, ExtensionGroup, AutoStateRule, PendingAutoStateChange, AppSettings } from "../../shared/types";
import { Selector } from "./Selector";
import { GL } from "./i18n";
import { Edity, Removy, Groupy } from "./icons";
import { ExtensionSwitch } from "./ExtensionBrief";
import {
  MatchScope,
  RuleTiming,
  RuleEffect,
  SCOPE_LABELS,
  SCOPE_EXPLANATIONS,
  SCOPE_PLACEHOLDERS,
  CUSTOM_REGEX_EXPLANATION,
  CUSTOM_REGEX_EXAMPLE,
  CUSTOM_REGEX_PLACEHOLDER,
  TIMING_LABELS,
  TIMING_DESCRIPTIONS,
  EFFECT_LABELS,
  AUTOSTATE_ACTION_LABELS,
  buildPatternFromScope,
  detectScopeAndInput,
  getTabValueForScope,
  getActionFromDecisions,
  getDecisionsFromAction,
  getBehaviorPreview,
  validateRuleInput,
} from "./autostate-helpers";
import { MaterialSymbol } from "./MaterialSymbols";

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
  const [ruleScope, setRuleScope] = useState<MatchScope>("site");
  const [ruleUseRegex, setRuleUseRegex] = useState<boolean>(false);
  const [ruleScopeInput, setRuleScopeInput] = useState<string>("");
  const [ruleTiming, setRuleTiming] = useState<RuleTiming>("temporary");
  const [ruleEffect, setRuleEffect] = useState<RuleEffect>("on");
  const [ruleTargets, setRuleTargets] = useState<string[]>([]);
  const [websiteWarning, setWebsiteWarning] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setRuleTargets([]);
    setRuleScope("site");
    setRuleUseRegex(false);
    setRuleScopeInput("");
    setRuleTiming("temporary");
    setRuleEffect("on");
    setWebsiteWarning(null);
  };

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
          const result = getTabValueForScope(tabs[0].url, ruleScope, ruleScope === "custom" && ruleUseRegex);
          if (result.success && result.value) {
            setRuleScopeInput(result.value);
            setWebsiteWarning(null);
          } else if (result.error) {
            setWebsiteWarning(result.error);
            setTimeout(() => setWebsiteWarning(null), 4000);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  const validation = validateRuleInput(
    ruleTargets,
    ruleScope,
    ruleScopeInput,
    ruleScope === "custom" && ruleUseRegex
  );
  const isFormValid = validation.isValid;

  const handleAddOrUpdateRule = () => {
    if (!isFormValid) return;

    const { pattern, isWildcard } = buildPatternFromScope(
      ruleScope,
      ruleScopeInput,
      ruleScope === "custom" && ruleUseRegex
    );
    if (!pattern) return;

    const action = getActionFromDecisions(ruleTiming, ruleEffect);

    if (editingId) {
      // Update existing
      const updated = rules.map((r) =>
        r.id === editingId
          ? {
              ...r,
              action,
              pattern,
              isWildcard,
              targets: ruleTargets,
            }
          : r
      );
      onSaveRules(updated);
      resetForm();
    } else {
      // Create new
      const newRule: AutoStateRule = {
        id: "rule_" + Date.now().toString(36),
        enabled: true,
        name: ruleScopeInput || pattern || "Site Rule",
        pattern,
        isWildcard,
        targets: ruleTargets,
        action,
        priority: rules.length + 1,
        createdAt: Date.now(),
      };
      onSaveRules([...rules, newRule]);
      resetForm();
    }
  };

  const handleEditRule = (rule: AutoStateRule) => {
    const { scope, displayInput, useRegex } = detectScopeAndInput(rule);
    const { timing, effect } = getDecisionsFromAction(rule.action);
    setEditingId(rule.id);
    setRuleScope(scope);
    setRuleUseRegex(useRegex);
    setRuleScopeInput(displayInput);
    setRuleTiming(timing);
    setRuleEffect(effect);
    setRuleTargets([...rule.targets]);
    setWebsiteWarning(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    onSaveRules(rules.filter((r) => r.id !== ruleId));
    if (editingId === ruleId) {
      resetForm();
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

  const preview = getBehaviorPreview(ruleTiming, ruleEffect, ruleScopeInput);

  return (
    <div className="nb-page">
      {/* Site Rules Explanatory Header */}
      <div
        className="site-rules-header-card"
        style={{
          marginBottom: "20px",
          padding: "14px 18px",
          background: "var(--bg-secondary, #f8f9fa)",
          borderRadius: "var(--radius-md, 8px)",
          border: "1px solid var(--border-subtle, #e0e0e0)",
        }}
      >
        <h1 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
          {GL("autoState")}
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
          Site Rules automatically turn extensions ON or OFF when websites open or close, either temporarily while browsing or as a one-time change.
        </p>
      </div>

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
              <th style={{ width: "150px" }}>{GL("target_s")}</th>
              <th style={{ width: "240px" }}>{GL("action")}</th>
              <th style={{ width: "160px" }}>Scope</th>
              <th>{GL("pattern")}</th>
              <th style={{ width: "50px", textAlign: "center" }}>State</th>
              <th style={{ width: "40px", textAlign: "center" }}></th>
              <th style={{ width: "40px", textAlign: "center" }}></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, idx) => {
              const { scope, displayInput, useRegex } = detectScopeAndInput(rule);
              const scopeBadgeText =
                scope === "site"
                  ? "This Site"
                  : scope === "exact"
                  ? "Exact Page"
                  : useRegex
                  ? "Custom (RegExp)"
                  : "Custom";

              return (
                <tr key={rule.id} className="history-row">
                  <td>{idx + 1}</td>
                  <td style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                    {renderTargetIcons(rule.targets)}
                  </td>
                  <td style={{ fontWeight: 500, fontSize: "12px", lineHeight: "1.3" }}>
                    {AUTOSTATE_ACTION_LABELS[rule.action] || rule.action}
                  </td>
                  <td>
                    <span className="history-badge event-update" title={SCOPE_EXPLANATIONS[scope]}>
                      {scopeBadgeText}
                    </span>
                  </td>
                  <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <code>{scope === "site" ? displayInput : (scope === "exact" ? displayInput : (useRegex ? rule.pattern : displayInput))}</code>
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
                  No Site Rules configured.
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

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          marginBottom: "20px",
          background: "var(--bg-secondary)",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Targets */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "130px", fontWeight: 600, color: "var(--text-secondary)" }}>{GL("target_s")}</div>
          <div style={{ flex: 1, minHeight: "32px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
            {ruleTargets.length > 0 ? (
              renderTargetIcons(ruleTargets)
            ) : (
              <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "12px" }}>Select targets below</span>
            )}
          </div>
        </div>

        {/* Where should this rule apply? */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "130px", fontWeight: 600, color: "var(--text-secondary)", paddingTop: "6px" }}>
            Where to apply
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <select
              id="ruleScopeSelector"
              value={ruleScope}
              onChange={(e) => {
                const nextScope = (e.target as HTMLSelectElement).value as MatchScope;
                setRuleScope(nextScope);
                setWebsiteWarning(null);
              }}
              style={{ maxWidth: "380px" }}
            >
              <option value="site">{SCOPE_LABELS.site}</option>
              <option value="exact">{SCOPE_LABELS.exact}</option>
              <option value="custom">{SCOPE_LABELS.custom}</option>
            </select>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <input
                id="ruleScopeInput"
                style={{ width: "340px" }}
                placeholder={
                  ruleScope === "custom" && ruleUseRegex
                    ? CUSTOM_REGEX_PLACEHOLDER
                    : SCOPE_PLACEHOLDERS[ruleScope]
                }
                value={ruleScopeInput}
                onInput={(e) => setRuleScopeInput((e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                className="btn btn-secondary action-btn"
                style={{ fontSize: "12px", whiteSpace: "nowrap" }}
                onClick={handleSetCurrentWebsite}
              >
                {ruleScope === "exact" ? "Set as current page" : GL("set_as_current_website")}
              </button>
            </div>

            {/* Custom scope advanced regex toggle */}
            {ruleScope === "custom" && (
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  marginTop: "2px",
                }}
              >
                <input
                  type="checkbox"
                  id="customUseRegexCheckbox"
                  checked={ruleUseRegex}
                  onChange={(e) => setRuleUseRegex((e.target as HTMLInputElement).checked)}
                />
                <span>Use advanced regular expression</span>
              </label>
            )}

            <div className="autostate-inline-helper" style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>
              {ruleScope === "custom" && ruleUseRegex ? (
                <>
                  <div>{CUSTOM_REGEX_EXPLANATION}</div>
                  <div style={{ marginTop: "2px", fontFamily: "ui-monospace, monospace" }}>{CUSTOM_REGEX_EXAMPLE}</div>
                </>
              ) : (
                SCOPE_EXPLANATIONS[ruleScope]
              )}
            </div>

            {websiteWarning && (
              <div style={{ color: "var(--danger, #ea4335)", fontSize: "11px" }}>
                {websiteWarning}
              </div>
            )}
          </div>
        </div>

        {/* When should this rule act? */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "130px", fontWeight: 600, color: "var(--text-secondary)", paddingTop: "6px" }}>
            When to act
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
            <select
              id="ruleTimingSelector"
              value={ruleTiming}
              onChange={(e) => setRuleTiming((e.target as HTMLSelectElement).value as RuleTiming)}
              style={{ maxWidth: "380px" }}
            >
              <option value="temporary">{TIMING_LABELS.temporary}</option>
              <option value="onetime">{TIMING_LABELS.onetime}</option>
            </select>
            <div className="autostate-inline-helper" style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>
              {TIMING_DESCRIPTIONS[ruleTiming]}
            </div>
          </div>
        </div>

        {/* What should happen? */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "130px", fontWeight: 600, color: "var(--text-secondary)", paddingTop: "6px" }}>
            What happens
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
            <select
              id="ruleEffectSelector"
              value={ruleEffect}
              onChange={(e) => setRuleEffect((e.target as HTMLSelectElement).value as RuleEffect)}
              style={{ maxWidth: "380px" }}
            >
              <option value="on">{EFFECT_LABELS.on}</option>
              <option value="off">{EFFECT_LABELS.off}</option>
            </select>
          </div>
        </div>

        {/* Dynamic Behavior Preview */}
        <div
          className="behavior-preview-box"
          style={{
            background: "var(--bg-card, #ffffff)",
            border: "1px solid var(--border-subtle, #e0e0e0)",
            borderLeft: `4px solid ${themeMainColor}`,
            borderRadius: "var(--radius-md, 8px)",
            padding: "12px 14px",
            marginTop: "2px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>
            <MaterialSymbol name="info" size={16} color={themeMainColor} />
            <span>Rule behavior preview</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ color: themeMainColor, fontWeight: 700 }}>•</span>
              <span id="behaviorPreviewOpen">{preview.openText}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ color: themeMainColor, fontWeight: 700 }}>•</span>
              <span id="behaviorPreviewClose">{preview.closeText}</span>
            </div>
          </div>
        </div>

        {/* Inline Validation Guidance */}
        {!isFormValid && (
          <div
            id="ruleValidationWarning"
            className="rule-validation-warning"
            style={{
              fontSize: "12px",
              color: "var(--danger, #ea4335)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 0",
            }}
          >
            <MaterialSymbol name="error" size={16} color="var(--danger, #ea4335)" />
            <span>{validation.error}</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button
            id="addRuleBtn"
            className={`btn btn-primary action-btn ${!isFormValid ? "disabled" : ""}`}
            disabled={!isFormValid}
            onClick={handleAddOrUpdateRule}
            title={!isFormValid ? validation.error || "Fill required fields" : undefined}
          >
            {editingId ? "Update rule" : GL("add_rule")}
          </button>
          {editingId && (
            <button
              className="btn btn-secondary action-btn"
              onClick={resetForm}
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
        selectionNoun="selected"
        onSelect={handleToggleTarget}
        themeMainColor={themeMainColor}
      />
    </div>
  );
}
