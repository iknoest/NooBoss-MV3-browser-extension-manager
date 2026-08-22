import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import type {
  ExtensionInfo,
  ExtensionGroup,
  AutoStateRule,
  HistoryRecord,
  PendingAutoStateChange,
  AppSettings,
  ExportData,
  AutoStateAction,
} from '../shared/types';
import { DEFAULT_SETTINGS, generateId } from '../shared/types';

type Section = 'extensions' | 'groups' | 'autostate' | 'history' | 'settings';

export function ManagerApp() {
  const [section, setSection] = useState<Section>('extensions');
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [groups, setGroups] = useState<ExtensionGroup[]>([]);
  const [rules, setRules] = useState<AutoStateRule[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingAutoStateChange[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [exts, grps, rls, hist, pending, setts] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'GET_EXTENSIONS' }),
        chrome.runtime.sendMessage({ type: 'GET_GROUPS' }),
        chrome.runtime.sendMessage({ type: 'GET_AUTOSTATE_RULES' }),
        chrome.runtime.sendMessage({ type: 'GET_HISTORY' }),
        chrome.runtime.sendMessage({ type: 'GET_PENDING_CHANGES' }),
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }),
      ]);
      setExtensions(exts || []);
      setGroups(grps || []);
      setRules(rls || []);
      setHistory(hist || []);
      setPendingChanges(pending || []);
      setSettings(setts || DEFAULT_SETTINGS);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const listener = (message: { type: string }) => {
      if (message.type === 'STATE_CHANGED') loadData();
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [loadData]);

  if (loading) {
    return <div style={s.loadingPage}>Loading NooBoss...</div>;
  }

  return (
    <div style={s.app}>
      {/* Notification toast */}
      {notification && (
        <div style={s.toast}>{notification}</div>
      )}

      {/* Sidebar */}
      <nav style={s.sidebar} aria-label="Main navigation">
        <h1 style={s.logo}>NooBoss</h1>
        <p style={s.subtitle}>Extension Manager</p>
        {(['extensions', 'groups', 'autostate', 'history', 'settings'] as Section[]).map((s_) => (
          <button
            key={s_}
            onClick={() => setSection(s_)}
            style={section === s_ ? s.navBtnActive : s.navBtn}
            aria-current={section === s_ ? 'page' : undefined}
          >
            {s_ === 'extensions' && '🧩 Extensions'}
            {s_ === 'groups' && '📁 Groups'}
            {s_ === 'autostate' && '⚡ AutoState'}
            {s_ === 'history' && '📜 History'}
            {s_ === 'settings' && '⚙️ Settings'}
            {s_ === 'autostate' && pendingChanges.length > 0 && (
              <span style={s.badge}>{pendingChanges.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main style={s.main}>
        {section === 'extensions' && (
          <ExtensionsSection
            extensions={extensions}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filter={filter}
            setFilter={setFilter}
            loadData={loadData}
            showNotification={showNotification}
          />
        )}
        {section === 'groups' && (
          <GroupsSection
            groups={groups}
            extensions={extensions}
            loadData={loadData}
            showNotification={showNotification}
          />
        )}
        {section === 'autostate' && (
          <AutoStateSection
            rules={rules}
            extensions={extensions}
            groups={groups}
            settings={settings}
            pendingChanges={pendingChanges}
            loadData={loadData}
            showNotification={showNotification}
          />
        )}
        {section === 'history' && (
          <HistorySection
            history={history}
            loadData={loadData}
            showNotification={showNotification}
          />
        )}
        {section === 'settings' && (
          <SettingsSection
            settings={settings}
            loadData={loadData}
            showNotification={showNotification}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================
// EXTENSIONS SECTION
// ============================================================

function ExtensionsSection({
  extensions,
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  loadData,
  showNotification,
}: {
  extensions: ExtensionInfo[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filter: 'all' | 'enabled' | 'disabled';
  setFilter: (f: 'all' | 'enabled' | 'disabled') => void;
  loadData: () => Promise<void>;
  showNotification: (msg: string) => void;
}) {
  const filtered = extensions.filter((ext) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || ext.name.toLowerCase().includes(q) || ext.id.includes(q);
    const matchesFilter =
      filter === 'all' || (filter === 'enabled' && ext.enabled) || (filter === 'disabled' && !ext.enabled);
    return matchesSearch && matchesFilter;
  });

  const enabledCount = extensions.filter((e) => e.enabled).length;

  const toggle = async (id: string, enabled: boolean) => {
    const result = await chrome.runtime.sendMessage({ type: 'TOGGLE_EXTENSION', id, enabled });
    if (result?.error) showNotification(`Error: ${result.error}`);
    await loadData();
  };

  const uninstall = async (id: string) => {
    await chrome.runtime.sendMessage({ type: 'UNINSTALL_EXTENSION', id });
    await loadData();
  };

  return (
    <div>
      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>Extensions ({extensions.length})</h2>
        <span style={s.enabledInfo}>{enabledCount} enabled • {extensions.length - enabledCount} disabled</span>
      </div>

      <div style={s.toolbar}>
        <input
          type="search"
          placeholder="Search by name or ID..."
          value={searchQuery}
          onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          style={s.searchInput}
          aria-label="Search extensions"
        />
        <select
          value={filter}
          onChange={(e) => setFilter((e.target as HTMLSelectElement).value as 'all' | 'enabled' | 'disabled')}
          style={s.select}
          aria-label="Filter extensions"
        >
          <option value="all">All</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <div style={s.listContainer}>
        {filtered.length === 0 ? (
          <p style={s.emptyState}>No extensions match your search</p>
        ) : (
          filtered.map((ext) => {
            const iconUrl = ext.icons?.reduce((best, icon) => (icon.size > (best?.size || 0) ? icon : best), ext.icons[0])?.url;
            return (
              <div key={ext.id} style={{ ...s.card, opacity: ext.enabled ? 1 : 0.82 }}>
                <div style={s.cardIcon}>
                  {iconUrl ? (
                    <img src={iconUrl} alt="" width="32" height="32" style={s.cardIconImg} />
                  ) : (
                    <div style={s.cardIconPlaceholder}>{ext.name[0]}</div>
                  )}
                </div>
                <div style={s.cardInfo}>
                  <div style={s.cardName}>{ext.name}</div>
                  <div style={s.cardMeta}>
                    v{ext.version}
                    {ext.installType === 'development' && <span style={s.devBadge}>DEV</span>}
                    {!ext.mayDisable && <span style={s.policyBadge}>MANAGED</span>}
                    <span style={s.typeBadge}>{ext.type}</span>
                  </div>
                  {ext.description && (
                    <div style={s.cardDesc}>{ext.description.slice(0, 120)}{ext.description.length > 120 ? '...' : ''}</div>
                  )}
                </div>
                <div style={s.cardActions}>
                  {ext.optionsUrl && (
                    <button
                      onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS', id: ext.id })}
                      style={s.actionBtn}
                      title="Open options"
                      aria-label={`Open options for ${ext.name}`}
                    >⚙ Options</button>
                  )}
                  <button
                    onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_CHROME_DETAILS', id: ext.id })}
                    style={s.actionBtn}
                    title="Chrome details"
                    aria-label={`Chrome details for ${ext.name}`}
                  >ℹ Details</button>
                  {ext.mayDisable && (
                    <button
                      onClick={() => toggle(ext.id, !ext.enabled)}
                      style={{ ...s.toggleBtn, background: ext.enabled ? 'var(--success)' : 'var(--bg-hover)', color: ext.enabled ? '#fff' : 'var(--text)' }}
                      aria-label={`${ext.enabled ? 'Disable' : 'Enable'} ${ext.name}`}
                    >
                      {ext.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  )}
                  {ext.mayDisable && (
                    <button
                      onClick={() => uninstall(ext.id)}
                      style={s.dangerBtn}
                      aria-label={`Uninstall ${ext.name}`}
                    >Uninstall</button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================
// GROUPS SECTION
// ============================================================

function GroupsSection({
  groups,
  extensions,
  loadData,
  showNotification,
}: {
  groups: ExtensionGroup[];
  extensions: ExtensionInfo[];
  loadData: () => Promise<void>;
  showNotification: (msg: string) => void;
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<ExtensionGroup | null>(null);

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    await chrome.runtime.sendMessage({ type: 'CREATE_GROUP', name: newGroupName.trim() });
    setNewGroupName('');
    await loadData();
    showNotification('Group created');
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    await chrome.runtime.sendMessage({ type: 'DELETE_GROUP', id });
    await loadData();
    showNotification('Group deleted');
  };

  const toggleGroup = async (id: string, enabled: boolean) => {
    const result = await chrome.runtime.sendMessage({ type: 'TOGGLE_GROUP', id, enabled });
    if (result?.errors?.length) {
      showNotification(`Errors: ${result.errors.join(', ')}`);
    }
    await loadData();
  };

  const saveGroup = async (group: ExtensionGroup) => {
    await chrome.runtime.sendMessage({ type: 'UPDATE_GROUP', group });
    setEditingGroup(null);
    await loadData();
    showNotification('Group saved');
  };

  const toggleExtensionInGroup = (group: ExtensionGroup, extId: string) => {
    const updated = { ...group };
    const idx = updated.extensionIds.indexOf(extId);
    if (idx === -1) {
      updated.extensionIds = [...updated.extensionIds, extId];
    } else {
      updated.extensionIds = updated.extensionIds.filter((id) => id !== extId);
    }
    setEditingGroup(updated);
  };

  return (
    <div>
      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>Groups ({groups.length})</h2>
      </div>

      {/* Create Group */}
      <div style={s.toolbar}>
        <input
          type="text"
          placeholder="New group name..."
          value={newGroupName}
          onInput={(e) => setNewGroupName((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => e.key === 'Enter' && createGroup()}
          style={s.searchInput}
          aria-label="New group name"
        />
        <button onClick={createGroup} style={s.primaryBtn}>Create Group</button>
      </div>

      {/* Group Editor Modal */}
      {editingGroup && (
        <div style={s.modal}>
          <div style={s.modalContent}>
            <h3 style={s.modalTitle}>Edit Group</h3>
            <input
              type="text"
              value={editingGroup.name}
              onInput={(e) => setEditingGroup({ ...editingGroup, name: (e.target as HTMLInputElement).value })}
              style={s.input}
              aria-label="Group name"
            />
            <div style={s.colorRow}>
              <label>Color:</label>
              <input
                type="color"
                value={editingGroup.color}
                onInput={(e) => setEditingGroup({ ...editingGroup, color: (e.target as HTMLInputElement).value })}
                style={s.colorPicker}
              />
            </div>
            <h4 style={s.subheading}>Extensions ({editingGroup.extensionIds.length} selected)</h4>
            <div style={s.extCheckList}>
              {extensions.map((ext) => (
                <label key={ext.id} style={s.checkItem}>
                  <input
                    type="checkbox"
                    checked={editingGroup.extensionIds.includes(ext.id)}
                    onChange={() => toggleExtensionInGroup(editingGroup, ext.id)}
                  />
                  <span>{ext.name}</span>
                </label>
              ))}
            </div>
            <div style={s.modalActions}>
              <button onClick={() => saveGroup(editingGroup)} style={s.primaryBtn}>Save</button>
              <button onClick={() => setEditingGroup(null)} style={s.actionBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Group List */}
      <div style={s.listContainer}>
        {groups.length === 0 ? (
          <p style={s.emptyState}>No groups yet. Create one above.</p>
        ) : (
          groups.map((group) => {
            const memberExts = extensions.filter((e) => group.extensionIds.includes(e.id));
            const allEnabled = memberExts.length > 0 && memberExts.every((e) => e.enabled);
            const someEnabled = memberExts.some((e) => e.enabled);
            return (
              <div key={group.id} style={s.card}>
                <div style={{ ...s.groupColorBar, background: group.color }} />
                <div style={s.cardInfo}>
                  <div style={s.cardName}>{group.name}</div>
                  <div style={s.cardMeta}>
                    {group.extensionIds.length} extensions
                    {someEnabled && !allEnabled && ' (mixed state)'}
                  </div>
                  <div style={s.memberList}>
                    {memberExts.slice(0, 5).map((ext) => (
                      <span key={ext.id} style={{ ...s.memberChip, opacity: ext.enabled ? 1 : 0.5 }}>
                        {ext.name}
                      </span>
                    ))}
                    {memberExts.length > 5 && <span style={s.memberChip}>+{memberExts.length - 5} more</span>}
                  </div>
                </div>
                <div style={s.cardActions}>
                  <button onClick={() => setEditingGroup({ ...group })} style={s.actionBtn}>Edit</button>
                  <button
                    onClick={() => toggleGroup(group.id, !allEnabled)}
                    style={{ ...s.toggleBtn, background: allEnabled ? 'var(--success)' : 'var(--bg-hover)', color: allEnabled ? '#fff' : 'var(--text)' }}
                  >
                    {allEnabled ? 'All On' : 'All Off'}
                  </button>
                  <button onClick={() => deleteGroup(group.id)} style={s.dangerBtn}>Delete</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================
// AUTOSTATE SECTION
// ============================================================

const ACTION_LABELS: Record<AutoStateAction, string> = {
  enableWhenMatched: 'Enable when matched',
  disableWhenMatched: 'Disable when matched',
  enableOnlyWhileMatched: 'Enable only while matched',
  disableOnlyWhileMatched: 'Disable only while matched',
};

function AutoStateSection({
  rules,
  extensions,
  groups,
  settings,
  pendingChanges,
  loadData,
  showNotification,
}: {
  rules: AutoStateRule[];
  extensions: ExtensionInfo[];
  groups: ExtensionGroup[];
  settings: AppSettings;
  pendingChanges: PendingAutoStateChange[];
  loadData: () => Promise<void>;
  showNotification: (msg: string) => void;
}) {
  const [editingRule, setEditingRule] = useState<AutoStateRule | null>(null);
  const [isNew, setIsNew] = useState(false);

  const saveRules = async (newRules: AutoStateRule[]) => {
    await chrome.runtime.sendMessage({ type: 'SAVE_AUTOSTATE_RULES', rules: newRules });
    await loadData();
  };

  const createRule = () => {
    const newRule: AutoStateRule = {
      id: `rule_${generateId()}`,
      enabled: true,
      name: 'New Rule',
      pattern: '*example.com*',
      isWildcard: true,
      targets: [],
      action: 'enableWhenMatched',
      priority: rules.length,
      createdAt: Date.now(),
    };
    setEditingRule(newRule);
    setIsNew(true);
  };

  const saveRule = async (rule: AutoStateRule) => {
    let newRules: AutoStateRule[];
    if (isNew) {
      newRules = [...rules, rule];
    } else {
      newRules = rules.map((r) => (r.id === rule.id ? rule : r));
    }
    await saveRules(newRules);
    setEditingRule(null);
    setIsNew(false);
    showNotification('Rule saved');
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    const newRules = rules.filter((r) => r.id !== id);
    await saveRules(newRules);
    showNotification('Rule deleted');
  };

  const toggleRule = async (id: string) => {
    const newRules = rules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    await saveRules(newRules);
  };

  const moveRule = async (idx: number, dir: -1 | 1) => {
    const newRules = [...rules];
    const target = idx + dir;
    if (target < 0 || target >= newRules.length) return;
    [newRules[idx], newRules[target]] = [newRules[target], newRules[idx]];
    newRules.forEach((r, i) => (r.priority = i));
    await saveRules(newRules);
  };

  const applyPending = async (extId: string, enabled: boolean) => {
    await chrome.runtime.sendMessage({ type: 'APPLY_PENDING_CHANGE', extensionId: extId, enabled });
    await loadData();
  };

  const dismissPending = async (extId: string) => {
    await chrome.runtime.sendMessage({ type: 'DISMISS_PENDING_CHANGE', extensionId: extId });
    await loadData();
  };

  const toggleTarget = (rule: AutoStateRule, targetId: string) => {
    const updated = { ...rule };
    const idx = updated.targets.indexOf(targetId);
    if (idx === -1) {
      updated.targets = [...updated.targets, targetId];
    } else {
      updated.targets = updated.targets.filter((t) => t !== targetId);
    }
    setEditingRule(updated);
  };

  return (
    <div>
      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>AutoState Rules</h2>
        <span style={s.enabledInfo}>
          Mode: <strong>{settings.autoStateMode}</strong>
          {settings.autoStateMode === 'automatic'
            ? ' — Extensions are toggled automatically based on tab URLs'
            : ' — Changes require user confirmation'}
        </span>
      </div>

      {/* Pending changes */}
      {pendingChanges.length > 0 && (
        <div style={s.pendingSection}>
          <h3 style={s.subheading}>⚠ Pending Changes ({pendingChanges.length})</h3>
          {pendingChanges.map((p) => (
            <div key={p.extensionId} style={s.pendingCard}>
              <span><strong>{p.extensionName}</strong> → {p.targetEnabled ? 'Enable' : 'Disable'} (Rule: {p.ruleName})</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => applyPending(p.extensionId, p.targetEnabled)} style={s.primaryBtn}>Apply</button>
                <button onClick={() => dismissPending(p.extensionId)} style={s.actionBtn}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={s.toolbar}>
        <button onClick={createRule} style={s.primaryBtn}>+ New Rule</button>
      </div>

      {/* Rule Editor Modal */}
      {editingRule && (
        <div style={s.modal}>
          <div style={s.modalContent}>
            <h3 style={s.modalTitle}>{isNew ? 'Create Rule' : 'Edit Rule'}</h3>
            <label style={s.formLabel}>
              Rule Name
              <input
                type="text"
                value={editingRule.name}
                onInput={(e) => setEditingRule({ ...editingRule, name: (e.target as HTMLInputElement).value })}
                style={s.input}
              />
            </label>
            <label style={s.formLabel}>
              URL Pattern
              <input
                type="text"
                value={editingRule.pattern}
                onInput={(e) => setEditingRule({ ...editingRule, pattern: (e.target as HTMLInputElement).value })}
                style={s.input}
                placeholder={editingRule.isWildcard ? '*example.com*' : '.*example\\.com.*'}
              />
            </label>
            <label style={s.checkItem}>
              <input
                type="checkbox"
                checked={editingRule.isWildcard}
                onChange={() => setEditingRule({ ...editingRule, isWildcard: !editingRule.isWildcard })}
              />
              <span>Wildcard pattern (otherwise regex)</span>
            </label>
            <label style={s.formLabel}>
              Action
              <select
                value={editingRule.action}
                onChange={(e) => setEditingRule({ ...editingRule, action: (e.target as HTMLSelectElement).value as AutoStateAction })}
                style={s.select}
              >
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <h4 style={s.subheading}>Targets (Extensions & Groups)</h4>
            <div style={s.extCheckList}>
              <div style={s.targetSection}>
                <strong>Groups</strong>
                {groups.map((g) => (
                  <label key={g.id} style={s.checkItem}>
                    <input
                      type="checkbox"
                      checked={editingRule.targets.includes(g.id)}
                      onChange={() => toggleTarget(editingRule, g.id)}
                    />
                    <span>📁 {g.name} ({g.extensionIds.length})</span>
                  </label>
                ))}
              </div>
              <div style={s.targetSection}>
                <strong>Extensions</strong>
                {extensions.map((ext) => (
                  <label key={ext.id} style={s.checkItem}>
                    <input
                      type="checkbox"
                      checked={editingRule.targets.includes(ext.id)}
                      onChange={() => toggleTarget(editingRule, ext.id)}
                    />
                    <span>{ext.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={s.modalActions}>
              <button onClick={() => saveRule(editingRule)} style={s.primaryBtn}>Save Rule</button>
              <button onClick={() => { setEditingRule(null); setIsNew(false); }} style={s.actionBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div style={s.listContainer}>
        {rules.length === 0 ? (
          <p style={s.emptyState}>No AutoState rules. Create one to automatically manage extensions based on tab URLs.</p>
        ) : (
          rules.map((rule, idx) => (
            <div key={rule.id} style={{ ...s.card, borderLeft: rule.enabled ? '3px solid var(--primary)' : '3px solid var(--border)' }}>
              <div style={s.cardInfo}>
                <div style={s.cardName}>
                  {rule.name}
                  {!rule.enabled && <span style={s.disabledLabel}>(disabled)</span>}
                </div>
                <div style={s.cardMeta}>
                  {rule.isWildcard ? 'Wildcard' : 'Regex'}: <code style={s.code}>{rule.pattern}</code>
                </div>
                <div style={s.cardMeta}>
                  Action: {ACTION_LABELS[rule.action]} • {rule.targets.length} targets • Priority: {idx + 1}
                </div>
              </div>
              <div style={s.cardActions}>
                <button onClick={() => moveRule(idx, -1)} disabled={idx === 0} style={s.actionBtn} aria-label="Move up">▲</button>
                <button onClick={() => moveRule(idx, 1)} disabled={idx === rules.length - 1} style={s.actionBtn} aria-label="Move down">▼</button>
                <button onClick={() => toggleRule(rule.id)} style={s.actionBtn}>
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => { setEditingRule({ ...rule }); setIsNew(false); }} style={s.actionBtn}>Edit</button>
                <button onClick={() => deleteRule(rule.id)} style={s.dangerBtn}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// HISTORY SECTION
// ============================================================

function HistorySection({
  history,
  loadData,
  showNotification,
}: {
  history: HistoryRecord[];
  loadData: () => Promise<void>;
  showNotification: (msg: string) => void;
}) {
  const clearAll = async () => {
    if (!confirm('Clear all history?')) return;
    await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
    await loadData();
    showNotification('History cleared');
  };

  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);

  const eventIcons: Record<string, string> = {
    installed: '📥',
    uninstalled: '🗑',
    enabled: '✅',
    disabled: '⛔',
    updated: '🔄',
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>History ({history.length} records)</h2>
        {history.length > 0 && (
          <button onClick={clearAll} style={s.dangerBtn}>Clear All</button>
        )}
      </div>

      <div style={s.listContainer}>
        {sorted.length === 0 ? (
          <p style={s.emptyState}>No history yet. Events will appear here as extensions are installed, enabled, disabled, or uninstalled.</p>
        ) : (
          sorted.map((record) => (
            <div key={record.id} style={s.historyRow}>
              <span style={s.historyIcon}>{eventIcons[record.event] || '•'}</span>
              <div style={s.historyInfo}>
                <span style={s.historyName}>{record.extensionName}</span>
                <span style={s.historyEvent}>{record.event}</span>
                {record.extensionVersion && <span style={s.historyVersion}>v{record.extensionVersion}</span>}
              </div>
              <span style={s.historyTime}>{formatTime(record.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS SECTION
// ============================================================

function SettingsSection({
  settings,
  loadData,
  showNotification,
}: {
  settings: AppSettings;
  loadData: () => Promise<void>;
  showNotification: (msg: string) => void;
}) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: localSettings });
    await loadData();
    showNotification('Settings saved');
  };

  const exportData = async () => {
    const data: ExportData = await chrome.runtime.sendMessage({ type: 'EXPORT_DATA' });
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nooboss-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup exported');
  };

  const importData = async () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await chrome.runtime.sendMessage({ type: 'IMPORT_DATA', data });
      if (result?.success) {
        showNotification('Backup imported successfully');
        await loadData();
        setLocalSettings(await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }));
      } else {
        showNotification(`Import failed: ${result?.error || 'Unknown error'}`);
      }
    } catch (err) {
      showNotification(`Import failed: ${err instanceof Error ? err.message : 'Invalid JSON'}`);
    }
    target.value = '';
  };

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings({ ...localSettings, [key]: value });
  };

  return (
    <div>
      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>Settings</h2>
      </div>

      <div style={s.settingsGrid}>
        {/* AutoState */}
        <fieldset style={s.fieldset}>
          <legend style={s.legend}>AutoState</legend>
          <label style={s.checkItem}>
            <input type="checkbox" checked={localSettings.autoStateEnabled} onChange={() => update('autoStateEnabled', !localSettings.autoStateEnabled)} />
            <span>Enable AutoState</span>
          </label>
          <label style={s.formLabel}>
            Mode
            <select value={localSettings.autoStateMode} onChange={(e) => update('autoStateMode', (e.target as HTMLSelectElement).value as 'automatic' | 'assisted')} style={s.select}>
              <option value="automatic">Automatic (extensions toggled without user interaction)</option>
              <option value="assisted">Assisted (changes require user confirmation)</option>
            </select>
          </label>
          <p style={s.helpText}>
            Automatic mode uses chrome.management.setEnabled() to toggle extensions programmatically.
            This is supported on Chrome 116+ with the management permission.
          </p>
        </fieldset>

        {/* Notifications */}
        <fieldset style={s.fieldset}>
          <legend style={s.legend}>Notifications</legend>
          <label style={s.checkItem}>
            <input type="checkbox" checked={localSettings.notifyStateChange} onChange={() => update('notifyStateChange', !localSettings.notifyStateChange)} />
            <span>State change notifications</span>
          </label>
          <label style={s.checkItem}>
            <input type="checkbox" checked={localSettings.notifyInstallUninstall} onChange={() => update('notifyInstallUninstall', !localSettings.notifyInstallUninstall)} />
            <span>Install/Uninstall notifications</span>
          </label>
          <label style={s.checkItem}>
            <input type="checkbox" checked={localSettings.notifyAutoState} onChange={() => update('notifyAutoState', !localSettings.notifyAutoState)} />
            <span>AutoState notifications</span>
          </label>
        </fieldset>

        {/* History */}
        <fieldset style={s.fieldset}>
          <legend style={s.legend}>History</legend>
          <label style={s.formLabel}>
            Max records
            <input type="number" value={localSettings.historyMaxRecords} min={100} max={50000} step={100}
              onInput={(e) => update('historyMaxRecords', parseInt((e.target as HTMLInputElement).value) || 5000)}
              style={s.input} />
          </label>
          <label style={s.checkItem}>
            <input type="checkbox" checked={localSettings.historyTrackInstall} onChange={() => update('historyTrackInstall', !localSettings.historyTrackInstall)} />
            <span>Track installs</span>
          </label>
          <label style={s.checkItem}>
            <input type="checkbox" checked={localSettings.historyTrackUninstall} onChange={() => update('historyTrackUninstall', !localSettings.historyTrackUninstall)} />
            <span>Track uninstalls</span>
          </label>
          <label style={s.checkItem}>
            <input type="checkbox" checked={localSettings.historyTrackEnable} onChange={() => update('historyTrackEnable', !localSettings.historyTrackEnable)} />
            <span>Track enable</span>
          </label>
          <label style={s.checkItem}>
            <input type="checkbox" checked={localSettings.historyTrackDisable} onChange={() => update('historyTrackDisable', !localSettings.historyTrackDisable)} />
            <span>Track disable</span>
          </label>
        </fieldset>

        {/* Display */}
        <fieldset style={s.fieldset}>
          <legend style={s.legend}>Display</legend>
          <label style={s.formLabel}>
            Theme
            <select value={localSettings.theme} onChange={(e) => update('theme', (e.target as HTMLSelectElement).value as 'system' | 'light' | 'dark')} style={s.select}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label style={s.formLabel}>
            Sort order
            <select value={localSettings.sortOrder} onChange={(e) => update('sortOrder', (e.target as HTMLSelectElement).value as AppSettings['sortOrder'])} style={s.select}>
              <option value="name">Name</option>
              <option value="name-state">Name (enabled first)</option>
              <option value="type">Type</option>
            </select>
          </label>
        </fieldset>

        {/* Backup */}
        <fieldset style={s.fieldset}>
          <legend style={s.legend}>Backup & Restore</legend>
          <p style={s.helpText}>
            Export your groups, AutoState rules, and settings as a JSON file.
            Import validates data before applying.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={exportData} style={s.primaryBtn}>📤 Export Backup</button>
            <button onClick={importData} style={s.actionBtn}>📥 Import Backup</button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
        </fieldset>
      </div>

      <div style={{ padding: '16px' }}>
        <button onClick={save} style={s.primaryBtn}>Save Settings</button>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const s: Record<string, any> = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg)',
  },
  loadingPage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '16px',
    color: 'var(--text-secondary)',
  },
  toast: {
    position: 'fixed',
    top: '12px',
    right: '12px',
    background: 'var(--primary)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.18)',
  },
  sidebar: {
    width: '180px',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flexShrink: 0,
  },
  logo: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text)',
    padding: '4px 8px 2px',
    letterSpacing: '0.01em',
  },
  subtitle: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
    padding: '0 8px',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 10px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '12px',
    textAlign: 'left' as const,
    width: '100%',
  },
  navBtnActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 10px',
    border: '1px solid var(--primary)',
    background: 'var(--primary)',
    color: '#fff',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'left' as const,
    width: '100%',
  },
  badge: {
    marginLeft: 'auto',
    background: 'var(--warning)',
    color: '#fff',
    borderRadius: '999px',
    padding: '1px 6px',
    fontSize: '10px',
    fontWeight: '700',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: '0',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px 8px',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: 'var(--text)',
  },
  enabledInfo: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  toolbar: {
    display: 'flex',
    gap: '8px',
    padding: '8px 16px',
    borderBottom: '1px solid var(--border)',
    alignItems: 'center',
    background: 'var(--bg-secondary)',
  },
  searchInput: {
    flex: 1,
    padding: '5px 8px',
    border: '1px solid var(--border)',
    borderRadius: '3px',
    fontSize: '12px',
    background: 'var(--bg)',
    color: 'var(--text)',
    outline: 'none',
    minHeight: '28px',
  },
  select: {
    padding: '5px 8px',
    border: '1px solid var(--border)',
    borderRadius: '3px',
    fontSize: '12px',
    background: 'var(--bg)',
    color: 'var(--text)',
    minHeight: '28px',
  },
  input: {
    padding: '5px 8px',
    border: '1px solid var(--border)',
    borderRadius: '3px',
    fontSize: '12px',
    background: 'var(--bg)',
    color: 'var(--text)',
    width: '100%',
    outline: 'none',
    minHeight: '28px',
  },
  listContainer: {
    padding: '0',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderBottom: '1px solid var(--border)',
    gap: '10px',
    transition: 'background 0.1s',
  },
  cardIcon: {
    width: '24px',
    height: '24px',
    flexShrink: 0,
  },
  cardIconImg: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
  },
  cardIconPlaceholder: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    background: 'var(--bg-hover)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  cardMeta: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  cardDesc: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
    lineHeight: '1.4',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  devBadge: {
    fontSize: '9px',
    padding: '1px 5px',
    borderRadius: '3px',
    background: 'var(--warning)',
    color: '#fff',
    fontWeight: '700',
  },
  policyBadge: {
    fontSize: '9px',
    padding: '1px 5px',
    borderRadius: '3px',
    background: 'var(--text-secondary)',
    color: '#fff',
    fontWeight: '700',
  },
  typeBadge: {
    fontSize: '9px',
    padding: '1px 5px',
    borderRadius: '3px',
    background: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
  },
  actionBtn: {
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    padding: '3px 7px',
    borderRadius: '3px',
    fontSize: '11px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  primaryBtn: {
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  toggleBtn: {
    border: '1px solid transparent',
    padding: '2px 7px',
    borderRadius: '999px',
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  dangerBtn: {
    border: '1px solid var(--danger)',
    background: 'transparent',
    color: 'var(--danger)',
    padding: '3px 7px',
    borderRadius: '3px',
    fontSize: '11px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    padding: '24px 16px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '12px',
  },
  groupColorBar: {
    width: '4px',
    alignSelf: 'stretch',
    borderRadius: '2px',
    flexShrink: 0,
  },
  memberList: {
    display: 'flex',
    gap: '4px',
    marginTop: '4px',
    flexWrap: 'wrap',
  },
  memberChip: {
    fontSize: '10px',
    padding: '1px 5px',
    borderRadius: '3px',
    background: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.46)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalContent: {
    background: 'var(--bg)',
    borderRadius: '8px',
    padding: '18px',
    width: '560px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
    border: '1px solid var(--border)',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '12px',
  },
  modalActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
    justifyContent: 'flex-end',
  },
  formLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
    fontSize: '12px',
    cursor: 'pointer',
  },
  subheading: {
    fontSize: '13px',
    fontWeight: '700',
    margin: '12px 0 8px',
  },
  extCheckList: {
    maxHeight: '250px',
    overflow: 'auto',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '8px',
    background: 'var(--bg)',
  },
  targetSection: {
    marginBottom: '8px',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '8px 0',
    fontSize: '12px',
  },
  colorPicker: {
    width: '40px',
    height: '28px',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    background: 'var(--bg)',
  },
  historyRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderBottom: '1px solid var(--border)',
    gap: '10px',
  },
  historyIcon: {
    fontSize: '14px',
    width: '20px',
    textAlign: 'center',
  },
  historyInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  historyName: {
    fontSize: '12px',
    fontWeight: '600',
  },
  historyEvent: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    textTransform: 'capitalize',
  },
  historyVersion: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
  },
  historyTime: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  },
  settingsGrid: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fieldset: {
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '12px',
    background: 'var(--bg-secondary)',
  },
  legend: {
    fontSize: '12px',
    fontWeight: '700',
    padding: '0 6px',
  },
  helpText: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
    lineHeight: '1.5',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '11px',
    background: 'var(--bg-hover)',
    padding: '1px 4px',
    borderRadius: '3px',
  },
  disabledLabel: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
    fontWeight: 'normal',
  },
  pendingSection: {
    padding: '10px 16px',
    background: '#f9f1d8',
    borderBottom: '1px solid var(--border)',
  },
  pendingCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    fontSize: '12px',
    gap: '8px',
  },
};
