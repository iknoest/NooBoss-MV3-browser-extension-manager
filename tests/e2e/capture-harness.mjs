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

function startStaticServer(port = 8789) {
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

  const server = await startStaticServer(8789);
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
    {
      id: "lmhkpmbekcpmknklioeibfkpmmfibljd",
      name: "Redux DevTools",
      version: "3.1.6",
      enabled: false,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Redux DevTools for debugging application state changes.",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_rdx" }],
    },
  ];

  const groupsWithExts = (migratedData.groups || []).map((g, idx) => {
    if (idx === 0) return { ...g, icon: { type: "material", name: "shopping_cart" }, extensionIds: ["ghbmnnjggjcganegdakffhaeglpncmno", "cjpalhdlnbpafiamejdnhcphjbkeiagm"] };
    if (idx === 1) return { ...g, icon: { type: "material", name: "code" }, extensionIds: ["fmkadmapgofadopljbjfkapdkoienihi"] };
    if (idx === 2) return { ...g, icon: { type: "material", name: "business_center" }, extensionIds: ["nkbihfbeogaeaoehlefnkodbefgpgknn", "eimadpbcbfnmbkopoojfekhnkhdbieeh"] };
    if (idx === 3) return { ...g, icon: { type: "material", name: "shield" }, extensionIds: ["eimadpbcbfnmbkopoojfekhnkhdbieeh"] };
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
    let internalSetts = { ...setts, theme: "system", accentPreset: "default", accentColor: "#1a73e8", viewMode: "bigTile" };

    // Real-simulation of chrome.management in page context
    window.chrome = {
      runtime: {
        id: "test_nooboss_extension_id",
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
      management: {
        setEnabled: async (id, enabled) => {
          console.log(`[Management API] setEnabled called for ${id} -> ${enabled}`);
          const ext = internalExts.find((e) => e.id === id);
          if (ext) ext.enabled = enabled;
          return Promise.resolve();
        },
        get: async (id) => {
          return internalExts.find((e) => e.id === id);
        },
        getAll: async () => {
          return internalExts;
        },
        uninstall: async (id) => {
          internalExts = internalExts.filter((e) => e.id !== id);
          return Promise.resolve();
        },
      },
      i18n: { getMessage: (k) => k },
    };
  }, sampleExtensions, groupsWithExts, migratedData.autoStateRules || [], migratedData.settings || {});

  await page.goto("http://localhost:8789/popup/popup.html", { waitUntil: "networkidle0" });
  await sleep(1000);

  // Evidence 1: Manage -> Big Tile (Default View)
  const s1Path = path.join(ARTIFACT_DIR, "usability_01_manage_big_tile.png");
  await page.screenshot({ path: s1Path });
  console.log("Captured:", s1Path);

  // Evidence 2: Manage -> List Mode
  await page.evaluate(() => {
    const listBtn = document.querySelectorAll(".view-mode-btn")[0];
    if (listBtn) listBtn.click();
  });
  await sleep(500);
  const s2Path = path.join(ARTIFACT_DIR, "usability_02_manage_list.png");
  await page.screenshot({ path: s2Path });
  console.log("Captured:", s2Path);

  // Evidence 3: Manage -> Tile Mode (Max 6 columns across)
  await page.evaluate(() => {
    const tileBtn = document.querySelectorAll(".view-mode-btn")[2];
    if (tileBtn) tileBtn.click();
  });
  await sleep(500);
  const s3Path = path.join(ARTIFACT_DIR, "usability_03_manage_tile_max6.png");
  await page.screenshot({ path: s3Path });
  console.log("Captured:", s3Path);

  // Evidence 4: Group hover/action controls
  await page.hover(".nb-tile.group-tile");
  await sleep(300);
  const s4Path = path.join(ARTIFACT_DIR, "usability_04_group_hover_controls.png");
  await page.screenshot({ path: s4Path });
  console.log("Captured:", s4Path);

  // Open Group Editor for group 2 (which has mixed state)
  await page.evaluate(() => {
    // Switch to Big Tile first for editing
    const bigTileBtn = document.querySelectorAll(".view-mode-btn")[1];
    if (bigTileBtn) bigTileBtn.click();
  });
  await sleep(300);

  await page.evaluate(() => {
    const editBtns = document.querySelectorAll(".nb-big-tile.group-big-tile .action-icon-btn");
    if (editBtns[1]) {
      editBtns[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  await sleep(600);

  // Evidence 5: Group Editor -> default List view with whole-row clickable selection
  const s5Path = path.join(ARTIFACT_DIR, "usability_05_editor_default_list.png");
  await page.screenshot({ path: s5Path });
  console.log("Captured:", s5Path);

  // Evidence 6: Group Editor -> Big Tile mode (max 2 columns inside modal)
  await page.evaluate(() => {
    const modalViewBtns = document.querySelectorAll(".subwindow-box .view-mode-btn");
    if (modalViewBtns[1]) modalViewBtns[1].click();
  });
  await sleep(500);
  const s6Path = path.join(ARTIFACT_DIR, "usability_06_editor_big_tile_2col.png");
  await page.screenshot({ path: s6Path });
  console.log("Captured:", s6Path);

  // Toggle selection on a card inside modal
  await page.evaluate(() => {
    const selectableCard = document.querySelector(".selectable-big-tile");
    if (selectableCard) selectableCard.click();
  });
  await sleep(400);

  // Evidence 7: Direct Group Toggle interaction working
  await page.evaluate(() => {
    const groupToggle = document.querySelector(".subwindow-box .group-state-toggle");
    if (groupToggle) groupToggle.click();
  });
  await sleep(500);
  const s7Path = path.join(ARTIFACT_DIR, "usability_07_group_toggle_working.png");
  await page.screenshot({ path: s7Path });
  console.log("Captured:", s7Path);

  // Close modal
  const subWindowClose = await page.$(".subwindow-close-btn");
  if (subWindowClose) {
    await subWindowClose.click();
    await sleep(400);
  }

  // Evidence 8: Mixed group state in List view
  await page.evaluate(() => {
    const listBtn = document.querySelectorAll(".view-mode-btn")[0];
    if (listBtn) listBtn.click();
  });
  await sleep(400);
  const s8Path = path.join(ARTIFACT_DIR, "usability_08_mixed_group_state_list.png");
  await page.screenshot({ path: s8Path });
  console.log("Captured:", s8Path);

  await browser.close();
  server.close();
  console.log("All usability evidence screenshots captured successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
