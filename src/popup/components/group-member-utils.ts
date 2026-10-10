import type { ExtensionInfo, HistoryRecord } from "../../shared/types";

/**
 * Resolve the last-known extension name for a missing extension ID from Extension Drawer History.
 * Returns null if not found or if history is empty.
 * Group membership itself never depends on History.
 */
export function resolveLastKnownExtensionName(
  extensionId: string,
  history: HistoryRecord[] = []
): string | null {
  if (!extensionId || !history || history.length === 0) {
    return null;
  }

  let latestName: string | null = null;
  let latestTimestamp = -1;

  for (const record of history) {
    if (record.extensionId === extensionId && record.extensionName && record.extensionName.trim()) {
      if (record.timestamp >= latestTimestamp) {
        latestTimestamp = record.timestamp;
        latestName = record.extensionName.trim();
      }
    }
  }

  return latestName;
}

/**
 * Sort extensions for group membership editor and selection contexts:
 * 1. Already assigned / selected members first
 * 2. Within each selected/unselected section, running extensions first
 * 3. Then alphabetical by name
 */
export function sortGroupMemberExtensions(
  extensions: ExtensionInfo[],
  selectedIds?: string[]
): ExtensionInfo[] {
  if (!selectedIds || selectedIds.length === 0) {
    return [...extensions].sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }

  const selectedSet = new Set(selectedIds);
  return [...extensions].sort((a, b) => {
    const aSelected = selectedSet.has(a.id);
    const bSelected = selectedSet.has(b.id);
    if (aSelected !== bSelected) {
      return aSelected ? -1 : 1;
    }
    if (a.enabled !== b.enabled) {
      return a.enabled ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
