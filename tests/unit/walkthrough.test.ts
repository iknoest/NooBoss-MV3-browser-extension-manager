import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";

describe("Guided Walkthrough Architecture & Behavior", () => {
  const overlaySource = fs.readFileSync("src/popup/components/WalkthroughOverlay.tsx", "utf8");
  const welcomeSource = fs.readFileSync("src/popup/components/WelcomeView.tsx", "utf8");
  const appSource = fs.readFileSync("src/popup/components/NooBossApp.tsx", "utf8");
  const aboutSource = fs.readFileSync("src/popup/components/AboutView.tsx", "utf8");
  const selectorSource = fs.readFileSync("src/popup/components/Selector.tsx", "utf8");
  const autostateSource = fs.readFileSync("src/popup/components/AutoStateView.tsx", "utf8");
  const historySource = fs.readFileSync("src/popup/components/HistoryView.tsx", "utf8");
  const optionsSource = fs.readFileSync("src/popup/components/OptionsView.tsx", "utf8");

  describe("1. WelcomeView Entry Surface & CTA Hierarchy", () => {
    it("renders primary 'Start quick tour' CTA with supporting 'About 1 minute' copy", () => {
      expect(welcomeSource).toContain("welcomeStartTourBtn");
      expect(welcomeSource).toContain("Start quick tour");
      expect(welcomeSource).toContain("welcome-tour-duration");
      expect(welcomeSource).toContain("About 1 minute");
    });

    it("renders secondary 'Skip and open Extension Drawer' CTA", () => {
      expect(welcomeSource).toContain("welcomeSkipBtn");
      expect(welcomeSource).toContain("Skip and open Extension Drawer");
    });
  });

  describe("2. The 5 Guided Steps Verification", () => {
    it("Step 1: Manage your extensions targets catalog/action bar with exact copy", () => {
      expect(overlaySource).toContain("Manage your extensions");
      expect(overlaySource).toContain(
        "Find extensions, change their state, inspect them, and choose how the list is organized."
      );
      expect(overlaySource).toContain("#extensionManagerCatalog");
      expect(selectorSource).toContain('id="extensionManagerCatalog"');
    });

    it("Step 2: Organize with Groups targets groups area / new group button with exact copy", () => {
      expect(overlaySource).toContain("Organize with Groups");
      expect(overlaySource).toContain(
        "Keep related extensions together so you can find and control them as a set."
      );
      expect(overlaySource).toContain("#newGroupBtn");
      expect(selectorSource).toContain('id="newGroupBtn"');
    });

    it("Step 3: Automate with Site Rules targets rule builder with exact copy", () => {
      expect(overlaySource).toContain("Automate with Site Rules");
      expect(overlaySource).toContain(
        "Turn extensions on or off automatically depending on the websites you open."
      );
      expect(overlaySource).toContain("#autostateRuleBuilder");
      expect(autostateSource).toContain('id="autostateRuleBuilder"');
    });

    it("Step 4: Review what changed targets history and provides Backup & Data callout", () => {
      expect(overlaySource).toContain("Review what changed");
      expect(overlaySource).toContain(
        "History shows extension management events recorded by Extension Drawer."
      );
      expect(overlaySource).toContain(
        "Export your configuration, extension list and history, or restore a saved configuration under Options → Backup & Data."
      );
      expect(overlaySource).toContain("walkthroughShowBackupBtn");
      expect(overlaySource).toContain("Show Backup &amp; Data");
      expect(overlaySource).toContain("#historyTableWrapper");
      expect(overlaySource).toContain("#optionsBackupSection");
      expect(historySource).toContain('id="historyTableWrapper"');
      expect(optionsSource).toContain('id="optionsBackupSection"');
    });

    it("Step 5: You’re ready targets main surface and provides Finish tour primary CTA", () => {
      expect(overlaySource).toContain("You’re ready");
      expect(overlaySource).toContain(
        "The core tools are ready to use. Developer Workspace is optional and is available when you need local builds, Store links or analytics."
      );
      expect(overlaySource).toContain("walkthroughFinishBtn");
      expect(overlaySource).toContain("Finish tour");
    });
  });

  describe("3. Walkthrough Controls & UX Standards", () => {
    it("includes Back, step indicator, Next/Finish, and Skip tour controls", () => {
      expect(overlaySource).toContain("walkthroughBackBtn");
      expect(overlaySource).toContain("walkthroughNextBtn");
      expect(overlaySource).toContain("walkthroughFinishBtn");
      expect(overlaySource).toContain("walkthroughSkipBtn");
      expect(overlaySource).toContain("walkthroughStepIndicator");
      expect(overlaySource).toContain("Step {currentStep} of 5");
    });

    it("supports keyboard Escape key to exit cleanly", () => {
      expect(overlaySource).toContain('e.key === "Escape"');
      expect(overlaySource).toContain("onSkip()");
    });

    it("implements accessible dialog attributes", () => {
      expect(overlaySource).toContain('role="dialog"');
      expect(overlaySource).toContain('aria-modal="true"');
      expect(overlaySource).toContain('aria-labelledby="walkthroughTitle"');
      expect(overlaySource).toContain('aria-describedby="walkthroughBody"');
    });

    it("falls back gracefully to centered card when target element is not found", () => {
      expect(overlaySource).toContain("walkthrough-backdrop-fallback");
      expect(overlaySource).toContain('cardStyle.top = "50%"');
      expect(overlaySource).toContain('cardStyle.left = "50%"');
      expect(overlaySource).toContain('cardStyle.transform = "translate(-50%, -50%)"');
    });
  });

  describe("4. Zero Permissions, Zero Identity, Zero Network", () => {
    it("verifies WalkthroughOverlay contains no permission requests, identity calls, or network requests", () => {
      expect(overlaySource).not.toContain("chrome.permissions");
      expect(overlaySource).not.toContain("chrome.identity");
      expect(overlaySource).not.toContain("requestAnalyticsPermissions");
      expect(overlaySource).not.toContain("getAuthToken");
      expect(overlaySource).not.toContain("fetch(");
    });
  });

  describe("5. Navigation Wiring & Re-running Tour Anytime", () => {
    it("wires tour state and step transitions in NooBossApp", () => {
      expect(appSource).toContain("isTourActive");
      expect(appSource).toContain("handleStartTour");
      expect(appSource).toContain("handleTourNext");
      expect(appSource).toContain("handleTourBack");
      expect(appSource).toContain("handleTourShowBackup");
      expect(appSource).toContain("handleTourFinish");
      expect(appSource).toContain("handleTourSkip");
      expect(appSource).toContain("<WalkthroughOverlay");
    });

    it("AboutView 'Getting started' button reopens Welcome so user can rerun tour anytime", () => {
      expect(aboutSource).toContain("aboutWelcomeBtn");
      expect(aboutSource).toContain("Getting started");
      expect(aboutSource).toContain("onOpenWelcome");
      expect(appSource).toContain('onOpenWelcome={() => setMainLocation("welcome")}');
    });
  });
});
