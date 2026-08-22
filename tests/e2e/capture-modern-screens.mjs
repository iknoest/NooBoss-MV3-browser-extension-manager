import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DIST = path.join(ROOT, "dist");
const MIGRATED_JSON = path.join(ROOT, "migrated-nooboss-import.json");
const ARTIFACT_DIR = "/Users/ava/.gemini/antigravity/brain/5edd0da1-ee39-4265-8d36-7d1bb76ba72d/.tempmediaStorage";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), "nooboss-modern-"));
  console.log(`Starting Chrome with profile: ${tmpProfile}`);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: [
      `--disable-extensions-except=${DIST}`,
      `--load-extension=${DIST}`,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      `--user-data-dir=${tmpProfile}`,
      "--no-first-run",
      "--disable-default-apps",
    ],
  });

  await sleep(2500);

  let extensionId = null;
  const targets = await browser.targets();
  for (const target of targets) {
    const url = target.url();
    if (url.startsWith("chrome-extension://")) {
      const match = url.match(/chrome-extension:\/\/([^/]+)/);
      if (match) {
        extensionId = match[1];
        break;
      }
    }
  }

  if (!extensionId) {
    // Try service worker target
    try {
      const swTarget = await browser.waitForTarget(
        (t) => t.url().includes("chrome-extension://"),
        { timeout: 5000 }
      );
      if (swTarget) {
        const match = swTarget.url().match(/chrome-extension:\/\/([^/]+)/);
        if (match) extensionId = match[1];
      }
    } catch {}
  }

  console.log(`Extension ID: ${extensionId}`);
  if (!extensionId) {
    console.error("Could not find extension ID");
    await browser.close();
    process.exit(1);
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 560 });

  // 1. Load popup directly
  const popupUrl = `chrome-extension://${extensionId}/src/popup/popup.html`;
  await page.goto(popupUrl, { waitUntil: "networkidle0" });
  await sleep(1000);

  // Import migrated data if available
  if (fs.existsSync(MIGRATED_JSON)) {
    const rawData = JSON.parse(fs.readFileSync(MIGRATED_JSON, "utf8"));
    console.log("Importing migrated data into test session...");
    await page.evaluate((data) => {
      return chrome.runtime.sendMessage({ type: "IMPORT_DATA", data });
    }, rawData);
    await sleep(1000);
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(1000);
  }

  // Screenshot 1: Default landing page (Extensions / Manage) in Tile View
  const s1Path = path.join(ARTIFACT_DIR, "modern_01_manage_tile_default.png");
  await page.screenshot({ path: s1Path });
  console.log("Captured:", s1Path);

  // Screenshot 2: Switch to Big Tile View
  const bigTileBtn = await page.$("button[title=\"Big tile view\"]");
  if (bigTileBtn) {
    await bigTileBtn.click();
    await sleep(400);
  }
  const s2Path = path.join(ARTIFACT_DIR, "modern_02_manage_big_tile.png");
  await page.screenshot({ path: s2Path });
  console.log("Captured:", s2Path);

  // Screenshot 3: Switch to List View
  const listBtn = await page.$("button[title=\"List view\"]");
  if (listBtn) {
    await listBtn.click();
    await sleep(400);
  }
  const s3Path = path.join(ARTIFACT_DIR, "modern_03_manage_list.png");
  await page.screenshot({ path: s3Path });
  console.log("Captured:", s3Path);

  // Screenshot 4: Navigate to Options
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll(".nav-link")).find(
      (el) => el.textContent.includes("Options") || el.textContent.includes("options")
    );
    if (btn) btn.click();
  });
  await sleep(600);
  const s4Path = path.join(ARTIFACT_DIR, "modern_04_options_appearance.png");
  await page.screenshot({ path: s4Path });
  console.log("Captured:", s4Path);

  // Screenshot 5: Switch to Dark Theme in Options
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll(".settings-select"));
    if (selects[0]) {
      selects[0].value = "dark";
      selects[0].dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await sleep(600);
  const s5Path = path.join(ARTIFACT_DIR, "modern_05_dark_mode.png");
  await page.screenshot({ path: s5Path });
  console.log("Captured:", s5Path);

  // Switch back to Light theme for Group Edit & Icon Picker screenshots
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll(".settings-select"));
    if (selects[0]) {
      selects[0].value = "light";
      selects[0].dispatchEvent(new Event("change", { bubbles: true }));
    }
    const manageBtn = Array.from(document.querySelectorAll(".sub-link")).find(
      (el) => el.textContent.includes("Manage") || el.textContent.includes("manage")
    );
    if (manageBtn) manageBtn.click();
  });
  await sleep(600);

  // Screenshot 6: Open Group Edit SubWindow & Icon Picker
  await page.evaluate(() => {
    const editIcons = document.querySelectorAll(".item-controls svg, .list-actions svg");
    if (editIcons[1]) {
      editIcons[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  await sleep(600);

  const s6Path = path.join(ARTIFACT_DIR, "modern_06_group_edit_modal.png");
  await page.screenshot({ path: s6Path });
  console.log("Captured:", s6Path);

  // Click on group icon to open Icon Picker
  const iconEditBtn = await page.$(".group-icon-edit-btn");
  if (iconEditBtn) {
    await iconEditBtn.click();
    await sleep(500);
  }
  const s7Path = path.join(ARTIFACT_DIR, "modern_07_group_icon_picker.png");
  await page.screenshot({ path: s7Path });
  console.log("Captured:", s7Path);

  // Type search query in icon picker
  const searchInput = await page.$(".icon-picker-search-bar input");
  if (searchInput) {
    await searchInput.type("cart");
    await sleep(400);
  }
  const s8Path = path.join(ARTIFACT_DIR, "modern_08_group_icon_search.png");
  await page.screenshot({ path: s8Path });
  console.log("Captured:", s8Path);

  await browser.close();
  console.log("All modern visual screenshots captured successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
