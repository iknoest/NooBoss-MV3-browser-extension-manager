import { matchUrl } from './matching';
import type { AutoStateRule, ExtensionGroup } from './types';

export function resolveTargets(targets: string[], groups: ExtensionGroup[]): string[] {
  const ids = new Set<string>();
  for (const target of targets) {
    if (target.startsWith('group_')) {
      const group = groups.find((g) => g.id === target);
      if (group) {
        group.extensionIds.forEach((id) => ids.add(id));
      }
    } else {
      ids.add(target);
    }
  }
  return Array.from(ids);
}

export function computeDesiredStates(
  rules: AutoStateRule[],
  groups: ExtensionGroup[],
  activeUrls: string[]
): Record<string, boolean> {
  const desired: Record<string, boolean> = {};

  const ordered = [...rules]
    .filter((rule) => rule.enabled)
    .sort((a, b) => a.priority - b.priority);

  // Group rules by target in priority order with match results
  const targetRulesMap = new Map<string, Array<{ rule: AutoStateRule; matched: boolean }>>();

  for (const rule of ordered) {
    const matched = activeUrls.some((url) => matchUrl(url, rule.pattern, rule.isWildcard));
    const targets = resolveTargets(rule.targets, groups);

    for (const extId of targets) {
      if (!targetRulesMap.has(extId)) {
        targetRulesMap.set(extId, []);
      }
      targetRulesMap.get(extId)!.push({ rule, matched });
    }
  }

  for (const [extId, ruleEntries] of targetRulesMap.entries()) {
    // 1. Highest-priority actively matched rule wins
    const activeMatch = ruleEntries.find((entry) => entry.matched);
    if (activeMatch) {
      switch (activeMatch.rule.action) {
        case 'enableWhenMatched':
        case 'enableOnlyWhileMatched':
          desired[extId] = true;
          break;
        case 'disableWhenMatched':
        case 'disableOnlyWhileMatched':
          desired[extId] = false;
          break;
      }
    } else {
      // 2. No rule actively matched. Apply non-matching restore state from highest-priority temporary rule
      const fallbackRule = ruleEntries.find(
        (entry) =>
          entry.rule.action === 'enableOnlyWhileMatched' ||
          entry.rule.action === 'disableOnlyWhileMatched'
      );
      if (fallbackRule) {
        if (fallbackRule.rule.action === 'enableOnlyWhileMatched') {
          desired[extId] = false;
        } else if (fallbackRule.rule.action === 'disableOnlyWhileMatched') {
          desired[extId] = true;
        }
      }
    }
  }

  return desired;
}
