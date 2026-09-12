import type { AutoStateRule } from "../../shared/types";

export type MatchScope = "website" | "exact" | "wildcard" | "regex";
export type RuleTiming = "while" | "when";
export type RuleEffect = "on" | "off";

export const SCOPE_LABELS: Record<MatchScope, string> = {
  website: "This website (recommended)",
  exact: "Exact page",
  wildcard: "Custom URL pattern",
  regex: "Regular expression · Advanced",
};

export const SCOPE_EXPLANATIONS: Record<MatchScope, string> = {
  website: "Applies to all pages on this website (e.g. linkedin.com/feed, www.linkedin.com)",
  exact: "Applies only to this exact page URL",
  wildcard: "Use * to match any text and ? for a single character",
  regex: "For complex URL matching when the options above are not enough",
};

export const SCOPE_PLACEHOLDERS: Record<MatchScope, string> = {
  website: "e.g. linkedin.com",
  exact: "e.g. https://www.linkedin.com/jobs/view/123",
  wildcard: "e.g. *linkedin.com/in/*",
  regex: "e.g. ^https://.*\\.linkedin\\.com/.*",
};

export const TIMING_LABELS: Record<RuleTiming, string> = {
  while: "While this site is open (Temporary: reverts when tab closes)",
  when: "When this site opens (One-time trigger: stays changed after tab closes)",
};

export const EFFECT_LABELS: Record<RuleEffect, string> = {
  on: "Turn extension ON",
  off: "Turn extension OFF",
};

export const AUTOSTATE_ACTION_LABELS: Record<AutoStateRule["action"], string> = {
  enableOnlyWhileMatched: "Keep on while matching site is open",
  disableOnlyWhileMatched: "Keep off while matching site is open",
  enableWhenMatched: "Turn on when a matching site opens",
  disableWhenMatched: "Turn off when a matching site opens",
};

export const AUTOSTATE_ACTION_HELPERS: Record<AutoStateRule["action"], string> = {
  enableOnlyWhileMatched:
    "Turns the extension on while any open tab matches. Turns it off when no open tabs match.",
  disableOnlyWhileMatched:
    "Turns the extension off while any open tab matches. Turns it back on when no open tabs match.",
  enableWhenMatched:
    "Turns the extension on when a match appears. It stays on afterward.",
  disableWhenMatched:
    "Turns the extension off when a match appears. It stays off afterward.",
};

export const MATCH_TYPE_LABELS = {
  wildcard: "Website pattern",
  regex: "Regular expression (advanced)",
} as const;

export const MATCH_TYPE_HELPERS = {
  wildcard: "Use * for any text and ? for one character.\nExample: https://www.linkedin.com/*",
  regex: "Advanced matching using JavaScript regular expressions.",
} as const;

export interface PatternGenerationResult {
  success: boolean;
  pattern?: string;
  value?: string;
  error?: string;
}

/**
 * Clean a domain input by stripping protocol, path, leading www., and outer asterisks.
 */
export function cleanDomainInput(input: string): string {
  if (!input) return "";
  let d = input.trim();
  d = d.replace(/^https?:\/\//i, "");
  d = d.replace(/^\/\//, "");
  d = d.replace(/\/.*$/, "");
  d = d.replace(/^[*?]+|[*?]+$/g, "");
  d = d.replace(/^www\./i, "");
  return d;
}

/**
 * Convert user scope and input into an internal AutoStateRule pattern.
 */
export function buildPatternFromScope(
  scope: MatchScope,
  input: string
): { pattern: string; isWildcard: boolean } {
  const trimmed = input.trim();
  switch (scope) {
    case "website": {
      const clean = cleanDomainInput(trimmed);
      return {
        pattern: clean ? `*${clean}*` : "",
        isWildcard: true,
      };
    }
    case "exact":
      return {
        pattern: trimmed,
        isWildcard: true,
      };
    case "wildcard":
      return {
        pattern: trimmed,
        isWildcard: true,
      };
    case "regex":
      return {
        pattern: trimmed,
        isWildcard: false,
      };
  }
}

/**
 * Detect the appropriate MatchScope and user-facing input from a stored AutoStateRule.
 */
export function detectScopeAndInput(rule: Pick<AutoStateRule, "pattern" | "isWildcard">): {
  scope: MatchScope;
  displayInput: string;
} {
  if (!rule.isWildcard) {
    return {
      scope: "regex",
      displayInput: rule.pattern,
    };
  }

  const p = rule.pattern.trim();

  // Pattern like *domain.com*
  const starDomainMatch = p.match(/^\*+([a-zA-Z0-9.-]+)\*+$/);
  if (starDomainMatch) {
    return {
      scope: "website",
      displayInput: starDomainMatch[1],
    };
  }

  // Pattern like *://*.domain.com/* or *://*domain.com/*
  const schemeStarMatch = p.match(/^\*:\/\/\*?\.?([a-zA-Z0-9.-]+)\/\*$/);
  if (schemeStarMatch) {
    return {
      scope: "website",
      displayInput: schemeStarMatch[1],
    };
  }

  // Pattern like https://domain.com/* or http://domain.com/*
  const originStarMatch = p.match(/^https?:\/\/([a-zA-Z0-9.-]+)\/\*$/);
  if (originStarMatch) {
    return {
      scope: "website",
      displayInput: originStarMatch[1],
    };
  }

  // Exact page URL (starts with http:// or https:// and contains no * or ?)
  if (/^https?:\/\//i.test(p) && !p.includes("*") && !p.includes("?")) {
    return {
      scope: "exact",
      displayInput: p,
    };
  }

  return {
    scope: "wildcard",
    displayInput: p,
  };
}

/**
 * Get active tab value formatted cleanly for the given scope.
 */
export function getTabValueForScope(rawUrl: string, scope: MatchScope): PatternGenerationResult {
  if (!rawUrl || (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://"))) {
    return {
      success: false,
      error: "Cannot set pattern from internal or non-web pages (must be http:// or https://)",
    };
  }

  try {
    const parsed = new URL(rawUrl);
    switch (scope) {
      case "website": {
        const cleanHost = parsed.hostname.replace(/^www\./i, "");
        return {
          success: true,
          value: cleanHost,
          pattern: `*${cleanHost}*`,
        };
      }
      case "exact":
        return {
          success: true,
          value: rawUrl,
          pattern: rawUrl,
        };
      case "wildcard":
        return {
          success: true,
          value: `${parsed.origin}/*`,
          pattern: `${parsed.origin}/*`,
        };
      case "regex": {
        const escapedOrigin = parsed.origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = `^${escapedOrigin}/.*`;
        return {
          success: true,
          value: re,
          pattern: re,
        };
      }
    }
  } catch {
    return {
      success: false,
      error: "Invalid URL provided",
    };
  }
}

/**
 * Legacy whole-site pattern generator.
 */
export function generatePatternForUrl(
  rawUrl: string,
  isWildcard: boolean
): PatternGenerationResult {
  const res = getTabValueForScope(rawUrl, isWildcard ? "wildcard" : "regex");
  return {
    success: res.success,
    pattern: res.pattern,
    error: res.error,
  };
}

/**
 * Map two-decision inputs to internal AutoStateRule action.
 */
export function getActionFromDecisions(
  timing: RuleTiming,
  effect: RuleEffect
): AutoStateRule["action"] {
  if (timing === "while") {
    return effect === "on" ? "enableOnlyWhileMatched" : "disableOnlyWhileMatched";
  } else {
    return effect === "on" ? "enableWhenMatched" : "disableWhenMatched";
  }
}

/**
 * Map internal AutoStateRule action to two-decision inputs.
 */
export function getDecisionsFromAction(
  action: AutoStateRule["action"]
): { timing: RuleTiming; effect: RuleEffect } {
  switch (action) {
    case "enableOnlyWhileMatched":
      return { timing: "while", effect: "on" };
    case "disableOnlyWhileMatched":
      return { timing: "while", effect: "off" };
    case "enableWhenMatched":
      return { timing: "when", effect: "on" };
    case "disableWhenMatched":
      return { timing: "when", effect: "off" };
    default:
      return { timing: "while", effect: "on" };
  }
}

/**
 * Extract a friendly brand or domain name for behavior preview text.
 */
export function formatFriendlySiteName(rawInput: string): string {
  if (!rawInput || !rawInput.trim()) return "";
  let s = rawInput.trim();
  s = s.replace(/^https?:\/\//i, "");
  s = s.replace(/^www\./i, "");
  s = s.replace(/^[*?]+|[*?]+$/g, "");
  s = s.replace(/\/.*$/, "");
  s = s.replace(/[\^$]/g, "").replace(/\\\./g, ".");

  const lower = s.toLowerCase();
  if (lower === "linkedin.com" || lower === "linkedin") return "LinkedIn";
  if (lower === "github.com" || lower === "github") return "GitHub";
  if (lower === "google.com" || lower === "google") return "Google";
  if (lower === "youtube.com" || lower === "youtube") return "YouTube";
  if (lower === "twitter.com" || lower === "x.com") return "Twitter";
  if (lower === "reddit.com" || lower === "reddit") return "Reddit";
  if (lower === "facebook.com" || lower === "facebook") return "Facebook";
  if (lower === "amazon.com" || lower === "amazon") return "Amazon";

  const domainParts = s.split(".");
  if (domainParts.length >= 2) {
    const brand = domainParts[0];
    if (brand.length > 0) {
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }

  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface BehaviorPreview {
  openText: string;
  closeText: string;
}

/**
 * Generate dynamic plain-language lifecycle explanation based on timing, effect, and website.
 */
export function getBehaviorPreview(
  timing: RuleTiming,
  effect: RuleEffect,
  siteInput: string
): BehaviorPreview {
  const brand = formatFriendlySiteName(siteInput);
  const onOrOff = effect === "on" ? "ON" : "OFF";
  const oppOnOrOff = effect === "on" ? "OFF" : "ON";
  const stayOrNot = effect === "on" ? "stays ON (does not turn off)" : "stays OFF (does not turn on)";

  if (timing === "while") {
    const siteRef = brand ? `${brand} tab` : "matching tab";
    const lastSiteRef = brand ? `${brand} tab` : "matching tab";
    return {
      openText: `When any ${siteRef} is open → extension turns ${onOrOff}`,
      closeText: `When the last ${lastSiteRef} is closed → extension turns ${oppOnOrOff} automatically`,
    };
  } else {
    const openSiteRef = brand ? brand : "a matching site";
    const closeSiteRef = brand ? brand : "a matching site";
    return {
      openText: `When you open ${openSiteRef} → extension turns ${onOrOff}`,
      closeText: `When you close ${closeSiteRef} → extension ${stayOrNot}`,
    };
  }
}
