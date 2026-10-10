import puppeteer from "puppeteer";
import path from "path";
import http from "http";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const OUTPUT_DIR = path.join(ROOT, "docs/marketing/renders");
const REVIEW_DIR = "/private/tmp/agent-review/marketing";

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(REVIEW_DIR, { recursive: true });

// Read local icon data
const icon128Base64 = fs.readFileSync(path.join(DIST, "icons/icon128.png")).toString("base64");
const iconDataUrl = `data:image/png;base64,${icon128Base64}`;

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
  react: createSvgDataUrl("#0ea5e9", `<ellipse cx="32" cy="32" rx="20" ry="8" fill="none" stroke="#fff" stroke-width="2" transform="rotate(30 32 32)"/><ellipse cx="32" cy="32" rx="20" ry="8" fill="none" stroke="#fff" stroke-width="2" transform="rotate(90 32 32)"/><ellipse cx="32" cy="32" rx="20" ry="8" fill="none" stroke="#fff" stroke-width="2" transform="rotate(150 32 32)"/><circle cx="32" cy="32" r="3" fill="#fff"/>`),
  json: createSvgDataUrl("#e11d48", `<path fill="#ffffff" d="M20 18c-3 0-4 2-4 5v4c0 3-2 4-4 4 2 0 4 1 4 4v4c0 3 1 5 4 5h2v-4h-2c-1 0-1-1-1-2v-5c0-2-2-3-3-3 1 0 3-1 3-3v-5c0-1 0-2 1-2h2v-4h-2zm24 0h-2v4h2c1 0 1 1 1 2v5c0 2 2 3 3 3-1 0-3 1-3 3v5c0 1 0 2-1 2h-2v4h2c3 0 4-2 4-5v-4c0-3 2-4 4-4-2 0-4-1-4-4v-4c0-3-1-5-4-5z"/>`),
};

const sampleExtensions = [
  { id: "ext_shield", name: "Privacy & Content Shield", version: "3.2.0", enabled: true, type: "extension", installType: "normal", mayDisable: true, description: "Protect your browsing with tracker and ad blocking.", icons: [{ size: 48, url: ICONS.shield }], optionsUrl: "chrome-extension://ext_shield/options.html" },
  { id: "ext_markdown", name: "Markdown Preview Pro", version: "2.1.4", enabled: true, type: "extension", installType: "normal", mayDisable: true, description: "Real-time markdown document previewer and exporter.", icons: [{ size: 48, url: ICONS.markdown }], optionsUrl: "chrome-extension://ext_markdown/options.html" },
  { id: "ext_palette", name: "Color Palette Inspector", version: "1.4.2", enabled: false, type: "extension", installType: "normal", mayDisable: true, description: "Inspect and extract web color palettes with one click.", icons: [{ size: 48, url: ICONS.palette }], optionsUrl: "chrome-extension://ext_palette/options.html" },
  { id: "ext_code", name: "Code Snippet Manager", version: "4.0.1", enabled: true, type: "extension", installType: "normal", mayDisable: true, description: "Instant access to personal code templates and snippets.", icons: [{ size: 48, url: ICONS.code }], optionsUrl: "chrome-extension://ext_code/options.html" },
  { id: "ext_react", name: "React Developer Tools Demo", version: "5.2.0", enabled: true, type: "extension", installType: "development", mayDisable: true, description: "Inspect React component hierarchy and state.", icons: [{ size: 48, url: ICONS.react }], optionsUrl: "chrome-extension://ext_react/options.html" },
  { id: "ext_json", name: "JSON Formatter & Viewer", version: "1.8.0", enabled: true, type: "extension", installType: "normal", mayDisable: true, description: "Pretty print and search JSON in the browser.", icons: [{ size: 48, url: ICONS.json }] },
  { id: "ext_sample", name: "Rest Client Tester", version: "2.0.0", enabled: false, type: "extension", installType: "normal", mayDisable: true, description: "Simple HTTP client for API request testing.", icons: [{ size: 48, url: ICONS.sample }], optionsUrl: "chrome-extension://ext_sample/options.html" },
  { id: "ext_utility", name: "Tab Organizer & Stash", version: "1.1.2", enabled: true, type: "extension", installType: "normal", mayDisable: true, description: "Group and save browser tabs for later review.", icons: [{ size: 48, url: ICONS.utility }] },
];

function startStaticServer(port = 8898) {
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
    if (reqUrl === "/") reqUrl = "/src/manager/manager.html";

    // Handle Vite dist structure
    let filePath = path.join(DIST, reqUrl);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST, reqUrl.replace("/src/", "/"));
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end("Not found: " + reqUrl);
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

async function renderPromotionalGraphics(browser) {
  console.log("\n--- [Phase 8] Rendering Store Promotional Graphics ---");
  const page = await browser.newPage();

  // 1. Small Promo Tile (440x280)
  console.log("Generating Small Promo Tile (440x280)...");
  await page.setViewport({ width: 440, height: 280, deviceScaleFactor: 2 });
  const smallPromoHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 440px; height: 280px;
          background: linear-gradient(135deg, #090e1a 0%, #101c36 50%, #0d1629 100%);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative; overflow: hidden;
        }
        .glow {
          position: absolute; width: 340px; height: 220px;
          background: radial-gradient(circle, rgba(26, 115, 232, 0.35) 0%, rgba(26, 115, 232, 0) 70%);
          top: 30px; left: 50px; z-index: 1; pointer-events: none;
        }
        .card-stack {
          position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center;
        }
        .drawer-icon-frame {
          width: 96px; height: 96px; border-radius: 24px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(66, 133, 244, 0.3);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .drawer-icon-frame img { width: 72px; height: 72px; }
        .title {
          font-size: 22px; font-weight: 700; color: #ffffff;
          letter-spacing: -0.02em; margin-bottom: 6px;
        }
        .subtitle {
          font-size: 11px; font-weight: 500; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.12em;
        }
        .pill-row {
          display: flex; gap: 8px; margin-top: 14px;
        }
        .pill {
          padding: 3px 10px; border-radius: 9999px; font-size: 10px; font-weight: 600;
          background: rgba(26, 115, 232, 0.18); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="glow"></div>
      <div class="card-stack">
        <div class="drawer-icon-frame">
          <img src="${iconDataUrl}" />
        </div>
        <div class="title">Extension Drawer</div>
        <div class="subtitle">Extension Manager & Organizer</div>
        <div class="pill-row">
          <span class="pill">Groups</span>
          <span class="pill">Site Rules</span>
          <span class="pill">Dev Tools</span>
        </div>
      </div>
    </body>
    </html>
  `;
  await page.setContent(smallPromoHtml);
  const smallPromoPath = path.join(OUTPUT_DIR, "small-promo-tile-440x280.png");
  await page.screenshot({ path: smallPromoPath, clip: { x: 0, y: 0, width: 440, height: 280 } });
  fs.copyFileSync(smallPromoPath, path.join(REVIEW_DIR, "small-promo-tile-440x280.png"));
  console.log(`  ✓ Created ${smallPromoPath}`);

  // 2. Marquee Promo Tile (1400x560)
  console.log("Generating Marquee Promo Tile (1400x560)...");
  await page.setViewport({ width: 1400, height: 560, deviceScaleFactor: 2 });
  const marqueeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 1400px; height: 560px;
          background: radial-gradient(circle at 75% 40%, #1e293b 0%, #0a0f1d 70%);
          display: flex; align-items: center; justify-content: space-between; padding: 0 100px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative; overflow: hidden;
        }
        .hero-left { max-width: 580px; z-index: 2; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 9999px; background: rgba(37, 99, 235, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.35); color: #60a5fa; font-size: 13px; font-weight: 600;
          margin-bottom: 24px;
        }
        .hero-title {
          font-size: 46px; font-weight: 800; color: #ffffff; line-height: 1.15; letter-spacing: -0.03em;
          margin-bottom: 16px;
        }
        .hero-title span { color: #3b82f6; }
        .hero-desc {
          font-size: 18px; color: #94a3b8; line-height: 1.5; margin-bottom: 32px;
        }
        .feature-pills { display: flex; gap: 10px; }
        .fpill {
          padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
          background: rgba(255, 255, 255, 0.06); color: #e2e8f0; border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .hero-right {
          position: relative; z-index: 2; width: 520px; height: 380px;
          display: flex; align-items: center; justify-content: center;
        }
        .card-preview {
          width: 460px; background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6); padding: 24px;
        }
        .preview-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
        }
        .prev-brand { display: flex; align-items: center; gap: 12px; }
        .prev-brand img { width: 36px; height: 36px; }
        .prev-name { font-size: 18px; font-weight: 700; color: #fff; }
        .status-chip {
          padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;
          background: #dcfce7; color: #15803d;
        }
        .group-demo-row {
          background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px; padding: 14px; display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .group-name { font-size: 14px; font-weight: 600; color: #f1f5f9; }
        .group-meta { font-size: 12px; color: #94a3b8; }
        .seg-btn {
          background: #2563eb; color: #fff; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 6px;
        }
      </style>
    </head>
    <body>
      <div class="hero-left">
        <div class="hero-badge">Manifest V3 · Local First</div>
        <h1 class="hero-title">Your Chrome extensions, <span>effortlessly managed</span>.</h1>
        <p class="hero-desc">One-click bulk group toggles, automatic Site Rules, management audit history, and developer workspace.</p>
        <div class="feature-pills">
          <span class="fpill">⚡ Instant Tile View</span>
          <span class="fpill">🏷️ Command Groups</span>
          <span class="fpill">🌐 Site Rules</span>
          <span class="fpill">🛡️ 100% Private</span>
        </div>
      </div>
      <div class="hero-right">
        <div class="card-preview">
          <div class="preview-header">
            <div class="prev-brand">
              <img src="${iconDataUrl}" />
              <span class="prev-name">Extension Drawer</span>
            </div>
            <span class="status-chip">6 / 8 running</span>
          </div>
          <div class="group-demo-row">
            <div>
              <div class="group-name">Development Stack</div>
              <div class="group-meta">4 extensions · Rule active</div>
            </div>
            <span class="seg-btn">ON</span>
          </div>
          <div class="group-demo-row">
            <div>
              <div class="group-name">Privacy & Security</div>
              <div class="group-meta">2 extensions · Always on</div>
            </div>
            <span class="seg-btn">ON</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  await page.setContent(marqueeHtml);
  const marqueePath = path.join(OUTPUT_DIR, "marquee-promo-tile-1400x560.png");
  await page.screenshot({ path: marqueePath, clip: { x: 0, y: 0, width: 1400, height: 560 } });
  fs.copyFileSync(marqueePath, path.join(REVIEW_DIR, "marquee-promo-tile-1400x560.png"));
  console.log(`  ✓ Created ${marqueePath}`);

  // 3. YouTube Thumbnail (1280x720)
  console.log("Generating YouTube Thumbnail (1280x720)...");
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
  const thumbHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 1280px; height: 720px;
          background: linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e1b4b 100%);
          display: flex; align-items: center; justify-content: space-between; padding: 60px 80px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative; overflow: hidden;
        }
        .thumb-glow {
          position: absolute; width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%);
          top: -100px; left: -100px; pointer-events: none;
        }
        .left-col { max-width: 620px; z-index: 2; }
        .logo-row { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
        .logo-row img { width: 56px; height: 56px; filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4)); }
        .brand-text { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .main-headline {
          font-size: 52px; font-weight: 900; color: #ffffff; line-height: 1.1; letter-spacing: -0.03em;
          margin-bottom: 24px;
        }
        .main-headline .highlight {
          background: linear-gradient(90deg, #38bdf8, #818cf8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .tagline-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 32px; }
        .tpill {
          padding: 8px 18px; border-radius: 9999px; font-size: 14px; font-weight: 700;
          background: rgba(255, 255, 255, 0.08); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .store-badge {
          display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; border-radius: 12px;
          background: #2563eb; color: #fff; font-size: 15px; font-weight: 700;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
        }
        .right-col {
          z-index: 2; width: 440px; height: 500px; display: flex; flex-direction: column; justify-content: center;
        }
        .mock-window {
          background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 18px; padding: 24px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
        }
        .mock-row {
          background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .mock-ext { display: flex; align-items: center; gap: 12px; }
        .mock-ext-name { font-size: 14px; font-weight: 600; color: #fff; }
        .mock-switch-on {
          width: 36px; height: 20px; border-radius: 9999px; background: #3b82f6; position: relative;
        }
        .mock-switch-on::after {
          content: ""; position: absolute; right: 2px; top: 2px; width: 16px; height: 16px;
          border-radius: 50%; background: #fff;
        }
        .mock-switch-off {
          width: 36px; height: 20px; border-radius: 9999px; background: #475569; position: relative;
        }
        .mock-switch-off::after {
          content: ""; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px;
          border-radius: 50%; background: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="thumb-glow"></div>
      <div class="left-col">
        <div class="logo-row">
          <img src="${iconDataUrl}" />
          <span class="brand-text">Extension Drawer</span>
        </div>
        <h1 class="main-headline">Manage <span class="highlight">100+ Chrome Extensions</span></h1>
        <div class="tagline-pills">
          <span class="tpill">🏷️ Groups</span>
          <span class="tpill">🌐 Site Rules</span>
          <span class="tpill">🛠️ Dev Tools</span>
        </div>
        <div class="store-badge">Free on Chrome Web Store</div>
      </div>
      <div class="right-col">
        <div class="mock-window">
          <div style="font-size: 13px; font-weight: 700; color: #94a3b8; margin-bottom: 14px; text-transform: uppercase;">Extension Catalog</div>
          <div class="mock-row">
            <div class="mock-ext">
              <span style="font-size: 18px;">🛡️</span>
              <span class="mock-ext-name">Privacy Shield Pro</span>
            </div>
            <div class="mock-switch-on"></div>
          </div>
          <div class="mock-row">
            <div class="mock-ext">
              <span style="font-size: 18px;">⚛️</span>
              <span class="mock-ext-name">React DevTools Demo</span>
            </div>
            <div class="mock-switch-on"></div>
          </div>
          <div class="mock-row">
            <div class="mock-ext">
              <span style="font-size: 18px;">🎨</span>
              <span class="mock-ext-name">Color Palette Inspector</span>
            </div>
            <div class="mock-switch-off"></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  await page.setContent(thumbHtml);
  const thumbPath = path.join(OUTPUT_DIR, "youtube-thumbnail-1280x720.png");
  await page.screenshot({ path: thumbPath, clip: { x: 0, y: 0, width: 1280, height: 720 } });
  fs.copyFileSync(thumbPath, path.join(REVIEW_DIR, "youtube-thumbnail-1280x720.png"));
  console.log(`  ✓ Created ${thumbPath}`);

  await page.close();
}

async function renderDemoVideos(browser, serverPort) {
  console.log("\n--- [Phase 7] Rendering Promo Videos (60s & 20s) ---");
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // Mock controlled Chrome APIs on window
  await page.evaluateOnNewDocument((exts) => {
    window.__openedTabs = [];
    window.__mockExts = JSON.parse(JSON.stringify(exts));
    window.__mockGrps = [
      {
        id: "grp_dev",
        name: "Development Stack",
        color: "#1a73e8",
        icon: "code",
        extensionIds: ["ext_code", "ext_react", "ext_json", "ext_markdown", "ext_missing_cached"],
        createdAt: Date.now() - 86400000,
      },
      {
        id: "grp_privacy",
        name: "Privacy & Security",
        color: "#059669",
        icon: "shield",
        extensionIds: ["ext_shield"],
        createdAt: Date.now() - 172800000,
      },
    ];
    window.__mockRules = [
      {
        id: "rule_gh",
        name: "GitHub Developer Mode",
        pattern: "github.com",
        scope: "domain",
        timing: "while_open",
        extensionIds: ["ext_react", "ext_code"],
        enabled: true,
      },
    ];
    window.__mockHist = [
      { id: "h1", timestamp: Date.now() - 3600000, event: "enabled", extensionId: "ext_react", extensionName: "React Developer Tools Demo" },
      { id: "h2", timestamp: Date.now() - 7200000, event: "updated", extensionId: "ext_shield", extensionName: "Privacy & Content Shield" },
      { id: "h3", timestamp: Date.now() - 86400000, event: "installed", extensionId: "ext_code", extensionName: "Code Snippet Manager" },
    ];
    window.__mockKnownExts = {
      ext_shield: { id: "ext_shield", name: "Privacy & Content Shield", lastSeenAt: Date.now() },
      ext_markdown: { id: "ext_markdown", name: "Markdown Preview Pro", lastSeenAt: Date.now() },
      ext_missing_cached: { id: "ext_missing_cached", name: "Super Proxy Pro", lastSeenAt: Date.now() - 3600000 },
    };
    window.__mockSettings = {
      viewMode: "tile",
      theme: "light",
      accentPreset: "default",
      accentColor: "#1a73e8",
      sortOrder: "name-state",
      showDeveloperMode: true,
      notificationsEnabled: true,
      maxHistoryRecords: 500,
    };
    window.__mockDevProjects = [
      {
        id: "proj_1",
        name: "Extension Drawer",
        path: "/Users/developer/Projects/Extension-Drawer",
        manifestVersion: 3,
        cwsExtensionId: "onkcjpfgllpfbimnchjehboikhippnka",
        githubRepo: "iknoest/NooBoss-MV3-browser-extension-manager",
        lastReload: Date.now() - 1800000,
      },
    ];
    window.__mockGa4 = {
      activeUsers: 14200,
      newUsers: 3450,
      screenPageViews: 48900,
      engagementRate: 0.76,
      lastFetched: Date.now() - 3600000,
    };

    window.chrome = {
      runtime: {
        id: "mock_extension_drawer_121",
        getManifest: () => ({ version: "1.2.1", name: "Extension Drawer" }),
        getURL: (p) => `http://localhost:8898/${p}`,
        sendMessage: async (msg) => {
          if (!msg) return null;
          if (msg.type === "GET_EXTENSIONS") return window.__mockExts;
          if (msg.type === "GET_GROUPS") return window.__mockGrps;
          if (msg.type === "GET_AUTOSTATE_RULES") return window.__mockRules;
          if (msg.type === "GET_HISTORY") return window.__mockHist;
          if (msg.type === "GET_SETTINGS") return window.__mockSettings;
          if (msg.type === "SAVE_SETTINGS") {
            Object.assign(window.__mockSettings, msg.settings);
            return { success: true };
          }
          if (msg.type === "GET_WELCOME_SEEN") return true;
          if (msg.type === "TOGGLE_EXTENSION") {
            const ext = window.__mockExts.find((e) => e.id === msg.id);
            if (ext) ext.enabled = msg.enabled;
            return { success: true };
          }
          if (msg.type === "OPEN_OPTIONS") {
            window.__openedTabs.push("options.html");
            return { success: true };
          }
          if (msg.type === "OPEN_CHROME_DETAILS") {
            window.__openedTabs.push(`chrome://extensions/?id=${msg.id}`);
            return { success: true };
          }
          if (msg.type === "UPDATE_GROUP") {
            const idx = window.__mockGrps.findIndex((g) => g.id === msg.group.id);
            if (idx >= 0) window.__mockGrps[idx] = msg.group;
            else window.__mockGrps.push(msg.group);
            return { success: true, group: msg.group };
          }
          if (msg.type === "GET_DEVELOPER_PROJECTS") return window.__mockDevProjects;
          if (msg.type === "GET_ALL_GA4_METRICS") return window.__mockGa4;
          if (msg.type === "GET_PENDING_CHANGES") return [];
          if (msg.type === "GET_KNOWN_EXTENSIONS") return window.__mockKnownExts || {};
          return [];
        },
        onMessage: { addListener: () => {}, removeListener: () => {} },
      },
      tabs: {
        create: async (opts) => {
          window.__openedTabs.push(opts.url);
          return { id: 999, url: opts.url };
        },
      },
      management: {
        getSelf: async () => ({
          id: "mock_extension_drawer_121",
          name: "Extension Drawer",
          version: "1.2.1",
          enabled: true,
        }),
        getAll: async () => window.__mockExts,
      },
      storage: {
        local: {
          get: async () => ({}),
          set: async () => {},
        },
      },
    };
  }, sampleExtensions);

  const framesDir = path.join(OUTPUT_DIR, "frames");
  if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  await page.goto(`http://localhost:${serverPort}/src/manager/manager.html`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".tile-grid");

  // Helper to inject lower-third caption overlay
  const setCaption = async (text, subtitle = "") => {
    await page.evaluate((t, s) => {
      let el = document.getElementById("demo-caption-overlay");
      if (!el) {
        el = document.createElement("div");
        el.id = "demo-caption-overlay";
        el.style.position = "fixed";
        el.style.bottom = "42px";
        el.style.left = "50%";
        el.style.transform = "translateX(-50%)";
        el.style.background = "rgba(10, 16, 30, 0.92)";
        el.style.backdropFilter = "blur(16px)";
        el.style.border = "1px solid rgba(255, 255, 255, 0.16)";
        el.style.boxShadow = "0 16px 40px rgba(0, 0, 0, 0.55), 0 0 20px rgba(37, 99, 235, 0.25)";
        el.style.padding = "16px 36px";
        el.style.borderRadius = "9999px";
        el.style.color = "#ffffff";
        el.style.fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";
        el.style.fontSize = "23px";
        el.style.fontWeight = "600";
        el.style.zIndex = "999999";
        el.style.display = "flex";
        el.style.flexDirection = "column";
        el.style.alignItems = "center";
        el.style.gap = "4px";
        el.style.pointerEvents = "none";
        document.body.appendChild(el);
      }
      if (!t) {
        el.style.display = "none";
      } else {
        el.style.display = "flex";
        el.innerHTML = `<span style="display:flex;align-items:center;gap:10px;"><span style="color:#60a5fa;">✦</span> ${t}</span>${s ? `<span style="font-size:14px;color:#94a3b8;font-weight:400;">${s}</span>` : ""}`;
      }
    }, text, subtitle);
  };

  // Helper to inject full-screen title/end cards
  const setFullScreenCard = async (type, title, subtitle, sub2) => {
    await page.evaluate((type, title, subtitle, sub2, icon) => {
      let el = document.getElementById("demo-fullscreen-overlay");
      if (!el) {
        el = document.createElement("div");
        el.id = "demo-fullscreen-overlay";
        el.style.position = "fixed";
        el.style.top = "0"; el.style.left = "0";
        el.style.width = "100vw"; el.style.height = "100vh";
        el.style.background = "radial-gradient(circle at center, #101c36 0%, #070b14 100%)";
        el.style.display = "flex"; el.style.flexDirection = "column";
        el.style.alignItems = "center"; el.style.justifyContent = "center";
        el.style.zIndex = "1000000";
        el.style.fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";
        document.body.appendChild(el);
      }
      if (type === "hide") {
        el.style.display = "none";
        return;
      }
      el.style.display = "flex";
      el.innerHTML = `
        <div style="width:110px;height:110px;border-radius:28px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);box-shadow:0 20px 50px rgba(0,0,0,0.6),0 0 30px rgba(59,130,246,0.4);display:flex;align-items:center;justify-content:center;margin-bottom:28px;">
          <img src="${icon}" style="width:84px;height:84px;" />
        </div>
        <h1 style="font-size:46px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;margin-bottom:14px;text-align:center;">${title}</h1>
        <p style="font-size:22px;color:#94a3b8;font-weight:500;margin-bottom:10px;text-align:center;">${subtitle}</p>
        ${sub2 ? `<p style="font-size:16px;color:#60a5fa;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">${sub2}</p>` : ""}
      `;
    }, type, title, subtitle, sub2, iconDataUrl);
  };

  let frameCount = 0;
  const captureFrame = async () => {
    const framePath = path.join(framesDir, `frame_${String(frameCount).padStart(5, "0")}.jpg`);
    await page.screenshot({ path: framePath, type: "jpeg", quality: 90 });
    frameCount++;
  };

  const captureHold = async (durationSec, fps = 15) => {
    const frames = Math.round(durationSec * fps);
    for (let i = 0; i < frames; i++) {
      await captureFrame();
    }
  };

  console.log("Recording Scene 1: The Hook (0-5s)...");
  await setFullScreenCard("show", "Managing 100 Chrome extensions shouldn't be this hard.", "Extension Drawer brings clarity, control, and automation to your browser.");
  await captureHold(4.5);
  await setFullScreenCard("hide");
  await setCaption("Managing 100 Chrome extensions shouldn't be this hard.");
  await captureHold(0.5);

  console.log("Recording Scene 2: Extension Management & Tile View (5-16s)...");
  await setCaption("Search, sort and control your extensions.", "Compact Tile Grid · Instant Toggles · Live Status");
  await captureHold(2.0);

  // Type in search bar
  const searchInput = await page.$(".search-box input");
  if (searchInput) {
    await searchInput.type("pro", { delay: 150 });
    await captureHold(3.0);
    // Clear search
    await page.evaluate(() => {
      const inp = document.querySelector(".search-box input");
      if (inp) { inp.value = ""; inp.dispatchEvent(new Event("input", { bubbles: true })); }
    });
    await captureHold(1.0);
  }

  // Toggle switch animation
  await page.evaluate(() => {
    const firstSwitch = document.querySelector(".ext-switch input");
    if (firstSwitch) { firstSwitch.click(); }
  });
  await captureHold(2.5);
  await page.evaluate(() => {
    const firstSwitch = document.querySelector(".ext-switch input");
    if (firstSwitch) { firstSwitch.click(); }
  });
  await captureHold(2.5);

  console.log("Recording Scene 3: Command-Based Groups & Missing Safety (16-28s)...");
  await setCaption("Switch whole workflows with one click.", "Real-Time 5/6 Running Counters · Reversible Undo");
  // Click Groups in sidebar navigation
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll(".nav-item"));
    const grp = navItems.find(el => el.textContent.includes("Groups"));
    if (grp) grp.click();
  });
  await captureHold(4.0);

  // Focus Development Stack group card
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".group-card"));
    if (cards[0]) cards[0].click();
  });
  await captureHold(4.0);

  // Trigger Remove and show Undo toast
  await page.evaluate(() => {
    const removeBtn = document.querySelector(".missing-remove-btn");
    if (removeBtn) removeBtn.click();
  });
  await captureHold(4.0);

  console.log("Recording Scene 4: Automate with Site Rules (28-40s)...");
  await setCaption("Only run extensions where you actually need them.", "Site Rules · Temporary While Open Lifecycle · Zero Data Transmission");
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll(".nav-item"));
    const sr = navItems.find(el => el.textContent.includes("Site Rules"));
    if (sr) sr.click();
  });
  await captureHold(5.0);

  // Click Add Rule button
  await page.evaluate(() => {
    const addBtn = document.querySelector(".btn-primary");
    if (addBtn && addBtn.textContent.includes("Rule")) addBtn.click();
  });
  await captureHold(7.0);

  console.log("Recording Scene 5: History & Local Backup Portability (40-48s)...");
  await setCaption("History and portable local backups.", "Comprehensive Audit Trail · Safe CSV Merge · Portable JSON Backups");
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll(".nav-item"));
    const hist = navItems.find(el => el.textContent.includes("History"));
    if (hist) hist.click();
  });
  await captureHold(4.0);

  // Navigate to Options / Backup
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll(".nav-item"));
    const opt = navItems.find(el => el.textContent.includes("Options") || el.textContent.includes("Backup"));
    if (opt) opt.click();
  });
  await captureHold(4.0);

  console.log("Recording Scene 6: Developer Workspace (48-56s)...");
  await setCaption("Built-in tools for extension developers.", "1-Click Code Reload · Store Quicklinks · Read-Only GA4 Listing Metrics");
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll(".nav-item"));
    const dev = navItems.find(el => el.textContent.includes("Developer"));
    if (dev) dev.click();
  });
  await captureHold(8.0);

  console.log("Recording Scene 7: End Card & Call to Action (56-60s)...");
  await setCaption("");
  await setFullScreenCard("show", "Extension Drawer", "Free & Open Source Extension Manager", "Available on Chrome Web Store · GitHub");
  await captureHold(4.0);

  console.log(`Total 60s frames captured: ${frameCount}`);

  // Compile 60s video with ffmpeg
  const output60s = path.join(OUTPUT_DIR, "extension-drawer-demo-60s.mp4");
  console.log(`Compiling 60s MP4: ${output60s}...`);
  execSync(
    `ffmpeg -y -framerate 15 -i "${framesDir}/frame_%05d.jpg" -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -r 30 "${output60s}"`,
    { stdio: "inherit" }
  );
  fs.copyFileSync(output60s, path.join(REVIEW_DIR, "extension-drawer-demo-60s.mp4"));
  console.log(`  ✓ Created 60s MP4 (${(fs.statSync(output60s).size / (1024 * 1024)).toFixed(2)} MB)`);

  // Now compile 20s Social Cut:
  // Sub-sample key sequence: Tile (0-4s) -> Groups (4-8s) -> Site Rules (8-13s) -> Dev Tools (13-17s) -> End Card (17-20s)
  console.log("Compiling 20s Social Cut MP4...");
  const frames20Dir = path.join(OUTPUT_DIR, "frames_20");
  if (fs.existsSync(frames20Dir)) fs.rmSync(frames20Dir, { recursive: true, force: true });
  fs.mkdirSync(frames20Dir, { recursive: true });

  // Map 300 frames from the 60s frame pool:
  // Tile: frames 70 to 130 (60 frames = 4s)
  // Groups: frames 240 to 300 (60 frames = 4s)
  // Site Rules: frames 430 to 505 (75 frames = 5s)
  // Dev Workspace: frames 650 to 710 (60 frames = 4s)
  // End card: frames 855 to 899 (45 frames = 3s)
  let f20Count = 0;
  const copySubRange = (start, end) => {
    for (let f = start; f <= end && f < frameCount; f++) {
      const src = path.join(framesDir, `frame_${String(f).padStart(5, "0")}.jpg`);
      const dst = path.join(frames20Dir, `frame_${String(f20Count).padStart(5, "0")}.jpg`);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
        f20Count++;
      }
    }
  };

  copySubRange(70, 129);  // 60 frames = 4s
  copySubRange(240, 299); // 60 frames = 4s
  copySubRange(430, 504); // 75 frames = 5s
  copySubRange(650, 709); // 60 frames = 4s
  copySubRange(855, 899); // 45 frames = 3s

  const output20s = path.join(OUTPUT_DIR, "extension-drawer-demo-20s.mp4");
  execSync(
    `ffmpeg -y -framerate 15 -i "${frames20Dir}/frame_%05d.jpg" -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -r 30 "${output20s}"`,
    { stdio: "inherit" }
  );
  fs.copyFileSync(output20s, path.join(REVIEW_DIR, "extension-drawer-demo-20s.mp4"));
  console.log(`  ✓ Created 20s Social MP4 (${(fs.statSync(output20s).size / (1024 * 1024)).toFixed(2)} MB)`);

  // Clean up intermediate frames
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.rmSync(frames20Dir, { recursive: true, force: true });

  await page.close();
}

async function main() {
  console.log("================================================================================");
  console.log("  EXTENSION DRAWER 1.2.1 PROMOTIONAL MEDIA PRODUCTION SUITE");
  console.log("================================================================================");

  const server = await startStaticServer(8898);
  console.log("Static server running on port 8898...");

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });

  try {
    await renderPromotionalGraphics(browser);
    await renderDemoVideos(browser, 8898);

    // Copy voiceover script and storyboard to review dir
    fs.copyFileSync(path.join(ROOT, "docs/marketing/video-voiceover-script.md"), path.join(REVIEW_DIR, "video-voiceover-script.md"));
    fs.copyFileSync(path.join(ROOT, "docs/marketing/STORYBOARD.md"), path.join(REVIEW_DIR, "STORYBOARD.md"));

    // Package review ZIP
    console.log("\n--- [Phase 9] Packaging Marketing Review Archive ---");
    const zipPath = "/private/tmp/agent-review/20261010_extension-drawer-1.2.1-marketing-assets.zip";
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    execSync(`cd "${REVIEW_DIR}" && zip -r "${zipPath}" .`, { stdio: "inherit" });
    console.log(`Review Archive created: ${zipPath} (${(fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2)} MB)`);

  } finally {
    await browser.close();
    server.close();
  }

  console.log("\n================================================================================");
  console.log("  ALL MARKETING MEDIA ASSETS PRODUCED AND PACKAGED SUCCESSFULLY!");
  console.log("================================================================================");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
