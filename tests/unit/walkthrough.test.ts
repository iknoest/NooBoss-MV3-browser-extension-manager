import { describe, it, expect } from "vitest";
import * as fs from "fs";

describe("Guided Walkthrough Architecture & Behavior (6 Primary Steps)", () => {
  const overlaySource = fs.readFileSync("src/popup/components/WalkthroughOverlay.tsx", "utf8");
  const welcomeSource = fs.readFileSync("src/popup/components/WelcomeView.tsx", "utf8");
  const appSource = fs.readFileSync("src/popup/components/NooBossApp.tsx", "utf8");
  const aboutSource = fs.readFileSync("src/popup/components/AboutView.tsx", "utf8");
  const selectorSource = fs.readFileSync("src/popup/components/Selector.tsx", "utf8");
  const autostateSource = fs.readFileSync("src/popup/components/AutoStateView.tsx", "utf8");
  const historySource = fs.readFileSync("src/popup/components/HistoryView.tsx", "utf8");
  const optionsSource = fs.readFileSync("src/popup/components/OptionsView.tsx", "utf8");
  const developerSource = fs.readFileSync("src/popup/components/DeveloperView.tsx", "utf8");

  describe("1. WelcomeView Entry Surface & Duration", () => {
    it("renders primary 'Start quick tour' CTA with supporting 'About 2 minutes' copy", () => {
      expect(welcomeSource).toContain("welcomeStartTourBtn");
      expect(welcomeSource).toContain("Start quick tour");
      expect(welcomeSource).toContain("welcome-tour-duration");
      expect(welcomeSource).toContain("About 2 minutes");
      expect(welcomeSource).not.toContain("About 1 minute");
    });

    it("renders secondary 'Skip and open Extension Drawer' CTA", () => {
      expect(welcomeSource).toContain("welcomeSkipBtn");
      expect(welcomeSource).toContain("Skip and open Extension Drawer");
    });
  });

  describe("2. The 6 Primary Guided Steps Verification", () => {
    it("Step 1: Manage extensions targets catalog/action bar", () => {
      expect(overlaySource).toContain("Manage extensions");
      expect(overlaySource).toContain(
        "Find extensions, change their state, inspect them, and choose how the list is organized."
      );
      expect(overlaySource).toContain("#extensionManagerCatalog");
      expect(selectorSource).toContain('id="extensionManagerCatalog"');
    });

    it("Step 2: Organize with Groups targets groups area / new group button", () => {
      expect(overlaySource).toContain("Organize with Groups");
      expect(overlaySource).toContain(
        "Keep related extensions together so you can find and control them as a set."
      );
      expect(overlaySource).toContain("#newGroupBtn");
      expect(selectorSource).toContain('id="newGroupBtn"');
    });

    it("Step 3: Automate with Site Rules targets rule builder", () => {
      expect(overlaySource).toContain("Automate with Site Rules");
      expect(overlaySource).toContain(
        "Turn extensions on or off automatically depending on the websites you open."
      );
      expect(overlaySource).toContain("#autostateRuleBuilder");
      expect(autostateSource).toContain('id="autostateRuleBuilder"');
    });

    it("Step 4: Review History routes to History and explains Extension Drawer management history", () => {
      expect(overlaySource).toContain("Review History");
      expect(overlaySource).toContain(
        "See install, update, enable and disable activity recorded by Extension Drawer. Filter or search the history when you need to trace what changed."
      );
      // History does not mention usage analytics
      expect(overlaySource).not.toContain("usage analytics");
      expect(overlaySource).not.toContain("runtime usage");
      // Targets historyContentArea encompassing filters/search and table
      expect(overlaySource).toContain("#historyContentArea");
      expect(historySource).toContain('id="historyContentArea"');
      expect(historySource).toContain('id="historyToolbar"');
      expect(historySource).toContain('id="historyTableWrapper"');
    });

    it("Step 5: Backup, export and restore routes to Options → Backup & Data and covers all four actions", () => {
      expect(overlaySource).toContain("Backup, export and restore");
      expect(overlaySource).toContain(
        "Back up your Extension Drawer setup, export your extension list or history, and restore a saved configuration when needed."
      );
      // Explanatory line for the three export formats
      expect(overlaySource).toContain("Configuration · JSON");
      expect(overlaySource).toContain("Extension list · HTML");
      expect(overlaySource).toContain("History · CSV");
      expect(overlaySource).toContain("#optionsBackupSection");
      expect(optionsSource).toContain('id="optionsBackupSection"');

      // Verifies all four actions are present in OptionsView Backup & Data section
      expect(optionsSource).toContain("Export Configuration");
      expect(optionsSource).toContain("Export Extension List");
      expect(optionsSource).toContain("Export History");
      expect(optionsSource).toContain("Import Backup");
    });

    it("Step 5 is purely informational and does not trigger export or import on step entry", () => {
      // Step 5 overlay has no auto-trigger functions
      expect(overlaySource).not.toContain("onExportData()");
      expect(overlaySource).not.toContain("onExportHistory()");
      expect(overlaySource).not.toContain("onImportData()");
      expect(overlaySource).not.toContain("click()");
    });

    it("Step 6: Developer Workspace · Optional targets Options toggle and labels as optional", () => {
      expect(overlaySource).toContain("Developer Workspace · Optional");
      expect(overlaySource).toContain(
        "Turn on Developer Workspace when you need tools for local test builds, GitHub and Chrome Web Store links, analytics, and extension packages."
      );
      expect(overlaySource).toContain("It stays hidden unless you choose to enable it.");
      expect(overlaySource).toContain("#optionsDeveloperRow");
      expect(optionsSource).toContain('id="optionsDeveloperRow"');
      expect(optionsSource).toContain("Show Developer workspace");
    });

    it("Step 6 preview mode reuses Step 6 rather than creating a Step 7", () => {
      expect(overlaySource).toContain('currentStep === 6 && subStep === "preview"');
      expect(overlaySource).toContain(
        "Manage local test builds and connect project links, Store analytics and extension packages from here."
      );
      expect(overlaySource).toContain("#developerWorkspaceRoot");
      expect(developerSource).toContain('id="developerWorkspaceRoot"');
      // Step indicator remains Step 6 of 6
      expect(overlaySource).toContain("Step {currentStep} of 6");
      expect(overlaySource).not.toContain("Step 7");
    });
  });

  describe("3. Walkthrough Controls & Behavior", () => {
    it("displays exactly Step N of 6 indicator", () => {
      expect(overlaySource).toContain("Step {currentStep} of 6");
      expect(overlaySource).not.toContain("of 5");
    });

    it("Step 6 provides Finish tour as the primary completion action", () => {
      expect(overlaySource).toContain("const isFinalStep = currentStep === 6;");
      expect(overlaySource).toContain("walkthroughFinishBtn");
      expect(overlaySource).toContain("Finish tour");
    });

    it("supports keyboard Escape key to cleanly exit tour", () => {
      expect(overlaySource).toContain('e.key === "Escape"');
      expect(overlaySource).toContain("onSkip()");
    });

    it("implements accessible dialog attributes and autofocus", () => {
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

  describe("4. Safety: Zero Permissions, Zero Mutation, Zero Network", () => {
    it("verifies WalkthroughOverlay contains no permission requests, identity calls, or network requests", () => {
      expect(overlaySource).not.toContain("chrome.permissions");
      expect(overlaySource).not.toContain("chrome.identity");
      expect(overlaySource).not.toContain("requestAnalyticsPermissions");
      expect(overlaySource).not.toContain("requestDownloadPermissions");
      expect(overlaySource).not.toContain("getAuthToken");
      expect(overlaySource).not.toContain("fetch(");
    });

    it("walkthrough does NOT mutate developerMode or preferences automatically", () => {
      expect(overlaySource).not.toContain("handleUpdateSetting");
      expect(overlaySource).not.toContain("onSaveSettings");
      expect(overlaySource).not.toContain("developerMode = true");
      expect(appSource).not.toContain("handleUpdateSetting('developerMode'");
    });
  });

  describe("5. Navigation Wiring & State Transitions in NooBossApp", () => {
    it("wires 6 primary steps correctly in NooBossApp", () => {
      // Step 1 -> Step 2: extensions
      // Step 2 -> Step 3: autostate
      // Step 3 -> Step 4: history
      // Step 4 -> Step 5: options (Backup & Data)
      // Step 5 -> Step 6: options (Developer Workspace)
      expect(appSource).toContain("isTourActive");
      expect(appSource).toContain("handleStartTour");
      expect(appSource).toContain("handleTourNext");
      expect(appSource).toContain("handleTourBack");
      expect(appSource).toContain("handleTourPreviewDeveloper");
      expect(appSource).toContain("handleTourFinish");
      expect(appSource).toContain("handleTourSkip");
      expect(appSource).toContain("<WalkthroughOverlay");
    });

    it("developerMode disabled: does not expose preview button or hidden Developer route", () => {
      // WalkthroughOverlay only renders Preview Developer Workspace if developerMode is true
      expect(overlaySource).toContain("developerMode && onPreviewDeveloper");
      // NooBossApp redirects away from developer if developerMode is disabled
      expect(appSource).toContain("!settings.developerMode && mainLocation === \"developer\"");
    });

    it("AboutView 'Getting started' button reopens Welcome so user can rerun tour anytime", () => {
      expect(aboutSource).toContain("aboutWelcomeBtn");
      expect(aboutSource).toContain("Getting started");
      expect(aboutSource).toContain("onOpenWelcome");
      expect(appSource).toContain('onOpenWelcome={() => setMainLocation("welcome")}');
    });
  });
});
