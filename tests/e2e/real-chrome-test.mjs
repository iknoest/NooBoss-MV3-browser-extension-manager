import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DIST = path.join(ROOT, "dist");
const EXT1 = path.join(ROOT, "tests/fixtures/test-ext-1");
const EXT2 = path.join(ROOT, "tests/fixtures/test-ext-2");
const ARTIFACT_DIR = "/Users/ava/.gemini/antigravity/brain/5edd0da1-ee39-4265-8d36-7d1bb76ba72d/.tempmediaStorage";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runRealChromeTests() {
  console.log("Launching REAL Google Chrome with unpacked extensions...");
  const extensionPaths = [DIST, EXT1, EXT2].join(",");

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: [
      `--disable-extensions-except=${extensionPaths}`,
      `--load-extension=${extensionPaths}`,
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  await sleep(1500);

  // Discover real extension IDs from targets
  const targets = browser.targets();
  let noobossId = null;
  for (const target of targets) {
    const url = target.url();
    if (url.startsWith("chrome-extension://")) {
      const id = url.split("/")[2];
      noobossId = id;
      break;
    }
  }

  // Fallback: open an extension page to query chrome.management directly
  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 560 });

  if (!noobossId) {
    // Navigate to chrome://version or any page to inspect targets
    const bgTargets = browser.targets().filter(t => t.type() === "service_worker" || t.type() === "background_page");
    for (const t of bgTargets) {
      const url = t.url();
      if (url.startsWith("chrome-extension://")) {
        noobossId = url.split("/")[2];
        break;
      }
    }
  }

  console.log("Discovered NooBoss Extension ID in real Chrome:", noobossId);

  // Navigate to REAL extension popup URL
  const popupUrl = `chrome-extension://${noobossId}/src/popup/popup.html`;
  console.log("Navigating to real popup:", popupUrl);
  await page.goto(popupUrl, { waitUntil: "networkidle0" });
  await sleep(1000);

  // Verify that window.chrome.management is NATIVE (not mocked)
  const isNative = await page.evaluate(() => {
    return typeof chrome !== "undefined" && typeof chrome.management !== "undefined" && typeof chrome.management.setEnabled === "function";
  });
  console.log("Native chrome.management available in page context:", isNative);

  // Query all installed extensions via real Chrome API
  const allInstalled = await page.evaluate(async () => {
    const list = await chrome.management.getAll();
    return list.map(e => ({ id: e.id, name: e.name, enabled: e.enabled }));
  });
  console.log("Real extensions installed in Chrome session:", allInstalled);

  const testExt1 = allInstalled.find(e => e.name === "Disposable Test Extension One");
  const testExt2 = allInstalled.find(e => e.name === "Disposable Test Extension Two");

  if (!testExt1 || !testExt2) {
    throw new Error("Fixture test extensions were not loaded by Chrome!");
  }

  console.log("Found Test Extension 1:", testExt1);
  console.log("Found Test Extension 2:", testExt2);

  const results = [];

  // Helper to get real Chrome enabled state
  async function getRealState(id) {
    return page.evaluate(async (extId) => {
      const ext = await chrome.management.get(extId);
      return ext.enabled;
    }, id);
  }

  // Helper to ensure extension is in starting state
  async function ensureState(id, targetState) {
    await page.evaluate(async (extId, enabled) => {
      await chrome.management.setEnabled(extId, enabled);
    }, id, targetState);
    await sleep(300);
  }

  // --- Test 1: Extension toggle in Big Tile mode (ON -> OFF) ---
  console.log("\n--- Running Test 1: Extension toggle in Big Tile mode (ON -> OFF) ---");
  await ensureState(testExt1.id, true);
  await page.evaluate(() => {
    const bigTileBtn = document.querySelectorAll(".view-mode-btn")[1];
    if (bigTileBtn) bigTileBtn.click();
  });
  await sleep(400);

  const before1 = await getRealState(testExt1.id);
  // Find switch for testExt1 in Big Tile
  const clicked1 = await page.evaluate((extName) => {
    const tiles = document.querySelectorAll(".nb-big-tile");
    for (const tile of tiles) {
      if (tile.textContent.includes(extName)) {
        const sw = tile.querySelector(".extension-switch");
        if (sw) {
          sw.click();
          return true;
        }
      }
    }
    return false;
  }, testExt1.name);
  await sleep(600);
  const after1 = await getRealState(testExt1.id);
  const pass1 = before1 === true && after1 === false && clicked1;
  console.log(`Test 1: before=${before1}, clicked=${clicked1}, after=${after1} -> ${pass1 ? "PASS" : "FAIL"}`);
  results.push({ name: "Extension Big Tile ON→OFF", pass: pass1, before: before1, after: after1 });

  // --- Test 2: Extension toggle in Big Tile mode (OFF -> ON) ---
  console.log("\n--- Running Test 2: Extension toggle in Big Tile mode (OFF -> ON) ---");
  const before2 = await getRealState(testExt1.id);
  const clicked2 = await page.evaluate((extName) => {
    const tiles = document.querySelectorAll(".nb-big-tile");
    for (const tile of tiles) {
      if (tile.textContent.includes(extName)) {
        const sw = tile.querySelector(".extension-switch");
        if (sw) {
          sw.click();
          return true;
        }
      }
    }
    return false;
  }, testExt1.name);
  await sleep(600);
  const after2 = await getRealState(testExt1.id);
  const pass2 = before2 === false && after2 === true && clicked2;
  console.log(`Test 2: before=${before2}, clicked=${clicked2}, after=${after2} -> ${pass2 ? "PASS" : "FAIL"}`);
  results.push({ name: "Extension Big Tile OFF→ON", pass: pass2, before: before2, after: after2 });

  // Capture Big Tile Screenshot in REAL CHROME
  const s1 = path.join(ARTIFACT_DIR, "real_chrome_01_big_tile.png");
  await page.screenshot({ path: s1 });
  console.log("Captured real Chrome screenshot:", s1);

  // --- Test 3: Extension toggle in List mode (ON -> OFF) ---
  console.log("\n--- Running Test 3: Extension toggle in List mode (ON -> OFF) ---");
  await page.evaluate(() => {
    const listBtn = document.querySelectorAll(".view-mode-btn")[0];
    if (listBtn) listBtn.click();
  });
  await sleep(400);

  const before3 = await getRealState(testExt1.id);
  const clicked3 = await page.evaluate((extName) => {
    const rows = document.querySelectorAll(".nb-list-row");
    for (const row of rows) {
      if (row.textContent.includes(extName)) {
        const sw = row.querySelector(".extension-switch");
        if (sw) {
          sw.click();
          return true;
        }
      }
    }
    return false;
  }, testExt1.name);
  await sleep(600);
  const after3 = await getRealState(testExt1.id);
  const pass3 = before3 === true && after3 === false && clicked3;
  console.log(`Test 3: before=${before3}, clicked=${clicked3}, after=${after3} -> ${pass3 ? "PASS" : "FAIL"}`);
  results.push({ name: "Extension List ON→OFF", pass: pass3, before: before3, after: after3 });

  // --- Test 4: Extension toggle in List mode (OFF -> ON) ---
  console.log("\n--- Running Test 4: Extension toggle in List mode (OFF -> ON) ---");
  const before4 = await getRealState(testExt1.id);
  const clicked4 = await page.evaluate((extName) => {
    const rows = document.querySelectorAll(".nb-list-row");
    for (const row of rows) {
      if (row.textContent.includes(extName)) {
        const sw = row.querySelector(".extension-switch");
        if (sw) {
          sw.click();
          return true;
        }
      }
    }
    return false;
  }, testExt1.name);
  await sleep(600);
  const after4 = await getRealState(testExt1.id);
  const pass4 = before4 === false && after4 === true && clicked4;
  console.log(`Test 4: before=${before4}, clicked=${clicked4}, after=${after4} -> ${pass4 ? "PASS" : "FAIL"}`);
  results.push({ name: "Extension List OFF→ON", pass: pass4, before: before4, after: after4 });

  // Capture List Screenshot in REAL CHROME
  const s2 = path.join(ARTIFACT_DIR, "real_chrome_02_list.png");
  await page.screenshot({ path: s2 });
  console.log("Captured real Chrome screenshot:", s2);

  // --- Test 5: Extension toggle in Tile mode (ON -> OFF) ---
  console.log("\n--- Running Test 5: Extension toggle in Tile mode (ON -> OFF) ---");
  await page.evaluate(() => {
    const tileBtn = document.querySelectorAll(".view-mode-btn")[2];
    if (tileBtn) tileBtn.click();
  });
  await sleep(400);

  const before5 = await getRealState(testExt1.id);
  const clicked5 = await page.evaluate((extName) => {
    const tiles = document.querySelectorAll(".nb-tile:not(.group-tile)");
    for (const tile of tiles) {
      if (tile.textContent.includes(extName)) {
        const sw = tile.querySelector(".extension-switch");
        if (sw) {
          sw.click();
          return true;
        }
      }
    }
    return false;
  }, testExt1.name);
  await sleep(600);
  const after5 = await getRealState(testExt1.id);
  const pass5 = before5 === true && after5 === false && clicked5;
  console.log(`Test 5: before=${before5}, clicked=${clicked5}, after=${after5} -> ${pass5 ? "PASS" : "FAIL"}`);
  results.push({ name: "Extension Tile ON→OFF", pass: pass5, before: before5, after: after5 });

  // Capture Tile Screenshot in REAL CHROME
  const s3 = path.join(ARTIFACT_DIR, "real_chrome_03_tile.png");
  await page.screenshot({ path: s3 });
  console.log("Captured real Chrome screenshot:", s3);

  // Create a test group with testExt1 and testExt2 for group tests
  console.log("\n--- Setting up test group for group toggle tests ---");
  await page.evaluate(async (id1, id2) => {
    const groups = [
      {
        id: "group_test_real",
        name: "Real Test Group",
        extensionIds: [id1, id2],
        color: "#1a73e8",
        createdAt: Date.now(),
        icon: { type: "material", name: "folder" }
      }
    ];
    await chrome.storage.local.set({ nooboss_groups: groups });
  }, testExt1.id, testExt2.id);

  // Reload page to pick up test group
  await page.reload({ waitUntil: "networkidle0" });
  await sleep(800);

  // --- Test 6: Group Big Tile ON -> OFF ---
  console.log("\n--- Running Test 6: Group Big Tile ON -> OFF ---");
  await ensureState(testExt1.id, true);
  await ensureState(testExt2.id, true);
  await page.evaluate(() => {
    const bigTileBtn = document.querySelectorAll(".view-mode-btn")[1];
    if (bigTileBtn) bigTileBtn.click();
  });
  await sleep(400);

  const before6A = await getRealState(testExt1.id);
  const before6B = await getRealState(testExt2.id);
  const clicked6 = await page.evaluate((grpName) => {
    const grpTiles = document.querySelectorAll(".nb-big-tile.group-big-tile");
    for (const t of grpTiles) {
      if (t.textContent.includes(grpName)) {
        const sw = t.querySelector(".group-state-toggle");
        if (sw) {
          sw.click();
          return true;
        }
      }
    }
    return false;
  }, "Real Test Group");
  await sleep(700);

  const after6A = await getRealState(testExt1.id);
  const after6B = await getRealState(testExt2.id);
  const pass6 = before6A === true && before6B === true && after6A === false && after6B === false && clicked6;
  console.log(`Test 6: ext1 before=${before6A}/after=${after6A}, ext2 before=${before6B}/after=${after6B} -> ${pass6 ? "PASS" : "FAIL"}`);
  results.push({ name: "Group Big Tile ON→OFF", pass: pass6, before: "both ON", after: "both OFF" });

  // --- Test 7: Group Big Tile OFF -> ON ---
  console.log("\n--- Running Test 7: Group Big Tile OFF -> ON ---");
  const before7A = await getRealState(testExt1.id);
  const before7B = await getRealState(testExt2.id);
  const clicked7 = await page.evaluate((grpName) => {
    const grpTiles = document.querySelectorAll(".nb-big-tile.group-big-tile");
    for (const t of grpTiles) {
      if (t.textContent.includes(grpName)) {
        const sw = t.querySelector(".group-state-toggle");
        if (sw) {
          sw.click();
          return true;
        }
      }
    }
    return false;
  }, "Real Test Group");
  await sleep(700);

  const after7A = await getRealState(testExt1.id);
  const after7B = await getRealState(testExt2.id);
  const pass7 = before7A === false && before7B === false && after7A === true && after7B === true && clicked7;
  console.log(`Test 7: ext1 before=${before7A}/after=${after7A}, ext2 before=${before7B}/after=${after7B} -> ${pass7 ? "PASS" : "FAIL"}`);
  results.push({ name: "Group Big Tile OFF→ON", pass: pass7, before: "both OFF", after: "both ON" });

  // --- Test 8: Group Mixed -> ON ---
  console.log("\n--- Running Test 8: Group mixed -> ON ---");
  await ensureState(testExt1.id, true);
  await ensureState(testExt2.id, false);
  await page.reload({ waitUntil: "networkidle0" });
  await sleep(600);

  const before8A = await getRealState(testExt1.id);
  const before8B = await getRealState(testExt2.id);
  const clicked8 = await page.evaluate((grpName) => {
    const grpTiles = document.querySelectorAll(".nb-big-tile.group-big-tile");
    for (const t of grpTiles) {
      if (t.textContent.includes(grpName)) {
        const sw = t.querySelector(".group-state-toggle");
        if (sw) {
          sw.click();
          return true;
        }
      }
    }
    return false;
  }, "Real Test Group");
  await sleep(700);

  const after8A = await getRealState(testExt1.id);
  const after8B = await getRealState(testExt2.id);
  const pass8 = before8A === true && before8B === false && after8A === true && after8B === true && clicked8;
  console.log(`Test 8: ext1 before=${before8A}/after=${after8A}, ext2 before=${before8B}/after=${after8B} -> ${pass8 ? "PASS" : "FAIL"}`);
  results.push({ name: "Group mixed→ON", pass: pass8, before: "mixed (T1=ON, T2=OFF)", after: "both ON" });

  // --- Test 9: Group Editor header toggle ---
  console.log("\n--- Running Test 9: Group Editor header toggle ---");
  // Open Group Editor
  await page.evaluate((grpName) => {
    const grpTiles = document.querySelectorAll(".nb-big-tile.group-big-tile");
    for (const t of grpTiles) {
      if (t.textContent.includes(grpName)) {
        const editBtn = t.querySelectorAll(".action-icon-btn")[1]; // edit
        if (editBtn) editBtn.click();
      }
    }
  }, "Real Test Group");
  await sleep(700);

  // Capture Group Editor screenshot in REAL CHROME
  const s4 = path.join(ARTIFACT_DIR, "real_chrome_04_group_editor_list.png");
  await page.screenshot({ path: s4 });
  console.log("Captured real Chrome screenshot:", s4);

  const before9A = await getRealState(testExt1.id);
  const before9B = await getRealState(testExt2.id);
  const clicked9 = await page.evaluate(() => {
    const hdrToggle = document.querySelector(".subwindow-box .group-state-toggle");
    if (hdrToggle) {
      hdrToggle.click();
      return true;
    }
    return false;
  });
  await sleep(700);

  const after9A = await getRealState(testExt1.id);
  const after9B = await getRealState(testExt2.id);
  const pass9 = before9A === true && before9B === true && after9A === false && after9B === false && clicked9;
  console.log(`Test 9: ext1 before=${before9A}/after=${after9A}, ext2 before=${before9B}/after=${after9B} -> ${pass9 ? "PASS" : "FAIL"}`);
  results.push({ name: "Group Editor header toggle", pass: pass9, before: "both ON", after: "both OFF" });

  console.log("\n=======================================================");
  console.log("REAL GOOGLE CHROME UNPACKED EXTENSION ACCEPTANCE RESULTS:");
  console.log("=======================================================");
  console.table(results);

  await browser.close();

  const allPassed = results.every(r => r.pass);
  if (!allPassed) {
    console.error("Some real Chrome tests failed!");
    process.exit(1);
  }
  console.log("ALL REAL CHROME ACCEPTANCE TESTS PASSED 100%!");
}

runRealChromeTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
