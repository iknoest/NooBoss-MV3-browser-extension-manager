import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const DOCS_IMAGES = path.join(ROOT, "docs/images");

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function startStaticServer(port = 8792) {
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

const sampleExtensions = [
  {
    id: "ext_chatgpt",
    name: "ChatGPT for Chrome",
    version: "1.8.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Access ChatGPT directly from your browser toolbar.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_ublock",
    name: "uBlock Origin",
    version: "1.58.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "An efficient wide-spectrum content blocker.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_darkreader",
    name: "Dark Reader",
    version: "4.9.80",
    enabled: false,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Dark mode for every website.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_metamask",
    name: "MetaMask",
    version: "12.2.1",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Ethereum wallet and Web3 browser interface.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_reactdev",
    name: "React Developer Tools",
    version: "5.3.1",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Profiling and inspection tools for React components.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_reduxdev",
    name: "Redux DevTools",
    version: "3.1.6",
    enabled: false,
    type: "extension",
    installType: "admin",
    mayDisable: false, // Attention example
    description: "Redux DevTools for inspecting state mutations.",
    icons: [{ size: 48, url: "" }],
  },
];

const sampleGroups = [
  {
    id: "g_privacy",
    name: "Privacy & Adblock",
    extensionIds: ["ext_ublock", "ext_darkreader"],
    color: "#1a73e8",
    createdAt: 1000,
    icon: { type: "material", name: "shield" },
  },
  {
    id: "g_dev",
    name: "Web Development",
    extensionIds: ["ext_reactdev", "ext_reduxdev"],
    color: "#1a73e8",
    createdAt: 2000,
    icon: { type: "material", name: "code" },
  },
  {
    id: "g_finance",
    name: "Finance & Web3",
    extensionIds: ["ext_metamask", "ext_chatgpt"],
    color: "#1a73e8",
    createdAt: 3000,
    icon: { type: "material", name: "business_center" },
  },
  {
    id: "g_daily",
    name: "Daily Essentials",
    extensionIds: ["ext_chatgpt"],
    color: "#1a73e8",
    createdAt: 4000,
    icon: { type: "material", name: "folder" },
  },
];

const sampleRules = [
  {
    id: "rule_github",
    enabled: true,
    name: "github.com",
    pattern: "github.com",
    isWildcard: false,
    targets: ["ext_reactdev", "ext_reduxdev"],
    action: "enableOnlyWhileMatched",
    priority: 1,
    createdAt: 1000,
  },
  {
    id: "rule_shopping",
    enabled: true,
    name: "*.amazon.com",
    pattern: "*.amazon.com",
    isWildcard: true,
    targets: ["g_privacy"],
    action: "enableWhenMatched",
    priority: 2,
    createdAt: 2000,
  },
];

async function generateImages() {
  const server = await startStaticServer(8792);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 560, deviceScaleFactor: 2 });

  await page.evaluateOnNewDocument((exts, grps, rls) => {
    let internalExts = [...exts];
    let internalGrps = [...grps];
    let internalRls = [...rls];
    let internalSetts = {
      theme: "system",
      accentPreset: "default",
      accentColor: "#1a73e8",
      viewMode: "bigTile",
      showRecommendedIcons: true,
      googleFontsCatalogLink: "https://fonts.google.com/icons",
    };

    window.chrome = {
      runtime: {
        id: "release_nooboss_extension_id",
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
  }, sampleExtensions, sampleGroups, sampleRules);

  // 1. Manage (Extensions + Groups Big Tile)
  await page.goto("http://localhost:8792/popup/popup.html?page=extensions", { waitUntil: "networkidle0" });
  await sleep(600);
  const manageImg = path.join(DOCS_IMAGES, "manage.png");
  await page.screenshot({ path: manageImg });
  console.log("Saved:", manageImg);

  // 2. Groups (List mode with command controls)
  await page.evaluate(() => {
    const listBtn = document.querySelectorAll(".view-mode-btn")[0];
    if (listBtn) listBtn.click();
    const typeSelect = document.querySelector("#typeFilter");
    if (typeSelect) {
      typeSelect.value = "group";
      typeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await sleep(400);
  const groupsImg = path.join(DOCS_IMAGES, "groups.png");
  await page.screenshot({ path: groupsImg });
  console.log("Saved:", groupsImg);

  // 3. AutoState View
  await page.goto("http://localhost:8792/popup/popup.html?page=autostate", { waitUntil: "networkidle0" });
  await sleep(600);
  const autostateImg = path.join(DOCS_IMAGES, "autostate.png");
  await page.screenshot({ path: autostateImg });
  console.log("Saved:", autostateImg);

  // 4. Options View
  await page.goto("http://localhost:8792/popup/popup.html?page=options", { waitUntil: "networkidle0" });
  await sleep(600);
  const optionsImg = path.join(DOCS_IMAGES, "options.png");
  await page.screenshot({ path: optionsImg });
  console.log("Saved:", optionsImg);

  // 5. Composite Overview Image
  const overviewHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 24px;
        background: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
      }
      .header {
        text-align: center;
        color: #ffffff;
        margin-bottom: 20px;
      }
      .title {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin: 0 0 6px 0;
        background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .subtitle {
        font-size: 14px;
        color: #94a3b8;
        margin: 0;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        width: 100%;
        max-width: 1100px;
      }
      .card {
        background: #1e293b;
        border-radius: 12px;
        border: 1px solid #334155;
        overflow: hidden;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      }
      .card-label {
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 600;
        color: #cbd5e1;
        background: #1e293b;
        border-bottom: 1px solid #334155;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .card img {
        width: 100%;
        display: block;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 class="title">NooBoss MV3 — Extension Manager</h1>
      <p class="subtitle">Community-maintained Manifest V3 continuation of NooBoss for modern Chrome</p>
    </div>
    <div class="grid">
      <div class="card">
        <div class="card-label">⚡ Extensions & Groups (Big Tile & Live Counts)</div>
        <img src="data:image/png;base64,${fs.readFileSync(manageImg).toString("base64")}" />
      </div>
      <div class="card">
        <div class="card-label">🏷️ Groups Command Center (One-Shot Bulk Commands)</div>
        <img src="data:image/png;base64,${fs.readFileSync(groupsImg).toString("base64")}" />
      </div>
      <div class="card">
        <div class="card-label">🌐 AutoState Automation (URL & Context Rules)</div>
        <img src="data:image/png;base64,${fs.readFileSync(autostateImg).toString("base64")}" />
      </div>
      <div class="card">
        <div class="card-label">🎨 Modern System Settings (Themes & Local Backup)</div>
        <img src="data:image/png;base64,${fs.readFileSync(optionsImg).toString("base64")}" />
      </div>
    </div>
  </body>
  </html>
  `;

  const compPage = await browser.newPage();
  await compPage.setViewport({ width: 1200, height: 860, deviceScaleFactor: 2 });
  await compPage.setContent(overviewHtml, { waitUntil: "networkidle0" });
  await sleep(500);

  const overviewImg = path.join(DOCS_IMAGES, "nooboss-overview.png");
  await compPage.screenshot({ path: overviewImg });
  console.log("Saved:", overviewImg);

  await browser.close();
  server.close();
  console.log("All README images generated successfully!");
}

generateImages().catch((err) => {
  console.error(err);
  process.exit(1);
});
