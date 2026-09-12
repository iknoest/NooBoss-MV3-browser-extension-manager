import type { AutoStateRule } from "../../shared/types";

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
  error?: string;
}

/**
 * Generate a website-level pattern for a URL.
 * - In Website pattern mode, produces a whole-site wildcard such as `https://example.com/*`.
 * - In Regular expression mode, produces an escaped origin prefix `^https://example\\.com/.*`.
 * - Rejects non-HTTP/HTTPS URLs (e.g. chrome://, chrome-extension://, about:) gracefully.
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
      };
    } else {
      const escapedOrigin = parsed.origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return {
        success: true,
        pattern: `^${escapedOrigin}/.*`,
      };
    }
  } catch {
    return {
      success: false,
      error: "Invalid URL provided",
    };
  }
}
