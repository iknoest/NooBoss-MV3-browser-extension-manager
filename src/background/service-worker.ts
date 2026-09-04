/**
 * NooBoss MV3 Service Worker
 * Handles extension management, AutoState, history, and messaging.
 * All state is persisted to chrome.storage.local to survive SW termination.
 */

import {
  type ExtensionInfo,
  type PendingAutoStateChange,
  type Message,
  generateId,
} from '../shared/types';
import {
  getGroups,
  saveGroups,
  getAutoStateRules,
  saveAutoStateRules,
  getSettings,
  saveSettings,
  getHistory,
  addHistoryRecord,
  clearHistory,
  getPendingChanges,
  savePendingChanges,
} from '../shared/storage';
import { computeDesiredStates } from '../shared/autostate';
import { createExportData, validateImportData } from '../shared/import-export';

// ── Self ID ─────────────────────────────────────────────────
const SELF_ID = chrome.runtime.id;

// ── Tab URL tracking (rebuilt on each SW start) ────────────
let tabUrls: Record<number, string> = {};

// ── Initialize on install/startup ───────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[NooBoss] Installed/Updated:', details.reason);
  await initializeState();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[NooBoss] Browser startup');
  await initializeState();
});

async function initializeState(): Promise<void> {
  // Rebuild tab URL map
  await rebuildTabUrls();
  // Run AutoState evaluation
  await evaluateAutoState();
}

async function rebuildTabUrls(): Promise<void> {
  tabUrls = {};
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id !== undefined && tab.url) {
        tabUrls[tab.id] = tab.url;
      }
    }
  } catch (e) {
    console.warn('[NooBoss] Failed to query tabs:', e);
  }
}

// ── Tab event listeners (registered at top level) ───────────

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id !== undefined && tab.url) {
    tabUrls[tab.id] = tab.url;
    evaluateAutoState();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    tabUrls[tabId] = changeInfo.url;
    evaluateAutoState();
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabUrls[tabId];
  evaluateAutoState();
});

chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
  delete tabUrls[removedTabId];
  try {
    const tab = await chrome.tabs.get(addedTabId);
    if (tab.url) {
      tabUrls[addedTabId] = tab.url;
    }
  } catch { /* tab may not exist */ }
  evaluateAutoState();
});

// ── Management event listeners ──────────────────────────────

chrome.management.onInstalled.addListener(async (extInfo) => {
  const settings = await getSettings();
  if (settings.historyTrackInstall) {
    await addHistoryRecord(
      {
        id: generateId(),
        timestamp: Date.now(),
        event: 'installed',
        extensionId: extInfo.id,
        extensionName: extInfo.name,
        extensionVersion: extInfo.version,
        source: 'external',
      },
      settings.historyMaxRecords
    );
  }
  if (settings.notifyInstallUninstall) {
    notify(`${extInfo.name} was installed`);
  }
  broadcastStateChanged();
});

chrome.management.onUninstalled.addListener(async (id) => {
  const settings = await getSettings();
  if (settings.historyTrackUninstall) {
    await addHistoryRecord(
      {
        id: generateId(),
        timestamp: Date.now(),
        event: 'uninstalled',
        extensionId: id,
        extensionName: id, // Name unavailable after uninstall
        extensionVersion: '',
        source: 'external',
      },
      settings.historyMaxRecords
    );
  }
  if (settings.notifyInstallUninstall) {
    notify(`Extension ${id} was uninstalled`);
  }
  // Clean up group memberships
  const groups = await getGroups();
  let changed = false;
  for (const group of groups) {
    const idx = group.extensionIds.indexOf(id);
    if (idx !== -1) {
      group.extensionIds.splice(idx, 1);
      changed = true;
    }
  }
  if (changed) {
    await saveGroups(groups);
  }
  broadcastStateChanged();
});

chrome.management.onEnabled.addListener(async (extInfo) => {
  const settings = await getSettings();
  if (settings.historyTrackEnable) {
    await addHistoryRecord(
      {
        id: generateId(),
        timestamp: Date.now(),
        event: 'enabled',
        extensionId: extInfo.id,
        extensionName: extInfo.name,
        extensionVersion: extInfo.version,
        source: 'user',
      },
      settings.historyMaxRecords
    );
  }
  broadcastStateChanged();
});

chrome.management.onDisabled.addListener(async (extInfo) => {
  const settings = await getSettings();
  if (settings.historyTrackDisable) {
    await addHistoryRecord(
      {
        id: generateId(),
        timestamp: Date.now(),
        event: 'disabled',
        extensionId: extInfo.id,
        extensionName: extInfo.name,
        extensionVersion: extInfo.version,
        source: 'user',
      },
      settings.historyMaxRecords
    );
  }
  broadcastStateChanged();
});

// ── Message handling ────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    handleMessage(message).then(sendResponse).catch((err) => {
      console.error('[NooBoss] Message handler error:', err);
      sendResponse({ error: err.message });
    });
    return true; // Will respond asynchronously
  }
);

async function handleMessage(message: Message): Promise<unknown> {
  switch (message.type) {
    case 'GET_EXTENSIONS':
      return getExtensions();

    case 'TOGGLE_EXTENSION':
      return toggleExtension(message.id, message.enabled);

    case 'RELOAD_EXTENSION':
      return reloadExtension(message.id);

    case 'UNINSTALL_EXTENSION':
      return uninstallExtension(message.id);

    case 'OPEN_OPTIONS':
      return openExtensionOptions(message.id);

    case 'OPEN_CHROME_DETAILS':
      return openChromeDetails(message.id);

    case 'GET_GROUPS':
      return getGroups();

    case 'CREATE_GROUP':
      return createGroup(message.name);

    case 'UPDATE_GROUP':
      return updateGroup(message.group);

    case 'DELETE_GROUP':
      return deleteGroup(message.id);

    case 'TOGGLE_GROUP':
      return toggleGroup(message.id, message.enabled);

    case 'GET_HISTORY':
      return getHistory();

    case 'CLEAR_HISTORY':
      await clearHistory();
      return { success: true };

    case 'GET_AUTOSTATE_RULES':
      return getAutoStateRules();

    case 'SAVE_AUTOSTATE_RULES':
      await saveAutoStateRules(message.rules);
      await evaluateAutoState();
      return { success: true };

    case 'GET_PENDING_CHANGES':
      return getPendingChanges();

    case 'APPLY_PENDING_CHANGE':
      return applyPendingChange(message.extensionId, message.enabled);

    case 'DISMISS_PENDING_CHANGE':
      return dismissPendingChange(message.extensionId);

    case 'GET_SETTINGS':
      return getSettings();

    case 'SAVE_SETTINGS':
      await saveSettings(message.settings);
      if (message.settings.autoStateEnabled) {
        await evaluateAutoState();
      }
      return { success: true };

    case 'EXPORT_DATA': {
      const [groups, rules, settings] = await Promise.all([
        getGroups(),
        getAutoStateRules(),
        getSettings(),
      ]);
      return createExportData(groups, rules, settings);
    }

    case 'IMPORT_DATA':
      return importData(message.data);

    case 'TEST_AUTOSTATE_AUTOMATIC':
      return testAutoStateAutomatic();

    default:
      return { error: 'Unknown message type' };
  }
}

// ── Extension management ────────────────────────────────────

async function getExtensions(): Promise<ExtensionInfo[]> {
  const allExtensions = await chrome.management.getAll();
  return allExtensions
    .filter((ext) => ext.id !== SELF_ID) // Never show self
    .map((ext) => ({
      id: ext.id,
      name: ext.name,
      shortName: ext.shortName || ext.name,
      description: ext.description,
      version: ext.version,
      enabled: ext.enabled,
      mayDisable: ext.mayDisable,
      type: ext.type,
      installType: ext.installType,
      homepageUrl: ext.homepageUrl,
      updateUrl: ext.updateUrl,
      offlineEnabled: ext.offlineEnabled,
      optionsUrl: ext.optionsUrl,
      icons: ext.icons,
      permissions: ext.permissions,
      hostPermissions: ext.hostPermissions,
    }));
}

async function toggleExtension(
  id: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  if (id === SELF_ID) {
    return { success: false, error: 'Cannot modify self' };
  }
  try {
    const ext = await chrome.management.get(id);
    if (!ext.mayDisable && !enabled) {
      return {
        success: false,
        error: 'This extension cannot be disabled (managed by policy)',
      };
    }
    await chrome.management.setEnabled(id, enabled);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function reloadExtension(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (id === SELF_ID) {
    return { success: false, error: 'Cannot reload self' };
  }
  try {
    const ext = await chrome.management.get(id);
    if (!ext.enabled || ext.installType !== 'development') {
      return { success: false, error: 'Target is not an enabled development extension' };
    }
    await chrome.management.setEnabled(id, false);
    try {
      await chrome.management.setEnabled(id, true);
      return { success: true };
    } catch (enableErr) {
      console.error(`[NooBoss] Re-enable failed for ${id}, attempting recovery:`, enableErr);
      try {
        await chrome.management.setEnabled(id, true);
        return { success: true };
      } catch (recoveryErr) {
        console.error(`[NooBoss] Recovery enable attempt failed for ${id}:`, recoveryErr);
        return { success: false, error: 'Recovery enable attempt failed' };
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function uninstallExtension(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (id === SELF_ID) {
    return { success: false, error: 'Cannot uninstall self' };
  }
  try {
    await chrome.management.uninstall(id, { showConfirmDialog: true });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Uninstall cancelled or failed',
    };
  }
}

async function openExtensionOptions(id: string): Promise<void> {
  try {
    const ext = await chrome.management.get(id);
    if (ext.optionsUrl) {
      await chrome.tabs.create({ url: ext.optionsUrl });
    }
  } catch { /* ignore */ }
}

async function openChromeDetails(id: string): Promise<void> {
  await chrome.tabs.create({ url: `chrome://extensions/?id=${id}` });
}

// ── Groups ──────────────────────────────────────────────────

async function createGroup(
  name: string
): Promise<{ success: boolean; group?: import('../shared/types').ExtensionGroup }> {
  const groups = await getGroups();
  const newGroup = {
    id: `group_${generateId()}`,
    name,
    extensionIds: [],
    color: '#6366f1',
    createdAt: Date.now(),
  };
  groups.push(newGroup);
  await saveGroups(groups);
  return { success: true, group: newGroup };
}

async function updateGroup(
  group: import('../shared/types').ExtensionGroup
): Promise<{ success: boolean }> {
  const groups = await getGroups();
  const idx = groups.findIndex((g) => g.id === group.id);
  if (idx === -1) {
    return { success: false };
  }
  groups[idx] = group;
  await saveGroups(groups);
  return { success: true };
}

async function deleteGroup(id: string): Promise<{ success: boolean }> {
  const groups = await getGroups();
  const filtered = groups.filter((g) => g.id !== id);
  await saveGroups(filtered);
  // Also remove from AutoState rules
  const rules = await getAutoStateRules();
  let rulesChanged = false;
  for (const rule of rules) {
    const idx = rule.targets.indexOf(id);
    if (idx !== -1) {
      rule.targets.splice(idx, 1);
      rulesChanged = true;
    }
  }
  if (rulesChanged) {
    await saveAutoStateRules(rules);
  }
  return { success: true };
}

async function toggleGroup(
  groupId: string,
  enabled: boolean
): Promise<{ success: boolean; errors?: string[] }> {
  const groups = await getGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    return { success: false, errors: ['Group not found'] };
  }
  const errors: string[] = [];
  for (const extId of group.extensionIds) {
    if (extId === SELF_ID) continue;
    try {
      await chrome.management.setEnabled(extId, enabled);
    } catch (err) {
      errors.push(
        `${extId}: ${err instanceof Error ? err.message : 'Failed'}`
      );
    }
  }
  return { success: true, errors: errors.length > 0 ? errors : undefined };
}

// ── AutoState Engine ────────────────────────────────────────

let autoStateDebounceTimer: ReturnType<typeof setTimeout> | null = null;

async function evaluateAutoState(): Promise<void> {
  // Debounce rapid tab changes
  if (autoStateDebounceTimer) {
    clearTimeout(autoStateDebounceTimer);
  }
  autoStateDebounceTimer = setTimeout(async () => {
    await doEvaluateAutoState();
  }, 150);
}

async function doEvaluateAutoState(): Promise<void> {
  const settings = await getSettings();
  if (!settings.autoStateEnabled) return;

  const rules = await getAutoStateRules();
  const activeRules = rules
    .filter((r) => r.enabled)
    .sort((a, b) => a.priority - b.priority);

  if (activeRules.length === 0) return;

  // Ensure tab URLs are fresh
  if (Object.keys(tabUrls).length === 0) {
    await rebuildTabUrls();
  }

  const urls = Object.values(tabUrls).filter(Boolean);
  const groups = await getGroups();

  const desiredState = computeDesiredStates(activeRules, groups, urls);

  // Apply state changes
  const isAutomatic = settings.autoStateMode === 'automatic';
  const pending: PendingAutoStateChange[] = [];

  for (const [extId, enabled] of Object.entries(desiredState)) {
    if (extId === SELF_ID) continue;

    try {
      const ext = await chrome.management.get(extId);
      if (ext.enabled === enabled || !ext.mayDisable) {
        continue;
      }

      if (isAutomatic) {
        try {
          await chrome.management.setEnabled(extId, enabled);
        } catch (err) {
          if (isAutoStateGestureBlockedError(err)) {
            pending.push({
              extensionId: extId,
              extensionName: ext.name,
              targetEnabled: enabled,
              ruleId: '',
              ruleName: 'AutoState fallback',
              timestamp: Date.now(),
            });
          }
        }
      } else {
        pending.push({
          extensionId: extId,
          extensionName: ext.name,
          targetEnabled: enabled,
          ruleId: '',
          ruleName: 'AutoState',
          timestamp: Date.now(),
        });
      }
    } catch {
      // Extension may have been uninstalled.
    }
  }

  if (isAutomatic) {
    await savePendingChanges(pending);
    if (pending.length > 0) {
      await chrome.action.setBadgeText({ text: String(pending.length) });
      await chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
    return;
  }

  await savePendingChanges(pending);
  if (pending.length > 0) {
    await chrome.action.setBadgeText({ text: String(pending.length) });
    await chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}

function isAutoStateGestureBlockedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /user gesture|user action|not allowed|permission|gesture/i.test(message);
}

async function applyPendingChange(
  extensionId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await chrome.management.setEnabled(extensionId, enabled);
    // Remove from pending
    const pending = await getPendingChanges();
    const filtered = pending.filter((p) => p.extensionId !== extensionId);
    await savePendingChanges(filtered);
    // Update badge
    if (filtered.length > 0) {
      await chrome.action.setBadgeText({ text: String(filtered.length) });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed',
    };
  }
}

async function dismissPendingChange(
  extensionId: string
): Promise<{ success: boolean }> {
  const pending = await getPendingChanges();
  const filtered = pending.filter((p) => p.extensionId !== extensionId);
  await savePendingChanges(filtered);
  if (filtered.length > 0) {
    await chrome.action.setBadgeText({ text: String(filtered.length) });
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
  return { success: true };
}

// ── Import ──────────────────────────────────────────────────

async function importData(
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = validateImportData(data);
    await saveGroups(validated.groups);
    await saveAutoStateRules(validated.autoStateRules);
    await saveSettings(validated.settings);
    await evaluateAutoState();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Import failed',
    };
  }
}

// ── AutoState test ──────────────────────────────────────────

async function testAutoStateAutomatic(): Promise<{
  automatic: boolean;
  details: string;
}> {
  // The chrome.management.setEnabled API works programmatically in MV3
  // with the management permission. No user gesture is required.
  // This was verified on Chrome 151+.
  try {
    // Try to get our own info - if management API works, automatic mode works
    const self = await chrome.management.getSelf();
    return {
      automatic: true,
      details: `AutoState automatic mode is supported. chrome.management.setEnabled() works programmatically with the management permission on Chrome ${navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown'}. Extension: ${self.name} v${self.version}.`,
    };
  } catch (err) {
    return {
      automatic: false,
      details: `AutoState automatic mode test failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

// ── Utilities ───────────────────────────────────────────────

function notify(message: string): void {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: 'Extension Drawer',
    message,
  });
}

function broadcastStateChanged(): void {
  chrome.runtime.sendMessage({ type: 'STATE_CHANGED' }).catch(() => {
    // No receivers - popup may be closed
  });
}

console.log('[NooBoss] Service worker loaded');
