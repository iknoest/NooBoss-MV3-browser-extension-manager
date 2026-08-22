import http from "http";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer-core";

const PORT = 8992;
const DIST_DIR = path.resolve("dist");
const OUT_DIR = path.resolve(".artifacts/mv3");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Mock fixtures matching legacy runner fixtures
const FIXTURE_EXTENSIONS = [
  {
    id: "nngceckbapebfimnlniiiahkandclblb",
    name: "Bitwarden Password Manager",
    shortName: "Bitwarden",
    version: "2024.6.0",
    description: "A secure and free password manager for all of your devices.",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    optionsUrl: "chrome-extension://nngceckbapebfimnlniiiahkandclblb/popup/index.html",
    homepageUrl: "https://bitwarden.com",
    icons: [{ size: 128, url: "/icons/bw.png" }],
    permissions: ["storage", "unlimitedStorage", "clipboardWrite", "tabs"],
    hostPermissions: ["*://*/*"],
  },
  {
    id: "eimadpbcbfnmbkopoojfekhnkhdbieeh",
    name: "Dark Reader",
    shortName: "Dark Reader",
    version: "4.9.86",
    description: "Dark mode for every website. Take care of your eyes, use dark theme for night and daily browsing.",
    enabled: false,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    optionsUrl: "",
    homepageUrl: "https://darkreader.org",
    icons: [{ size: 128, url: "/icons/dr.png" }],
    permissions: ["storage", "tabs", "theme"],
    hostPermissions: ["<all_urls>"],
  },
  {
    id: "fmkadmapgofadopljbjfkapdkoienihi",
    name: "React Developer Tools",
    shortName: "React DevTools",
    version: "5.2.0",
    description: "Adds React debugging tools to the Chrome Developer Tools.",
    enabled: true,
    type: "extension",
    installType: "development",
    mayDisable: true,
    optionsUrl: "",
    homepageUrl: "https://github.com/facebook/react",
    icons: [{ size: 128, url: "/icons/react.png" }],
    permissions: [],
    hostPermissions: [],
  },
  {
    id: "dhdgffkkebhmkfjojejmpbldmpobfkfo",
    name: "Tampermonkey",
    shortName: "Tampermonkey",
    version: "5.1.1",
    description: "The world most popular userscript manager.",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    optionsUrl: "chrome-extension://dhdgffkkebhmkfjojejmpbldmpobfkfo/options.html",
    homepageUrl: "https://tampermonkey.net",
    icons: [{ size: 128, url: "/icons/tm.png" }],
    permissions: ["storage", "tabs", "webRequest"],
    hostPermissions: ["*://*/*"],
  },
  {
    id: "cjpalhdlnbpafiamejdnhcphjbkeiagm",
    name: "uBlock Origin",
    shortName: "uBlock Origin",
    version: "1.58.0",
    description: "An efficient blocker: easy on CPU and memory.",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    optionsUrl: "chrome-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/dashboard.html",
    homepageUrl: "https://github.com/gorhill/uBlock",
    icons: [{ size: 128, url: "/icons/ub.png" }],
    permissions: ["storage", "webRequest", "webRequestBlocking", "tabs"],
    hostPermissions: ["<all_urls>"],
  },
  {
    id: "dbepggeogbaibhgnhhndojpepiihcmeb",
    name: "Vimium",
    shortName: "Vimium",
    version: "2.1.2",
    description: "The Hacker Browser. Vimium provides keyboard shortcuts for navigation and control in the spirit of Vim.",
    enabled: false,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    optionsUrl: "chrome-extension://dbepggeogbaibhgnhhndojpepiihcmeb/pages/options.html",
    homepageUrl: "https://vimium.github.io",
    icons: [{ size: 128, url: "/icons/v.png" }],
    permissions: ["storage", "tabs"],
    hostPermissions: ["<all_urls>"],
  },
  {
    id: "coobgflhoopjcajflimmobdmflpkcngf",
    name: "Google Keep",
    shortName: "Google Keep",
    version: "4.24.1",
    description: "Save to Google Keep in a single click!",
    enabled: true,
    type: "app",
    installType: "normal",
    mayDisable: true,
    optionsUrl: "",
    homepageUrl: "https://keep.google.com",
    icons: [{ size: 128, url: "/icons/keep.png" }],
    permissions: [],
    hostPermissions: [],
  },
];

const FIXTURE_GROUPS = [
  {
    id: "group_dev",
    name: "Development",
    color: "#4f46e5",
    extensionIds: ["fmkadmapgofadopljbjfkapdkoienihi", "dhdgffkkebhmkfjojejmpbldmpobfkfo"],
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "group_sec",
    name: "Privacy & Security",
    color: "#059669",
    extensionIds: ["cjpalhdlnbpafiamejdnhcphjbkeiagm", "nngceckbapebfimnlniiiahkandclblb", "eimadpbcbfnmbkopoojfekhnkhdbieeh"],
    createdAt: Date.now() - 86400000 * 2,
  },
];

const FIXTURE_RULES = [
  {
    id: "rule_1",
    enabled: true,
    name: "Dev tools for GitHub",
    pattern: "github.com",
    isWildcard: false,
    targets: ["fmkadmapgofadopljbjfkapdkoienihi"],
    action: "enableOnlyWhileMatched",
    priority: 0,
    createdAt: Date.now() - 3600000 * 24,
  },
  {
    id: "rule_2",
    enabled: false,
    name: "Disable dark mode on banking",
    pattern: "*.bank.com/*",
    isWildcard: true,
    targets: ["eimadpbcbfnmbkopoojfekhnkhdbieeh"],
    action: "disableWhenMatched",
    priority: 1,
    createdAt: Date.now() - 3600000 * 12,
  },
];

const FIXTURE_HISTORY = [
  {
    id: "hist_1",
    extensionId: "cjpalhdlnbpafiamejdnhcphjbkeiagm",
    extensionName: "uBlock Origin",
    extensionVersion: "1.58.0",
    event: "enabled",
    timestamp: Date.now() - 5 * 60 * 1000,
  },
  {
    id: "hist_2",
    extensionId: "eimadpbcbfnmbkopoojfekhnkhdbieeh",
    extensionName: "Dark Reader",
    extensionVersion: "4.9.86",
    event: "disabled",
    timestamp: Date.now() - 2 * 3600 * 1000,
  },
  {
    id: "hist_3",
    extensionId: "fmkadmapgofadopljbjfkapdkoienihi",
    extensionName: "React Developer Tools",
    extensionVersion: "5.2.0",
    event: "updated",
    timestamp: Date.now() - 24 * 3600 * 1000,
  },
  {
    id: "hist_4",
    extensionId: "nngceckbapebfimnlniiiahkandclblb",
    extensionName: "Bitwarden Password Manager",
    extensionVersion: "2024.6.0",
    event: "installed",
    timestamp: Date.now() - 48 * 3600 * 1000,
  },
];

const FIXTURE_SETTINGS = {
  theme: "system",
  autoStateEnabled: true,
  autoStateMode: "automatic",
  notifyAutoState: true,
  notifyStateChange: false,
  notifyInstallUninstall: false,
  historyTrackInstall: true,
  historyTrackUninstall: true,
  historyTrackEnable: true,
  historyTrackDisable: true,
  viewMode: "grid",
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];
  
  if (urlPath.startsWith("/icons/")) {
    const iconName = urlPath.replace("/icons/", "");
    const colorMap = {
      "bw.png": "#005ea6",
      "dr.png": "#1b1e2b",
      "react.png": "#20232a",
      "tm.png": "#004d40",
      "ub.png": "#800000",
      "v.png": "#4a4a4a",
      "keep.png": "#fbbc04",
    };
    const textMap = {
      "bw.png": "BW",
      "dr.png": "DR",
      "react.png": "⚛",
      "tm.png": "TM",
      "ub.png": "uB",
      "v.png": "V",
      "keep.png": "💡",
    };
    const bg = colorMap[iconName] || "#4f46e5";
    const txt = textMap[iconName] || "NB";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="28" fill="${bg}"/>
      <text x="64" y="76" font-family="system-ui, -apple-system, sans-serif" font-size="46" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="middle">${txt}</text>
    </svg>`;
    res.writeHead(200, { "Content-Type": "image/svg+xml" });
    res.end(svg);
    return;
  }

  let filePath = path.join(DIST_DIR, urlPath === "/" ? "popup/popup.html" : urlPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, "popup/popup.html");
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
  };
  const mime = mimeTypes[ext] || "text/plain";

  try {
    let content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": mime });
    res.end(content);
  } catch (err) {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, async () => {
  console.log(`MV3 server listening on http://localhost:${PORT}`);
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=800,600"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 760, height: 560, deviceScaleFactor: 1 });

    // Mock chrome extension APIs
    await page.evaluateOnNewDocument((fixtures) => {
      window.chrome = {
        runtime: {
          sendMessage: (msg, callback) => {
            if (msg.type === "GET_EXTENSIONS") callback?.({ extensions: fixtures.exts });
            else if (msg.type === "GET_GROUPS") callback?.({ groups: fixtures.grps });
            else if (msg.type === "GET_AUTOSTATE_RULES") callback?.({ rules: fixtures.rules });
            else if (msg.type === "GET_HISTORY") callback?.({ records: fixtures.history });
            else if (msg.type === "GET_SETTINGS") callback?.({ settings: fixtures.settings });
            else if (msg.type === "GET_PENDING_CHANGES") callback?.({ changes: [] });
            else callback?.({ success: true });
          },
          onMessage: {
            addListener: () => {},
            removeListener: () => {},
          },
        },
        tabs: {
          query: (_q, cb) => cb?.([{ url: "https://github.com/owner/repo" }]),
        },
        i18n: {
          getMessage: () => "",
        },
      };
    }, {
      exts: FIXTURE_EXTENSIONS,
      grps: FIXTURE_GROUPS,
      rules: FIXTURE_RULES,
      history: FIXTURE_HISTORY,
      settings: FIXTURE_SETTINGS,
    });

    // 1. Overview
    await page.goto(`http://localhost:${PORT}/popup/popup.html`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, "1_overview.png") });
    console.log("Saved 1_overview.png");

    // 2. Manage - Tile
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll(".nav-link"));
      const extNav = links.find((l) => l.textContent.includes("Extensions"));
      if (extNav) extNav.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(OUT_DIR, "2_manage_tile.png") });
    console.log("Saved 2_manage_tile.png");

    // 2b. Manage - Tile Hover (hover over first tile)
    const firstTile = await page.$(".nb-tile");
    if (firstTile) {
      await firstTile.hover();
      await new Promise((r) => setTimeout(r, 400));
      await page.screenshot({ path: path.join(OUT_DIR, "2b_manage_tile_hover.png") });
      console.log("Saved 2b_manage_tile_hover.png");
    }

    // 3. Manage - Big Tile
    await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll(".view-switcher svg"));
      if (svgs[1]) svgs[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(OUT_DIR, "3_manage_big_tile.png") });
    console.log("Saved 3_manage_big_tile.png");

    // 4. Manage - List
    await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll(".view-switcher svg"));
      if (svgs[2]) svgs[2].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(OUT_DIR, "4_manage_list.png") });
    console.log("Saved 4_manage_list.png");

    // 5. AutoState
    await page.goto(`http://localhost:${PORT}/popup/popup.html?page=extensions&sub=autoState`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, "5_autostate.png") });
    console.log("Saved 5_autostate.png");

    // 6. History
    await page.goto(`http://localhost:${PORT}/popup/popup.html?page=history`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, "6_history.png") });
    console.log("Saved 6_history.png");

    // 7. Options
    await page.goto(`http://localhost:${PORT}/popup/popup.html?page=options`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, "7_options.png") });
    console.log("Saved 7_options.png");

    // 8. About
    await page.goto(`http://localhost:${PORT}/popup/popup.html?page=about`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, "8_about.png") });
    console.log("Saved 8_about.png");

    // 9. SubWindow - Extension Detail
    await page.goto(`http://localhost:${PORT}/popup/popup.html?page=extensions&sub=manage`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    await page.click("#extensionList .item-name-front");
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT_DIR, "9_subwindow_extension.png") });
    console.log("Saved 9_subwindow_extension.png");

    // 10. SubWindow - Group Edit
    await page.goto(`http://localhost:${PORT}/popup/popup.html?page=extensions&sub=manage`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    await page.click("#groupList .item-name-front");
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT_DIR, "10_subwindow_group.png") });
    console.log("Saved 10_subwindow_group.png");

  } catch (err) {
    console.error("Error in MV3 runner:", err);
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(0);
  }
});
