import type { AutoStateRule } from "../../shared/types";
import { validateRegex } from "../../shared/matching";

export type MatchScope = "site" | "exact" | "custom";
export type RuleTiming = "temporary" | "onetime";
export type RuleEffect = "on" | "off";

export const SCOPE_LABELS: Record<MatchScope, string> = {
  site: "This site (recommended)",
  exact: "Exact page",
  custom: "Custom",
};

export const SCOPE_EXPLANATIONS: Record<MatchScope, string> = {
  site: "Applies to all pages on this site.",
  exact: "Applies only to this exact page (matches full URL including query or hash).",
  custom: "Matches pages matching this URL pattern. Example: linkedin.com/jobs/* (matches pages under linkedin.com/jobs/)",
};

export const SCOPE_PLACEHOLDERS: Record<MatchScope, string> = {
  site: "e.g. linkedin.com",
  exact: "e.g. https://www.linkedin.com/jobs/view/123",
  custom: "e.g. linkedin.com/jobs/*",
};

export const CUSTOM_REGEX_EXPLANATION =
  "Uses standard JavaScript regular-expression syntax. Use only when simple URL patterns are not enough.";
export const CUSTOM_REGEX_EXAMPLE = "Example: ^https://.*linkedin.com/jobs/.*";
export const CUSTOM_REGEX_PLACEHOLDER = "e.g. ^https://.*linkedin.com/jobs/.*";

export const TIMING_LABELS: Record<RuleTiming, string> = {
  temporary: "Temporary while open",
  onetime: "One-time on open",
};

export const TIMING_DESCRIPTIONS: Record<RuleTiming, string> = {
  temporary:
    "The extension follows the site. When the last matching tab closes, the change is automatically reversed.",
  onetime:
    "The extension changes once when a matching page opens. Closing the page does not reverse the change.",
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
 * Clean a domain input by stripping protocol, path, query/hash, leading www., and outer asterisks.
 */
export function cleanDomainInput(input: string): string {
  if (!input) return "";
  let d = input.trim();
  d = d.replace(/^https?:\/\//i, "");
  d = d.replace(/^\/\//, "");
  d = d.replace(/[/?#].*$/, "");
  d = d.replace(/^[*?]+|[*?]+$/g, "");
  d = d.replace(/^www\./i, "");
  return d.trim();
}

/**
 * Build a robust, least-surprising site-matching regular expression.
 * Semantics:
 * - Matches http:// and https://
 * - Matches cleanHost and www.cleanHost
 * - Matches arbitrary subdomains (*.cleanHost)
 * - Rejects non-subdomains such as evil-cleanHost or attacker.com/?q=cleanHost
 */
export function buildSiteRegex(cleanHost: string): string {
  const escaped = cleanHost.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)*${escaped}(?::\\d+)?(?:\\/.*)?$`;
}

/**
 * Convert user scope and input into an internal AutoStateRule pattern.
 */
export function buildPatternFromScope(
  scope: MatchScope,
  input: string,
  useRegex = false
): { pattern: string; isWildcard: boolean } {
  const trimmed = input.trim();
  switch (scope) {
    case "site": {
      const clean = cleanDomainInput(trimmed);
      if (!clean) return { pattern: "", isWildcard: false };
      return {
        pattern: buildSiteRegex(clean),
        isWildcard: false,
      };
    }
    case "exact":
      return {
        pattern: trimmed,
        isWildcard: true,
      };
    case "custom": {
      if (useRegex) {
        return {
          pattern: trimmed,
          isWildcard: false,
        };
      }
      let pat = trimmed;
      if (pat && !pat.startsWith("http://") && !pat.startsWith("https://") && !pat.startsWith("*") && !pat.startsWith("?")) {
        pat = `*${pat}`;
      }
      return {
        pattern: pat,
        isWildcard: true,
      };
    }
  }
}

/**
 * Detect the appropriate MatchScope and user-facing input from a stored AutoStateRule.
 */
export function detectScopeAndInput(rule: Pick<AutoStateRule, "pattern" | "isWildcard">): {
  scope: MatchScope;
  displayInput: string;
  useRegex: boolean;
} {
  const p = (rule.pattern || "").trim();

  if (!rule.isWildcard) {
    // Check if it's our structured site regex: ^https?:\/\/(?:[a-zA-Z0-9-]+\.)*domain\.com(?::\d+)?(?:\/.*)?$
    const siteRegexMatch = p.match(
      /^\^https\?:\\\/\\\/\(\?:\[a-zA-Z0-9-\]\+\\\.\)\*((?:[a-zA-Z0-9-]|\\\.)+)\(\?::\\d\+\)\?\(\?:\\\/.*\)?[\\$]?$/i
    );
    if (siteRegexMatch) {
      // Unescape dots
      const unescapedDomain = siteRegexMatch[1].replace(/\\([.])/g, "$1");
      return {
        scope: "site",
        displayInput: unescapedDomain,
        useRegex: false,
      };
    }

    // Otherwise, it's an advanced custom regex
    return {
      scope: "custom",
      displayInput: p,
      useRegex: true,
    };
  }

  // Wildcard patterns:
  // 1. Legacy *domain.com*
  const starDomainMatch = p.match(/^\*+([a-zA-Z0-9.-]+)\*+$/);
  if (starDomainMatch) {
    return {
      scope: "site",
      displayInput: starDomainMatch[1],
      useRegex: false,
    };
  }

  // 2. Legacy *://*.domain.com/* or *://*domain.com/*
  const schemeStarMatch = p.match(/^\*:\/\/\*?\.?([a-zA-Z0-9.-]+)\/\*$/);
  if (schemeStarMatch) {
    return {
      scope: "site",
      displayInput: schemeStarMatch[1],
      useRegex: false,
    };
  }

  // 3. Legacy https://domain.com/*
  const originStarMatch = p.match(/^https?:\/\/([a-zA-Z0-9.-]+)\/\*$/);
  if (originStarMatch) {
    return {
      scope: "site",
      displayInput: originStarMatch[1],
      useRegex: false,
    };
  }

  // 4. Exact page URL: starts with http(s):// and contains no * or ?
  if (/^https?:\/\//i.test(p) && !p.includes("*") && !p.includes("?")) {
    return {
      scope: "exact",
      displayInput: p,
      useRegex: false,
    };
  }

  // 5. Custom URL pattern (clean leading * if we added it for scheme-agnostic matching)
  let customDisplay = p;
  if (customDisplay.startsWith("*") && !customDisplay.startsWith("*://") && customDisplay.includes("/")) {
    customDisplay = customDisplay.replace(/^\*/, "");
  }

  return {
    scope: "custom",
    displayInput: customDisplay,
    useRegex: false,
  };
}

/**
 * Get active tab value formatted cleanly for the given scope.
 */
export function getTabValueForScope(
  rawUrl: string,
  scope: MatchScope,
  useRegex = false
): PatternGenerationResult {
  if (!rawUrl || (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://"))) {
    return {
      success: false,
      error: "Cannot set pattern from internal or non-web pages (must be http:// or https://)",
    };
  }

  try {
    const parsed = new URL(rawUrl);
    switch (scope) {
      case "site": {
        const cleanHost = parsed.hostname.replace(/^www\./i, "");
        return {
          success: true,
          value: cleanHost,
          pattern: buildSiteRegex(cleanHost),
        };
      }
      case "exact":
        return {
          success: true,
          value: rawUrl,
          pattern: rawUrl,
        };
      case "custom": {
        if (useRegex) {
          const escapedOrigin = parsed.origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const re = `^${escapedOrigin}/.*`;
          return {
            success: true,
            value: re,
            pattern: re,
          };
        }
        const cleanHost = parsed.hostname.replace(/^www\./i, "");
        return {
          success: true,
          value: `${cleanHost}/*`,
          pattern: `*${cleanHost}/*`,
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
  if (!rawUrl || (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://"))) {
    return {
      success: false,
      error: "Cannot set pattern from internal or non-web pages (must be http:// or https://)",
    };
  }

  try {
    const parsed = new URL(rawUrl);
    if (isWildcard) {
      return {
        success: true,
        pattern: `${parsed.origin}/*`,
        value: `${parsed.origin}/*`,
      };
    } else {
      const escapedOrigin = parsed.origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = `^${escapedOrigin}/.*`;
      return {
        success: true,
        pattern: re,
        value: re,
      };
    }
  } catch {
    return {
      success: false,
      error: "Invalid URL provided",
    };
  }
}

/**
 * Map two-decision inputs to internal AutoStateRule action.
 */
export function getActionFromDecisions(
  timing: RuleTiming,
  effect: RuleEffect
): AutoStateRule["action"] {
  if (timing === "temporary") {
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
      return { timing: "temporary", effect: "on" };
    case "disableOnlyWhileMatched":
      return { timing: "temporary", effect: "off" };
    case "enableWhenMatched":
      return { timing: "onetime", effect: "on" };
    case "disableWhenMatched":
      return { timing: "onetime", effect: "off" };
    default:
      return { timing: "temporary", effect: "on" };
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
  s = s.replace(/[/?#].*$/, "");
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
 * Follows exact human QA requirements:
 * Temporary + ON:
 * - `Matching site open → extension ON`
 * - `Last matching tab closes → extension OFF`
 * Temporary + OFF:
 * - `Matching site open → extension OFF`
 * - `Last matching tab closes → extension ON`
 * One-time + ON:
 * - `Matching site opens → extension ON`
 * - `Closing the site does not turn it OFF`
 * One-time + OFF:
 * - `Matching site opens → extension OFF`
 * - `Closing the site does not turn it ON`
 */
export function getBehaviorPreview(
  timing: RuleTiming,
  effect: RuleEffect,
  siteInput: string
): BehaviorPreview {
  const brand = formatFriendlySiteName(siteInput);

  if (timing === "temporary") {
    if (effect === "on") {
      return {
        openText: brand ? `${brand} open → extension ON` : "Matching site open → extension ON",
        closeText: brand
          ? `Last ${brand} tab closes → extension OFF`
          : "Last matching tab closes → extension OFF",
      };
    } else {
      return {
        openText: brand ? `${brand} open → extension OFF` : "Matching site open → extension OFF",
        closeText: brand
          ? `Last ${brand} tab closes → extension ON`
          : "Last matching tab closes → extension ON",
      };
    }
  } else {
    if (effect === "on") {
      return {
        openText: brand ? `${brand} opens → extension ON` : "Matching site opens → extension ON",
        closeText: brand
          ? `Closing ${brand} does not turn it OFF`
          : "Closing the site does not turn it OFF",
      };
    } else {
      return {
        openText: brand ? `${brand} opens → extension OFF` : "Matching site opens → extension OFF",
        closeText: brand
          ? `Closing ${brand} does not turn it ON`
          : "Closing the site does not turn it ON",
      };
    }
  }
}

/**
 * Validate user input before adding/updating a Site Rule.
 */
export function validateRuleInput(
  targets: string[],
  scope: MatchScope,
  input: string,
  useRegex = false
): { isValid: boolean; error: string | null } {
  if (targets.length === 0) {
    return { isValid: false, error: "Select at least one extension or group." };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: "Please enter a website or URL pattern." };
  }

  if (scope === "site") {
    const clean = cleanDomainInput(trimmed);
    if (!clean || clean.length < 3 || !clean.includes(".")) {
      return { isValid: false, error: "Please enter a valid website domain (e.g. linkedin.com)." };
    }
  } else if (scope === "exact") {
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return { isValid: false, error: "Exact page must be a full web URL starting with http:// or https://" };
    }
  } else if (scope === "custom" && useRegex) {
    const regexError = validateRegex(trimmed);
    if (regexError) {
      return { isValid: false, error: `Invalid regular expression: ${regexError}` };
    }
  }

  return { isValid: true, error: null };
}
