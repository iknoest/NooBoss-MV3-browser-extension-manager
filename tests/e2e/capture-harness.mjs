import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DIST = path.join(ROOT, "dist");
const MIGRATED_JSON = path.join(ROOT, "migrated-nooboss-import.json");
const ARTIFACT_DIR = "/Users/ava/.gemini/antigravity/brain/5edd0da1-ee39-4265-8d36-7d1bb76ba72d/.tempmediaStorage";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function startStaticServer(port = 8788) {
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split("?")[0];
    if (reqUrl === "/") reqUrl = "/popup/popup.html";

    const filePath = path.join(DIST, reqUrl);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Static server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function main() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const server = await startStaticServer(8788);
  const migratedData = JSON.parse(fs.readFileSync(MIGRATED_JSON, "utf8"));

  const sampleExtensions = [
    {
      id: "ghbmnnjggjcganegdakffhaeglpncmno",
      name: "ChatGPT for Chrome",
      version: "1.8.0",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Access ChatGPT directly from your browser toolbar.",
      homepageUrl: "https://openai.com",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_gpt" }],
    },
    {
      id: "cjpalhdlnbpafiamejdnhcphjbkeiagm",
      name: "uBlock Origin",
      version: "1.58.0",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Finally, an efficient wide-spectrum content blocker.",
      homepageUrl: "https://github.com/gorhill/uBlock",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_ubo" }],
    },
    {
      id: "eimadpbcbfnmbkopoojfekhnkhdbieeh",
      name: "Dark Reader",
      version: "4.9.80",
      enabled: false,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Dark mode for every website. Take care of your eyes.",
      homepageUrl: "https://darkreader.org",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_dr" }],
    },
    {
      id: "nkbihfbeogaeaoehlefnkodbefgpgknn",
      name: "MetaMask",
      version: "12.2.1",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "An Ethereum Wallet in your Browser",
      homepageUrl: "https://metamask.io",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_mm" }],
    },
    {
      id: "fmkadmapgofadopljbjfkapdkoienihi",
      name: "React Developer Tools",
      version: "5.3.1",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "React profiling and debugging tools for Chrome.",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_rdt" }],
    },
  ];

  // Assign groups: some with specific requested Material Symbols, some with Folder default
  const groupsWithExts = (migratedData.groups || []).map((g, idx) => {
    if (idx === 0) return { ...g, icon: { type: "material", name: "shopping_cart" }, extensionIds: ["ghbmnnjggjcganegdakffhaeglpncmno", "cjpalhdlnbpafiamejdnhcphjbkeiagm"] };
    if (idx === 1) return { ...g, icon: { type: "material", name: "code" }, extensionIds: ["fmkadmapgofadopljbjfkapdkoienihi"] };
    if (idx === 2) return { ...g, icon: { type: "material", name: "business_center" }, extensionIds: ["nkbihfbeogaeaoehlefnkodbefgpgknn"] };
    if (idx === 3) return { ...g, icon: { type: "material", name: "shield" }, extensionIds: ["eimadpbcbfnmbkopoojfekhnkhdbieeh"] };
    // Groups 4-7 have no icon set, verifying default Folder fallback
    return { ...g, icon: undefined, extensionIds: [] };
  });

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 560 });

  await page.evaluateOnNewDocument((exts, grps, rls, setts) => {
    let internalExts = [...exts];
    let internalGrps = [...grps];
    let internalRls = [...rls];
    let internalSetts = { ...setts, theme: "system", accentPreset: "default", accentColor: "#1a73e8", viewMode: "grid" };

    window.chrome = {
      runtime: {
        sendMessage: async (msg) => {
          if (!msg || !msg.type) return null;
          switch (msg.type) {
            case "GET_EXTENSIONS":
              return internalExts;
            case "GET_GROUPS":
              return internalGrps;
            case "GET_AUTOSTATE_RULES":
              return internalRls;
            case "GET_HISTORY":
              return [];
            case "GET_SETTINGS":
              return internalSetts;
            case "GET_PENDING_CHANGES":
              return [];
            case "TOGGLE_EXTENSION": {
              const ext = internalExts.find((e) => e.id === msg.id);
              if (ext) ext.enabled = msg.enabled;
              return { success: true };
            }
            case "TOGGLE_GROUP": {
              const grp = internalGrps.find((g) => g.id === msg.id);
              if (grp) {
                grp.extensionIds.forEach((id) => {
                  const ext = internalExts.find((e) => e.id === id);
                  if (ext) ext.enabled = msg.enabled;
                });
              }
              return { success: true };
            }
            case "SAVE_SETTINGS":
              internalSetts = { ...internalSetts, ...msg.settings };
              return { success: true };
            case "UPDATE_GROUP": {
              internalGrps = internalGrps.map((g) => (g.id === msg.group.id ? msg.group : g));
              return { success: true };
            }
            default:
              return { success: true };
          }
        },
        onMessage: { addListener: () => {}, removeListener: () => {} },
      },
      i18n: { getMessage: (k) => k },
    };
  }, sampleExtensions, groupsWithExts, migratedData.autoStateRules || [], migratedData.settings || {});

  await page.goto("http://localhost:8788/popup/popup.html", { waitUntil: "networkidle0" });
  await sleep(1000);

  // Evidence 1: Default landing page (Extensions / Manage) showing groups with Folder default and requested icons
  const s1Path = path.join(ARTIFACT_DIR, "refinement_01_groups_folder_and_icons.png");
  await page.screenshot({ path: s1Path });
  console.log("Captured:", s1Path);

  // Open Group Edit modal for group 0
  await page.evaluate(() => {
    const editIcons = document.querySelectorAll(".item-controls svg");
    if (editIcons[1]) {
      editIcons[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  await sleep(600);

  // Open Group Icon Picker
  const iconEditBtn = await page.$(".group-icon-edit-btn");
  if (iconEditBtn) {
    await iconEditBtn.click();
    await sleep(600);
  }

  // Evidence 2: Recommended Icon Palette
  const s2Path = path.join(ARTIFACT_DIR, "refinement_02_recommended_palette.png");
  await page.screenshot({ path: s2Path });
  console.log("Captured:", s2Path);

  // Evidence 3: Search for "car"
  const searchInput = await page.$(".icon-picker-search-bar input");
  if (searchInput) {
    await searchInput.type("car");
    await sleep(500);
  }
  const s3Path = path.join(ARTIFACT_DIR, "refinement_03_search_car.png");
  await page.screenshot({ path: s3Path });
  console.log("Captured:", s3Path);

  // Clear search input
  const clearBtn = await page.$(".icon-picker-clear-search");
  if (clearBtn) {
    await clearBtn.click();
    await sleep(400);
  }

  // Evidence 4: Paste / Type "crossword" into manual input and view live preview
  const manualInput = await page.$(".manual-name-input");
  if (manualInput) {
    await manualInput.type("crossword");
    await page.evaluate(() => {
      const scrollBody = document.querySelector(".icon-picker-scroll-body");
      if (scrollBody) scrollBody.scrollTop = scrollBody.scrollHeight;
    });
    await sleep(500);
  }
  const s4Path = path.join(ARTIFACT_DIR, "refinement_04_pasted_crossword.png");
  await page.screenshot({ path: s4Path });
  console.log("Captured:", s4Path);

  // Evidence 5: Type invalid icon name into manual input
  if (manualInput) {
    await page.evaluate((el) => {
      el.value = "";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, manualInput);
    await manualInput.type("invalid_random_symbol_xyz");
    await page.evaluate(() => {
      const scrollBody = document.querySelector(".icon-picker-scroll-body");
      if (scrollBody) scrollBody.scrollTop = scrollBody.scrollHeight;
    });
    await sleep(500);
  }
  const s5Path = path.join(ARTIFACT_DIR, "refinement_05_invalid_icon.png");
  await page.screenshot({ path: s5Path });
  console.log("Captured:", s5Path);

  // Close modal and navigate to About view to verify NooBoss Crossword brand icon
  const closeBtn = await page.$(".icon-picker-close-btn");
  if (closeBtn) {
    await closeBtn.click();
    await sleep(400);
  }
  const subWindowClose = await page.$(".subwindow-close-btn");
  if (subWindowClose) {
    await subWindowClose.click();
    await sleep(400);
  }

  // Evidence 6: About page showing NooBoss Crossword brand icon
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll(".nav-link")).find(
      (el) => el.textContent.includes("About") || el.textContent.includes("about")
    );
    if (btn) btn.click();
  });
  await sleep(600);
  const s6Path = path.join(ARTIFACT_DIR, "refinement_06_nooboss_logo_about.png");
  await page.screenshot({ path: s6Path });
  console.log("Captured:", s6Path);

  // Evidence 7: Toolbar icons light & dark comparison
  const toolbarPage = await browser.newPage();
  await toolbarPage.setViewport({ width: 600, height: 280 });
  const icon16B64 = fs.readFileSync(path.join(ROOT, "src/icons/icon16.png")).toString("base64");
  const icon32B64 = fs.readFileSync(path.join(ROOT, "src/icons/icon32.png")).toString("base64");
  const icon48B64 = fs.readFileSync(path.join(ROOT, "src/icons/icon48.png")).toString("base64");
  const icon128B64 = fs.readFileSync(path.join(ROOT, "src/icons/icon128.png")).toString("base64");

  const comparisonHtml = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; color: #202124; }
  .grid { display: flex; gap: 20px; }
  .box { flex: 1; border-radius: 8px; padding: 16px; border: 1px solid #dadce0; }
  .box.light { background: #ffffff; }
  .box.dark { background: #202124; color: #ffffff; border-color: #3c4043; }
  h4 { margin: 0 0 14px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; }
  .icons-row { display: flex; align-items: center; gap: 16px; }
  .item { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 11px; }
</style>
</head>
<body>
  <h3 style="margin: 0 0 16px 0; font-size: 16px;">Chrome Toolbar Crossword Icon Visibility Test (Transparent Background)</h3>
  <div class="grid">
    <div class="box light">
      <h4>Light Toolbar (#ffffff)</h4>
      <div class="icons-row">
        <div class="item"><img src="data:image/png;base64,${icon16B64}" width="16" height="16" /><span>16px</span></div>
        <div class="item"><img src="data:image/png;base64,${icon32B64}" width="32" height="32" /><span>32px</span></div>
        <div class="item"><img src="data:image/png;base64,${icon48B64}" width="48" height="48" /><span>48px</span></div>
        <div class="item"><img src="data:image/png;base64,${icon128B64}" width="64" height="64" /><span>128px</span></div>
      </div>
    </div>
    <div class="box dark">
      <h4>Dark Toolbar (#202124)</h4>
      <div class="icons-row">
        <div class="item"><img src="data:image/png;base64,${icon16B64}" width="16" height="16" /><span>16px</span></div>
        <div class="item"><img src="data:image/png;base64,${icon32B64}" width="32" height="32" /><span>32px</span></div>
        <div class="item"><img src="data:image/png;base64,${icon48B64}" width="48" height="48" /><span>48px</span></div>
        <div class="item"><img src="data:image/png;base64,${icon128B64}" width="64" height="64" /><span>128px</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;

  await toolbarPage.setContent(comparisonHtml, { waitUntil: "networkidle0" });
  const s7Path = path.join(ARTIFACT_DIR, "refinement_07_toolbar_icon_comparison.png");
  await toolbarPage.screenshot({ path: s7Path });
  console.log("Captured:", s7Path);
  await toolbarPage.close();

  await browser.close();
  server.close();
  console.log("All refinement evidence screenshots captured successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
