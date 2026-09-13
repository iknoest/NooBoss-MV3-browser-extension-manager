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
  CUSTOM_REGEX_EXPLANATION,
  CUSTOM_REGEX_EXAMPLE,
  CUSTOM_REGEX_PLACEHOLDER,
  TIMING_LABELS,
  TIMING_DESCRIPTIONS,
  EFFECT_LABELS,
  cleanDomainInput,
  buildPatternFromScope,
  buildSiteRegex,
  detectScopeAndInput,
  getTabValueForScope,
  getActionFromDecisions,
  getDecisionsFromAction,
  formatFriendlySiteName,
  getBehaviorPreview,
  generatePatternForUrl,
  validateRuleInput,
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

  describe("Outcome 1: Exactly 3 primary scopes & precise subdomain semantics", () => {
    it("provides exactly three primary user-facing scopes with plain-language explanations", () => {
      expect(Object.keys(SCOPE_LABELS)).toEqual(["site", "exact", "custom"]);
      expect(SCOPE_LABELS.site).toContain("This site");
      expect(SCOPE_LABELS.exact).toBe("Exact page");
      expect(SCOPE_LABELS.custom).toBe("Custom");

      expect(SCOPE_EXPLANATIONS.site).toBe("Applies to all pages on this site.");
      expect(SCOPE_EXPLANATIONS.exact).toContain("Applies only to this exact page");
      expect(SCOPE_EXPLANATIONS.custom).toContain("Matches pages matching this URL pattern");

      expect(SCOPE_PLACEHOLDERS.site).toBe("e.g. linkedin.com");
      expect(SCOPE_PLACEHOLDERS.exact).toBe("e.g. https://www.linkedin.com/jobs/view/123");
      expect(SCOPE_PLACEHOLDERS.custom).toBe("e.g. linkedin.com/jobs/*");

      // Custom secondary regex affordance constants
      expect(CUSTOM_REGEX_EXPLANATION).toContain("Uses standard JavaScript regular-expression syntax");
      expect(CUSTOM_REGEX_EXAMPLE).toContain("linkedin.com/jobs/");
      expect(CUSTOM_REGEX_PLACEHOLDER).toContain("^https://");
    });

    it("verifies cleanDomainInput strips protocols, paths, query/hash, www, and asterisks", () => {
      expect(cleanDomainInput("linkedin.com")).toBe("linkedin.com");
      expect(cleanDomainInput("https://www.linkedin.com/feed/")).toBe("linkedin.com");
      expect(cleanDomainInput("*linkedin.com*")).toBe("linkedin.com");
      expect(cleanDomainInput("http://github.com/pulls?q=is%3Aopen#top")).toBe("github.com");
      expect(cleanDomainInput("jobs.linkedin.com")).toBe("jobs.linkedin.com");
    });

    it("enforces least-surprising site and subdomain semantics without silent broadening", () => {
      const siteResult = buildPatternFromScope("site", "linkedin.com");
      expect(siteResult.isWildcard).toBe(false); // Regex-based for strict domain boundary

      // 1. Matches base domain
      expect(matchUrl("https://linkedin.com/", siteResult.pattern, false)).toBe(true);
      expect(matchUrl("http://linkedin.com/page", siteResult.pattern, false)).toBe(true);

      // 2. Matches www.
      expect(matchUrl("https://www.linkedin.com/feed", siteResult.pattern, false)).toBe(true);

      // 3. Matches arbitrary subdomains
      expect(matchUrl("https://jobs.linkedin.com/view/123", siteResult.pattern, false)).toBe(true);
      expect(matchUrl("https://deep.sub.linkedin.com/a/b", siteResult.pattern, false)).toBe(true);
      expect(matchUrl("http://sub.linkedin.com:8080/test", siteResult.pattern, false)).toBe(true);

      // 4. Strictly REJECTS lookalike or unrelated domains (no silent broadening)
      expect(matchUrl("https://evil-linkedin.com/", siteResult.pattern, false)).toBe(false);
      expect(matchUrl("https://notlinkedin.com/", siteResult.pattern, false)).toBe(false);
      expect(matchUrl("https://attacker.com/?q=linkedin.com", siteResult.pattern, false)).toBe(false);
      expect(matchUrl("https://linkedin.com.evil.org/", siteResult.pattern, false)).toBe(false);
    });

    it("builds exact page pattern and tests engine matching", () => {
      const exactResult = buildPatternFromScope("exact", "https://www.linkedin.com/jobs/view/123");
      expect(exactResult.pattern).toBe("https://www.linkedin.com/jobs/view/123");
      expect(exactResult.isWildcard).toBe(true);

      expect(matchUrl("https://www.linkedin.com/jobs/view/123", exactResult.pattern, true)).toBe(true);
      expect(matchUrl("https://www.linkedin.com/jobs/view/456", exactResult.pattern, true)).toBe(false);
    });

    it("builds Custom simple URL patterns and Advanced regex", () => {
      // Custom simple URL pattern
      const customSimple = buildPatternFromScope("custom", "linkedin.com/jobs/*", false);
      expect(customSimple.isWildcard).toBe(true);
      expect(matchUrl("https://linkedin.com/jobs/123", customSimple.pattern, true)).toBe(true);
      expect(matchUrl("https://www.linkedin.com/jobs/123", customSimple.pattern, true)).toBe(true);
      expect(matchUrl("https://linkedin.com/feed", customSimple.pattern, true)).toBe(false);

      // Custom advanced regex
      const customRegex = buildPatternFromScope("custom", "^https://.*\\.linkedin\\.com/jobs/.*", true);
      expect(customRegex.isWildcard).toBe(false);
      expect(matchUrl("https://jobs.linkedin.com/jobs/view", customRegex.pattern, false)).toBe(true);
      expect(matchUrl("https://other.com/jobs/", customRegex.pattern, false)).toBe(false);
    });

    it("preserves compatibility with existing saved rules across scopes", () => {
      // Legacy wildcard *domain.com*
      expect(detectScopeAndInput({ pattern: "*linkedin.com*", isWildcard: true })).toEqual({
        scope: "site",
        displayInput: "linkedin.com",
        useRegex: false,
      });

      // Legacy wildcard *://*.domain.com/*
      expect(detectScopeAndInput({ pattern: "*://*.domain.com/*", isWildcard: true })).toEqual({
        scope: "site",
        displayInput: "domain.com",
        useRegex: false,
      });

      // New site regex
      const newSitePattern = buildSiteRegex("github.com");
      expect(detectScopeAndInput({ pattern: newSitePattern, isWildcard: false })).toEqual({
        scope: "site",
        displayInput: "github.com",
        useRegex: false,
      });

      // Exact page
      expect(detectScopeAndInput({ pattern: "https://www.linkedin.com/jobs/view/123", isWildcard: true })).toEqual({
        scope: "exact",
        displayInput: "https://www.linkedin.com/jobs/view/123",
        useRegex: false,
      });

      // Custom simple pattern
      expect(detectScopeAndInput({ pattern: "*linkedin.com/jobs/*", isWildcard: true })).toEqual({
        scope: "custom",
        displayInput: "linkedin.com/jobs/*",
        useRegex: false,
      });

      // Custom advanced regex
      expect(detectScopeAndInput({ pattern: "^https://.*\\.github\\.com/.*", isWildcard: false })).toEqual({
        scope: "custom",
        displayInput: "^https://.*\\.github\\.com/.*",
        useRegex: true,
      });
    });

    it("extracts active tab values formatted per scope and warns on internal URLs", () => {
      const tabUrl = "https://www.github.com/trending";
      const siteTab = getTabValueForScope(tabUrl, "site");
      expect(siteTab.success).toBe(true);
      expect(siteTab.value).toBe("github.com");

      const exactTab = getTabValueForScope(tabUrl, "exact");
      expect(exactTab.success).toBe(true);
      expect(exactTab.value).toBe(tabUrl);

      const customTab = getTabValueForScope(tabUrl, "custom", false);
      expect(customTab.success).toBe(true);
      expect(customTab.value).toBe("github.com/*");

      const internalTab = getTabValueForScope("chrome://extensions/", "site");
      expect(internalTab.success).toBe(false);
      expect(internalTab.error).toContain("Cannot set pattern from internal");
    });
  });

  describe("Outcome 2: Temporary vs One-time lifecycle labels & required previews", () => {
    it("maps Temporary while open and One-time on open bijectively to all 4 internal actions", () => {
      expect(TIMING_LABELS.temporary).toBe("Temporary while open");
      expect(TIMING_LABELS.onetime).toBe("One-time on open");

      expect(TIMING_DESCRIPTIONS.temporary).toContain("revers");
      expect(TIMING_DESCRIPTIONS.onetime).toContain("not reverse");

      expect(getActionFromDecisions("temporary", "on")).toBe("enableOnlyWhileMatched");
      expect(getActionFromDecisions("temporary", "off")).toBe("disableOnlyWhileMatched");
      expect(getActionFromDecisions("onetime", "on")).toBe("enableWhenMatched");
      expect(getActionFromDecisions("onetime", "off")).toBe("disableWhenMatched");

      expect(getDecisionsFromAction("enableOnlyWhileMatched")).toEqual({ timing: "temporary", effect: "on" });
      expect(getDecisionsFromAction("disableOnlyWhileMatched")).toEqual({ timing: "temporary", effect: "off" });
      expect(getDecisionsFromAction("enableWhenMatched")).toEqual({ timing: "onetime", effect: "on" });
      expect(getDecisionsFromAction("disableWhenMatched")).toEqual({ timing: "onetime", effect: "off" });
    });

    it("produces exact required lifecycle preview texts", () => {
      // Temporary + ON
      const tempOnSite = getBehaviorPreview("temporary", "on", "linkedin.com");
      expect(tempOnSite.openText).toBe("LinkedIn open → extension ON");
      expect(tempOnSite.closeText).toBe("Last LinkedIn tab closes → extension OFF");

      const tempOnDefault = getBehaviorPreview("temporary", "on", "");
      expect(tempOnDefault.openText).toBe("Matching site open → extension ON");
      expect(tempOnDefault.closeText).toBe("Last matching tab closes → extension OFF");

      // Temporary + OFF
      const tempOffSite = getBehaviorPreview("temporary", "off", "linkedin.com");
      expect(tempOffSite.openText).toBe("LinkedIn open → extension OFF");
      expect(tempOffSite.closeText).toBe("Last LinkedIn tab closes → extension ON");

      const tempOffDefault = getBehaviorPreview("temporary", "off", "");
      expect(tempOffDefault.openText).toBe("Matching site open → extension OFF");
      expect(tempOffDefault.closeText).toBe("Last matching tab closes → extension ON");

      // One-time + ON
      const oneOnSite = getBehaviorPreview("onetime", "on", "linkedin.com");
      expect(oneOnSite.openText).toBe("LinkedIn opens → extension ON");
      expect(oneOnSite.closeText).toBe("Closing LinkedIn does not turn it OFF");

      const oneOnDefault = getBehaviorPreview("onetime", "on", "");
      expect(oneOnDefault.openText).toBe("Matching site opens → extension ON");
      expect(oneOnDefault.closeText).toBe("Closing the site does not turn it OFF");

      // One-time + OFF
      const oneOffSite = getBehaviorPreview("onetime", "off", "linkedin.com");
      expect(oneOffSite.openText).toBe("LinkedIn opens → extension OFF");
      expect(oneOffSite.closeText).toBe("Closing LinkedIn does not turn it ON");

      const oneOffDefault = getBehaviorPreview("onetime", "off", "");
      expect(oneOffDefault.openText).toBe("Matching site opens → extension OFF");
      expect(oneOffDefault.closeText).toBe("Closing the site does not turn it ON");
    });
  });

  describe("Outcome 3: Block invalid and targetless rules", () => {
    it("blocks submission when zero targets are selected with actionable guidance", () => {
      const res = validateRuleInput([], "site", "linkedin.com");
      expect(res.isValid).toBe(false);
      expect(res.error).toBe("Select at least one extension or group.");
    });

    it("blocks submission when scope value is empty or invalid domain", () => {
      expect(validateRuleInput(["ext_1"], "site", "").isValid).toBe(false);
      expect(validateRuleInput(["ext_1"], "site", "invalid").isValid).toBe(false);
      expect(validateRuleInput(["ext_1"], "site", "linkedin.com").isValid).toBe(true);
    });

    it("blocks submission when Exact page URL is not a full http(s) URL", () => {
      expect(validateRuleInput(["ext_1"], "exact", "page-only").isValid).toBe(false);
      expect(validateRuleInput(["ext_1"], "exact", "https://linkedin.com/jobs/1").isValid).toBe(true);
    });

    it("blocks submission when Custom regex has invalid syntax", () => {
      const invalidRegex = validateRuleInput(["ext_1"], "custom", "[invalid", true);
      expect(invalidRegex.isValid).toBe(false);
      expect(invalidRegex.error).toContain("Invalid regular expression");

      const validRegex = validateRuleInput(["ext_1"], "custom", "^https://.*\\.example\\.com/.*", true);
      expect(validRegex.isValid).toBe(true);
    });
  });
});
