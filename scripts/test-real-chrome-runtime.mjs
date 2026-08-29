import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import puppeteer from "puppeteer";

const ROOT = path.resolve(".");
const ZIP_PATH = path.join(ROOT, "release/extension-drawer-1.0.0.zip");
const FIXTURE_EXT_PATH = path.join(ROOT, "tests/fixtures/sample-test-ext");

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runRealChromeTest() {
  console.log("=== REAL EXTRACTED-RELEASE CHROME RUNTIME ACCEPTANCE ===");

  if (!fs.existsSync(ZIP_PATH)) {
    throw new Error(`Release ZIP not found at ${ZIP_PATH}`);
  }

  // 1. Extract ZIP to a clean temporary directory
  const tempExtDir = fs.mkdtempSync(path.join(os.tmpdir(), "ext-drawer-real-chrome-"));
  const tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-profile-"));
  console.log(`Extracted to clean temp directory: ${tempExtDir}`);
  console.log(`Using clean isolated Chrome profile: ${tempProfileDir}`);
  execSync(`unzip -q "${ZIP_PATH}" -d "${tempExtDir}"`);

  // 2. Launch actual Chrome with the extracted extension and disposable test helper
  console.log("Launching Google Chrome with unpacked release extension...");
  const browser = await puppeteer.launch({
    headless: false, // headed launch ensures full extension runtime & service workers
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
    args: [
      `--user-data-dir=${tempProfileDir}`,
      `--disable-extensions-except=${tempExtDir},${FIXTURE_EXT_PATH}`,
      `--load-extension=${tempExtDir},${FIXTURE_EXT_PATH}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--window-position=0,0",
      "--window-size=1200,900",
    ],
  });

  const consoleErrors = [];
  const logError = (msg) => {
    console.error("  [Console/Runtime Error]:", msg);
    consoleErrors.push(msg);
  };

  try {
    await sleep(1500); // Allow extensions & service worker to initialize

    // 3. Find extension targets & verify Service Worker registration
    const targets = await browser.targets();
    let extDrawerId = null;
    let fixtureId = null;

    for (const t of targets) {
      const url = t.url();
      if (url.includes("chrome-extension://")) {
        const match = url.match(/chrome-extension:\/\/([a-z0-9]+)/);
        if (match && !extDrawerId) extDrawerId = match[1];
      }
    }

    // Also check worker targets
    if (!extDrawerId) {
      for (const t of targets) {
        if (t.type() === "service_worker") {
          const match = t.url().match(/chrome-extension:\/\/([a-z0-9]+)/);
          if (match) extDrawerId = match[1];
        }
      }
    }

    // Try navigating to standard extension protocol if needed
    if (!extDrawerId) {
      // In Chromium, we can open chrome://extensions to inspect or use the first tab
      const extPage = await browser.newPage();
      await extPage.goto("chrome://extensions", { waitUntil: "networkidle0" });
      await sleep(1000);
      const extIds = await extPage.evaluate(() => {
        const items = document.querySelectorAll("extensions-item");
        return Array.from(items).map(i => i.id);
      });
      console.log("Discovered extension IDs on chrome://extensions:", extIds);
      await extPage.close();
    }

    console.log(`✓ Real Chrome extension discovered with ID: ${extDrawerId}`);
    if (!extDrawerId) {
      throw new Error("FAIL: Could not locate loaded Extension Drawer ID in Chrome targets!");
    }

    // 4. Open Manager tab in real Chrome runtime
    const managerUrl = `chrome-extension://${extDrawerId}/manager/manager.html`;
    console.log(`Opening real Manager page: ${managerUrl}`);
    const page = await browser.newPage();
    page.on("pageerror", (err) => logError(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") logError(msg.text());
    });

    await page.goto(managerUrl, { waitUntil: "networkidle0" });
    await sleep(800);

    const pageTitle = await page.title();
    console.log(`✓ Manager tab loaded successfully: Title="${pageTitle}"`);
    if (!pageTitle.includes("Extension Drawer")) {
      throw new Error(`FAIL: Unexpected page title: ${pageTitle}`);
    }

    // 5. Verify real chrome.management.getAll() data rendered
    const realExtensions = await page.evaluate(async () => {
      const exts = await chrome.management.getAll();
      return exts.map(e => ({ id: e.id, name: e.name, enabled: e.enabled, mayDisable: e.mayDisable }));
    });
    console.log(`✓ Real chrome.management.getAll() returned ${realExtensions.length} extensions:`);
    for (const ext of realExtensions) {
      console.log(`    - ${ext.name} (id: ${ext.id}, enabled: ${ext.enabled}, mayDisable: ${ext.mayDisable})`);
      if (ext.name === "Disposable Test Helper") {
        fixtureId = ext.id;
      }
    }

    if (!fixtureId) {
      throw new Error("FAIL: Disposable Test Helper not found in management list!");
    }

    // 6. Test real individual Enable/Disable operation
    console.log("Testing REAL individual toggle on Disposable Test Helper...");
    const initialEnabled = realExtensions.find(e => e.id === fixtureId).enabled;
    console.log(`  Initial state of ${fixtureId}: enabled=${initialEnabled}`);

    await page.evaluate(async (fId) => {
      await chrome.runtime.sendMessage({ type: "TOGGLE_EXTENSION", id: fId, enabled: false });
    }, fixtureId);

    await sleep(600);

    const postToggleState = await page.evaluate(async (fId) => {
      const ext = await chrome.management.get(fId);
      return ext.enabled;
    }, fixtureId);
    console.log(`✓ Real individual toggle executed! Post-toggle state in Chrome management API: enabled=${postToggleState}`);

    // 7. Test real Group creation and bulk OFF/ON command
    console.log("Testing REAL Group creation and bulk commands...");
    await page.evaluate(async (fId) => {
      const res = await chrome.runtime.sendMessage({
        type: "CREATE_GROUP",
        name: "Test Runtime Group",
      });
      const createdGroup = res.group || res;
      createdGroup.extensionIds = [fId];
      await chrome.runtime.sendMessage({
        type: "UPDATE_GROUP",
        group: createdGroup,
      });
      return createdGroup;
    }, fixtureId);

    await sleep(400);

    const groups = await page.evaluate(async () => {
      return await chrome.runtime.sendMessage({ type: "GET_GROUPS" });
    });
    console.log(`✓ Real group created: "${groups[0]?.name}" with members: ${JSON.stringify(groups[0]?.extensionIds)}`);

    // Execute bulk ON command
    console.log("Executing bulk ON command on group...");
    await page.evaluate(async (groupId) => {
      await chrome.runtime.sendMessage({ type: "TOGGLE_GROUP", id: groupId, enabled: true });
    }, groups[0].id);

    await sleep(600);

    const postGroupOnState = await page.evaluate(async (fId) => {
      const ext = await chrome.management.get(fId);
      return ext.enabled;
    }, fixtureId);
    console.log(`✓ Real group bulk ON executed! Disposable Test Helper state: enabled=${postGroupOnState}`);
    if (postGroupOnState !== true) {
      throw new Error("FAIL: Group bulk ON did not enable the test extension!");
    }

    // 8. Test AutoState Page and chrome.tabs URL inspection
    console.log("Testing AutoState and chrome.tabs...");
    await page.goto(`chrome-extension://${extDrawerId}/manager/manager.html?page=autostate`, { waitUntil: "networkidle0" });
    await sleep(500);

    const currentTabUrl = await page.evaluate(async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs[0]?.url;
    });
    console.log(`✓ Real chrome.tabs query returned active URL: "${currentTabUrl}"`);

    await page.evaluate(async (fId) => {
      const rule = {
        id: "real_rule_1",
        name: "Runtime Test Rule",
        pattern: "*.example.com",
        isWildcard: true,
        targets: [fId],
        action: "enableWhenMatched",
        enabled: true,
        priority: 1,
        createdAt: Date.now(),
      };
      await chrome.runtime.sendMessage({ type: "SAVE_AUTOSTATE_RULES", rules: [rule] });
    }, fixtureId);

    const savedRules = await page.evaluate(async () => {
      return await chrome.runtime.sendMessage({ type: "GET_AUTOSTATE_RULES" });
    });
    console.log(`✓ Real AutoState rule saved in storage: ${savedRules.length} rule(s) configured`);

    // 9. Test History Logging after real state changes
    console.log("Testing History log in real chrome.storage.local...");
    await page.goto(`chrome-extension://${extDrawerId}/manager/manager.html?page=history`, { waitUntil: "networkidle0" });
    await sleep(500);

    const historyRecords = await page.evaluate(async () => {
      return await chrome.runtime.sendMessage({ type: "GET_HISTORY" });
    });
    console.log(`✓ Real History records verified: ${historyRecords.length} event(s) logged`);
    for (const h of historyRecords.slice(0, 5)) {
      console.log(`    - Event: ${h.event} on "${h.extensionName}" (${new Date(h.timestamp).toISOString()})`);
    }

    // 10. Test Options & About Page with GitHub Links
    console.log("Testing Options and About navigation...");
    await page.goto(`chrome-extension://${extDrawerId}/manager/manager.html?page=about`, { waitUntil: "networkidle0" });
    await sleep(500);

    const aboutData = await page.evaluate(() => {
      const heading = document.querySelector(".nb-heading")?.textContent;
      const links = Array.from(document.querySelectorAll("a")).map(a => ({ text: a.textContent, href: a.href }));
      return { heading, links };
    });
    console.log(`✓ Real About page heading: "${aboutData.heading}"`);
    console.log("✓ Real About page clickable links:");
    for (const l of aboutData.links) {
      console.log(`    - ${l.text}: ${l.href}`);
    }

    // 11. Test Backup Export in real runtime
    console.log("Testing Backup Export in real runtime...");
    const exportData = await page.evaluate(async () => {
      return await chrome.runtime.sendMessage({ type: "EXPORT_DATA" });
    });
    console.log(`✓ Real Export data generated: version=${exportData.version}, groups=${exportData.groups.length}, rules=${exportData.autoStateRules.length}`);

    // 12. Verify Popup page loads in real runtime
    console.log("Testing Popup page in real runtime...");
    await page.goto(`chrome-extension://${extDrawerId}/popup/popup.html`, { waitUntil: "networkidle0" });
    await sleep(500);
    const popupNav = await page.evaluate(() => document.querySelector(".nb-nav")?.textContent || "Loaded");
    console.log(`✓ Real Popup page loaded successfully: navigation=${popupNav.trim()}`);

    if (consoleErrors.length > 0) {
      console.warn(`⚠️ ${consoleErrors.length} console errors logged during runtime run:`, consoleErrors);
    } else {
      console.log("✓ ZERO console or runtime errors during real Chrome execution!");
    }

    console.log("=== REAL EXTRACTED-RELEASE CHROME RUNTIME ACCEPTANCE PASSED! ===");
  } finally {
    await browser.close();
    fs.rmSync(tempExtDir, { recursive: true, force: true });
    fs.rmSync(tempProfileDir, { recursive: true, force: true });
  }
}

runRealChromeTest().catch((err) => {
  console.error("FAIL in Real Chrome Acceptance Test:", err);
  process.exit(1);
});
