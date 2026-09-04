/**
 * Shared type definitions for NooBoss MV3
 */

/** Extension info from chrome.management, augmented with our metadata */
export interface ExtensionInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  version: string;
  enabled: boolean;
  mayDisable: boolean;
  mayEnable?: boolean;
  type: string;
  installType: string;
  homepageUrl?: string;
  updateUrl?: string;
  offlineEnabled: boolean;
  optionsUrl: string;
  icons?: Array<{ size: number; url: string }>;
  permissions: string[];
  hostPermissions: string[];
}

/** Group Icon descriptor */
export type GroupIcon =
  | { type: 'material'; name: string }
  | { type: 'custom'; dataUrl: string };

/** A user-created group of extensions */
export interface ExtensionGroup {
  id: string;
  name: string;
  extensionIds: string[];
  color: string;
  createdAt: number;
  icon?: GroupIcon | string;
}

/** AutoState matching rule */
export interface AutoStateRule {
  id: string;
  enabled: boolean;
  name: string;
  /** URL pattern - wildcard or regex */
  pattern: string;
  /** Whether pattern is wildcard (true) or regex (false) */
  isWildcard: boolean;
  /** Extension IDs and/or group IDs targeted by this rule */
  targets: string[];
  /** What to do when the pattern matches */
  action: AutoStateAction;
  /** Priority: lower = higher priority. Determines evaluation order. */
  priority: number;
  createdAt: number;
}

export type AutoStateAction =
  | 'enableWhenMatched'    // Enable extensions when any tab URL matches
  | 'disableWhenMatched'   // Disable extensions when any tab URL matches
  | 'enableOnlyWhileMatched'   // Enable only while matched, disable otherwise
  | 'disableOnlyWhileMatched'; // Disable only while matched, enable otherwise

/** A pending AutoState change that needs user confirmation (if auto mode doesn't work) */
export interface PendingAutoStateChange {
  extensionId: string;
  extensionName: string;
  targetEnabled: boolean;
  ruleId: string;
  ruleName: string;
  timestamp: number;
}

/** History record of an extension management event */
export interface HistoryRecord {
  id: string;
  timestamp: number;
  event: 'installed' | 'uninstalled' | 'enabled' | 'disabled' | 'updated';
  extensionId: string;
  extensionName: string;
  extensionVersion: string;
  /** Source: 'user' for manual, 'autostate' for automatic, 'external' for other */
  source: 'user' | 'autostate' | 'external';
}

/** App settings/preferences */
export interface AppSettings {
  /** Whether AutoState is globally enabled */
  autoStateEnabled: boolean;
  /** Whether AutoState operates automatically or in assisted mode */
  autoStateMode: 'automatic' | 'assisted';
  /** Whether to show notifications for state changes */
  notifyStateChange: boolean;
  /** Whether to show notifications for install/uninstall */
  notifyInstallUninstall: boolean;
  /** Whether to show notifications for AutoState actions */
  notifyAutoState: boolean;
  /** Maximum number of history records to keep */
  historyMaxRecords: number;
  /** Track install events in history */
  historyTrackInstall: boolean;
  /** Track uninstall events in history */
  historyTrackUninstall: boolean;
  /** Track enable events in history */
  historyTrackEnable: boolean;
  /** Track disable events in history */
  historyTrackDisable: boolean;
  /** Theme preference */
  theme: 'system' | 'light' | 'dark';
  /** Accent color preset */
  accentPreset?: 'default' | 'blue' | 'purple' | 'green' | 'orange' | 'custom';
  /** Custom/resolved accent color hex */
  accentColor?: string;
  /** Extension list sort order */
  sortOrder: 'name' | 'name-state' | 'type' | 'recently-updated';
  /** View mode */
  viewMode: 'list' | 'bigTile' | 'tile' | 'grid';
}

/** Export/Import data format */
export interface ExportData {
  version: number;
  exportedAt: number;
  generator: string;
  groups: ExtensionGroup[];
  autoStateRules: AutoStateRule[];
  settings: AppSettings;
}

/** Messages between service worker and UI */
export type Message =
  | { type: 'GET_EXTENSIONS' }
  | { type: 'EXTENSIONS_LIST'; extensions: ExtensionInfo[] }
  | { type: 'TOGGLE_EXTENSION'; id: string; enabled: boolean }
  | { type: 'RELOAD_EXTENSION'; id: string }
  | { type: 'UNINSTALL_EXTENSION'; id: string }
  | { type: 'OPEN_OPTIONS'; id: string }
  | { type: 'OPEN_CHROME_DETAILS'; id: string }
  | { type: 'GET_GROUPS' }
  | { type: 'GROUPS_LIST'; groups: ExtensionGroup[] }
  | { type: 'CREATE_GROUP'; name: string }
  | { type: 'UPDATE_GROUP'; group: ExtensionGroup }
  | { type: 'DELETE_GROUP'; id: string }
  | { type: 'TOGGLE_GROUP'; id: string; enabled: boolean }
  | { type: 'GET_HISTORY' }
  | { type: 'HISTORY_LIST'; records: HistoryRecord[] }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'GET_AUTOSTATE_RULES' }
  | { type: 'AUTOSTATE_RULES_LIST'; rules: AutoStateRule[] }
  | { type: 'SAVE_AUTOSTATE_RULES'; rules: AutoStateRule[] }
  | { type: 'GET_PENDING_CHANGES' }
  | { type: 'PENDING_CHANGES_LIST'; changes: PendingAutoStateChange[] }
  | { type: 'APPLY_PENDING_CHANGE'; extensionId: string; enabled: boolean }
  | { type: 'DISMISS_PENDING_CHANGE'; extensionId: string }
  | { type: 'GET_SETTINGS' }
  | { type: 'SETTINGS_DATA'; settings: AppSettings }
  | { type: 'SAVE_SETTINGS'; settings: AppSettings }
  | { type: 'EXPORT_DATA' }
  | { type: 'EXPORT_RESULT'; data: ExportData }
  | { type: 'IMPORT_DATA'; data: unknown }
  | { type: 'IMPORT_RESULT'; success: boolean; error?: string }
  | { type: 'STATE_CHANGED' }
  | { type: 'TEST_AUTOSTATE_AUTOMATIC' }
  | { type: 'AUTOSTATE_TEST_RESULT'; automatic: boolean; details: string };

/** Default settings */
export const DEFAULT_SETTINGS: AppSettings = {
  autoStateEnabled: true,
  autoStateMode: 'automatic',
  notifyStateChange: false,
  notifyInstallUninstall: true,
  notifyAutoState: false,
  historyMaxRecords: 5000,
  historyTrackInstall: true,
  historyTrackUninstall: true,
  historyTrackEnable: true,
  historyTrackDisable: true,
  theme: 'system',
  accentPreset: 'default',
  accentColor: '#1a73e8',
  sortOrder: 'name-state',
  viewMode: 'bigTile',
};

/** Storage keys */
export const STORAGE_KEYS = {
  GROUPS: 'nooboss_groups',
  AUTOSTATE_RULES: 'nooboss_autostate_rules',
  SETTINGS: 'nooboss_settings',
  HISTORY: 'nooboss_history',
  AUTOSTATE_MANAGED: 'nooboss_autostate_managed',
  PENDING_CHANGES: 'nooboss_pending_changes',
} as const;

/** Generate a unique ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** Check if an ID refers to a group (vs an extension) */
export function isGroupId(id: string): boolean {
  return id.startsWith('group_');
}
