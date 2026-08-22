import { useState, useEffect, useCallback } from 'preact/hooks';
import type { ExtensionInfo, ExtensionGroup, PendingAutoStateChange, AppSettings } from '../shared/types';

type Tab = 'extensions' | 'groups' | 'pending';

export function PopupApp() {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [groups, setGroups] = useState<ExtensionGroup[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingAutoStateChange[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [activeTab, setActiveTab] = useState<Tab>('extensions');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [exts, grps, pending, setts] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'GET_EXTENSIONS' }),
        chrome.runtime.sendMessage({ type: 'GET_GROUPS' }),
        chrome.runtime.sendMessage({ type: 'GET_PENDING_CHANGES' }),
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }),
      ]);
      setExtensions(exts || []);
      setGroups(grps || []);
      setPendingChanges(pending || []);
      setSettings(setts || null);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const listener = (message: { type: string }) => {
      if (message.type === 'STATE_CHANGED') {
        loadData();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [loadData]);

  const toggleExtension = async (id: string, enabled: boolean) => {
    await chrome.runtime.sendMessage({ type: 'TOGGLE_EXTENSION', id, enabled });
    await loadData();
  };

  const uninstallExtension = async (id: string) => {
    await chrome.runtime.sendMessage({ type: 'UNINSTALL_EXTENSION', id });
    await loadData();
  };

  const openOptions = async (id: string) => {
    await chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS', id });
  };

  const openChromeDetails = async (id: string) => {
    await chrome.runtime.sendMessage({ type: 'OPEN_CHROME_DETAILS', id });
  };

  const toggleGroup = async (id: string, enabled: boolean) => {
    await chrome.runtime.sendMessage({ type: 'TOGGLE_GROUP', id, enabled });
    await loadData();
  };

  const applyPendingChange = async (extId: string, enabled: boolean) => {
    await chrome.runtime.sendMessage({ type: 'APPLY_PENDING_CHANGE', extensionId: extId, enabled });
    await loadData();
  };

  const dismissPendingChange = async (extId: string) => {
    await chrome.runtime.sendMessage({ type: 'DISMISS_PENDING_CHANGE', extensionId: extId });
    await loadData();
  };

  const openManagerPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manager/manager.html') });
  };

  const filteredExtensions = extensions.filter((ext) => {
    const matchesSearch =
      !searchQuery ||
      ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'enabled' && ext.enabled) ||
      (filter === 'disabled' && !ext.enabled);
    return matchesSearch && matchesFilter;
  });

  const enabledCount = extensions.filter((e) => e.enabled).length;
  const disabledCount = extensions.filter((e) => !e.enabled).length;

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>NooBoss</h1>
          <button
            onClick={openManagerPage}
            style={styles.managerBtn}
            title="Open full manager"
            aria-label="Open full manager page"
          >
            ⛶
          </button>
        </div>
        <div style={styles.stats}>
          <span style={styles.statBadge}>{enabledCount} enabled</span>
          <span style={{ ...styles.statBadge, background: 'var(--bg-hover)' }}>
            {disabledCount} disabled
          </span>
          {settings?.autoStateEnabled && (
            <span
              style={{
                ...styles.statBadge,
                background: settings.autoStateMode === 'automatic' ? '#dcfce7' : '#fef3c7',
                color: settings.autoStateMode === 'automatic' ? '#166534' : '#92400e',
              }}
            >
              AutoState: {settings.autoStateMode}
            </span>
          )}
          {pendingChanges.length > 0 && (
            <span
              style={{ ...styles.statBadge, background: '#fef3c7', color: '#92400e' }}
            >
              {pendingChanges.length} pending
            </span>
          )}
        </div>
      </header>

      {/* Tabs */}
      <nav style={styles.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'extensions'}
          onClick={() => setActiveTab('extensions')}
          style={activeTab === 'extensions' ? styles.tabActive : styles.tab}
        >
          Extensions
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'groups'}
          onClick={() => setActiveTab('groups')}
          style={activeTab === 'groups' ? styles.tabActive : styles.tab}
        >
          Groups ({groups.length})
        </button>
        {pendingChanges.length > 0 && (
          <button
            role="tab"
            aria-selected={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
            style={activeTab === 'pending' ? styles.tabActive : styles.tab}
          >
            Pending ({pendingChanges.length})
          </button>
        )}
      </nav>

      {/* Extensions Tab */}
      {activeTab === 'extensions' && (
        <div>
          {/* Search & Filter */}
          <div style={styles.searchBar}>
            <input
              type="search"
              placeholder="Search extensions..."
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              style={styles.searchInput}
              aria-label="Search extensions"
            />
            <select
              value={filter}
              onChange={(e) =>
                setFilter((e.target as HTMLSelectElement).value as 'all' | 'enabled' | 'disabled')
              }
              style={styles.filterSelect}
              aria-label="Filter by state"
            >
              <option value="all">All</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          {/* Extension List */}
          <div style={styles.list}>
            {filteredExtensions.length === 0 ? (
              <div style={styles.empty}>No extensions match your search</div>
            ) : (
              filteredExtensions.map((ext) => (
                <ExtensionRow
                  key={ext.id}
                  ext={ext}
                  onToggle={toggleExtension}
                  onUninstall={uninstallExtension}
                  onOpenOptions={openOptions}
                  onOpenDetails={openChromeDetails}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div style={styles.list}>
          {groups.length === 0 ? (
            <div style={styles.empty}>
              No groups yet. Open the full manager to create groups.
            </div>
          ) : (
            groups.map((group) => {
              const memberExts = extensions.filter((e) =>
                group.extensionIds.includes(e.id)
              );
              const allEnabled = memberExts.length > 0 && memberExts.every((e) => e.enabled);
              return (
                <div key={group.id} style={styles.groupRow}>
                  <div style={styles.groupInfo}>
                    <span
                      style={{
                        ...styles.groupDot,
                        background: group.color,
                      }}
                    />
                    <span style={styles.groupName}>{group.name}</span>
                    <span style={styles.groupCount}>
                      {group.extensionIds.length} ext
                    </span>
                  </div>
                  <div style={styles.groupActions}>
                    <button
                      onClick={() => toggleGroup(group.id, !allEnabled)}
                      style={{
                        ...styles.toggleBtn,
                        background: allEnabled ? 'var(--success)' : 'var(--bg-hover)',
                      }}
                      aria-label={`${allEnabled ? 'Disable' : 'Enable'} group ${group.name}`}
                    >
                      {allEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pending Changes Tab */}
      {activeTab === 'pending' && (
        <div style={styles.list}>
          <div style={styles.pendingHeader}>
            AutoState changes need your confirmation:
          </div>
          {pendingChanges.map((change) => (
            <div key={change.extensionId} style={styles.pendingRow}>
              <div style={styles.pendingInfo}>
                <strong>{change.extensionName}</strong>
                <span style={styles.pendingAction}>
                  → {change.targetEnabled ? 'Enable' : 'Disable'}
                </span>
                <span style={styles.pendingRule}>Rule: {change.ruleName}</span>
              </div>
              <div style={styles.pendingActions}>
                <button
                  onClick={() =>
                    applyPendingChange(change.extensionId, change.targetEnabled)
                  }
                  style={styles.applyBtn}
                  aria-label={`Apply change for ${change.extensionName}`}
                >
                  Apply
                </button>
                <button
                  onClick={() => dismissPendingChange(change.extensionId)}
                  style={styles.dismissBtn}
                  aria-label={`Dismiss change for ${change.extensionName}`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExtensionRow({
  ext,
  onToggle,
  onUninstall,
  onOpenOptions,
  onOpenDetails,
}: {
  ext: ExtensionInfo;
  onToggle: (id: string, enabled: boolean) => void;
  onUninstall: (id: string) => void;
  onOpenOptions: (id: string) => void;
  onOpenDetails: (id: string) => void;
}) {
  const iconUrl =
    ext.icons && ext.icons.length > 0
      ? ext.icons.reduce((best, icon) =>
          icon.size > (best?.size || 0) ? icon : best
        ).url
      : undefined;

  return (
    <div
      style={{
        ...styles.extRow,
        opacity: ext.enabled ? 1 : 0.82,
      }}
    >
      <div style={styles.extIcon}>
        {iconUrl ? (
          <img
            src={iconUrl}
            alt=""
            style={styles.extIconImg}
            width="24"
            height="24"
          />
        ) : (
          <div style={styles.extIconPlaceholder}>
            {ext.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div style={styles.extInfo}>
        <div style={styles.extName}>{ext.name}</div>
        <div style={styles.extMeta}>
          v{ext.version}
          {ext.installType === 'development' && (
            <span style={styles.devBadge}>DEV</span>
          )}
        </div>
      </div>
      <div style={styles.extActions}>
        {ext.optionsUrl && (
          <button
            onClick={() => onOpenOptions(ext.id)}
            style={styles.iconBtn}
            title="Options"
            aria-label={`Open options for ${ext.name}`}
          >
            ⚙
          </button>
        )}
        <button
          onClick={() => onOpenDetails(ext.id)}
          style={styles.iconBtn}
          title="Chrome details"
          aria-label={`Open Chrome details for ${ext.name}`}
        >
          ℹ
        </button>
        {ext.mayDisable && (
          <button
            onClick={() => onToggle(ext.id, !ext.enabled)}
            style={{
              ...styles.toggleBtn,
              background: ext.enabled ? 'var(--success)' : 'var(--bg-hover)',
            }}
            aria-label={`${ext.enabled ? 'Disable' : 'Enable'} ${ext.name}`}
          >
            {ext.enabled ? 'ON' : 'OFF'}
          </button>
        )}
        {ext.mayDisable && (
          <button
            onClick={() => onUninstall(ext.id)}
            style={styles.deleteBtn}
            title="Uninstall"
            aria-label={`Uninstall ${ext.name}`}
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, Record<string, string | number>> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '760px',
    background: 'var(--bg)',
    color: 'var(--text)',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-secondary)',
    fontSize: '13px',
  },
  header: {
    padding: '8px 12px 6px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text)',
    margin: 0,
  },
  managerBtn: {
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    cursor: 'pointer',
    padding: '3px 7px',
    borderRadius: '4px',
    fontSize: '13px',
    lineHeight: 1,
    minWidth: 'unset',
  },
  stats: {
    display: 'flex',
    gap: '4px',
    marginTop: '6px',
    flexWrap: 'wrap',
  },
  statBadge: {
    fontSize: '10px',
    lineHeight: '1.5',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
  },
  tab: {
    flex: 1,
    padding: '7px 8px',
    border: 'none',
    borderBottom: '2px solid transparent',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  tabActive: {
    flex: 1,
    padding: '7px 8px',
    border: 'none',
    borderBottom: '2px solid var(--primary)',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
  },
  searchBar: {
    display: 'flex',
    gap: '6px',
    padding: '6px 10px',
    borderBottom: '1px solid var(--border)',
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
    minHeight: '26px',
  },
  filterSelect: {
    padding: '5px 8px',
    border: '1px solid var(--border)',
    borderRadius: '3px',
    fontSize: '12px',
    background: 'var(--bg)',
    color: 'var(--text)',
    outline: 'none',
    minHeight: '26px',
  },
  list: {
    overflowY: 'auto',
    flex: 1,
  },
  empty: {
    padding: '20px 12px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '12px',
  },
  extRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderBottom: '1px solid var(--border)',
    gap: '8px',
    minHeight: '38px',
    transition: 'background 0.15s',
  },
  extIcon: {
    width: '20px',
    height: '20px',
    flexShrink: 0,
  },
  extIconImg: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
  },
  extIconPlaceholder: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    background: 'var(--bg-hover)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  extInfo: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  extName: {
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.25',
  },
  extMeta: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    lineHeight: '1.2',
  },
  devBadge: {
    fontSize: '9px',
    padding: '1px 4px',
    borderRadius: '3px',
    background: 'var(--warning)',
    color: '#fff',
    fontWeight: '700',
  },
  extActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  iconBtn: {
    border: '1px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    padding: '2px 5px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    borderRadius: '3px',
    minWidth: 'unset',
    lineHeight: 1,
  },
  toggleBtn: {
    border: '1px solid transparent',
    padding: '2px 7px',
    borderRadius: '999px',
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    color: '#fff',
    lineHeight: 1.2,
    minWidth: 'unset',
  },
  deleteBtn: {
    border: '1px solid var(--danger)',
    background: 'transparent',
    cursor: 'pointer',
    padding: '2px 5px',
    fontSize: '11px',
    color: 'var(--danger)',
    borderRadius: '3px',
    minWidth: 'unset',
    lineHeight: 1,
  },
  groupRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 10px',
    borderBottom: '1px solid var(--border)',
    gap: '8px',
  },
  groupInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
  },
  groupDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  },
  groupName: {
    fontSize: '12px',
    fontWeight: '600',
    lineHeight: '1.2',
  },
  groupCount: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
  },
  groupActions: {
    display: 'flex',
    gap: '4px',
  },
  pendingHeader: {
    padding: '10px 12px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border)',
    background: '#f8f2d8',
  },
  pendingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderBottom: '1px solid var(--border)',
    gap: '8px',
  },
  pendingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  pendingAction: {
    fontSize: '11px',
    color: 'var(--primary)',
    fontWeight: '600',
  },
  pendingRule: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
  },
  pendingActions: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexShrink: 0,
  },
  applyBtn: {
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  dismissBtn: {
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text-secondary)',
    padding: '4px 7px',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
  },
};
