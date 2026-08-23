import type { ExtensionGroup, ExtensionInfo } from "../../shared/types";

export interface GroupRuntimeSummary {
  configuredMemberCount: number;
  installedMemberCount: number;
  runningMemberCount: number;
  unavailableMemberCount: number;
  missingMemberCount: number;
  summaryText: string;
  exceptionText?: string;
  hasUnavailable: boolean;
  hasMissing: boolean;
}

export function computeGroupRuntimeSummary(
  group: ExtensionGroup,
  allExtensions: ExtensionInfo[] = []
): GroupRuntimeSummary {
  const configuredIds = group.extensionIds || [];
  const configuredMemberCount = configuredIds.length;

  const installedExts = allExtensions.filter((e) => configuredIds.includes(e.id));
  const installedMemberCount = installedExts.length;

  const runningMemberCount = installedExts.filter((e) => e.enabled).length;

  // Unavailable: installed member that cannot be disabled (mayDisable === false)
  const unavailableMemberCount = installedExts.filter((e) => e.mayDisable === false).length;

  // Missing: configured IDs that are no longer installed in Chrome
  const missingMemberCount = configuredIds.filter((id) => !allExtensions.some((e) => e.id === id)).length;

  const summaryText = `${runningMemberCount} / ${installedMemberCount} running`;

  const exceptions: string[] = [];
  if (unavailableMemberCount > 0) {
    exceptions.push(`${unavailableMemberCount} unavailable`);
  }
  if (missingMemberCount > 0) {
    exceptions.push(`${missingMemberCount} missing`);
  }

  const exceptionText = exceptions.length > 0 ? exceptions.join(" · ") : undefined;

  return {
    configuredMemberCount,
    installedMemberCount,
    runningMemberCount,
    unavailableMemberCount,
    missingMemberCount,
    summaryText,
    exceptionText,
    hasUnavailable: unavailableMemberCount > 0,
    hasMissing: missingMemberCount > 0,
  };
}
