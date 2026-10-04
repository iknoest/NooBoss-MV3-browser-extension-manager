import puppeteer from "puppeteer";
import path from "path";
import http from "http";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const CWS_DIR = path.join(ROOT, "docs/chrome-web-store/screenshots/cws");
const MARKETING_DIR = path.join(ROOT, "docs/chrome-web-store/screenshots/marketing");

for (const dir of [CWS_DIR, MARKETING_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function startStaticServer(port = 8896) {
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
    if (reqUrl === "/") reqUrl = "/manager/manager.html";

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
    server.listen(port, () => resolve(server));
  });
}

function createSvgDataUrl(bg, glyph) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="${bg}"/>
    ${glyph}
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const ICONS = {
  shield: createSvgDataUrl("#059669", `<path fill="#ffffff" d="M32 12L16 18v14c0 10.6 6.8 20.5 16 23 9.2-2.5 16-12.4 16-23V18L32 12zm-3 28l-8-8 3-3 5 5 11-11 3 3-14 14z"/>`),
  markdown: createSvgDataUrl("#2563eb", `<path fill="#ffffff" d="M14 20h36v24H14z" opacity="0.15"/><path fill="#ffffff" d="M16 42V22h5l6 7.5 6-7.5h5v20h-5V30l-6 7.5-6-7.5v12h-5zm27-6h5v-8h6l-8.5-8.5L37 28h6v8z"/>`),
  palette: createSvgDataUrl("#7c3aed", `<path fill="#ffffff" d="M32 12C20.95 12 12 20.95 12 32c0 8.84 5.73 16.34 13.75 19 1.05.35 2.25-.45 2.25-1.57v-2.18c0-3.31 2.69-6 6-6h3.25c6.49 0 11.75-5.26 11.75-11.75C49 20.08 41.38 12 32 12zm-12 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm8-8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm10 0c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm8 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>`),
  code: createSvgDataUrl("#d97706", `<path fill="#ffffff" d="M25 18l-10 14 10 14 3.5-3.5L21 32l7.5-10.5L25 18zm14 0l-3.5 3.5L43 32l-7.5 10.5L39 46l10-14-10-14z"/>`),
  sample: createSvgDataUrl("#0284c7", `<path fill="#ffffff" d="M16 16h32v32H16z" opacity="0.2"/><path fill="#ffffff" d="M20 20h24v4H20zm0 8h24v4H20zm0 8h16v4H20z"/>`),
  utility: createSvgDataUrl("#4f46e5", `<path fill="#ffffff" d="M14 18h16v6H14zm18 0h18v6H32zM14 28h36v20H14z"/>`),
};

// Neutral fictional extension fixtures
const sampleExtensions = [
  {
    id: "ext_shield",
    name: "Privacy & Content Shield",
    version: "3.2.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Protect your browsing with tracker and ad blocking.",
    icons: [{ size: 48, url: ICONS.shield }],
  },
  {
    id: "ext_markdown",
    name: "Markdown Preview Pro",
    version: "2.4.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Render and preview markdown files in real time.",
    icons: [{ size: 48, url: ICONS.markdown }],
  },
  {
    id: "ext_color",
    name: "Color Picker & Palette",
    version: "1.5.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Sample colors and generate design palettes.",
    icons: [{ size: 48, url: ICONS.palette }],
  },
  {
    id: "ext_formatter",
    name: "JSON & API Formatter",
    version: "2.1.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Format and inspect API JSON payloads.",
    icons: [{ size: 48, url: ICONS.code }],
  },
  {
    id: "ext_sample",
    name: "Sample Extension",
    version: "1.0.0",
    enabled: true,
    type: "extension",
    installType: "development",
    mayDisable: true,
    description: "Sample Chrome extension for testing and development.",
    icons: [{ size: 48, url: ICONS.sample }],
  },
  {
    id: "ext_utility",
    name: "Workspace Utility Demo",
    version: "2.0.0",
    enabled: false,
    type: "extension",
    installType: "development",
    mayDisable: true,
    description: "Demo developer utility for browser automation.",
    icons: [{ size: 48, url: ICONS.utility }],
  },
];

const sampleGroups = [
  {
    id: "g_daily",
    name: "Daily Essentials",
    extensionIds: ["ext_shield", "ext_markdown"],
    color: "#1a73e8",
    createdAt: 1000,
    icon: { type: "material", name: "folder" },
  },
  {
    id: "g_dev",
    name: "Web Development",
    extensionIds: ["ext_formatter", "ext_color"],
    color: "#1a73e8",
    createdAt: 2000,
    icon: { type: "material", name: "code" },
  },
];

const sampleRules = [
  {
    id: "rule_github",
    enabled: true,
    name: "github.com",
    pattern: "github.com",
    isWildcard: true,
    targets: ["g_dev"],
    action: "enableOnlyWhileMatched",
    priority: 1,
    createdAt: 1000,
  },
  {
    id: "rule_figma",
    enabled: true,
    name: "figma.com",
    pattern: "figma.com",
    isWildcard: true,
    targets: ["ext_color"],
    action: "enableOnlyWhileMatched",
    priority: 2,
    createdAt: 2000,
  },
];

const now = Date.now();
const sampleHistory = [
  {
    id: "h1",
    timestamp: now - 15 * 60 * 1000,
    event: "enabled",
    extensionId: "ext_formatter",
    extensionName: "JSON & API Formatter",
    extensionVersion: "2.1.0",
    source: "user",
  },
  {
    id: "h2",
    timestamp: now - 45 * 60 * 1000,
    event: "enabled",
    extensionId: "ext_color",
    extensionName: "Color Picker & Palette",
    extensionVersion: "1.5.0",
    source: "autostate",
  },
  {
    id: "h3",
    timestamp: now - 2 * 3600 * 1000,
    event: "disabled",
    extensionId: "ext_utility",
    extensionName: "Workspace Utility Demo",
    extensionVersion: "2.0.0",
    source: "user",
  },
  {
    id: "h4",
    timestamp: now - 24 * 3600 * 1000,
    event: "updated",
    extensionId: "ext_shield",
    extensionName: "Privacy & Content Shield",
    extensionVersion: "3.2.0",
    source: "external",
  },
  {
    id: "h5",
    timestamp: now - 3 * 24 * 3600 * 1000,
    event: "installed",
    extensionId: "ext_markdown",
    extensionName: "Markdown Preview Pro",
    extensionVersion: "2.4.0",
    source: "user",
  },
];

const canonicalCwsId = "abcdefghijklmnopabcdefghijklmnop";

// Neutral fictional developer projects - zero reference to real NoWebP under simulated analytics
const sampleDevProjects = [
  {
    id: "proj_sample",
    name: "Sample Extension",
    localExtensionId: "ext_sample",
    cwsExtensionId: canonicalCwsId,
    githubUrl: "https://github.com/example/sample-extension",
    gaPropertyId: "987654321",
    createdAt: now - 30 * 24 * 3600 * 1000,
    updatedAt: now - 3600 * 1000,
  },
  {
    id: "proj_utility",
    name: "Workspace Utility Demo",
    localExtensionId: "ext_utility",
    cwsExtensionId: canonicalCwsId,
    githubUrl: "https://github.com/example/workspace-utility",
    gaPropertyId: "",
    createdAt: now - 15 * 24 * 3600 * 1000,
    updatedAt: now - 7200 * 1000,
  },
];

const sampleGA4Metrics = {
  proj_sample: {
    propertyId: "987654321",
    visitors: 14820,
    views: 52400,
    engagementRate: 0.64,
    newUsers: 3140,
    visitorsTrend: "+12.4%",
    viewsTrend: "+15.2%",
    engagementTrend: "+3.4%",
    newUsersTrend: "+8.1%",
    activeUsers: 14820,
    eventCount: 52400,
    hasPreviousBaseline: true,
    fetchedAt: now - 3600 * 1000,
  },
};

function getChromePath() {
  const macDefault = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (fs.existsSync(macDefault)) return macDefault;
  return undefined; // Puppeteer will resolve default bundle
}

async function main() {
  console.log("=== Extension Drawer 1.2.0 CWS Screenshot Pipeline ===");
  const server = await startStaticServer(8896);

  const launchOptions = {
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
  const chromePath = getChromePath();
  if (chromePath) launchOptions.executablePath = chromePath;

  const browser = await puppeteer.launch(launchOptions);

  const setupMockEnvironment = async (page, options = {}) => {
    const { developerMode = true } = options;
    await page.evaluateOnNewDocument(
      (exts, grps, rls, hist, projs, ga4, devMode) => {
        window.__INTERNAL_EXTS = JSON.parse(JSON.stringify(exts));
        window.__INTERNAL_GRPS = JSON.parse(JSON.stringify(grps));
        window.__INTERNAL_RLS = JSON.parse(JSON.stringify(rls));
        window.__INTERNAL_HIST = JSON.parse(JSON.stringify(hist));
        window.__INTERNAL_PROJS = JSON.parse(JSON.stringify(projs));
        window.__INTERNAL_GA4 = JSON.parse(JSON.stringify(ga4));
        window.__INTERNAL_SETTS = {
          theme: "light",
          accentPreset: "default",
          accentColor: "#1a73e8",
          viewMode: "bigTile",
          showRecommendedIcons: true,
          developerMode: devMode,
          autoStateEnabled: true,
          autoStateMode: "automatic",
        };

        const storageData = {
          nooboss_ga4_metrics: window.__INTERNAL_GA4,
          nooboss_developer_projects: window.__INTERNAL_PROJS,
        };

        window.chrome = {
          runtime: {
            id: "extension_drawer_cws_id",
            sendMessage: async (msg) => {
              if (!msg || !msg.type) return null;
              switch (msg.type) {
                case "GET_EXTENSIONS":
                  return window.__INTERNAL_EXTS;
                case "GET_GROUPS":
                  return window.__INTERNAL_GRPS;
                case "GET_AUTOSTATE_RULES":
                  return window.__INTERNAL_RLS;
                case "GET_HISTORY":
                  return window.__INTERNAL_HIST;
                case "GET_SETTINGS":
                  return window.__INTERNAL_SETTS;
                case "GET_PENDING_CHANGES":
                  return [];
                case "GET_DEVELOPER_PROJECTS":
                  return window.__INTERNAL_PROJS;
                default:
                  return { success: true };
              }
            },
            onMessage: { addListener: () => {}, removeListener: () => {} },
          },
          management: {
            setEnabled: async (id, enabled) => {
              const ext = window.__INTERNAL_EXTS.find((e) => e.id === id);
              if (ext) ext.enabled = enabled;
            },
            get: async (id) => window.__INTERNAL_EXTS.find((e) => e.id === id),
            getAll: async () => window.__INTERNAL_EXTS,
          },
          storage: {
            local: {
              get: (keys, cb) => {
                const res =
                  keys === "nooboss_ga4_metrics" || (Array.isArray(keys) && keys.includes("nooboss_ga4_metrics"))
                    ? { nooboss_ga4_metrics: window.__INTERNAL_GA4 }
                    : typeof keys === "string"
                    ? { [keys]: storageData[keys] }
                    : storageData;
                if (cb) cb(res);
                return Promise.resolve(res);
              },
              set: (obj, cb) => {
                Object.assign(storageData, obj);
                if (cb) cb();
                return Promise.resolve();
              },
            },
          },
          tabs: {
            query: async () => [{ url: "https://app.slack.com/client" }],
          },
          i18n: { getMessage: () => "" },
        };
      },
      sampleExtensions,
      sampleGroups,
      sampleRules,
      sampleHistory,
      sampleDevProjects,
      sampleGA4Metrics,
      developerMode
    );
  };

  // =========================================================================
  // 1. Manage Extensions & Groups (1-manage-groups.png)
  // =========================================================================
  console.log("[1/5] Generating CWS full-bleed 1-manage-groups.png (1280x800)...");
  const p1 = await browser.newPage();
  await p1.setViewport({ width: 1280, height: 800 });
  await setupMockEnvironment(p1, { developerMode: true });
  await p1.goto("http://localhost:8896/manager/manager.html?page=extensions", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await p1.screenshot({ path: path.join(CWS_DIR, "1-manage-groups.png"), omitBackground: false });
  await p1.close();

  // =========================================================================
  // 2. Site Rules (2-site-rules.png) - Complete visual unit without heading clipping
  // =========================================================================
  console.log("[2/5] Generating CWS full-bleed 2-site-rules.png (1280x800)...");
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 1280, height: 800 });
  await setupMockEnvironment(p2, { developerMode: true });
  await p2.goto("http://localhost:8896/manager/manager.html?page=autostate", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  await p2.evaluate(() => {
    // 1. Set site pattern
    const scopeInput = document.getElementById("ruleScopeInput");
    if (scopeInput) {
      scopeInput.value = "app.slack.com";
      scopeInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // 2. Select Privacy & Content Shield as target extension
    const targetBigTiles = Array.from(document.querySelectorAll(".selectable-big-tile"));
    const shieldCard = targetBigTiles.find((card) => card.textContent.includes("Privacy & Content Shield"));
    if (shieldCard) {
      shieldCard.click();
    }

    // 3. Scroll container so the Rules heading and table are fully visible below sticky nav
    // without any partial clipping or sliced letters (scrollTop = 110)
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.scrollTop = 110;
    }
  });
  await new Promise((r) => setTimeout(r, 400));
  await p2.screenshot({ path: path.join(CWS_DIR, "2-site-rules.png"), omitBackground: false });
  await p2.close();

  // =========================================================================
  // 3. History + Backup & Data (3-history-backup.png) - Split composite
  // =========================================================================
  console.log("[3/5] Generating CWS full-bleed 3-history-backup.png (1280x800 split)...");
  // Left: History view (640x800)
  const p3a = await browser.newPage();
  await p3a.setViewport({ width: 640, height: 800 });
  await setupMockEnvironment(p3a, { developerMode: true });
  await p3a.goto("http://localhost:8896/manager/manager.html?page=history", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  const buf3a = await p3a.screenshot({ encoding: "base64" });
  await p3a.close();

  // Right: Options Backup & Data section (640x800)
  const p3b = await browser.newPage();
  await p3b.setViewport({ width: 640, height: 800 });
  await setupMockEnvironment(p3b, { developerMode: true });
  await p3b.goto("http://localhost:8896/manager/manager.html?page=options", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await p3b.evaluate(() => {
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.style.paddingBottom = "500px";
    }
    const backupEl = document.getElementById("optionsBackupSection");
    if (backupEl) {
      backupEl.scrollIntoView({ behavior: "instant", block: "start" });
    }
  });
  await new Promise((r) => setTimeout(r, 400));
  const buf3b = await p3b.screenshot({ encoding: "base64" });
  await p3b.close();

  // Compose 640 + 640 into full bleed 1280x800
  const compPage = await browser.newPage();
  await compPage.setViewport({ width: 1280, height: 800 });
  await compPage.setContent(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1280px;
      height: 800px;
      overflow: hidden;
      display: flex;
      background: #ffffff;
    }
    .pane-left {
      width: 640px;
      height: 800px;
      overflow: hidden;
      border-right: 1px solid #cbd5e1;
    }
    .pane-right {
      width: 640px;
      height: 800px;
      overflow: hidden;
    }
    img {
      width: 640px;
      height: 800px;
      display: block;
    }
  </style>
</head>
<body>
  <div class="pane-left"><img src="data:image/png;base64,${buf3a}"></div>
  <div class="pane-right"><img src="data:image/png;base64,${buf3b}"></div>
</body>
</html>`);
  await new Promise((r) => setTimeout(r, 100));
  await compPage.screenshot({ path: path.join(CWS_DIR, "3-history-backup.png"), omitBackground: false });
  await compPage.close();

  // =========================================================================
  // 4. Developer Workspace (4-developer-workspace.png)
  // =========================================================================
  console.log("[4/5] Generating CWS full-bleed 4-developer-workspace.png (1280x800)...");
  const p4 = await browser.newPage();
  await p4.setViewport({ width: 1280, height: 800 });
  await setupMockEnvironment(p4, { developerMode: true });
  await p4.goto("http://localhost:8896/manager/manager.html?page=developer", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  await p4.screenshot({ path: path.join(CWS_DIR, "4-developer-workspace.png"), omitBackground: false });
  await p4.close();

  // =========================================================================
  // 5. Getting Started (5-getting-started.png) - Default first-run (developerMode: false)
  // =========================================================================
  console.log("[5/5] Generating CWS full-bleed 5-getting-started.png (1280x800, default first-run)...");
  const p5 = await browser.newPage();
  await p5.setViewport({ width: 1280, height: 800 });
  // Developer Workspace is optional and hidden by default on fresh install
  await setupMockEnvironment(p5, { developerMode: false });
  await p5.goto("http://localhost:8896/manager/manager.html?page=welcome", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await p5.screenshot({ path: path.join(CWS_DIR, "5-getting-started.png"), omitBackground: false });
  await p5.close();

  console.log("All 5 CWS full-bleed screenshots generated successfully in docs/chrome-web-store/screenshots/cws/!");
  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error("Screenshot generation failed:", err);
  process.exit(1);
});
