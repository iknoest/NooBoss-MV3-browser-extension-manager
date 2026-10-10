import type { ExtensionInfo, HistoryRecord, KnownExtensionMetadata } from "../../shared/types";

export interface ResolvedMemberIdentity {
  name: string;
  isKnown: boolean;
  source: 'installed' | 'cache' | 'history' | 'unknown';
}

/**
 * Resolve the display name and identity confidence for an extension ID.
 * Resolution order:
 * 1. Current installed Chrome metadata, if present
 * 2. Known-extension metadata cache
 * 3. Latest matching Extension Drawer History record (ignoring uninstall ID placeholders)
 * 4. Fallback: "Unknown extension"
 */
export function resolveMissingMemberIdentity(
  extensionId: string,
  knownCache: Record<string, KnownExtensionMetadata> = {},
  history: HistoryRecord[] = [],
  installedExtensions: ExtensionInfo[] = []
): ResolvedMemberIdentity {
  if (!extensionId || !extensionId.trim()) {
    return { name: "Unknown extension", isKnown: false, source: "unknown" };
  }

  // 1. Current installed Chrome metadata, if present
  const installed = installedExtensions.find((e) => e.id === extensionId);
  if (installed && installed.name && installed.name.trim()) {
    return {
      name: installed.name.trim(),
      isKnown: true,
      source: "installed",
    };
  }

  // 2. Known-extension metadata cache
  const cached = knownCache[extensionId];
  if (cached && cached.name && cached.name.trim()) {
    return {
      name: cached.name.trim(),
      isKnown: true,
      source: "cache",
    };
  }

  // 3. Latest matching Extension Drawer History record
  let latestHistoryName: string | null = null;
  let latestHistoryTime = -1;
  for (const record of history) {
    if (
      record.extensionId === extensionId &&
      record.extensionName &&
      record.extensionName.trim() &&
      record.extensionName.trim() !== extensionId // exclude raw ID fallbacks
    ) {
      if (record.timestamp >= latestHistoryTime) {
        latestHistoryTime = record.timestamp;
        latestHistoryName = record.extensionName.trim();
      }
    }
  }

  if (latestHistoryName) {
    return {
      name: latestHistoryName,
      isKnown: true,
      source: "history",
    };
  }

  // 4. Unknown extension
  return {
    name: "Unknown extension",
    isKnown: false,
    source: "unknown",
  };
}

/**
 * Resolve the last-known extension name for a missing extension ID.
 * Returns null if genuinely unknown.
 * Group membership itself never depends on History.
 */
export function resolveLastKnownExtensionName(
  extensionId: string,
  history: HistoryRecord[] = [],
  knownCache: Record<string, KnownExtensionMetadata> = {},
  installedExtensions: ExtensionInfo[] = []
): string | null {
  const resolved = resolveMissingMemberIdentity(
    extensionId,
    knownCache,
    history,
    installedExtensions
  );
  return resolved.isKnown ? resolved.name : null;
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

/**
 * Builds a user-initiated web search URL to help discover/identify a missing extension.
 * Defaults to: chrome extension "<EXTENSION_ID>"
 * If a known name is provided: chrome extension "<NAME>" "<EXTENSION_ID>"
 */
export function buildExtensionWebSearchUrl(
  extensionId: string,
  extensionName?: string,
  isKnown: boolean = false
): string {
  const cleanId = (extensionId || "").trim();
  const cleanName = (extensionName || "").trim();
  const query =
    isKnown && cleanName && cleanName !== cleanId && cleanName !== "Unknown extension"
      ? `chrome extension "${cleanName}" "${cleanId}"`
      : `chrome extension "${cleanId}"`;
  const params = new URLSearchParams({ q: query });
  return `https://www.google.com/search?${params.toString()}`;
}
