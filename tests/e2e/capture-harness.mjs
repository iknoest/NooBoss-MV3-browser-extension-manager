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
      installType: "admin",
      mayDisable: false, // Attention / unavailable case
      description: "Redux DevTools for debugging application state changes.",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_rdx" }],
    },
  ];

  const sampleGroups = [
    {
      id: "g_adblock",
      name: "Ad-Cookie blocker",
      extensionIds: ["ghbmnnjggjcganegdakffhaeglpncmno", "cjpalhdlnbpafiamejdnhcphjbkeiagm"],
      color: "#1a73e8",
      createdAt: 1000,
      icon: { type: "material", name: "shopping_cart" },
    },
    {
      id: "g_dev",
      name: "Development Tools",
      extensionIds: ["fmkadmapgofadopljbjfkapdkoienihi", "lmhkpmbekcpmknklioeibfkpmmfibljd"],
      color: "#1a73e8",
      createdAt: 2000,
      icon: { type: "material", name: "code" },
    },
    {
      id: "g_crypto",
      name: "Finance & Security",
      extensionIds: ["nkbihfbeogaeaoehlefnkodbefgpgknn", "eimadpbcbfnmbkopoojfekhnkhdbieeh", "ghost_ext_missing"],
      color: "#1a73e8",
      createdAt: 3000,
      icon: { type: "material", name: "business_center" },
    },
    {
      id: "g_general",
      name: "General Utilities",
      extensionIds: ["eimadpbcbfnmbkopoojfekhnkhdbieeh"],
      color: "#1a73e8",
      createdAt: 4000,
      icon: { type: "material", name: "folder" },
    },
  ];

  const sampleHistory = [
    { id: "h1", extensionId: "ghbmnnjggjcganegdakffhaeglpncmno", extensionName: "ChatGPT for Chrome", extensionVersion: "1.8.0", event: "enable", timestamp: Date.now() - 1000 * 60 * 5 },
    { id: "h2", extensionId: "cjpalhdlnbpafiamejdnhcphjbkeiagm", extensionName: "uBlock Origin", extensionVersion: "1.58.0", event: "update", timestamp: Date.now() - 1000 * 60 * 45 },
    { id: "h3", extensionId: "eimadpbcbfnmbkopoojfekhnkhdbieeh", extensionName: "Dark Reader", extensionVersion: "4.9.80", event: "disable", timestamp: Date.now() - 1000 * 60 * 180 },
    { id: "h4", extensionId: "nkbihfbeogaeaoehlefnkodbefgpgknn", extensionName: "MetaMask", extensionVersion: "12.2.1", event: "install", timestamp: Date.now() - 1000 * 60 * 60 * 24 },
  ];

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 560 });

  await page.evaluateOnNewDocument((exts, grps, rls, setts, hist) => {
    let internalExts = [...exts];
    let internalGrps = [...grps];
    let internalRls = [...rls];
    let internalHist = [...hist];
    let internalSetts = { ...setts, theme: "system", accentPreset: "default", accentColor: "#1a73e8", viewMode: "bigTile" };

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
              return internalHist;
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
          const ext = internalExts.find((e) => e.id === id);
          if (ext) ext.enabled = enabled;
          return Promise.resolve();
        },
        get: async (id) => internalExts.find((e) => e.id === id),
        getAll: async () => internalExts,
        uninstall: async (id) => {
          internalExts = internalExts.filter((e) => e.id !== id);
          return Promise.resolve();
        },
      },
      i18n: { getMessage: (k) => k },
    };
  }, sampleExtensions, sampleGroups, migratedData.autoStateRules || [], migratedData.settings || {}, sampleHistory);

  await page.goto("http://localhost:8789/popup/popup.html", { waitUntil: "networkidle0" });
  await sleep(1000);

  // 1. Group Big Tile with X / Y running & partial runtime case & contrast
  const s1 = path.join(ARTIFACT_DIR, "v2_01_group_big_tile_running_stats.png");
  await page.screenshot({ path: s1 });
  console.log("Captured:", s1);

  // 2. Extensions enabled/disabled contrast in Big Tile
  const s2 = path.join(ARTIFACT_DIR, "v2_02_enabled_disabled_contrast.png");
  await page.screenshot({ path: s2 });
  console.log("Captured:", s2);

  // 3. Group List mode (44px rows, segmented control, X / Y running)
  await page.evaluate(() => {
    const listBtn = document.querySelectorAll(".view-mode-btn")[0];
    if (listBtn) listBtn.click();
  });
  await sleep(400);
  const s3 = path.join(ARTIFACT_DIR, "v2_03_group_list_mode.png");
  await page.screenshot({ path: s3 });
  console.log("Captured:", s3);

  // 4. Tile resting state (clean without clutter)
  await page.evaluate(() => {
    const tileBtn = document.querySelectorAll(".view-mode-btn")[2];
    if (tileBtn) tileBtn.click();
  });
  await sleep(400);
  const s4 = path.join(ARTIFACT_DIR, "v2_04_tile_resting_state.png");
  await page.screenshot({ path: s4 });
  console.log("Captured:", s4);

  // 5. Tile hover panel showing X / Y running and [ OFF | ON ]
  await page.hover(".group-tile");
  await sleep(300);
  const s5 = path.join(ARTIFACT_DIR, "v2_05_tile_hover_operational_panel.png");
  await page.screenshot({ path: s5 });
  console.log("Captured:", s5);

  // 6. Compact Operational Summary Bar (e.g. 4 / 6 running · 1 extension needs attention)
  const s6 = path.join(ARTIFACT_DIR, "v2_06_operational_summary_bar.png");
  await page.screenshot({ path: s6 });
  console.log("Captured:", s6);

  // 7. Top Navigation (Extensions | AutoState | History | Options | About)
  const s7 = path.join(ARTIFACT_DIR, "v2_07_top_navigation_structure.png");
  await page.screenshot({ path: s7 });
  console.log("Captured:", s7);

  // 8. History View without separate Icon column (inline icon, 4 columns)
  await page.evaluate(() => {
    const navLinks = document.querySelectorAll(".nav-link");
    for (const l of navLinks) {
      if (l.textContent.includes("History") || l.textContent.includes("history")) {
        l.click();
        break;
      }
    }
  });
  await sleep(500);
  const s8 = path.join(ARTIFACT_DIR, "v2_08_history_4_columns_inline_icons.png");
  await page.screenshot({ path: s8 });
  console.log("Captured:", s8);

  // 9. AutoState Tab View as first-class top-level tab
  await page.evaluate(() => {
    const navLinks = document.querySelectorAll(".nav-link");
    for (const l of navLinks) {
      if (l.textContent.includes("AutoState") || l.textContent.includes("autoState")) {
        l.click();
        break;
      }
    }
  });
  await sleep(500);
  const s9 = path.join(ARTIFACT_DIR, "v2_09_autostate_toplevel_view.png");
  await page.screenshot({ path: s9 });
  console.log("Captured:", s9);

  await browser.close();
  server.close();
  console.log("All 9 visual evidence captures completed!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
