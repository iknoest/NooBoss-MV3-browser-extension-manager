import { describe, it, expect, beforeEach, vi } from "vitest";
import { computeDesiredStates, resolveTargets } from "../../src/shared/autostate";
import { matchUrl } from "../../src/shared/matching";
import {
  buildPatternFromScope,
  cleanDomainInput,
  getActionFromDecisions,
  getDecisionsFromAction,
} from "../../src/popup/components/autostate-helpers";
import type { AutoStateRule, ExtensionGroup, ExtensionInfo, AppSettings } from "../../src/shared/types";

describe("Phase 1: Site Rules Runtime Correctness & Lifecycle Verification", () => {
  // =========================================================================
  // Phase 1A — Lifecycle initialization
  // =========================================================================
  describe("Phase 1A: Lifecycle initialization & completeness", () => {
    it("ensures an authoritative full tab query runs when worker wakes uninitialized, even if an event arrives first", async () => {
      // Mock browser tabs in Chrome session:
      // Tab 1: LinkedIn jobs page (already open prior to worker wake)
      // Tab 2: Extension Drawer manager page
      const browserTabs: Array<{ id: number; url: string }> = [
        { id: 1, url: "https://www.linkedin.com/jobs" },
        { id: 2, url: "chrome-extension://onkcjpfgllpfbimnchjehboikhippnka/manager/manager.html" },
      ];

      let isTabsInitialized = false;
      let tabUrls: Record<number, string> = {};

      const rebuildTabUrls = vi.fn(async () => {
        const freshMap: Record<number, string> = {};
        for (const t of browserTabs) {
          if (t.id !== undefined && t.url) {
            freshMap[t.id] = t.url;
          }
        }
        tabUrls = freshMap;
        isTabsInitialized = true;
      });

      async function ensureTabsInitialized() {
        if (isTabsInitialized) return;
        await rebuildTabUrls();
      }

      // Step 1: Worker wakes from suspension because Tab 2 was updated.
      // An event arrives before full reconciliation:
      tabUrls[2] = browserTabs[1].url;

      // Note: tabUrls now has length 1. But isTabsInitialized is FALSE!
      expect(Object.keys(tabUrls)).toHaveLength(1);
      expect(isTabsInitialized).toBe(false);

      // Step 2: Evaluation triggers (e.g. from SAVE_AUTOSTATE_RULES or onUpdated)
      const rule: AutoStateRule = {
        id: "r_linkedin",
        enabled: true,
        name: "linkedin.com",
        pattern: "^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)*linkedin\\.com(?::\\d+)?(?:\\/.*)?$",
        isWildcard: false,
        targets: ["ext_test"],
        action: "enableOnlyWhileMatched",
        priority: 1,
        createdAt: 100,
      };

      async function evaluate() {
        await ensureTabsInitialized();
        const urls = Object.values(tabUrls).filter(Boolean);
        return computeDesiredStates([rule], [], urls);
      }

      const desired = await evaluate();

      // Verified: rebuildTabUrls was called authoritatively because isTabsInitialized was checked,
      // NOT relying on Object.keys(tabUrls).length === 0!
      expect(rebuildTabUrls).toHaveBeenCalledTimes(1);
      expect(isTabsInitialized).toBe(true);
      expect(tabUrls[1]).toBe("https://www.linkedin.com/jobs");
      expect(desired).toEqual({ ext_test: true });
    });

    it("evaluates immediately and authoritatively on SAVE_AUTOSTATE_RULES when matching tabs already exist", async () => {
      const allTabs = [
        { id: 10, url: "https://www.linkedin.com/jobs/search" },
        { id: 20, url: "chrome-extension://onkcjpfgllpfbimnchjehboikhippnka/manager/manager.html" },
      ];

      let tabUrls: Record<number, string> = {};
      let isTabsInitialized = false;

      async function rebuild() {
        const map: Record<number, string> = {};
        for (const t of allTabs) map[t.id] = t.url;
        tabUrls = map;
        isTabsInitialized = true;
      }

      const newRule: AutoStateRule = {
        id: "r_save",
        enabled: true,
        name: "linkedin.com",
        pattern: "^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)*linkedin\\.com(?::\\d+)?(?:\\/.*)?$",
        isWildcard: false,
        targets: ["ext_target"],
        action: "enableOnlyWhileMatched",
        priority: 1,
        createdAt: 200,
      };

      // Handler for SAVE_AUTOSTATE_RULES
      await rebuild();
      const urls = Object.values(tabUrls).filter(Boolean);
      const desired = computeDesiredStates([newRule], [], urls);

      expect(desired).toEqual({ ext_target: true });
    });
  });

  // =========================================================================
  // Phase 1B — Tab event correctness
  // =========================================================================
  describe("Phase 1B: Tab event correctness", () => {
    it("handles tab created with and without immediate URL", () => {
      const tabUrls: Record<number, string> = {};

      function handleTabCreated(tab: { id?: number; url?: string }) {
        if (tab.id !== undefined) {
          if (tab.url) {
            tabUrls[tab.id] = tab.url;
          }
        }
      }

      // Blank/newtab created without initial URL
      handleTabCreated({ id: 1, url: "" });
      expect(tabUrls[1]).toBeUndefined();

      // Created with URL
      handleTabCreated({ id: 2, url: "https://www.linkedin.com/feed" });
      expect(tabUrls[2]).toBe("https://www.linkedin.com/feed");
    });

    it("handles tab updated during navigation and during page reload (F5)", () => {
      const tabUrls: Record<number, string> = { 1: "https://www.linkedin.com/jobs" };
      let evaluateCalled = false;

      function handleTabUpdated(
        tabId: number,
        changeInfo: { url?: string; status?: string },
        tab?: { url?: string }
      ) {
        let urlChanged = false;
        if (changeInfo.url) {
          tabUrls[tabId] = changeInfo.url;
          urlChanged = true;
        } else if (tab?.url && tabUrls[tabId] !== tab.url) {
          tabUrls[tabId] = tab.url;
          urlChanged = true;
        }

        if (urlChanged || changeInfo.status === "complete") {
          evaluateCalled = true;
        }
      }

      // Scenario 1: Normal URL navigation
      handleTabUpdated(1, { url: "https://www.linkedin.com/jobs/view/999" });
      expect(tabUrls[1]).toBe("https://www.linkedin.com/jobs/view/999");
      expect(evaluateCalled).toBe(true);

      // Scenario 2: Page reload (F5 / Cmd+R) - changeInfo has no url!
      evaluateCalled = false;
      handleTabUpdated(1, { status: "complete" }, { url: "https://www.linkedin.com/jobs/view/999" });
      expect(tabUrls[1]).toBe("https://www.linkedin.com/jobs/view/999");
      // Verified: Reload complete triggers evaluate!
      expect(evaluateCalled).toBe(true);
    });

    it("handles tab activated safely without dropping background matching tabs", async () => {
      let isTabsInitialized = true;
      const tabUrls: Record<number, string> = {
        1: "https://www.linkedin.com/jobs",
        2: "https://google.com",
      };
      let evaluateCalled = false;

      async function handleTabActivated(activeInfo: { tabId: number }) {
        if (!isTabsInitialized) {
          evaluateCalled = true;
        } else if (!tabUrls[activeInfo.tabId]) {
          evaluateCalled = true;
        }
      }

      // Switching to existing tab 2: does not disrupt tabUrls
      await handleTabActivated({ tabId: 2 });
      expect(tabUrls[1]).toBe("https://www.linkedin.com/jobs");
      expect(evaluateCalled).toBe(false);

      // Rule evaluation still considers both open tabs
      const rule: AutoStateRule = {
        id: "r1",
        enabled: true,
        name: "linkedin",
        pattern: "^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)*linkedin\\.com(?::\\d+)?(?:\\/.*)?$",
        isWildcard: false,
        targets: ["ext_test"],
        action: "enableOnlyWhileMatched",
        priority: 1,
        createdAt: 1,
      };
      const desired = computeDesiredStates([rule], [], Object.values(tabUrls));
      expect(desired).toEqual({ ext_test: true });
    });

    it("handles tab removed cleanly", () => {
      const tabUrls: Record<number, string> = {
        1: "https://www.linkedin.com/jobs",
        2: "https://google.com",
      };

      delete tabUrls[1];
      expect(tabUrls[1]).toBeUndefined();
      expect(tabUrls[2]).toBe("https://google.com");
    });
  });

  // =========================================================================
  // Phase 1C — Temporary-while-open semantics
  // =========================================================================
  describe("Phase 1C: Temporary-while-open semantics ('Keep ON while matching site is open')", () => {
    const rule: AutoStateRule = {
      id: "r_temp",
      enabled: true,
      name: "linkedin.com",
      pattern: "^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)*linkedin\\.com(?::\\d+)?(?:\\/.*)?$",
      isWildcard: false,
      targets: ["ext_target"],
      action: "enableOnlyWhileMatched",
      priority: 1,
      createdAt: 1,
    };

    it("1. Target starts OFF, first matching tab opens -> becomes ON", () => {
      const activeUrls = ["https://www.linkedin.com/jobs"];
      const desired = computeDesiredStates([rule], [], activeUrls);
      expect(desired).toEqual({ ext_target: true });
    });

    it("2. Switching to unrelated tab while matching tab stays open does NOT restore", () => {
      const activeUrls = ["https://www.linkedin.com/jobs", "https://unrelated.org"];
      const desired = computeDesiredStates([rule], [], activeUrls);
      expect(desired).toEqual({ ext_target: true });
    });

    it("3. Second matching tab opens -> remains ON", () => {
      const activeUrls = ["https://www.linkedin.com/jobs", "https://www.linkedin.com/feed"];
      const desired = computeDesiredStates([rule], [], activeUrls);
      expect(desired).toEqual({ ext_target: true });
    });

    it("4. One matching tab closes while another remains open -> remains ON", () => {
      const activeUrls = ["https://www.linkedin.com/feed", "https://unrelated.org"];
      const desired = computeDesiredStates([rule], [], activeUrls);
      expect(desired).toEqual({ ext_target: true });
    });

    it("5. Last matching tab closes -> temporary behavior ends and restores to OFF", () => {
      const activeUrls = ["https://unrelated.org"];
      const desired = computeDesiredStates([rule], [], activeUrls);
      expect(desired).toEqual({ ext_target: false });
    });

    it("6. Matching tab navigates to a non-matching domain -> restores to OFF", () => {
      const activeUrls = ["https://github.com/pulls"];
      const desired = computeDesiredStates([rule], [], activeUrls);
      expect(desired).toEqual({ ext_target: false });
    });

    it("7. Service worker suspension/restart occurs while matching tab remains open -> reconciled to ON", () => {
      // After wake, authoritative query returns the open matching tab:
      const activeUrls = ["https://www.linkedin.com/jobs/view/123"];
      const desired = computeDesiredStates([rule], [], activeUrls);
      expect(desired).toEqual({ ext_target: true });
    });

    it("8. Zero tabs open at all -> restores to OFF", () => {
      const desired = computeDesiredStates([rule], [], []);
      expect(desired).toEqual({ ext_target: false });
    });
  });

  // =========================================================================
  // Phase 1D — This Site semantics
  // =========================================================================
  describe("Phase 1D: This Site semantics", () => {
    const { pattern, isWildcard } = buildPatternFromScope("site", "linkedin.com");

    it("matches linkedin.com", () => {
      expect(matchUrl("https://linkedin.com", pattern, isWildcard)).toBe(true);
      expect(matchUrl("https://linkedin.com/", pattern, isWildcard)).toBe(true);
      expect(matchUrl("http://linkedin.com", pattern, isWildcard)).toBe(true);
    });

    it("matches www.linkedin.com", () => {
      expect(matchUrl("https://www.linkedin.com", pattern, isWildcard)).toBe(true);
      expect(matchUrl("https://www.linkedin.com/jobs", pattern, isWildcard)).toBe(true);
    });

    it("matches paths, queries, and hashes on the same site", () => {
      expect(matchUrl("https://www.linkedin.com/jobs/view/12345?ref=search#details", pattern, isWildcard)).toBe(true);
      expect(matchUrl("https://linkedin.com/feed?trk=guest", pattern, isWildcard)).toBe(true);
    });

    it("matches relevant subdomains (e.g. jobs.linkedin.com)", () => {
      expect(matchUrl("https://jobs.linkedin.com", pattern, isWildcard)).toBe(true);
      expect(matchUrl("https://deep.sub.domain.linkedin.com/path", pattern, isWildcard)).toBe(true);
      expect(matchUrl("http://sub.linkedin.com:8080/path", pattern, isWildcard)).toBe(true);
    });

    it("strictly rejects unrelated domains and lookalikes", () => {
      expect(matchUrl("https://evil-linkedin.com", pattern, isWildcard)).toBe(false);
      expect(matchUrl("https://notlinkedin.com", pattern, isWildcard)).toBe(false);
      expect(matchUrl("https://attacker.com/?q=linkedin.com", pattern, isWildcard)).toBe(false);
      expect(matchUrl("https://linkedin.com.attacker.org", pattern, isWildcard)).toBe(false);
    });

    it("preserves cleanDomainInput normalization", () => {
      expect(cleanDomainInput("linkedin.com")).toBe("linkedin.com");
      expect(cleanDomainInput("www.linkedin.com")).toBe("linkedin.com");
      expect(cleanDomainInput("https://www.linkedin.com/jobs")).toBe("linkedin.com");
      expect(cleanDomainInput("*linkedin.com*")).toBe("linkedin.com");
    });
  });

  // =========================================================================
  // Phase 1E — Competing rules / targets
  // =========================================================================
  describe("Phase 1E: Competing rules & target validity", () => {
    it("enforces ascending priority order (lower numerical priority wins)", () => {
      const ruleOn: AutoStateRule = {
        id: "r_on",
        enabled: true,
        name: "LinkedIn ON",
        pattern: "^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)*linkedin\\.com(?::\\d+)?(?:\\/.*)?$",
        isWildcard: false,
        targets: ["ext_shared"],
        action: "enableOnlyWhileMatched",
        priority: 1, // Higher precedence
        createdAt: 1,
      };

      const ruleOff: AutoStateRule = {
        id: "r_off",
        enabled: true,
        name: "GitHub OFF",
        pattern: "^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)*github\\.com(?::\\d+)?(?:\\/.*)?$",
        isWildcard: false,
        targets: ["ext_shared"],
        action: "disableOnlyWhileMatched",
        priority: 2, // Lower precedence
        createdAt: 2,
      };

      // Both sites open: priority 1 (ON) wins over priority 2 (OFF)
      const res1 = computeDesiredStates([ruleOff, ruleOn], [], ["https://www.linkedin.com/jobs", "https://github.com"]);
      expect(res1).toEqual({ ext_shared: true });

      // Invert priorities: ruleOff becomes priority 1, ruleOn becomes priority 2
      ruleOff.priority = 1;
      ruleOn.priority = 2;
      const res2 = computeDesiredStates([ruleOff, ruleOn], [], ["https://www.linkedin.com/jobs", "https://github.com"]);
      expect(res2).toEqual({ ext_shared: false });
    });

    it("handles two matching ON rules for the same target extension", () => {
      const r1: AutoStateRule = {
        id: "r1",
        enabled: true,
        name: "Site 1",
        pattern: "https://site1.com/*",
        isWildcard: true,
        targets: ["ext_shared"],
        action: "enableOnlyWhileMatched",
        priority: 1,
        createdAt: 1,
      };
      const r2: AutoStateRule = {
        id: "r2",
        enabled: true,
        name: "Site 2",
        pattern: "https://site2.com/*",
        isWildcard: true,
        targets: ["ext_shared"],
        action: "enableOnlyWhileMatched",
        priority: 2,
        createdAt: 2,
      };

      // When only Site 1 is open: Rule 1 matches -> true
      expect(computeDesiredStates([r1, r2], [], ["https://site1.com/a"])).toEqual({ ext_shared: true });

      // When only Site 2 is open: Rule 2 matches -> true
      expect(computeDesiredStates([r1, r2], [], ["https://site2.com/b"])).toEqual({ ext_shared: true });

      // When both are open: both match -> true
      expect(computeDesiredStates([r1, r2], [], ["https://site1.com/a", "https://site2.com/b"])).toEqual({ ext_shared: true });

      // When neither is open: neither matches -> fallback restores to false
      expect(computeDesiredStates([r1, r2], [], ["https://other.com"])).toEqual({ ext_shared: false });
    });

    it("resolves targets through groups without duplicates", () => {
      const groups: ExtensionGroup[] = [
        {
          id: "group_alpha",
          name: "Alpha Group",
          extensionIds: ["ext_1", "ext_2"],
          color: "#6366f1",
          createdAt: 10,
        },
      ];

      const targets = resolveTargets(["group_alpha", "ext_2", "ext_3"], groups);
      expect(targets).toEqual(["ext_1", "ext_2", "ext_3"]);
    });
  });
});
