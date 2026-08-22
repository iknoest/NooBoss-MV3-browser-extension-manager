/**
 * Import/Export validation utilities.
 * Validates imported JSON data before writing to storage.
 */

import {
  type ExportData,
  type ExtensionGroup,
  type AutoStateRule,
  type AppSettings,
  DEFAULT_SETTINGS,
} from './types';

const CURRENT_EXPORT_VERSION = 1;

/**
 * Create an export data object from the current state.
 */
export function createExportData(
  groups: ExtensionGroup[],
  rules: AutoStateRule[],
  settings: AppSettings
): ExportData {
  return {
    version: CURRENT_EXPORT_VERSION,
    exportedAt: Date.now(),
    generator: 'NooBoss-MV3',
    groups,
    autoStateRules: rules,
    settings,
  };
}

/**
 * Validate and parse imported data.
 * Returns validated ExportData or throws with a descriptive error.
 */
export function validateImportData(data: unknown): ExportData {
  if (!data || typeof data !== 'object') {
    throw new Error('Import data must be a JSON object');
  }

  const obj = data as Record<string, unknown>;

  // Version check
  if (typeof obj.version !== 'number' || obj.version < 1) {
    throw new Error('Invalid or missing version field');
  }

  if (obj.version > CURRENT_EXPORT_VERSION) {
    throw new Error(
      `Import data version ${obj.version} is newer than supported version ${CURRENT_EXPORT_VERSION}`
    );
  }

  // Validate groups
  if (!Array.isArray(obj.groups)) {
    throw new Error('Missing or invalid groups array');
  }
  for (const group of obj.groups) {
    validateGroup(group);
  }

  // Validate rules
  if (!Array.isArray(obj.autoStateRules)) {
    throw new Error('Missing or invalid autoStateRules array');
  }
  for (const rule of obj.autoStateRules) {
    validateRule(rule);
  }

  // Validate settings
  if (!obj.settings || typeof obj.settings !== 'object') {
    throw new Error('Missing or invalid settings object');
  }
  const settings = validateSettings(obj.settings as Record<string, unknown>);

  return {
    version: obj.version as number,
    exportedAt: typeof obj.exportedAt === 'number' ? obj.exportedAt : Date.now(),
    generator: typeof obj.generator === 'string' ? obj.generator : 'unknown',
    groups: obj.groups as ExtensionGroup[],
    autoStateRules: obj.autoStateRules as AutoStateRule[],
    settings,
  };
}

function validateGroup(group: unknown): asserts group is ExtensionGroup {
  if (!group || typeof group !== 'object') {
    throw new Error('Group must be an object');
  }
  const g = group as Record<string, unknown>;
  if (typeof g.id !== 'string' || !g.id) {
    throw new Error('Group must have a string id');
  }
  if (typeof g.name !== 'string') {
    throw new Error('Group must have a string name');
  }
  if (!Array.isArray(g.extensionIds)) {
    throw new Error('Group must have an extensionIds array');
  }
  for (const id of g.extensionIds) {
    if (typeof id !== 'string') {
      throw new Error('Group extensionIds must be strings');
    }
  }
  if (g.icon !== undefined && g.icon !== null) {
    if (typeof g.icon === 'string') {
      if (containsExecutableCode(g.icon)) {
        throw new Error('Group icon URL contains unsafe content');
      }
    } else if (typeof g.icon === 'object') {
      const iconObj = g.icon as Record<string, unknown>;
      if (iconObj.type !== 'material' && iconObj.type !== 'custom') {
        throw new Error('Group icon type must be "material" or "custom"');
      }
      if (iconObj.type === 'material' && typeof iconObj.name !== 'string') {
        throw new Error('Material group icon must have a string name');
      }
      if (iconObj.type === 'custom' && typeof iconObj.dataUrl !== 'string') {
        throw new Error('Custom group icon must have a string dataUrl');
      }
      if (typeof iconObj.dataUrl === 'string' && !iconObj.dataUrl.startsWith('data:image/')) {
        throw new Error('Custom group icon dataUrl must be a valid image data URI');
      }
    }
  }
}

function validateRule(rule: unknown): asserts rule is AutoStateRule {
  if (!rule || typeof rule !== 'object') {
    throw new Error('Rule must be an object');
  }
  const r = rule as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) {
    throw new Error('Rule must have a string id');
  }
  if (typeof r.pattern !== 'string') {
    throw new Error('Rule must have a string pattern');
  }
  if (typeof r.isWildcard !== 'boolean') {
    throw new Error('Rule must have a boolean isWildcard');
  }
  const validActions = [
    'enableWhenMatched',
    'disableWhenMatched',
    'enableOnlyWhileMatched',
    'disableOnlyWhileMatched',
  ];
  if (!validActions.includes(r.action as string)) {
    throw new Error(`Rule action must be one of: ${validActions.join(', ')}`);
  }
  if (!Array.isArray(r.targets)) {
    throw new Error('Rule must have a targets array');
  }
  // Ensure no executable code in any field
  for (const val of Object.values(r)) {
    if (typeof val === 'string' && containsExecutableCode(val)) {
      throw new Error('Import data contains potentially unsafe content');
    }
  }
}

function validateSettings(settings: Record<string, unknown>): AppSettings {
  // Merge with defaults, only keeping known keys with valid types
  const result = { ...DEFAULT_SETTINGS };

  if (typeof settings.autoStateEnabled === 'boolean')
    result.autoStateEnabled = settings.autoStateEnabled;
  if (settings.autoStateMode === 'automatic' || settings.autoStateMode === 'assisted')
    result.autoStateMode = settings.autoStateMode;
  if (typeof settings.notifyStateChange === 'boolean')
    result.notifyStateChange = settings.notifyStateChange;
  if (typeof settings.notifyInstallUninstall === 'boolean')
    result.notifyInstallUninstall = settings.notifyInstallUninstall;
  if (typeof settings.notifyAutoState === 'boolean')
    result.notifyAutoState = settings.notifyAutoState;
  if (typeof settings.historyMaxRecords === 'number' && settings.historyMaxRecords > 0)
    result.historyMaxRecords = Math.min(settings.historyMaxRecords, 50000);
  if (typeof settings.historyTrackInstall === 'boolean')
    result.historyTrackInstall = settings.historyTrackInstall;
  if (typeof settings.historyTrackUninstall === 'boolean')
    result.historyTrackUninstall = settings.historyTrackUninstall;
  if (typeof settings.historyTrackEnable === 'boolean')
    result.historyTrackEnable = settings.historyTrackEnable;
  if (typeof settings.historyTrackDisable === 'boolean')
    result.historyTrackDisable = settings.historyTrackDisable;
  if (settings.theme === 'system' || settings.theme === 'light' || settings.theme === 'dark')
    result.theme = settings.theme;
  if (
    settings.accentPreset === 'default' ||
    settings.accentPreset === 'blue' ||
    settings.accentPreset === 'purple' ||
    settings.accentPreset === 'green' ||
    settings.accentPreset === 'orange' ||
    settings.accentPreset === 'custom'
  ) {
    result.accentPreset = settings.accentPreset;
  }
  if (typeof settings.accentColor === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(settings.accentColor)) {
    result.accentColor = settings.accentColor;
  }
  if (
    settings.sortOrder === 'name' ||
    settings.sortOrder === 'name-state' ||
    settings.sortOrder === 'type' ||
    settings.sortOrder === 'recently-updated'
  )
    result.sortOrder = settings.sortOrder;
  if (settings.viewMode === 'list' || settings.viewMode === 'grid')
    result.viewMode = settings.viewMode;

  return result;
}

/**
 * Check for potentially dangerous content in import data.
 * Blocks javascript: URLs, event handlers, etc.
 */
function containsExecutableCode(value: string): boolean {
  const dangerous = [
    /javascript:/i,
    /data:text\/html/i,
    /<script/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /Function\s*\(/i,
  ];
  return dangerous.some((pattern) => pattern.test(value));
}
