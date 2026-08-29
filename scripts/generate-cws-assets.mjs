import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const CWS_IMAGES = path.join(ROOT, "docs/chrome-web-store/images");

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function startStaticServer(port = 8795) {
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
    server.listen(port, () => {
      console.log(`Static server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

// Neutral fictional extension fixtures (no third-party brands)
const sampleExtensions = [
  {
    id: "ext_markdown",
    name: "Markdown Preview Pro",
    version: "2.4.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Render and preview markdown files in real time.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_shield",
    name: "Privacy & Content Shield",
    version: "3.1.2",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Protect your browsing with tracker and ad blocking.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_night",
    name: "Night Theme Styler",
    version: "4.0.1",
    enabled: false,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "High-contrast dark mode for web pages.",
    icons: [{ size: 48, url: "" }],
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
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_formatter",
    name: "Code Formatter Suite",
    version: "2.1.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Format JSON, CSS, and JavaScript snippets.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_apitester",
    name: "REST API Debugger",
    version: "3.0.4",
    enabled: false,
    type: "extension",
    installType: "admin",
    mayDisable: false,
    description: "Enterprise managed API debugging utility.",
    icons: [{ size: 48, url: "" }],
  },
];

const sampleGroups = [
  {
    id: "g_privacy",
    name: "Privacy & Security",
    extensionIds: ["ext_shield", "ext_night"],
    color: "#1a73e8",
    createdAt: 1000,
    icon: { type: "material", name: "shield" },
  },
  {
    id: "g_dev",
    name: "Web Development",
    extensionIds: ["ext_formatter", "ext_apitester"],
    color: "#1a73e8",
    createdAt: 2000,
    icon: { type: "material", name: "code" },
  },
  {
    id: "g_design",
    name: "Design & Styling",
    extensionIds: ["ext_color", "ext_markdown"],
    color: "#1a73e8",
    createdAt: 3000,
    icon: { type: "material", name: "brush" },
  },
  {
    id: "g_daily",
    name: "Daily Essentials",
    extensionIds: ["ext_markdown"],
    color: "#1a73e8",
    createdAt: 4000,
    icon: { type: "material", name: "folder" },
  },
];

const sampleRules = [
  {
    id: "rule_github",
    enabled: true,
    name: "*.github.com",
    pattern: "*.github.com",
    isWildcard: true,
    targets: ["ext_formatter", "ext_apitester"],
    action: "enableOnlyWhileMatched",
    priority: 1,
    createdAt: 1000,
  },
  {
    id: "rule_shopping",
    enabled: true,
    name: "*.example.com",
    pattern: "*.example.com",
    isWildcard: true,
    targets: ["g_privacy"],
    action: "enableWhenMatched",
    priority: 2,
    createdAt: 2000,
  },
];

async function generateCwsAssets() {
  const server = await startStaticServer(8795);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

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
    };

    window.chrome = {
      runtime: {
        id: "extension_drawer_cws_id",
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
      },
      i18n: { getMessage: (k) => k },
    };
  }, sampleExtensions, sampleGroups, sampleRules);

  // 1. screenshot-manage.png (1280x800)
  await page.goto("http://localhost:8795/manager/manager.html?page=extensions", { waitUntil: "networkidle0" });
  await sleep(600);
  const managePath = path.join(CWS_IMAGES, "screenshot-manage.png");
  await page.screenshot({ path: managePath });
  console.log("Saved 1280x800:", managePath);

  // 2. screenshot-groups.png (1280x800)
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
  const groupsPath = path.join(CWS_IMAGES, "screenshot-groups.png");
  await page.screenshot({ path: groupsPath });
  console.log("Saved 1280x800:", groupsPath);

  // 3. screenshot-autostate.png (1280x800)
  await page.goto("http://localhost:8795/manager/manager.html?page=autostate", { waitUntil: "networkidle0" });
  await sleep(600);
  const autostatePath = path.join(CWS_IMAGES, "screenshot-autostate.png");
  await page.screenshot({ path: autostatePath });
  console.log("Saved 1280x800:", autostatePath);

  const iconBase64 = fs.readFileSync(path.join(ROOT, "src/icons/icon128.png")).toString("base64");

  // 4. icon-128.png (128x128 with transparent breathing room padding)
  const iconPage = await browser.newPage();
  await iconPage.setViewport({ width: 128, height: 128, deviceScaleFactor: 1 });
  await iconPage.setContent(`
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        width: 128px;
        height: 128px;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      img {
        width: 104px;
        height: 104px;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    <img src="data:image/png;base64,${iconBase64}" />
  </body>
  </html>
  `, { waitUntil: "networkidle0" });
  const icon128Path = path.join(CWS_IMAGES, "icon-128.png");
  await iconPage.screenshot({ path: icon128Path, omitBackground: true });
  console.log("Saved 128x128 with padding:", icon128Path);

  // 5. small-promo-tile.png (440x280) - Clean, reduced text density
  const smallPromoHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        width: 440px;
        height: 280px;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 24px;
        box-sizing: border-box;
      }
      .icon-wrap {
        width: 80px;
        height: 80px;
        margin-bottom: 16px;
        filter: drop-shadow(0 6px 16px rgba(37, 99, 235, 0.45));
      }
      .title {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin: 0 0 8px 0;
        background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .desc {
        font-size: 14px;
        color: #94a3b8;
        margin: 0;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <img class="icon-wrap" src="data:image/png;base64,${iconBase64}" />
    <h1 class="title">Extension Drawer</h1>
    <p class="desc">Extension Manager & Organizer</p>
  </body>
  </html>
  `;

  const promoPage = await browser.newPage();
  await promoPage.setViewport({ width: 440, height: 280, deviceScaleFactor: 1 });
  await promoPage.setContent(smallPromoHtml, { waitUntil: "networkidle0" });
  await sleep(300);
  const smallPromoPath = path.join(CWS_IMAGES, "small-promo-tile.png");
  await promoPage.screenshot({ path: smallPromoPath });
  console.log("Saved 440x280 (clean):", smallPromoPath);

  // 6. marquee-promo-tile.png (1400x560)
  const marqueePromoHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        width: 1400px;
        height: 560px;
        background: linear-gradient(135deg, #0b0f19 0%, #1e293b 100%);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #ffffff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 60px 80px;
        box-sizing: border-box;
      }
      .left {
        max-width: 600px;
      }
      .icon-title {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 16px;
      }
      .icon-title img {
        width: 72px;
        height: 72px;
        filter: drop-shadow(0 6px 18px rgba(37, 99, 235, 0.5));
      }
      .title {
        font-size: 38px;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin: 0;
        background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .subtitle {
        font-size: 20px;
        font-weight: 600;
        color: #e2e8f0;
        margin: 0 0 12px 0;
      }
      .desc {
        font-size: 15px;
        color: #94a3b8;
        line-height: 1.6;
        margin: 0 0 24px 0;
      }
      .feature-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .feature-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #cbd5e1;
        font-weight: 500;
      }
      .right {
        position: relative;
        width: 540px;
        height: 380px;
        background: #182234;
        border: 1px solid #334155;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      }
      .right-header {
        padding: 12px 18px;
        background: #1e293b;
        border-bottom: 1px solid #334155;
        font-size: 13px;
        font-weight: 600;
        color: #94a3b8;
      }
      .right img {
        width: 100%;
        height: auto;
        display: block;
      }
    </style>
  </head>
  <body>
    <div class="left">
      <div class="icon-title">
        <img src="data:image/png;base64,${iconBase64}" />
        <h1 class="title">Extension Drawer</h1>
      </div>
      <div class="subtitle">Extension Manager & Organizer</div>
      <p class="desc">
        Take complete control of your browser plugins. Group extensions by workflow, toggle batches with one click, and automate activation using URL rules.
      </p>
      <div class="feature-list">
        <div class="feature-item">⚡ One-Click Bulk Commands</div>
        <div class="feature-item">🌐 Context-Aware AutoState</div>
        <div class="feature-item">📊 Real-Time Status & History</div>
        <div class="feature-item">🔒 100% Local & Privacy-First</div>
      </div>
    </div>
    <div class="right">
      <div class="right-header">⚡ Extensions & Command Groups</div>
      <img src="data:image/png;base64,${fs.readFileSync(managePath).toString("base64")}" />
    </div>
  </body>
  </html>
  `;

  const marqueePage = await browser.newPage();
  await marqueePage.setViewport({ width: 1400, height: 560, deviceScaleFactor: 1 });
  await marqueePage.setContent(marqueePromoHtml, { waitUntil: "networkidle0" });
  await sleep(300);
  const marqueePath = path.join(CWS_IMAGES, "marquee-promo-tile.png");
  await marqueePage.screenshot({ path: marqueePath });
  console.log("Saved 1400x560:", marqueePath);

  await browser.close();
  server.close();
  console.log("All CWS graphic assets generated successfully!");
}

generateCwsAssets().catch((err) => {
  console.error(err);
  process.exit(1);
});
