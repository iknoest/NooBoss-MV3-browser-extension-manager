import puppeteer from "puppeteer";
import path from "path";
import http from "http";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const CWS_DIR = path.join(ROOT, "docs/chrome-web-store/screenshots/cws");

if (!fs.existsSync(CWS_DIR)) {
  fs.mkdirSync(CWS_DIR, { recursive: true });
}

function startStaticServer(port = 8897) {
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
];

const sampleHistory = [
  {
    id: "h1",
    timestamp: Date.now() - 1000 * 60 * 12,
    event: "enabled",
    extensionId: "ext_shield",
    extensionName: "Privacy & Content Shield",
    extensionVersion: "3.2.0",
    source: "autostate",
  },
  {
    id: "h2",
    timestamp: Date.now() - 1000 * 60 * 65,
    event: "updated",
    extensionId: "ext_markdown",
    extensionName: "Markdown Preview Pro",
    extensionVersion: "2.4.0",
    source: "external",
  },
  {
    id: "h3",
    timestamp: Date.now() - 1000 * 60 * 180,
    event: "installed",
    extensionId: "ext_color",
    extensionName: "Color Picker & Palette",
    extensionVersion: "1.5.0",
    source: "user",
  },
];

async function setupMockEnvironment(page, { developerMode = true } = {}) {
  await page.evaluateOnNewDocument(
    (exts, historyData, devMode) => {
      window.__INTERNAL_EXTS = exts;
      window.__INTERNAL_HISTORY = historyData;

      const storageData = {
        nooboss_settings: {
          theme: "light",
          sortOrder: "name",
          viewMode: "bigTile",
          developerMode: devMode,
          autoStateEnabled: true,
          autoStateMode: "automatic",
          historyMaxRecords: 5000,
          historyTrackInstall: true,
          historyTrackUninstall: true,
          historyTrackEnable: true,
          historyTrackDisable: true,
        },
        nooboss_groups: [],
        nooboss_autostate_rules: [],
        nooboss_history: historyData,
      };

      window.chrome = {
        runtime: {
          id: "onkcjpfgllpfbimnchjehboikhippnka",
          getManifest: () => ({ version: "1.2.0", name: "Extension Drawer" }),
          sendMessage: async (msg) => {
            switch (msg.type) {
              case "GET_EXTENSIONS":
                return window.__INTERNAL_EXTS;
              case "GET_SETTINGS":
                return storageData.nooboss_settings;
              case "SAVE_SETTINGS":
                Object.assign(storageData.nooboss_settings, msg.settings);
                return { success: true };
              case "GET_HISTORY":
                return window.__INTERNAL_HISTORY;
              case "SAVE_HISTORY":
                window.__INTERNAL_HISTORY = msg.records;
                storageData.nooboss_history = msg.records;
                return { success: true };
              case "GET_GROUPS":
                return [];
              case "GET_AUTOSTATE_RULES":
                return [];
              case "GET_DEVELOPER_PROJECTS":
                return [];
              case "GET_SELF":
                return { id: "onkcjpfgllpfbimnchjehboikhippnka", name: "Extension Drawer", version: "1.2.0" };
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
              const res = typeof keys === "string" ? { [keys]: storageData[keys] } : storageData;
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
    sampleHistory,
    developerMode
  );
}

async function main() {
  console.log("Starting static server for screenshot 3 regeneration on port 8897...");
  const server = await startStaticServer(8897);

  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--force-device-scale-factor=1"],
  });

  console.log("Generating CWS full-bleed 3-history-backup.png (1280x800 split)...");
  // Left: History view (640x800)
  const p3a = await browser.newPage();
  await p3a.setViewport({ width: 640, height: 800 });
  await setupMockEnvironment(p3a, { developerMode: true });
  await p3a.goto("http://localhost:8897/manager/manager.html?page=history", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  const buf3a = await p3a.screenshot({ encoding: "base64" });
  await p3a.close();

  // Right: Options Backup & Data section (640x800)
  const p3b = await browser.newPage();
  await p3b.setViewport({ width: 640, height: 800 });
  await setupMockEnvironment(p3b, { developerMode: true });
  await p3b.goto("http://localhost:8897/manager/manager.html?page=options", { waitUntil: "networkidle0" });
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
  const destPath = path.join(CWS_DIR, "3-history-backup.png");
  await compPage.screenshot({ path: destPath, omitBackground: false });
  await compPage.close();

  console.log(`CWS screenshot #3 regenerated successfully at ${destPath}`);
  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error("Screenshot #3 regeneration failed:", err);
  process.exit(1);
});
