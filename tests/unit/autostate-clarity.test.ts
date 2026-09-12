import { describe, it, expect } from "vitest";
import { matchUrl } from "../../src/shared/matching";
import { computeDesiredStates } from "../../src/shared/autostate";
import type { AutoStateRule, ExtensionGroup } from "../../src/shared/types";
import {
  AUTOSTATE_ACTION_LABELS,
  AUTOSTATE_ACTION_HELPERS,
  MATCH_TYPE_LABELS,
  MATCH_TYPE_HELPERS,
  SCOPE_LABELS,
  SCOPE_EXPLANATIONS,
  SCOPE_PLACEHOLDERS,
  TIMING_LABELS,
  EFFECT_LABELS,
  cleanDomainInput,
  buildPatternFromScope,
  detectScopeAndInput,
  getTabValueForScope,
  getActionFromDecisions,
  getDecisionsFromAction,
  formatFriendlySiteName,
  getBehaviorPreview,
  generatePatternForUrl,
} from "../../src/popup/components/autostate-helpers";
import { GL, GLS } from "../../src/popup/components/i18n";

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

  describe("Outcome 1: Rename user-facing AutoState to Site Rules", () => {
    it("updates primary localization keys to Site Rules", () => {
      expect(GL("autoState")).toBe("Site Rules");
      expect(GLS("autoState_rule_s", 1)).toBe("Site Rule");
      expect(GLS("autoState_rule_s", 2)).toBe("Site Rules");
      expect(GL("extension_description")).toContain("Site Rules");
    });
  });

  describe("Outcome 2: Intent-based URL matching without raw wildcards", () => {
    it("provides four distinct scopes with explanations and placeholders", () => {
      expect(SCOPE_LABELS.website).toContain("This website");
      expect(SCOPE_LABELS.exact).toBe("Exact page");
      expect(SCOPE_LABELS.wildcard).toBe("Custom URL pattern");
      expect(SCOPE_LABELS.regex).toContain("Regular expression");

      expect(SCOPE_EXPLANATIONS.website).toContain("Applies to all pages on this website");
      expect(SCOPE_EXPLANATIONS.exact).toBe("Applies only to this exact page URL");
      expect(SCOPE_EXPLANATIONS.wildcard).toContain("Use * to match any text");
      expect(SCOPE_EXPLANATIONS.regex).toContain("For complex URL matching");

      expect(SCOPE_PLACEHOLDERS.website).toBe("e.g. linkedin.com");
      expect(SCOPE_PLACEHOLDERS.exact).toBe("e.g. https://www.linkedin.com/jobs/view/123");
    });

    it("cleans domain input and builds whole-website patterns without requiring user asterisks", () => {
      expect(cleanDomainInput("linkedin.com")).toBe("linkedin.com");
      expect(cleanDomainInput("https://www.linkedin.com/feed/")).toBe("linkedin.com");
      expect(cleanDomainInput("*linkedin.com*")).toBe("linkedin.com");
      expect(cleanDomainInput("http://github.com/pulls")).toBe("github.com");

      const websiteResult = buildPatternFromScope("website", "linkedin.com");
      expect(websiteResult.pattern).toBe("*linkedin.com*");
      expect(websiteResult.isWildcard).toBe(true);

      // Verify built pattern matches all pages, subdomains, and protocols
      expect(matchUrl("https://www.linkedin.com/feed", websiteResult.pattern, true)).toBe(true);
      expect(matchUrl("https://linkedin.com/", websiteResult.pattern, true)).toBe(true);
      expect(matchUrl("https://sub.linkedin.com/jobs", websiteResult.pattern, true)).toBe(true);
      expect(matchUrl("https://other.com/", websiteResult.pattern, true)).toBe(false);
    });

    it("builds exact page, custom pattern, and regex patterns correctly", () => {
      const exactResult = buildPatternFromScope("exact", "https://www.linkedin.com/jobs/view/123");
      expect(exactResult.pattern).toBe("https://www.linkedin.com/jobs/view/123");
      expect(exactResult.isWildcard).toBe(true);
      expect(matchUrl("https://www.linkedin.com/jobs/view/123", exactResult.pattern, true)).toBe(true);
      expect(matchUrl("https://www.linkedin.com/jobs/view/456", exactResult.pattern, true)).toBe(false);

      const wildcardResult = buildPatternFromScope("wildcard", "*linkedin.com/in/*");
      expect(wildcardResult.pattern).toBe("*linkedin.com/in/*");
      expect(wildcardResult.isWildcard).toBe(true);

      const regexResult = buildPatternFromScope("regex", "^https://.*\\.linkedin\\.com/.*");
      expect(regexResult.pattern).toBe("^https://.*\\.linkedin\\.com/.*");
      expect(regexResult.isWildcard).toBe(false);
    });

    it("detects scope and user input cleanly from saved rules", () => {
      expect(detectScopeAndInput({ pattern: "*linkedin.com*", isWildcard: true })).toEqual({
        scope: "website",
        displayInput: "linkedin.com",
      });

      expect(detectScopeAndInput({ pattern: "https://www.linkedin.com/*", isWildcard: true })).toEqual({
        scope: "website",
        displayInput: "www.linkedin.com",
      });

      expect(detectScopeAndInput({ pattern: "https://www.linkedin.com/jobs/view/123", isWildcard: true })).toEqual({
        scope: "exact",
        displayInput: "https://www.linkedin.com/jobs/view/123",
      });

      expect(detectScopeAndInput({ pattern: "*linkedin.com/in/*", isWildcard: true })).toEqual({
        scope: "wildcard",
        displayInput: "*linkedin.com/in/*",
      });

      expect(detectScopeAndInput({ pattern: "^https://.*\\.linkedin\\.com/.*", isWildcard: false })).toEqual({
        scope: "regex",
        displayInput: "^https://.*\\.linkedin\\.com/.*",
      });
    });

    it("extracts active tab values formatted cleanly per scope and rejects internal URLs", () => {
      const tabUrl = "https://www.github.com/trending";
      const websiteTab = getTabValueForScope(tabUrl, "website");
      expect(websiteTab.success).toBe(true);
      expect(websiteTab.value).toBe("github.com");

      const exactTab = getTabValueForScope(tabUrl, "exact");
      expect(exactTab.success).toBe(true);
      expect(exactTab.value).toBe(tabUrl);

      const internalTab = getTabValueForScope("chrome://extensions/", "website");
      expect(internalTab.success).toBe(false);
      expect(internalTab.error).toContain("Cannot set pattern from internal");
    });
  });

  describe("Outcome 3: Two-decision action model & dynamic behavior preview", () => {
    it("maps two decisions to and from internal engine actions bijectively", () => {
      expect(getActionFromDecisions("while", "on")).toBe("enableOnlyWhileMatched");
      expect(getActionFromDecisions("while", "off")).toBe("disableOnlyWhileMatched");
      expect(getActionFromDecisions("when", "on")).toBe("enableWhenMatched");
      expect(getActionFromDecisions("when", "off")).toBe("disableWhenMatched");

      expect(getDecisionsFromAction("enableOnlyWhileMatched")).toEqual({ timing: "while", effect: "on" });
      expect(getDecisionsFromAction("disableOnlyWhileMatched")).toEqual({ timing: "while", effect: "off" });
      expect(getDecisionsFromAction("enableWhenMatched")).toEqual({ timing: "when", effect: "on" });
      expect(getDecisionsFromAction("disableWhenMatched")).toEqual({ timing: "when", effect: "off" });
    });

    it("formats brand/domain names cleanly for dynamic behavior preview", () => {
      expect(formatFriendlySiteName("linkedin.com")).toBe("LinkedIn");
      expect(formatFriendlySiteName("https://www.github.com/issues")).toBe("GitHub");
      expect(formatFriendlySiteName("google.com")).toBe("Google");
      expect(formatFriendlySiteName("nytimes.com")).toBe("Nytimes");
    });

    it("generates exact required dynamic behavior preview text", () => {
      // While + ON with linkedin.com
      const whileOn = getBehaviorPreview("while", "on", "linkedin.com");
      expect(whileOn.openText).toBe("When any LinkedIn tab is open → extension turns ON");
      expect(whileOn.closeText).toBe("When the last LinkedIn tab is closed → extension turns OFF automatically");

      // When + ON with linkedin.com
      const whenOn = getBehaviorPreview("when", "on", "linkedin.com");
      expect(whenOn.openText).toBe("When you open LinkedIn → extension turns ON");
      expect(whenOn.closeText).toBe("When you close LinkedIn → extension stays ON (does not turn off)");

      // While + OFF with linkedin.com
      const whileOff = getBehaviorPreview("while", "off", "linkedin.com");
      expect(whileOff.openText).toBe("When any LinkedIn tab is open → extension turns OFF");
      expect(whileOff.closeText).toBe("When the last LinkedIn tab is closed → extension turns ON automatically");

      // When + OFF with linkedin.com
      const whenOff = getBehaviorPreview("when", "off", "linkedin.com");
      expect(whenOff.openText).toBe("When you open LinkedIn → extension turns OFF");
      expect(whenOff.closeText).toBe("When you close LinkedIn → extension stays OFF (does not turn on)");

      // Fallback when no site is entered yet
      const fallbackWhileOn = getBehaviorPreview("while", "on", "");
      expect(fallbackWhileOn.openText).toBe("When any matching tab is open → extension turns ON");
      expect(fallbackWhileOn.closeText).toBe("When the last matching tab is closed → extension turns OFF automatically");
    });
  });
});
