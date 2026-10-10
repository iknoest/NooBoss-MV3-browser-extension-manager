/**
 * Storage abstraction using chrome.storage.local
 * Handles serialization and provides typed access.
 * All state survives service worker termination.
 */

import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  type ExtensionGroup,
  type AutoStateRule,
  type AppSettings,
  type HistoryRecord,
  type PendingAutoStateChange,
  type DeveloperProject,
  type KnownExtensionMetadata,
  type ExtensionInfo,
} from './types';

/** Get a typed value from storage */
async function get<T>(key: string, defaultValue: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  if (result[key] === undefined) {
    return defaultValue;
  }
  return result[key] as T;
}

/** Set a value in storage */
async function set<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// ── Groups ──────────────────────────────────────────────────

export async function getGroups(): Promise<ExtensionGroup[]> {
  return get<ExtensionGroup[]>(STORAGE_KEYS.GROUPS, []);
}

export async function saveGroups(groups: ExtensionGroup[]): Promise<void> {
  await set(STORAGE_KEYS.GROUPS, groups);
}

// ── AutoState Rules ─────────────────────────────────────────

export async function getAutoStateRules(): Promise<AutoStateRule[]> {
  return get<AutoStateRule[]>(STORAGE_KEYS.AUTOSTATE_RULES, []);
}

export async function saveAutoStateRules(rules: AutoStateRule[]): Promise<void> {
  await set(STORAGE_KEYS.AUTOSTATE_RULES, rules);
}

// ── Settings ────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  return get<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await set(STORAGE_KEYS.SETTINGS, settings);
}

// ── History ─────────────────────────────────────────────────

export async function getHistory(): Promise<HistoryRecord[]> {
  return get<HistoryRecord[]>(STORAGE_KEYS.HISTORY, []);
}

export async function saveHistory(records: HistoryRecord[]): Promise<void> {
  await set(STORAGE_KEYS.HISTORY, records);
}

export async function addHistoryRecord(
  record: HistoryRecord,
  maxRecords: number
): Promise<void> {
  const records = await getHistory();
  records.push(record);
  // Trim oldest if over max
  while (records.length > maxRecords) {
    records.shift();
  }
  await saveHistory(records);
}

export async function clearHistory(): Promise<void> {
  await saveHistory([]);
}

// ── Known Extensions Cache ──────────────────────────────────
// Durable local-first metadata cache keyed by extension ID.
// Survives history clearing, retention trimming, uninstallation, and restarts.

export async function getKnownExtensions(): Promise<Record<string, KnownExtensionMetadata>> {
  return get<Record<string, KnownExtensionMetadata>>(STORAGE_KEYS.KNOWN_EXTENSIONS, {});
}

export async function saveKnownExtensions(
  cache: Record<string, KnownExtensionMetadata>
): Promise<void> {
  await set(STORAGE_KEYS.KNOWN_EXTENSIONS, cache);
}

export async function upsertKnownExtensions(
  extensions: Array<ExtensionInfo | chrome.management.ExtensionInfo>
): Promise<Record<string, KnownExtensionMetadata>> {
  const cache = await getKnownExtensions();
  const now = Date.now();
  let changed = false;

  for (const ext of extensions) {
    if (!ext || !ext.id) continue;
    const existing = cache[ext.id];
    const name = ext.name || ext.shortName || ext.id;
    const shortName = ext.shortName || ext.name || ext.id;
    const version = ext.version || '';
    const type = ext.type || '';

    if (
      !existing ||
      existing.name !== name ||
      existing.shortName !== shortName ||
      existing.version !== version ||
      existing.type !== type ||
      now - existing.lastSeenAt > 60000
    ) {
      cache[ext.id] = {
        id: ext.id,
        name,
        shortName,
        version,
        type,
        lastSeenAt: now,
      };
      changed = true;
    }
  }

  if (changed) {
    await saveKnownExtensions(cache);
  }
  return cache;
}

export async function backfillKnownExtensionsFromHistory(
  history: HistoryRecord[]
): Promise<Record<string, KnownExtensionMetadata>> {
  const cache = await getKnownExtensions();
  let changed = false;

  // Find latest valid history record for each extension ID
  const latestByExtId: Record<string, HistoryRecord> = {};
  for (const record of history) {
    if (!record || !record.extensionId) continue;
    const id = record.extensionId;
    if (
      record.extensionName &&
      record.extensionName.trim() &&
      record.extensionName.trim() !== id
    ) {
      const prev = latestByExtId[id];
      if (!prev || (record.timestamp || 0) >= (prev.timestamp || 0)) {
        latestByExtId[id] = record;
      }
    }
  }

  // Backfill into cache only for IDs not already in cache
  for (const [id, record] of Object.entries(latestByExtId)) {
    if (!cache[id]) {
      cache[id] = {
        id,
        name: record.extensionName.trim(),
        shortName: record.extensionName.trim(),
        version: record.extensionVersion || '',
        lastSeenAt: record.timestamp || Date.now(),
      };
      changed = true;
    }
  }

  if (changed) {
    await saveKnownExtensions(cache);
  }
  return cache;
}

// ── Pending Changes ─────────────────────────────────────────

export async function getPendingChanges(): Promise<PendingAutoStateChange[]> {
  return get<PendingAutoStateChange[]>(STORAGE_KEYS.PENDING_CHANGES, []);
}

export async function savePendingChanges(
  changes: PendingAutoStateChange[]
): Promise<void> {
  await set(STORAGE_KEYS.PENDING_CHANGES, changes);
}

// ── AutoState Managed state ─────────────────────────────────
// Tracks which extensions are currently being managed by AutoState
// so we can restore their state when AutoState is disabled

export async function getAutoStateManaged(): Promise<Record<string, boolean>> {
  return get<Record<string, boolean>>(STORAGE_KEYS.AUTOSTATE_MANAGED, {});
}

export async function saveAutoStateManaged(
  managed: Record<string, boolean>
): Promise<void> {
  await set(STORAGE_KEYS.AUTOSTATE_MANAGED, managed);
}

// ── Developer Projects ──────────────────────────────────────

export async function getDeveloperProjects(): Promise<DeveloperProject[]> {
  return get<DeveloperProject[]>(STORAGE_KEYS.DEVELOPER_PROJECTS, []);
}

export async function saveDeveloperProjects(
  projects: DeveloperProject[]
): Promise<void> {
  await set(STORAGE_KEYS.DEVELOPER_PROJECTS, projects);
}

// ── Google Analytics 4 Metrics ──────────────────────────────

export interface StoredGA4MetricsRecord {
  propertyId: string;
  visitors: number | null;
  views: number | null;
  engagementRate: number | null;
  newUsers: number | null;
  visitorsTrend?: string;
  viewsTrend?: string;
  engagementTrend?: string;
  newUsersTrend?: string;
  activeUsers?: number | null;
  eventCount?: number | null;
  keyEvents?: number | null;
  hasPreviousBaseline?: boolean;
  fetchedAt: number;
}

export async function getGA4MetricsMap(): Promise<Record<string, StoredGA4MetricsRecord>> {
  return get<Record<string, StoredGA4MetricsRecord>>(STORAGE_KEYS.GA4_METRICS, {});
}

export async function getProjectGA4Metrics(projectId: string): Promise<StoredGA4MetricsRecord | null> {
  const map = await getGA4MetricsMap();
  return map[projectId] ?? null;
}

export async function saveProjectGA4Metrics(
  projectId: string,
  record: StoredGA4MetricsRecord
): Promise<void> {
  const map = await getGA4MetricsMap();
  map[projectId] = record;
  await set(STORAGE_KEYS.GA4_METRICS, map);
}

export async function clearProjectGA4Metrics(projectId: string): Promise<void> {
  const map = await getGA4MetricsMap();
  if (map[projectId]) {
    delete map[projectId];
    await set(STORAGE_KEYS.GA4_METRICS, map);
  }
}

// ── Welcome Seen State ──────────────────────────────────────

export async function getWelcomeSeen(): Promise<boolean> {
  return get<boolean>(STORAGE_KEYS.WELCOME_SEEN, false);
}

export async function setWelcomeSeen(seen: boolean = true): Promise<void> {
  await set(STORAGE_KEYS.WELCOME_SEEN, seen);
}

