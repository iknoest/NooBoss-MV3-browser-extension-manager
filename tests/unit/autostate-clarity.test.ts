import { describe, it, expect } from "vitest";
import { matchUrl } from "../../src/shared/matching";
import { computeDesiredStates } from "../../src/shared/autostate";
import type { AutoStateRule, ExtensionGroup } from "../../src/shared/types";
import {
  AUTOSTATE_ACTION_LABELS,
  AUTOSTATE_ACTION_HELPERS,
  MATCH_TYPE_LABELS,
  MATCH_TYPE_HELPERS,
  generatePatternForUrl,
} from "../../src/popup/components/autostate-helpers";

describe("AutoState Clarity & Wording (Outcome A)", () => {
  describe("A1: Match Terminology & Helpers", () => {
    it("maps user-facing terminology to Website pattern and Regular expression (advanced)", () => {
      expect(MATCH_TYPE_LABELS.wildcard).toBe("Website pattern");
      expect(MATCH_TYPE_LABELS.regex).toBe("Regular expression (advanced)");
    });

    it("provides concise explanatory helper copy for Website pattern", () => {
      expect(MATCH_TYPE_HELPERS.wildcard).toContain("Use * for any text and ? for one character.");
      expect(MATCH_TYPE_HELPERS.wildcard).toContain("https://www.linkedin.com/*");
    });

    it("provides concise explanatory helper copy for Regular expression", () => {
      expect(MATCH_TYPE_HELPERS.regex).toBe("Advanced matching using JavaScript regular expressions.");
    });
  });

  describe("A2: Set as Current Website Pattern Generation", () => {
    it("generates a useful whole-site pattern for ordinary HTTPS pages", () => {
      const result = generatePatternForUrl("https://www.linkedin.com/feed/?trk=nav", true);
      expect(result.success).toBe(true);
      expect(result.pattern).toBe("https://www.linkedin.com/*");

      // Verify the generated pattern matches actual pages under that origin
      expect(matchUrl("https://www.linkedin.com/", result.pattern!, true)).toBe(true);
      expect(matchUrl("https://www.linkedin.com/in/someone", result.pattern!, true)).toBe(true);
      expect(matchUrl("https://www.linkedin.com/feed?q=test", result.pattern!, true)).toBe(true);
      expect(matchUrl("https://www.other.com/", result.pattern!, true)).toBe(false);
      expect(matchUrl("https://www.linkedin.com.attacker.com/", result.pattern!, true)).toBe(false);
    });

    it("generates a useful whole-site pattern for HTTP pages with ports", () => {
      const result = generatePatternForUrl("http://localhost:8080/app/index.html", true);
      expect(result.success).toBe(true);
      expect(result.pattern).toBe("http://localhost:8080/*");
      expect(matchUrl("http://localhost:8080/api/users", result.pattern!, true)).toBe(true);
      expect(matchUrl("http://localhost:3000/app", result.pattern!, true)).toBe(false);
    });

    it("generates a safe, escaped regular expression for Regular expression mode", () => {
      const result = generatePatternForUrl("https://www.linkedin.com/jobs/search", false);
      expect(result.success).toBe(true);
      expect(result.pattern).toBe("^https://www\\.linkedin\\.com/.*");

      // Verify the generated regex works as expected
      expect(matchUrl("https://www.linkedin.com/", result.pattern!, false)).toBe(true);
      expect(matchUrl("https://www.linkedin.com/jobs", result.pattern!, false)).toBe(true);
      expect(matchUrl("https://www.linkedin.com.evil.com/jobs", result.pattern!, false)).toBe(false);
      expect(matchUrl("https://sub.linkedin.com/jobs", result.pattern!, false)).toBe(false);
    });

    it("gracefully rejects internal browser URLs and non-web protocols", () => {
      const unsupportedUrls = [
        "chrome://extensions/",
        "chrome://settings/",
        "chrome-extension://aajodjghehmlpahhboidcpfjcncmcklf/popup.html",
        "about:blank",
        "file:///Users/test/index.html",
        "devtools://devtools/bundled/inspector.html",
        "",
      ];

      for (const url of unsupportedUrls) {
        const result = generatePatternForUrl(url, true);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.pattern).toBeUndefined();
      }
    });
  });

  describe("A3: Lifecycle Action Wording & Preserved Semantics", () => {
    it("defines exact required lifecycle copy for all four actions", () => {
      expect(AUTOSTATE_ACTION_LABELS.enableOnlyWhileMatched).toBe(
        "Keep on while matching site is open"
      );
      expect(AUTOSTATE_ACTION_LABELS.disableOnlyWhileMatched).toBe(
        "Keep off while matching site is open"
      );
      expect(AUTOSTATE_ACTION_LABELS.enableWhenMatched).toBe(
        "Turn on when a matching site opens"
      );
      expect(AUTOSTATE_ACTION_LABELS.disableWhenMatched).toBe(
        "Turn off when a matching site opens"
      );
    });

    it("defines exact required helper copy distinguishing continuous conditions from one-time triggers", () => {
      expect(AUTOSTATE_ACTION_HELPERS.enableOnlyWhileMatched).toBe(
        "Turns the extension on while any open tab matches. Turns it off when no open tabs match."
      );
      expect(AUTOSTATE_ACTION_HELPERS.disableOnlyWhileMatched).toBe(
        "Turns the extension off while any open tab matches. Turns it back on when no open tabs match."
      );
      expect(AUTOSTATE_ACTION_HELPERS.enableWhenMatched).toBe(
        "Turns the extension on when a match appears. It stays on afterward."
      );
      expect(AUTOSTATE_ACTION_HELPERS.disableWhenMatched).toBe(
        "Turns the extension off when a match appears. It stays off afterward."
      );
    });

    it("preserves continuous condition behavior for enableOnlyWhileMatched", () => {
      const groups: ExtensionGroup[] = [];
      const rules: AutoStateRule[] = [
        {
          id: "r1",
          enabled: true,
          name: "Work rule",
          pattern: "https://work.example.com/*",
          isWildcard: true,
          targets: ["ext_work"],
          action: "enableOnlyWhileMatched",
          priority: 1,
          createdAt: 100,
        },
      ];

      // While matched: true
      expect(computeDesiredStates(rules, groups, ["https://work.example.com/tasks"])).toEqual({
        ext_work: true,
      });

      // When no match: false (turns off when no open tabs match)
      expect(computeDesiredStates(rules, groups, ["https://other.com/"])).toEqual({
        ext_work: false,
      });
    });

    it("preserves continuous condition behavior for disableOnlyWhileMatched", () => {
      const groups: ExtensionGroup[] = [];
      const rules: AutoStateRule[] = [
        {
          id: "r2",
          enabled: true,
          name: "Distraction rule",
          pattern: "https://distraction.example.com/*",
          isWildcard: true,
          targets: ["ext_social"],
          action: "disableOnlyWhileMatched",
          priority: 1,
          createdAt: 100,
        },
      ];

      // While matched: false
      expect(computeDesiredStates(rules, groups, ["https://distraction.example.com/feed"])).toEqual({
        ext_social: false,
      });

      // When no match: true (turns back on when no open tabs match)
      expect(computeDesiredStates(rules, groups, ["https://work.example.com/"])).toEqual({
        ext_social: true,
      });
    });

    it("preserves one-time trigger behavior for enableWhenMatched and disableWhenMatched", () => {
      const groups: ExtensionGroup[] = [];
      const rules: AutoStateRule[] = [
        {
          id: "r3",
          enabled: true,
          name: "Trigger enable",
          pattern: "https://trigger.example.com/*",
          isWildcard: true,
          targets: ["ext_tool"],
          action: "enableWhenMatched",
          priority: 1,
          createdAt: 100,
        },
      ];

      // When matched: triggers enable
      expect(computeDesiredStates(rules, groups, ["https://trigger.example.com/start"])).toEqual({
        ext_tool: true,
      });

      // When not matched: produces no desired override (stays as-is afterward)
      expect(computeDesiredStates(rules, groups, ["https://unrelated.com/"])).toEqual({});
    });
  });
});
