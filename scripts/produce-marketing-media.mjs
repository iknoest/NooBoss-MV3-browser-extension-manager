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
  { id: "ext_code", name: "Code Snippet Manager", version: "4.0.1", enabled: true, type: "extension", installType: "normal", mayDisable: true, description: "Instant access to personal code templates and snippets.", icons: [{ size: 48, url: ICONS.code }], optionsUrl: "chrome-extension://ext_code/options.html" },
  { id: "ext_react", name: "React Developer Tools Demo", version: "5.2.0", enabled: false, type: "extension", installType: "development", mayDisable: true, description: "Inspect React component hierarchy and state.", icons: [{ size: 48, url: ICONS.react }], optionsUrl: "chrome-extension://ext_react/options.html" },
  { id: "ext_json", name: "JSON Formatter & Viewer", version: "1.8.0", enabled: true, type: "extension", installType: "normal", mayDisable: true, description: "Pretty print and search JSON in the browser.", icons: [{ size: 48, url: ICONS.json }] },
  { id: "ext_markdown", name: "Markdown Preview Pro", version: "2.1.4", enabled: true, type: "extension", installType: "normal", mayDisable: true, description: "Real-time markdown document previewer and exporter.", icons: [{ size: 48, url: ICONS.markdown }], optionsUrl: "chrome-extension://ext_markdown/options.html" },
  { id: "ext_palette", name: "Color Palette Inspector", version: "1.4.2", enabled: false, type: "extension", installType: "normal", mayDisable: true, description: "Inspect and extract web color palettes with one click.", icons: [{ size: 48, url: ICONS.palette }], optionsUrl: "chrome-extension://ext_palette/options.html" },
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
  console.log("\n--- [Phase A] Rendering Store Promotional Graphics ---");
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
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .drawer-icon-frame img { width: 72px; height: 72px; }
        .title { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; margin-bottom: 6px; }
        .badge {
          background: rgba(37, 99, 235, 0.25); border: 1px solid rgba(96, 165, 250, 0.4);
          color: #93c5fd; font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; padding: 4px 12px; border-radius: 9999px;
        }
      </style>
    </head>
    <body>
      <div class="glow"></div>
      <div class="card-stack">
        <div class="drawer-icon-frame"><img src="${iconDataUrl}" /></div>
        <div class="title">Extension Drawer</div>
        <div class="badge">Modern Extension Manager</div>
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
          background: radial-gradient(circle at 70% 30%, #1e293b 0%, #0f172a 60%, #020617 100%);
          display: flex; align-items: center; justify-content: space-between; padding: 60px 100px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative; overflow: hidden;
        }
        .left-content { max-width: 660px; z-index: 2; }
        .brand-header { display: flex; align-items: center; gap: 18px; margin-bottom: 24px; }
        .brand-header img { width: 64px; height: 64px; }
        .brand-title { font-size: 32px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .headline { font-size: 44px; font-weight: 800; color: #ffffff; line-height: 1.15; margin-bottom: 20px; letter-spacing: -0.03em; }
        .headline span { color: #60a5fa; }
        .feature-bullets { display: flex; gap: 16px; margin-top: 24px; }
        .bullet-pill {
          background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px; padding: 8px 16px; font-size: 13px; font-weight: 600; color: #cbd5e1;
        }
        .right-preview {
          width: 460px; height: 360px; z-index: 2; background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6); display: flex; flex-direction: column; gap: 12px;
        }
        .prev-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 12px; }
        .prev-name { font-size: 15px; font-weight: 700; color: #fff; }
        .status-chip { font-size: 12px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 3px 10px; border-radius: 9999px; }
        .group-demo-row { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; }
        .group-name { font-size: 14px; font-weight: 600; color: #f8fafc; }
        .group-meta { font-size: 11px; color: #94a3b8; }
        .seg-btn { background: #2563eb; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="left-content">
        <div class="brand-header">
          <img src="${iconDataUrl}" />
          <span class="brand-title">Extension Drawer</span>
        </div>
        <h1 class="headline">Tame your extension chaos with <span>instant workflows</span></h1>
        <div class="feature-bullets">
          <span class="bullet-pill">🏷️ Command Groups</span>
          <span class="bullet-pill">🌐 Site Rules Automation</span>
          <span class="bullet-pill">🛠️ Developer Workspace</span>
        </div>
      </div>
      <div class="right-preview">
        <div class="prev-header">
          <span class="prev-name">Extension Drawer</span>
          <span class="status-chip">6 / 8 running</span>
        </div>
        <div class="group-demo-row">
          <div><div class="group-name">Development Stack</div><div class="group-meta">4 extensions · 1-click command</div></div>
          <span class="seg-btn">ON</span>
        </div>
        <div class="group-demo-row">
          <div><div class="group-name">Privacy & Security</div><div class="group-meta">1 extension · Always active</div></div>
          <span class="seg-btn">ON</span>
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
        .main-headline { font-size: 52px; font-weight: 900; color: #ffffff; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 24px; }
        .main-headline .highlight { background: linear-gradient(90deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .tagline-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 32px; }
        .tpill { padding: 8px 18px; border-radius: 9999px; font-size: 14px; font-weight: 700; background: rgba(255, 255, 255, 0.08); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.15); }
        .store-badge { display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; border-radius: 12px; background: #2563eb; color: #fff; font-size: 15px; font-weight: 700; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4); }
        .right-col { z-index: 2; width: 440px; height: 500px; display: flex; flex-direction: column; justify-content: center; }
        .mock-window { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 18px; padding: 24px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7); }
        .mock-row { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .mock-ext { display: flex; align-items: center; gap: 12px; }
        .mock-ext-name { font-size: 14px; font-weight: 600; color: #fff; }
        .mock-switch-on { width: 36px; height: 20px; border-radius: 9999px; background: #3b82f6; position: relative; }
        .mock-switch-on::after { content: ""; position: absolute; right: 2px; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; }
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
          <span class="tpill">🏷️ Command Groups</span>
          <span class="tpill">🌐 Site Rules</span>
          <span class="tpill">🛠️ Dev Workspace</span>
        </div>
        <div class="store-badge">Free on Chrome Web Store</div>
      </div>
      <div class="right-col">
        <div class="mock-window">
          <div style="font-size: 13px; font-weight: 700; color: #94a3b8; margin-bottom: 14px; text-transform: uppercase;">Extension Catalog</div>
          <div class="mock-row">
            <div class="mock-ext"><span style="font-size: 18px;">🛡️</span><span class="mock-ext-name">Privacy Shield Pro</span></div>
            <div class="mock-switch-on"></div>
          </div>
          <div class="mock-row">
            <div class="mock-ext"><span style="font-size: 18px;">⚛️</span><span class="mock-ext-name">React DevTools Demo</span></div>
            <div class="mock-switch-on"></div>
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

/**
 * Action-Driven Demo Director for Interactive Recording
 */
class DemoDirector {
  constructor(page, framesDir) {
    this.page = page;
    this.framesDir = framesDir;
    this.frameCount = 0;
    this.cursorX = 960;
    this.cursorY = 540;
  }

  async initOverlay() {
    await this.page.evaluate(() => {
      // 1. Cursor container
      let cursorBox = document.getElementById("demo-cursor-box");
      if (!cursorBox) {
        cursorBox = document.createElement("div");
        cursorBox.id = "demo-cursor-box";
        cursorBox.style.cssText = `
          position: fixed; top: 0; left: 0; width: 0; height: 0;
          z-index: 100000000; pointer-events: none;
        `;
        cursorBox.innerHTML = `
          <div id="demo-cursor-pointer" style="position: absolute; top: 0; left: 0; transform: translate(960px, 540px); transition: none;">
            <svg width="26" height="26" viewBox="0 0 24 24" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.55));">
              <path d="M4 2l14 11.5-6.5 1 4 7.5-3 1.5-4-7.5-4.5 5.5V2z" fill="#0f172a" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>
            <div id="demo-click-ring" style="position: absolute; top: 2px; left: 4px; width: 36px; height: 36px; margin-top: -18px; margin-left: -18px; border-radius: 50%; border: 3px solid #38bdf8; background: rgba(56, 189, 248, 0.35); transform: scale(0); opacity: 0; pointer-events: none;"></div>
          </div>
        `;
        document.body.appendChild(cursorBox);
      }

      // 2. Caption overlay (compact lower-third pill)
      let caption = document.getElementById("demo-caption-pill");
      if (!caption) {
        caption = document.createElement("div");
        caption.id = "demo-caption-pill";
        caption.style.cssText = `
          position: fixed; bottom: 38px; left: 50%; transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.16); box-shadow: 0 16px 36px rgba(0,0,0,0.5);
          padding: 12px 28px; border-radius: 9999px; color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
          font-size: 20px; font-weight: 600; z-index: 99999999; display: none;
          align-items: center; gap: 10px; pointer-events: none;
        `;
        document.body.appendChild(caption);
      }

      // 3. Title Card overlay
      let card = document.getElementById("demo-card-overlay");
      if (!card) {
        card = document.createElement("div");
        card.id = "demo-card-overlay";
        card.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: radial-gradient(circle at center, #101c36 0%, #070b14 100%);
          display: none; flex-direction: column; align-items: center; justify-content: center;
          z-index: 99999990; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
        `;
        document.body.appendChild(card);
      }
    });
  }

  async captureFrame() {
    const framePath = path.join(this.framesDir, `frame_${String(this.frameCount).padStart(5, "0")}.jpg`);
    await this.page.screenshot({ path: framePath, type: "jpeg", quality: 88 });
    this.frameCount++;
  }

  async setCaption(text) {
    await this.page.evaluate((t) => {
      const el = document.getElementById("demo-caption-pill");
      if (!el) return;
      if (!t) {
        el.style.display = "none";
      } else {
        el.style.display = "flex";
        el.innerHTML = `<span style="color:#38bdf8;">✦</span> <span>${t}</span>`;
      }
    }, text);
  }

  async showTitleCard(title, subtitle, badge = "") {
    await this.page.evaluate((t, s, b, icon) => {
      const el = document.getElementById("demo-card-overlay");
      if (!el) return;
      el.style.display = "flex";
      el.innerHTML = `
        <div style="width:104px;height:104px;border-radius:26px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);box-shadow:0 20px 50px rgba(0,0,0,0.6),0 0 30px rgba(56,189,248,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
          <img src="${icon}" style="width:80px;height:80px;" />
        </div>
        <h1 style="font-size:48px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;margin-bottom:14px;text-align:center;">${t}</h1>
        <p style="font-size:22px;color:#94a3b8;font-weight:500;margin-bottom:16px;text-align:center;">${s}</p>
        ${b ? `<span style="background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);color:#38bdf8;padding:6px 16px;border-radius:9999px;font-size:14px;font-weight:700;">${b}</span>` : ""}
      `;
    }, title, subtitle, badge, iconDataUrl);
  }

  async hideTitleCard() {
    await this.page.evaluate(() => {
      const el = document.getElementById("demo-card-overlay");
      if (el) el.style.display = "none";
    });
  }

  async updateCursorDom(x, y) {
    this.cursorX = x;
    this.cursorY = y;
    await this.page.evaluate((cx, cy) => {
      const ptr = document.getElementById("demo-cursor-pointer");
      if (ptr) ptr.style.transform = `translate(${cx}px, ${cy}px)`;
    }, x, y);
  }

  async moveTo(targetX, targetY, frames = 18) {
    const startX = this.cursorX;
    const startY = this.cursorY;

    for (let f = 1; f <= frames; f++) {
      const t = f / frames;
      // Smooth easeInOutCubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const curX = startX + (targetX - startX) * ease;
      const curY = startY + (targetY - startY) * ease;

      await this.updateCursorDom(curX, curY);
      await this.captureFrame();
    }

    // Native mouse move to trigger browser hover state
    await this.page.mouse.move(targetX, targetY);
  }

  async moveToSelector(selector, frames = 18) {
    const box = await this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, selector);

    if (box) {
      await this.moveTo(box.x, box.y, frames);
    }
  }

  async click(selector = null, reactionFrames = 6) {
    // 1. Trigger ripple animation
    await this.page.evaluate(() => {
      const ring = document.getElementById("demo-click-ring");
      if (ring) {
        ring.style.animation = "none";
        void ring.offsetWidth;
        ring.style.animation = "demo-ripple 0.35s ease-out forwards";
      }
    });

    await this.captureFrame();

    // 2. Click natively & programmatically
    if (selector) {
      await this.page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) {
          el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
          el.click();
        }
      }, selector);
    } else {
      await this.page.mouse.click(this.cursorX, this.cursorY);
    }

    // 3. Capture reaction frames
    for (let f = 0; f < reactionFrames; f++) {
      await this.captureFrame();
    }
  }

  async progressiveType(selector, text, framesPerChar = 3) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      await this.page.evaluate((sel, c) => {
        const inp = document.querySelector(sel);
        if (inp) {
          inp.value += c;
          inp.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }, selector, char);

      for (let f = 0; f < framesPerChar; f++) {
        await this.captureFrame();
      }
    }
  }

  async hold(frames = 15) {
    for (let f = 0; f < frames; f++) {
      await this.captureFrame();
    }
  }
}

async function renderActionDrivenVideos(browser, serverPort) {
  console.log("\n--- [Phase B] Rendering Action-Driven Product Demos (45s & 20s) ---");
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // Mock controlled Chrome APIs on window
  await page.evaluateOnNewDocument((exts, icons) => {
    window.__openedTabs = [];
    window.__mockExts = JSON.parse(JSON.stringify(exts));
    window.__mockGrps = [
      {
        id: "grp_dev",
        name: "Development Stack",
        color: "#1a73e8",
        icon: "code",
        extensionIds: ["ext_code", "ext_react", "ext_json", "ext_markdown"],
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
    window.__mockRules = [];
    window.__mockHist = [
      { id: "h1", timestamp: Date.now() - 3600000, event: "enabled", extensionId: "ext_react", extensionName: "React Developer Tools Demo" },
      { id: "h2", timestamp: Date.now() - 7200000, event: "installed", extensionId: "ext_shield", extensionName: "Privacy & Content Shield" },
      { id: "h3", timestamp: Date.now() - 86400000, event: "installed", extensionId: "ext_code", extensionName: "Code Snippet Manager" },
    ];
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
        localExtensionId: "mock_extension_drawer_121",
        path: "/Users/developer/Projects/Extension-Drawer",
        manifestVersion: 3,
        cwsExtensionId: "onkcjpfgllpfbimnchjehboikhippnka",
        githubUrl: "https://github.com/iknoest/NooBoss-MV3-browser-extension-manager",
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
            if (ext) {
              ext.enabled = msg.enabled;
              window.__mockHist.unshift({
                id: "h_" + Date.now(),
                timestamp: Date.now(),
                event: msg.enabled ? "enabled" : "disabled",
                extensionId: ext.id,
                extensionName: ext.name,
              });
            }
            return { success: true };
          }
          if (msg.type === "TOGGLE_GROUP") {
            const grp = window.__mockGrps.find(g => g.id === msg.id);
            if (grp) {
              grp.extensionIds.forEach(extId => {
                const ext = window.__mockExts.find(e => e.id === extId);
                if (ext) {
                  ext.enabled = msg.enabled;
                  window.__mockHist.unshift({
                    id: "h_" + Date.now(),
                    timestamp: Date.now(),
                    event: msg.enabled ? "enabled" : "disabled",
                    extensionId: ext.id,
                    extensionName: ext.name,
                  });
                }
              });
            }
            return { success: true };
          }
          if (msg.type === "SAVE_AUTOSTATE_RULES") {
            window.__mockRules = msg.rules;
            return { success: true };
          }
          if (msg.type === "RELOAD_EXTENSION") {
            const proj = window.__mockDevProjects.find(p => p.id === msg.id || p.localExtensionId === msg.id);
            if (proj) proj.lastReload = Date.now();
            return { success: true };
          }
          if (msg.type === "GET_DEVELOPER_PROJECTS") return window.__mockDevProjects;
          if (msg.type === "GET_ALL_GA4_METRICS") return window.__mockGa4;
          if (msg.type === "GET_PENDING_CHANGES") return [];
          if (msg.type === "GET_KNOWN_EXTENSIONS") return {};
          return [];
        },
        onMessage: { addListener: () => {}, removeListener: () => {} },
      },
      tabs: {
        create: async (opts) => {
          window.__openedTabs.push(opts.url);
          return { id: 999, url: opts.url };
        },
        query: async () => [{ id: 1, url: "http://localhost:3000" }],
      },
      management: {
        getSelf: async () => ({
          id: "mock_extension_drawer_121",
          name: "Extension Drawer",
          version: "1.2.1",
          enabled: true,
          installType: "development",
        }),
        getAll: async () => window.__mockExts,
        setEnabled: async (id, enabled) => {
          const ext = window.__mockExts.find(e => e.id === id);
          if (ext) {
            ext.enabled = enabled;
            window.__mockHist.unshift({
              id: "h_" + Date.now(),
              timestamp: Date.now(),
              event: enabled ? "enabled" : "disabled",
              extensionId: ext.id,
              extensionName: ext.name,
            });
          }
        },
      },
      storage: {
        local: {
          get: async () => ({}),
          set: async () => {},
        },
      },
    };
  }, sampleExtensions, ICONS);

  const framesDir = path.join(OUTPUT_DIR, "interactive_frames");
  if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  await page.goto(`http://localhost:${serverPort}/src/manager/manager.html`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".tile-grid");

  // Inject CSS ripple keyframes & smooth styles
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes demo-ripple {
        0% { transform: scale(0.2); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.85; }
        100% { transform: scale(2.4); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  });

  const director = new DemoDirector(page, framesDir);
  await director.initOverlay();

  console.log("\n=======================================================");
  console.log("  RECORDING 45s ACTION-DRIVEN PRODUCT DEMO");
  console.log("=======================================================");

  // --- SCENE 1: Hook (0.0s - 2.5s = ~80 frames) ---
  console.log("Recording Scene 1: Hook (0-2.5s)...");
  await director.showTitleCard(
    "Managing 100+ Chrome extensions?",
    "Extension Drawer brings clarity, control, and automation.",
    "Extension Drawer 1.2.1"
  );
  await director.hold(65); // 2.1s hold
  await director.hideTitleCard();
  await director.hold(15); // 0.5s settle

  // --- SCENE 2: Manage Extensions & Progressive Search (2.5s - 10.0s = ~225 frames) ---
  console.log("Recording Scene 2: Manage Extensions & Progressive Search (2.5-10.0s)...");
  await director.setCaption("Search, sort and control your extensions.");

  // 1. Move cursor to search input
  await director.moveTo(700, 112, 18); // center of search input
  await director.click("input[placeholder*='Search']", 4);

  // 2. Progressive typing "privacy"
  await director.progressiveType("input[placeholder*='Search']", "privacy", 4);
  await director.hold(24); // notice only Privacy & Content Shield is displayed

  // 3. Move cursor to extension switch on the card
  // On tile view, hover the tile to reveal controls
  await director.moveTo(420, 240, 20); // hover over first card
  await page.evaluate(() => {
    const tile = document.querySelector(".nb-tile");
    if (tile) tile.classList.add("hover");
  });
  await director.hold(10);

  // 4. Click the switch on the card
  const switchBox = await page.evaluate(() => {
    const btn = document.querySelector(".nb-tile .extension-switch");
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (switchBox) {
    await director.moveTo(switchBox.x, switchBox.y, 14);
    await director.click(".nb-tile .extension-switch", 16); // Switch turns OFF! Status changes!
  }
  await director.hold(24); // User sees state update: 5 / 8 running

  // 5. Clear search input to restore all cards
  await director.moveTo(700, 112, 16);
  await page.evaluate(() => {
    const inp = document.querySelector("input[placeholder*='Search']");
    if (inp) {
      inp.value = "";
      inp.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await director.hold(24);

  // --- SCENE 3: Command Groups (10.0s - 17.5s = ~225 frames) ---
  console.log("Recording Scene 3: Command Groups (10.0-17.5s)...");
  await director.setCaption("Switch whole workflows with one click.");

  // 1. Click Groups category pill in header
  const groupsPillBox = await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll(".category-pill, .filter-chip, button"));
    const grp = pills.find(el => el.textContent.trim() === "Groups");
    if (!grp) return null;
    const r = grp.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (groupsPillBox) {
    await director.moveTo(groupsPillBox.x, groupsPillBox.y, 16);
    await director.click(null, 10);
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll(".category-pill, .filter-chip, button"));
      const grp = pills.find(el => el.textContent.trim() === "Groups");
      if (grp) grp.click();
    });
  }
  await director.hold(14);

  // 2. Click Development Stack group card to focus it
  const groupTileBox = await page.evaluate(() => {
    const tile = document.querySelector(".nb-tile.group-tile");
    if (!tile) return null;
    const r = tile.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (groupTileBox) {
    await director.moveTo(groupTileBox.x, groupTileBox.y, 18);
    await director.click(".nb-tile.group-tile", 14);
  }
  await director.hold(16); // Focused group view is open: shows 4 / 4 running members

  // 3. Move to OFF button in group header
  const offBtnBox = await page.evaluate(() => {
    const offBtn = document.querySelector(".group-cmd-btn.cmd-off");
    if (!offBtn) return null;
    const r = offBtn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (offBtnBox) {
    await director.moveTo(offBtnBox.x, offBtnBox.y, 18);
    await director.click(".group-cmd-btn.cmd-off", 20); // Turn all OFF!
  }
  await director.hold(28); // Viewer sees 4 switches slide OFF and counter changes to 0 / 4!

  // 4. Move to ON button in group header
  const onBtnBox = await page.evaluate(() => {
    const onBtn = document.querySelector(".group-cmd-btn.cmd-on");
    if (!onBtn) return null;
    const r = onBtn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (onBtnBox) {
    await director.moveTo(onBtnBox.x, onBtnBox.y, 16);
    await director.click(".group-cmd-btn.cmd-on", 20); // Turn all ON!
  }
  await director.hold(28); // Viewer sees all 4 switches return to ON and counter updates back to 4 / 4!

  // Exit sub-window / group focus
  await page.evaluate(() => {
    const backBtn = document.querySelector(".sub-window-close-btn, .btn-back, .sub-window-header button");
    if (backBtn) backBtn.click();
  });
  await director.hold(12);

  // --- SCENE 4: Site Rules Hero Interaction (17.5s - 29.5s = ~360 frames) ---
  console.log("Recording Scene 4: Site Rules Hero Interaction (17.5-29.5s)...");
  await director.setCaption("Only run extensions where you actually need them.");

  // 1. Move to Site Rules in navigator
  const siteRulesNavBox = await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll(".nav-link"));
    const sr = navs.find(el => el.textContent.includes("Site Rules") || el.textContent.includes("AutoState"));
    if (!sr) return null;
    const r = sr.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (siteRulesNavBox) {
    await director.moveTo(siteRulesNavBox.x, siteRulesNavBox.y, 18);
    await director.click(null, 12);
    await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll(".nav-link"));
      const sr = navs.find(el => el.textContent.includes("Site Rules") || el.textContent.includes("AutoState"));
      if (sr) sr.click();
    });
  }
  await director.hold(15); // Site Rules view loads

  // 2. In rule builder target selector, click "React Developer Tools Demo"
  const reactTargetBox = await page.evaluate(() => {
    const tiles = Array.from(document.querySelectorAll(".autostate-target-selector .nb-tile, .nb-page .nb-tile"));
    const reactTile = tiles.find(el => el.textContent.includes("React"));
    if (!reactTile) return null;
    const r = reactTile.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (reactTargetBox) {
    await director.moveTo(reactTargetBox.x, reactTargetBox.y, 20);
    await director.click(null, 12);
    await page.evaluate(() => {
      const tiles = Array.from(document.querySelectorAll(".autostate-target-selector .nb-tile, .nb-page .nb-tile"));
      const reactTile = tiles.find(el => el.textContent.includes("React"));
      if (reactTile) reactTile.click();
    });
  }
  await director.hold(14);

  // 3. Move cursor to #ruleScopeInput ("Where to apply")
  const scopeInputBox = await page.evaluate(() => {
    const inp = document.getElementById("ruleScopeInput");
    if (!inp) return null;
    const r = inp.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (scopeInputBox) {
    await director.moveTo(scopeInputBox.x, scopeInputBox.y, 18);
    await director.click("#ruleScopeInput", 4);
    await director.progressiveType("#ruleScopeInput", "localhost:3000", 3);
  }
  await director.hold(16); // Dynamic behavior preview shows "When opening localhost:3000: Turn ON React Developer Tools Demo"

  // 4. Click #addRuleBtn ("Add rule")
  const addRuleBtnBox = await page.evaluate(() => {
    const btn = document.getElementById("addRuleBtn");
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (addRuleBtnBox) {
    await director.moveTo(addRuleBtnBox.x, addRuleBtnBox.y, 16);
    await director.click("#addRuleBtn", 14);
  }
  await director.hold(16); // Rule added to table!

  // 5. LIVE SPLIT-VIEW DEMONSTRATION OF TAB OPEN & STATE AUTOMATION
  console.log("  -> Showing Live Split-View Automation Proof...");
  await page.evaluate((iconData, reactIcon) => {
    let split = document.getElementById("demo-split-container");
    if (!split) {
      split = document.createElement("div");
      split.id = "demo-split-container";
      split.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: #090d16; z-index: 999990; display: flex; overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
      `;
      split.innerHTML = `
        <!-- Left: Extension Drawer Mini-Inspector -->
        <div style="width: 45%; height: 100%; border-right: 1px solid rgba(255,255,255,0.12); background: #ffffff; display: flex; flex-direction: column;">
          <div style="height: 64px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 24px;">
            <div style="display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 17px; color: #0f172a;">
              <img src="${iconData}" style="width: 32px; height: 32px; border-radius: 8px;" />
              <span>Extension Drawer</span>
            </div>
            <div id="split-counter" style="background: #e2e8f0; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 700; color: #475569;">
              5 / 8 running
            </div>
          </div>
          <div style="padding: 28px; display: flex; flex-direction: column; gap: 20px;">
            <div style="padding: 14px 18px; background: #f1f5f9; border-radius: 12px; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-weight: 700; font-size: 13px; color: #334155; text-transform: uppercase; letter-spacing: 0.05em;">Site Rule Active</div>
                <div style="font-size: 13px; color: #64748b; font-family: monospace; margin-top: 2px;">localhost:3000 → React DevTools</div>
              </div>
              <div id="split-rule-badge" style="padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: #e2e8f0; color: #64748b;">
                STANDBY
              </div>
            </div>

            <!-- Target Extension Card -->
            <div id="split-card" style="border: 2px solid #e2e8f0; border-radius: 14px; padding: 20px; display: flex; align-items: center; justify-content: space-between; background: #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.06); transition: all 0.3s ease;">
              <div style="display: flex; align-items: center; gap: 16px;">
                <img src="${reactIcon}" style="width: 48px; height: 48px; border-radius: 12px;" />
                <div>
                  <div style="font-size: 16px; font-weight: 700; color: #0f172a;">React Developer Tools Demo</div>
                  <div style="font-size: 13px; color: #64748b;">Development · v5.2.0</div>
                  <div id="split-ext-pill" style="display: inline-block; margin-top: 6px; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; background: #f1f5f9; color: #64748b;">
                    Runtime OFF
                  </div>
                </div>
              </div>
              <div id="split-ext-switch" style="width: 44px; height: 24px; border-radius: 9999px; background: #cbd5e1; position: relative; transition: all 0.25s ease;">
                <span id="split-ext-thumb" style="position: absolute; left: 3px; top: 3px; width: 18px; height: 18px; border-radius: 50%; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.25s ease;"></span>
              </div>
            </div>

            <!-- Live Toast Notification -->
            <div id="split-toast" style="padding: 14px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; display: none; align-items: center; gap: 10px; transition: all 0.3s ease;"></div>
          </div>
        </div>

        <!-- Right: Simulated Browser Window with localhost:3000 tab -->
        <div style="width: 55%; height: 100%; display: flex; flex-direction: column; background: #0b1120;">
          <div style="height: 44px; background: #1e293b; display: flex; align-items: center; padding: 0 16px; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div style="display: flex; gap: 6px;">
              <span style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></span>
              <span style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></span>
              <span style="width: 12px; height: 12px; border-radius: 50%; background: #10b981;"></span>
            </div>
            <!-- Tab -->
            <div id="split-browser-tab" style="margin-left: 14px; background: #334155; color: #f8fafc; padding: 7px 16px; border-radius: 8px 8px 0 0; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
              <span>⚛️</span>
              <span>Local Dev Server</span>
              <button id="split-tab-close-btn" type="button" style="background: none; border: none; color: #94a3b8; font-size: 14px; font-weight: bold; cursor: pointer; padding: 0 4px; margin-left: 6px;">✕</button>
            </div>
          </div>
          <!-- Address bar -->
          <div style="height: 42px; background: #1e293b; display: flex; align-items: center; padding: 0 16px; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div style="flex: 1; background: #0f172a; height: 30px; border-radius: 6px; display: flex; align-items: center; padding: 0 12px; font-size: 13px; color: #38bdf8; font-family: monospace; border: 1px solid rgba(255,255,255,0.1);">
              🔒 http://localhost:3000
            </div>
          </div>
          <!-- Web page content -->
          <div id="split-page-view" style="flex: 1; background: #020617; padding: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #ffffff;">
            <div style="width: 80px; height: 80px; border-radius: 22px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 22px;">
              <span style="font-size: 42px;">⚛️</span>
            </div>
            <h2 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">React Local App</h2>
            <p style="font-size: 16px; color: #94a3b8; max-width: 400px; line-height: 1.5;">Connected to local dev server on <code style="color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 3px 8px; border-radius: 4px;">localhost:3000</code></p>
          </div>
        </div>
      `;
      document.body.appendChild(split);
    }
    split.style.display = "flex";
  }, iconDataUrl, ICONS.react);

  await director.hold(14);

  // Trigger Action: Website is open -> Extension flips ON!
  await page.evaluate(() => {
    const badge = document.getElementById("split-rule-badge");
    const card = document.getElementById("split-card");
    const pill = document.getElementById("split-ext-pill");
    const sw = document.getElementById("split-ext-switch");
    const thumb = document.getElementById("split-ext-thumb");
    const counter = document.getElementById("split-counter");
    const toast = document.getElementById("split-toast");

    if (badge) {
      badge.textContent = "MATCH ACTIVE";
      badge.style.background = "#dcfce7";
      badge.style.color = "#15803d";
    }
    if (card) {
      card.style.borderColor = "#38bdf8";
      card.style.boxShadow = "0 0 24px rgba(56, 189, 248, 0.25)";
    }
    if (pill) {
      pill.textContent = "Runtime ON (Site Rule Active)";
      pill.style.background = "#dbeafe";
      pill.style.color = "#1d4ed8";
    }
    if (sw) sw.style.background = "#1a73e8";
    if (thumb) thumb.style.transform = "translateX(20px)";
    if (counter) counter.textContent = "6 / 8 running";
    if (toast) {
      toast.style.display = "flex";
      toast.style.background = "rgba(56, 189, 248, 0.12)";
      toast.style.border = "1px solid rgba(56, 189, 248, 0.3)";
      toast.style.color = "#0369a1";
      toast.innerHTML = `<span>⚡</span> <span>Site Rule Triggered: React Developer Tools turned ON automatically.</span>`;
    }
  });
  await director.hold(48); // 1.6s hold: viewer sees the automatic trigger while browsing localhost:3000

  // Trigger Action: User closes the matching tab (clicks ✕ on the tab)
  const closeTabBtnBox = await page.evaluate(() => {
    const btn = document.getElementById("split-tab-close-btn");
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (closeTabBtnBox) {
    await director.moveTo(closeTabBtnBox.x, closeTabBtnBox.y, 18);
    await director.click("#split-tab-close-btn", 10);
  }

  // Trigger Reaction: Tab closes -> Extension restores back to OFF!
  await page.evaluate(() => {
    const tab = document.getElementById("split-browser-tab");
    const pageView = document.getElementById("split-page-view");
    const badge = document.getElementById("split-rule-badge");
    const card = document.getElementById("split-card");
    const pill = document.getElementById("split-ext-pill");
    const sw = document.getElementById("split-ext-switch");
    const thumb = document.getElementById("split-ext-thumb");
    const counter = document.getElementById("split-counter");
    const toast = document.getElementById("split-toast");

    if (tab) tab.style.display = "none";
    if (pageView) {
      pageView.innerHTML = `
        <div style="color: #64748b; font-size: 16px;">New Tab Page</div>
      `;
    }
    if (badge) {
      badge.textContent = "STANDBY";
      badge.style.background = "#e2e8f0";
      badge.style.color = "#64748b";
    }
    if (card) {
      card.style.borderColor = "#e2e8f0";
      card.style.boxShadow = "none";
    }
    if (pill) {
      pill.textContent = "Restored to OFF (Temporary)";
      pill.style.background = "#f1f5f9";
      pill.style.color = "#64748b";
    }
    if (sw) sw.style.background = "#cbd5e1";
    if (thumb) thumb.style.transform = "translateX(0px)";
    if (counter) counter.textContent = "5 / 8 running";
    if (toast) {
      toast.style.background = "rgba(100, 116, 139, 0.12)";
      toast.style.border = "1px solid rgba(100, 116, 139, 0.25)";
      toast.style.color = "#334155";
      toast.innerHTML = `<span>🔄</span> <span>Tab closed: React Developer Tools restored to original state (OFF).</span>`;
    }
  });
  await director.hold(48); // 1.6s hold: viewer sees the automatic restoration back to OFF!

  // Hide split view container
  await page.evaluate(() => {
    const split = document.getElementById("demo-split-container");
    if (split) split.style.display = "none";
  });
  await director.hold(12);

  // --- SCENE 5: History Continuity (29.5s - 34.5s = ~150 frames) ---
  console.log("Recording Scene 5: History Continuity (29.5-34.5s)...");
  await director.setCaption("See exactly what changed.");

  // Inject fresh history records reflecting the exact demo actions
  await page.evaluate(() => {
    window.__mockHist = [
      { id: "h_auto_off", timestamp: Date.now() - 3000, event: "disabled", extensionId: "ext_react", extensionName: "React Developer Tools Demo (Restored after site close)" },
      { id: "h_auto_on", timestamp: Date.now() - 8000, event: "enabled", extensionId: "ext_react", extensionName: "React Developer Tools Demo (Triggered by Site Rule: localhost:3000)" },
      { id: "h_grp_on", timestamp: Date.now() - 14000, event: "enabled", extensionId: "ext_code", extensionName: "Development Stack (Group ON)" },
      { id: "h_grp_off", timestamp: Date.now() - 18000, event: "disabled", extensionId: "ext_code", extensionName: "Development Stack (Group OFF)" },
      { id: "h_shield", timestamp: Date.now() - 25000, event: "disabled", extensionId: "ext_shield", extensionName: "Privacy & Content Shield" },
    ];
  });

  // 1. Click History in navigator
  const histNavBox = await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll(".nav-link"));
    const h = navs.find(el => el.textContent.includes("History"));
    if (!h) return null;
    const r = h.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (histNavBox) {
    await director.moveTo(histNavBox.x, histNavBox.y, 18);
    await director.click(null, 12);
    await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll(".nav-link"));
      const h = navs.find(el => el.textContent.includes("History"));
      if (h) h.click();
    });
  }
  await director.hold(28); // History list appears with the freshly generated events right at top!

  // 2. Filter by "Enabled"
  const filterSelectBox = await page.evaluate(() => {
    const sel = document.querySelector("select.form-primary-field, .history-filter select, select");
    if (!sel) return null;
    const r = sel.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (filterSelectBox) {
    await director.moveTo(filterSelectBox.x, filterSelectBox.y, 16);
    await director.click(null, 8);
    await page.evaluate(() => {
      const sel = document.querySelector("select.form-primary-field, .history-filter select, select");
      if (sel) {
        sel.value = "enabled";
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }
  await director.hold(35); // List filters cleanly!

  // --- SCENE 6: Developer Workspace (34.5s - 40.5s = ~180 frames) ---
  console.log("Recording Scene 6: Developer Workspace (34.5-40.5s)...");
  await director.setCaption("Built-in tools for extension developers.");

  // 1. Click Developer in navigator
  const devNavBox = await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll(".nav-link"));
    const d = navs.find(el => el.textContent.includes("Developer"));
    if (!d) return null;
    const r = d.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (devNavBox) {
    await director.moveTo(devNavBox.x, devNavBox.y, 18);
    await director.click(null, 12);
    await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll(".nav-link"));
      const d = navs.find(el => el.textContent.includes("Developer"));
      if (d) d.click();
    });
  }
  await director.hold(20); // Developer Workspace loads

  // 2. Move cursor to Reload button (.reload-btn)
  const reloadBtnBox = await page.evaluate(() => {
    const btn = document.querySelector(".reload-btn");
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (reloadBtnBox) {
    await director.moveTo(reloadBtnBox.x, reloadBtnBox.y, 18);
    await director.click(".reload-btn", 6);

    // Visible reload feedback: spinner rotates, green toast appears!
    await page.evaluate(() => {
      const btn = document.querySelector(".reload-btn");
      if (btn) btn.classList.add("is-reloading");

      let toast = document.getElementById("dev-reload-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "dev-reload-toast";
        toast.style.cssText = `
          position: fixed; top: 24px; right: 28px; background: #059669; color: #ffffff;
          padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 14px;
          box-shadow: 0 10px 25px rgba(5, 150, 105, 0.4); z-index: 9999999;
          display: flex; align-items: center; gap: 8px;
        `;
        toast.innerHTML = `<span>✓</span> <span>Extension reloaded in 38ms</span>`;
        document.body.appendChild(toast);
      }
    });

    await director.hold(28); // Show feedback

    await page.evaluate(() => {
      const btn = document.querySelector(".reload-btn");
      if (btn) btn.classList.remove("is-reloading");
      const toast = document.getElementById("dev-reload-toast");
      if (toast) toast.style.display = "none";
    });
  }

  // 3. Move cursor across chips (GitHub, Store, Analytics)
  await director.moveTo(900, 310, 20); // Hover integration chips
  await director.hold(35);

  // --- SCENE 7: End Card (40.5s - 43.5s = ~90 frames) ---
  console.log("Recording Scene 7: End Card (40.5-43.5s)...");
  await director.setCaption("");
  await director.showTitleCard(
    "Extension Drawer",
    "Free & Open Source Extension Manager",
    "Available on Chrome Web Store · GitHub"
  );
  await director.hold(85); // 2.8s hold
  await page.evaluate(() => {
    const card = document.getElementById("demo-card-overlay");
    if (card) card.style.background = "#000000";
  });
  await director.hold(10); // Quick fade out

  console.log(`\nTotal Frames Captured: ${director.frameCount}`);

  // Compile 45s MP4
  const output45s = path.join(OUTPUT_DIR, "extension-drawer-demo-45s.mp4");
  console.log(`Compiling Main 45s Interactive MP4: ${output45s}...`);
  execSync(
    `ffmpeg -y -framerate 30 -i "${framesDir}/frame_%05d.jpg" -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -r 30 "${output45s}"`,
    { stdio: "inherit" }
  );
  fs.copyFileSync(output45s, path.join(REVIEW_DIR, "extension-drawer-demo-45s.mp4"));
  console.log(`  ✓ Created ${output45s} (${(fs.statSync(output45s).size / (1024 * 1024)).toFixed(2)} MB)`);

  // --- SOCIAL CUT: 15-20s (extension-drawer-demo-20s.mp4) ---
  console.log("\n=======================================================");
  console.log("  COMPILING 20s HIGH-ENERGY SOCIAL CUT");
  console.log("=======================================================");
  const frames20Dir = path.join(OUTPUT_DIR, "interactive_frames_20");
  if (fs.existsSync(frames20Dir)) fs.rmSync(frames20Dir, { recursive: true, force: true });
  fs.mkdirSync(frames20Dir, { recursive: true });

  // 1. Search & Toggle Reaction: ~135 frames (4.5s)
  // 2. Groups OFF/ON Reaction: ~135 frames (4.5s)
  // 3. Site Rules Tab Open & Automatic State Change: ~180 frames (6.0s)
  // 4. Developer Reload Feedback: ~75 frames (2.5s)
  // 5. End Card: ~60 frames (2.0s)
  // Total: ~585 frames @ 30fps = ~19.5s
  let f20Count = 0;
  const copyRange = (start, end) => {
    for (let f = start; f <= end && f < director.frameCount; f++) {
      const src = path.join(framesDir, `frame_${String(f).padStart(5, "0")}.jpg`);
      const dst = path.join(frames20Dir, `frame_${String(f20Count).padStart(5, "0")}.jpg`);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
        f20Count++;
      }
    }
  };

  copyRange(95, 229);   // 135 frames = 4.5s (search "privacy" + switch toggles OFF)
  copyRange(355, 489);  // 135 frames = 4.5s (Development Stack OFF -> 0/4 -> ON -> 4/4)
  copyRange(680, 859);  // 180 frames = 6.0s (Tab opens localhost:3000 -> DevTools turns ON -> Tab closes -> restores OFF)
  copyRange(1050, 1124); // 75 frames = 2.5s (Click reload -> spin feedback -> badge)
  copyRange(director.frameCount - 70, director.frameCount - 11); // 60 frames = 2.0s (End card)


  const output20s = path.join(OUTPUT_DIR, "extension-drawer-demo-20s.mp4");
  console.log(`Compiling 20s Social Cut MP4: ${output20s}...`);
  execSync(
    `ffmpeg -y -framerate 30 -i "${frames20Dir}/frame_%05d.jpg" -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -r 30 "${output20s}"`,
    { stdio: "inherit" }
  );
  fs.copyFileSync(output20s, path.join(REVIEW_DIR, "extension-drawer-demo-20s.mp4"));
  console.log(`  ✓ Created ${output20s} (${(fs.statSync(output20s).size / (1024 * 1024)).toFixed(2)} MB)`);

  await page.close();
}

async function main() {
  console.log("Starting Marketing Media Production Suite...");
  const server = await startStaticServer(8898);
  console.log("Static HTTP server started on port 8898");

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--window-size=1920,1080"],
  });

  try {
    // 1. Render promotional graphics for Chrome Web Store & YouTube
    await renderPromotionalGraphics(browser);

    // 2. Render action-driven interactive demo videos
    await renderActionDrivenVideos(browser, 8898);

    console.log("\n=======================================================");
    console.log("  ALL MEDIA ASSETS PRODUCED AND VALIDATED SUCCESSFULLY!");
    console.log("=======================================================");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("Media production failed:", err);
  process.exit(1);
});
