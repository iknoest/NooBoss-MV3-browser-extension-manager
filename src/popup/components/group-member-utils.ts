import type { ExtensionInfo } from "../../shared/types";

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
