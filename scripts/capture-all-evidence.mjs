import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || path.join(ROOT, "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function startStaticServer(port = 8798) {
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

async function main() {
  const server = await startStaticServer(8798);

  const now = Date.now();
  const sampleExtensions = [
    {
      id: "bound_dev_1",
      name: "Extension Drawer (Dev Build)",
      version: "1.1.0",
      enabled: true,
      type: "extension",
      installType: "development",
      mayDisable: true,
      description: "Local unpacked dev build of Extension Drawer",
    },
    {
      id: "unlinked_dev_1",
      name: "Tailwind CSS DevTools",
      version: "0.4.2",
      enabled: true,
      type: "extension",
      installType: "development",
      mayDisable: true,
      description: "Unpacked Tailwind inspector",
    },
    {
      id: "store_ext_react",
      name: "React Developer Tools",
      version: "5.1.0",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Inspect React component hierarchies",
    },
    {
      id: "store_ext_ublock",
      name: "uBlock Origin",
      version: "1.58.0",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Efficient wide-spectrum content blocker",
    },
    {
      id: "store_ext_dark",
      name: "Dark Reader",
      version: "4.9.80",
      enabled: false,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Dark mode for every website",
    },
    {
      id: "store_ext_bitwarden",
      name: "Bitwarden Password Manager",
      version: "2024.4.1",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Secure and free password manager",
    },
    {
      id: "store_ext_json",
      name: "JSON Viewer Pro",
      version: "1.2.0",
      enabled: false,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Format and highlight JSON files",
    },
  ];

  const sampleHistory = [
    {
      id: "h1",
      timestamp: now - 15 * 60 * 1000,
      event: "disabled",
      extensionId: "store_ext_json",
      extensionName: "JSON Viewer Pro",
      extensionVersion: "1.2.0",
      source: "user",
    },
    {
      id: "h2",
      timestamp: now - 45 * 60 * 1000,
      event: "disabled",
      extensionId: "store_ext_dark",
      extensionName: "Dark Reader",
      extensionVersion: "4.9.80",
      source: "user",
    },
    {
      id: "h3",
      timestamp: now - 3 * 3600 * 1000,
      event: "enabled",
      extensionId: "bound_dev_1",
      extensionName: "Extension Drawer (Dev Build)",
      extensionVersion: "1.1.0",
      source: "user",
    },
    {
      id: "h4",
      timestamp: now - 8 * 3600 * 1000,
      event: "enabled",
      extensionId: "store_ext_dark",
      extensionName: "Dark Reader",
      extensionVersion: "4.9.80",
      source: "user",
    },
    {
      id: "h5",
      timestamp: now - 24 * 3600 * 1000,
      event: "installed",
      extensionId: "unlinked_dev_1",
      extensionName: "Tailwind CSS DevTools",
      extensionVersion: "0.4.2",
      source: "user",
    },
    {
      id: "h6",
      timestamp: now - 3 * 86400 * 1000,
      event: "installed",
      extensionId: "bound_dev_1",
      extensionName: "Extension Drawer (Dev Build)",
      extensionVersion: "1.1.0",
      source: "user",
    },
    {
      id: "h7",
      timestamp: now - 10 * 86400 * 1000,
      event: "installed",
      extensionId: "store_ext_ublock",
      extensionName: "uBlock Origin",
      extensionVersion: "1.58.0",
      source: "user",
    },
  ];

  const sampleProjects = [
    {
      id: "devproj_drawer",
      name: "Extension Drawer",
      localExtensionId: "bound_dev_1",
      cwsExtensionId: "kgenlcljnnalkmbhlolfomnfpdmnnapi",
      githubUrl: "https://github.com/iknoest/NooBoss-MV3",
      gaPropertyId: "properties/318492015",
      createdAt: now - 500000,
      updatedAt: now - 100000,
    },
    {
      id: "devproj_scratch",
      name: "Internal Prototype Tool",
      localExtensionId: undefined,
      cwsExtensionId: undefined,
      githubUrl: undefined,
      gaPropertyId: undefined,
      createdAt: now - 200000,
      updatedAt: now - 200000,
    },
  ];

  const sampleSettings = {
    autoStateEnabled: false,
    autoStateMode: "automatic",
    notifyStateChange: false,
    notifyInstallUninstall: false,
    viewMode: "tile",
    accentPreset: "default",
    accentColor: "#1a73e8",
    developerMode: true,
  };

  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 750, height: 600, deviceScaleFactor: 2 });

  // Setup chrome message mock
  await page.evaluateOnNewDocument(
    (exts, hists, projs, setts) => {
      window.chrome = {
        runtime: {
          sendMessage: (msg) => {
            if (msg.type === "GET_EXTENSIONS") return Promise.resolve(exts);
            if (msg.type === "GET_GROUPS") return Promise.resolve([]);
            if (msg.type === "GET_AUTOSTATE_RULES") return Promise.resolve([]);
            if (msg.type === "GET_HISTORY") return Promise.resolve(hists);
            if (msg.type === "GET_SETTINGS") return Promise.resolve(setts);
            if (msg.type === "GET_PENDING_CHANGES") return Promise.resolve([]);
            if (msg.type === "GET_DEVELOPER_PROJECTS") return Promise.resolve(projs);
            if (msg.type === "UPDATE_EXTENSION_STATE") return Promise.resolve({ success: true });
            if (msg.type === "RELOAD_EXTENSION") return Promise.resolve({ success: true });
            return Promise.resolve({});
          },
        },
      };
    },
    sampleExtensions,
    sampleHistory,
    sampleProjects,
    sampleSettings
  );

  // 1. History with All events
  await page.goto("http://localhost:8798/manager/manager.html?page=history", { waitUntil: "networkidle0" });
  await sleep(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_history_all_events.png") });
  console.log("Captured 01_history_all_events.png");

  // 2. History filtered to Disabled
  await page.select("#historyEventFilter", "disabled");
  await sleep(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_history_filtered_disabled.png") });
  console.log("Captured 02_history_filtered_disabled.png");

  // 3. Extensions view with Sort control
  await page.goto("http://localhost:8798/manager/manager.html?page=extensions", { waitUntil: "networkidle0" });
  await sleep(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03_extensions_sort_control.png") });
  console.log("Captured 03_extensions_sort_control.png");

  // 4. Extensions sorted by Recently changed
  await page.select("#sortModeSelect", "recently_changed");
  await sleep(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04_extensions_sorted_recently_changed.png") });
  console.log("Captured 04_extensions_sorted_recently_changed.png");

  // 5. Extensions sorted by Most changed
  await page.select("#sortModeSelect", "most_changed");
  await sleep(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05_extensions_sorted_most_changed.png") });
  console.log("Captured 05_extensions_sorted_most_changed.png");

  // 6. Developer Workspace with explicit Runtime / Tracking / Store / Package statuses
  await page.goto("http://localhost:8798/manager/manager.html?page=developer", { waitUntil: "networkidle0" });
  await sleep(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06_developer_workspace_explicit_statuses.png") });
  console.log("Captured 06_developer_workspace_explicit_statuses.png");

  // 7. Developer row single configuration entry
  const devRow = await page.$(".dev-project-row");
  if (devRow) {
    await devRow.screenshot({ path: path.join(SCREENSHOT_DIR, "07_developer_row_single_config.png") });
    console.log("Captured 07_developer_row_single_config.png");
  }

  // 8. Project Editor Modal with all binding settings
  await page.click(".dev-project-row");
  await sleep(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08_developer_project_editor_modal.png") });
  console.log("Captured 08_developer_project_editor_modal.png");

  // Close modal
  await page.click(".subwindow-close-btn");
  await sleep(300);

  // 9. Header with Open CWS Dashboard
  const headerElem = await page.$(".developer-header");
  if (headerElem) {
    await headerElem.screenshot({ path: path.join(SCREENSHOT_DIR, "09_developer_header_cws_dashboard.png") });
    console.log("Captured 09_developer_header_cws_dashboard.png");
  }

  // 10. Options showing Show Developer workspace
  await page.goto("http://localhost:8798/manager/manager.html?page=options", { waitUntil: "networkidle0" });
  await sleep(600);
  // Scroll down to Developer Workspace section
  await page.evaluate(() => {
    const el = document.getElementById("setting-developer-mode");
    if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await sleep(300);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10_options_show_developer_workspace.png") });
  console.log("Captured 10_options_show_developer_workspace.png");

  await browser.close();
  server.close();
  console.log("All screenshots captured successfully!");
}

main().catch((e) => {
  console.error("Screenshot capture failed:", e);
  process.exit(1);
});
