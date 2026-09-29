import puppeteer from "puppeteer";
import path from "path";
import http from "http";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const OUTPUT_DIR = path.join(ROOT, "docs/chrome-web-store/screenshots");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
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
  nowebp: createSvgDataUrl("#ea580c", `<path fill="#ffffff" d="M14 14h36v36H14z" opacity="0.15"/><path fill="#ffffff" d="M18 18h28v28H18zm4 20l5-6.5 3.5 4.5 5-6.5 6 8.5H22zM38 24a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>`),
  tabs: createSvgDataUrl("#4f46e5", `<path fill="#ffffff" d="M14 18h16v6H14zm18 0h18v6H32zM14 28h36v20H14z"/>`),
};

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
    id: "ext_nowebp",
    name: "NoWebP - Image Format Converter",
    version: "1.2.0",
    enabled: true,
    type: "extension",
    installType: "development",
    mayDisable: true,
    description: "Convert WebP images to PNG or JPG automatically.",
    icons: [{ size: 48, url: ICONS.nowebp }],
  },
  {
    id: "ext_tabs",
    name: "Tab Session Organizer",
    version: "2.0.4",
    enabled: false,
    type: "extension",
    installType: "development",
    mayDisable: true,
    description: "Save and group browser tabs into named workspaces.",
    icons: [{ size: 48, url: ICONS.tabs }],
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
    extensionId: "ext_tabs",
    extensionName: "Tab Session Organizer",
    extensionVersion: "2.0.4",
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

// Valid 32-character lowercase ID in range a-p
const canonicalCwsId = "abcdefghijklmnopabcdefghijklmnop";

const sampleDevProjects = [
  {
    id: "proj_nowebp",
    name: "NoWebP - Image Format Converter",
    localExtensionId: "ext_nowebp",
    cwsExtensionId: canonicalCwsId,
    githubUrl: "https://github.com/developer/nowebp",
    gaPropertyId: "384729102",
    createdAt: now - 30 * 24 * 3600 * 1000,
    updatedAt: now - 3600 * 1000,
  },
  {
    id: "proj_tabs",
    name: "Tab Session Organizer",
    localExtensionId: "ext_tabs",
    cwsExtensionId: canonicalCwsId,
    githubUrl: "https://github.com/developer/tab-organizer",
    gaPropertyId: "",
    createdAt: now - 15 * 24 * 3600 * 1000,
    updatedAt: now - 7200 * 1000,
  },
];

const sampleGA4Metrics = {
  proj_nowebp: {
    propertyId: "384729102",
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

function composeHtml({ title, subtitle, tabTitle, contentHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 1280px;
      height: 800px;
      overflow: hidden;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .cws-canvas {
      width: 1280px;
      height: 800px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 22px 50px 20px 50px;
      background: linear-gradient(180deg, #f8fafd 0%, #f1f5f9 100%);
    }
    .marketing-header {
      text-align: center;
      margin-bottom: 14px;
    }
    .marketing-title {
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      letter-spacing: -0.015em;
      margin-bottom: 5px;
    }
    .marketing-subtitle {
      font-size: 14px;
      font-weight: 400;
      color: #475569;
      line-height: 1.35;
    }
    .window-frame {
      width: 1180px;
      height: 680px;
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.09), 0 8px 10px -6px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .window-titlebar {
      height: 38px;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      padding: 0 14px;
      position: relative;
      flex-shrink: 0;
    }
    .traffic-lights {
      display: flex;
      gap: 7px;
      align-items: center;
    }
    .traffic-dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
    }
    .dot-red { background: #ff5f56; border: 0.5px solid #e0443e; }
    .dot-amber { background: #ffbd2e; border: 0.5px solid #dea123; }
    .dot-green { background: #27c93f; border: 0.5px solid #1aab29; }
    .window-tab {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 7px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-bottom: none;
      border-radius: 6px 6px 0 0;
      padding: 5px 16px;
      font-size: 12px;
      font-weight: 500;
      color: #334155;
      bottom: -1px;
      height: 28px;
    }
    .window-tab svg {
      width: 14px;
      height: 14px;
    }
    .window-content {
      flex: 1;
      width: 100%;
      height: 642px;
      overflow: hidden;
      position: relative;
      background: #ffffff;
    }
  </style>
</head>
<body>
  <div class="cws-canvas">
    <div class="marketing-header">
      <h1 class="marketing-title">${title}</h1>
      <p class="marketing-subtitle">${subtitle}</p>
    </div>
    <div class="window-frame">
      <div class="window-titlebar">
        <div class="traffic-lights">
          <span class="traffic-dot dot-red"></span>
          <span class="traffic-dot dot-amber"></span>
          <span class="traffic-dot dot-green"></span>
        </div>
        <div class="window-tab">
          <svg viewBox="0 0 24 24" fill="#1a73e8"><path d="M20 12V8h-4V4h-4v4H8v4H4v4h4v4h4v-4h4v4h4v-4h-4v-4h4z"/></svg>
          <span>${tabTitle}</span>
        </div>
      </div>
      <div class="window-content">
        ${contentHtml}
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log("Starting Chrome Web Store Screenshot Generation Pipeline for Extension Drawer 1.2.0...");
  const server = await startStaticServer(8896);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const setupMockEnvironment = async (page) => {
    await page.evaluateOnNewDocument(
      (exts, grps, rls, hist, projs, ga4) => {
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
          developerMode: true,
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
                const res = (keys === "nooboss_ga4_metrics" || (Array.isArray(keys) && keys.includes("nooboss_ga4_metrics")))
                  ? { nooboss_ga4_metrics: window.__INTERNAL_GA4 }
                  : (typeof keys === "string" ? { [keys]: storageData[keys] } : storageData);
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
      sampleGA4Metrics
    );
  };

  const composeAndSave = async (options, outputPath) => {
    const compPage = await browser.newPage();
    await compPage.setViewport({ width: 1280, height: 800 });
    const html = composeHtml(options);
    await compPage.setContent(html, { waitUntil: "load" });
    await new Promise((r) => setTimeout(r, 120));
    await compPage.screenshot({ path: outputPath, omitBackground: false });
    await compPage.close();
    console.log("  -> Saved 1280x800:", outputPath);
  };

  // =========================================================================
  // 1. Manage Extensions + Groups (1-manage-groups.png)
  // =========================================================================
  console.log("[1/5] Generating 1-manage-groups.png...");
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1180, height: 642 });
  await setupMockEnvironment(page1);
  await page1.goto("http://localhost:8896/manager/manager.html?page=extensions", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  const buf1 = await page1.screenshot({ encoding: "base64" });
  await page1.close();

  await composeAndSave(
    {
      title: "Manage all your extensions in one place",
      subtitle: "Search, sort, group and control your Chrome extensions with live running status.",
      tabTitle: "Extension Drawer - Extensions",
      contentHtml: `<img src="data:image/png;base64,${buf1}" style="width: 1180px; height: 642px; display: block;" />`,
    },
    path.join(OUTPUT_DIR, "1-manage-groups.png")
  );

  // =========================================================================
  // 2. Site Rules (2-site-rules.png)
  // =========================================================================
  console.log("[2/5] Generating 2-site-rules.png...");
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1180, height: 642 });
  await setupMockEnvironment(page2);
  await page2.goto("http://localhost:8896/manager/manager.html?page=autostate", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  await page2.evaluate(() => {
    const scopeInput = document.getElementById("ruleScopeInput");
    if (scopeInput) {
      scopeInput.value = "app.slack.com";
      scopeInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const targetRow = Array.from(document.querySelectorAll(".selectable-row")).find((r) =>
      r.textContent.includes("Privacy & Content Shield")
    );
    if (targetRow) targetRow.click();
  });
  await new Promise((r) => setTimeout(r, 300));
  const buf2 = await page2.screenshot({ encoding: "base64" });
  await page2.close();

  await composeAndSave(
    {
      title: "Automate extensions with Site Rules",
      subtitle: "Turn extensions on or off automatically based on the websites you open.",
      tabTitle: "Extension Drawer - Site Rules",
      contentHtml: `<img src="data:image/png;base64,${buf2}" style="width: 1180px; height: 642px; display: block;" />`,
    },
    path.join(OUTPUT_DIR, "2-site-rules.png")
  );

  // =========================================================================
  // 3. History + Backup & Data Composite (3-history-backup.png)
  // =========================================================================
  console.log("[3/5] Generating 3-history-backup.png...");
  // Left: History view
  const page3a = await browser.newPage();
  await page3a.setViewport({ width: 590, height: 642 });
  await setupMockEnvironment(page3a);
  await page3a.goto("http://localhost:8896/manager/manager.html?page=history", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  const buf3a = await page3a.screenshot({ encoding: "base64" });
  await page3a.close();

  // Right: Options Backup & Data section
  const page3b = await browser.newPage();
  await page3b.setViewport({ width: 590, height: 642 });
  await setupMockEnvironment(page3b);
  await page3b.goto("http://localhost:8896/manager/manager.html?page=options", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await page3b.evaluate(() => {
    const devSection = document.getElementById("optionsDeveloperSection");
    if (devSection) devSection.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 300));
  const buf3b = await page3b.screenshot({ encoding: "base64" });
  await page3b.close();

  await composeAndSave(
    {
      title: "Review changes and keep your data portable",
      subtitle: "Search management history and export configuration, extension lists and history locally.",
      tabTitle: "Extension Drawer - History & Backup",
      contentHtml: `<div style="display: flex; width: 1180px; height: 642px; overflow: hidden;">
        <div style="width: 590px; height: 642px; border-right: 1px solid #cbd5e1; overflow: hidden;">
          <img src="data:image/png;base64,${buf3a}" style="width: 590px; height: 642px; display: block;" />
        </div>
        <div style="width: 590px; height: 642px; overflow: hidden;">
          <img src="data:image/png;base64,${buf3b}" style="width: 590px; height: 642px; display: block;" />
        </div>
      </div>`,
    },
    path.join(OUTPUT_DIR, "3-history-backup.png")
  );

  // =========================================================================
  // 4. Developer Workspace (4-developer-workspace.png)
  // =========================================================================
  console.log("[4/5] Generating 4-developer-workspace.png...");
  const page4 = await browser.newPage();
  await page4.setViewport({ width: 1180, height: 642 });
  await setupMockEnvironment(page4);
  await page4.goto("http://localhost:8896/manager/manager.html?page=developer", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  const buf4 = await page4.screenshot({ encoding: "base64" });
  await page4.close();

  await composeAndSave(
    {
      title: "Optional tools for extension developers",
      subtitle: "Connect local builds, GitHub, Chrome Web Store, analytics and Store packages.",
      tabTitle: "Extension Drawer - Developer Workspace",
      contentHtml: `<img src="data:image/png;base64,${buf4}" style="width: 1180px; height: 642px; display: block;" />`,
    },
    path.join(OUTPUT_DIR, "4-developer-workspace.png")
  );

  // =========================================================================
  // 5. Getting Started (5-getting-started.png)
  // =========================================================================
  console.log("[5/5] Generating 5-getting-started.png...");
  const page5 = await browser.newPage();
  await page5.setViewport({ width: 1180, height: 642 });
  await setupMockEnvironment(page5);
  await page5.goto("http://localhost:8896/manager/manager.html?page=welcome", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 500));
  await page5.evaluate(() => {
    const welcome = document.querySelector(".welcome-view");
    if (welcome) {
      welcome.style.padding = "2px 20px 4px 20px";
      welcome.style.maxWidth = "740px";
    }
    const header = document.querySelector(".welcome-header");
    if (header) {
      header.style.marginBottom = "4px";
    }
    const grid = document.querySelector(".welcome-grid");
    if (grid) {
      grid.style.marginBottom = "6px";
      grid.style.gap = "8px";
    }
    const callout = document.querySelector(".welcome-developer-callout");
    if (callout) {
      callout.style.marginBottom = "6px";
      callout.style.padding = "6px 14px";
    }
    const cta = document.querySelector(".welcome-cta-container");
    if (cta) {
      cta.style.gap = "4px";
    }
  });
  await new Promise((r) => setTimeout(r, 200));
  const buf5 = await page5.screenshot({ encoding: "base64" });
  await page5.close();

  await composeAndSave(
    {
      title: "Get started in about 2 minutes",
      subtitle: "A guided tour introduces Extensions, Groups, Site Rules, History, Backup & Data and Developer Workspace.",
      tabTitle: "Extension Drawer - Welcome",
      contentHtml: `<img src="data:image/png;base64,${buf5}" style="width: 1180px; height: 642px; display: block;" />`,
    },
    path.join(OUTPUT_DIR, "5-getting-started.png")
  );

  console.log("All 5 Chrome Web Store screenshots generated successfully in docs/chrome-web-store/screenshots/!");

  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error("Screenshot generation failed:", err);
  process.exit(1);
});
