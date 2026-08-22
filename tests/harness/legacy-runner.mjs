import puppeteer from "puppeteer";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const LEGACY_DIR = path.join(ROOT, "tests/fixtures/legacy-0.1.9/aajodjghehmlpahhboidcpfjcncmcklf/0.1.9_1");
const GOLDEN_DIR = path.join(ROOT, ".artifacts/golden");

if (!fs.existsSync(GOLDEN_DIR)) {
  fs.mkdirSync(GOLDEN_DIR, { recursive: true });
}

// Load messages
const enMessagesRaw = fs.readFileSync(path.join(LEGACY_DIR, "_locales/en/messages.json"), "utf-8");
const enMessages = JSON.parse(enMessagesRaw);

function makeSvgIcon(label, bg, fg = "#ffffff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="28" fill="${bg}"/>
    <text x="64" y="76" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="bold" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const FIXTURE_EXTENSIONS = {
  ext_1: {
    id: "ext_1",
    name: "uBlock Origin",
    version: "1.58.0",
    enabled: true,
    type: "extension",
    isApp: false,
    description: "An efficient blocker. Easy on CPU and memory.",
    optionsUrl: "options.html",
    icon: makeSvgIcon("uB", "#800000"),
    icons: [{ size: 128, url: makeSvgIcon("uB", "#800000") }],
    mayDisable: true,
    installType: "normal",
    permissions: ["webRequest", "storage"],
    hostPermissions: ["<all_urls>"],
    installedDate: Date.now() - 86400000 * 30,
    lastUpdateDate: Date.now() - 86400000 * 2,
  },
  ext_2: {
    id: "ext_2",
    name: "Bitwarden Password Manager",
    version: "2024.6.0",
    enabled: true,
    type: "extension",
    isApp: false,
    description: "A secure and free password manager for all of your devices.",
    optionsUrl: "options.html",
    icon: makeSvgIcon("BW", "#175ddc"),
    icons: [{ size: 128, url: makeSvgIcon("BW", "#175ddc") }],
    mayDisable: true,
    installType: "normal",
    permissions: ["storage", "tabs"],
    hostPermissions: [],
    installedDate: Date.now() - 86400000 * 45,
    lastUpdateDate: Date.now() - 86400000 * 10,
  },
  ext_3: {
    id: "ext_3",
    name: "Dark Reader",
    version: "4.9.86",
    enabled: false,
    type: "extension",
    isApp: false,
    description: "Dark mode for every website. Take care of your eyes, use dark theme for night and daily browsing.",
    optionsUrl: "options.html",
    icon: makeSvgIcon("DR", "#1f2428"),
    icons: [{ size: 128, url: makeSvgIcon("DR", "#1f2428") }],
    mayDisable: true,
    installType: "normal",
    permissions: ["storage"],
    hostPermissions: ["<all_urls>"],
    installedDate: Date.now() - 86400000 * 20,
    lastUpdateDate: Date.now() - 86400000 * 5,
  },
  ext_4: {
    id: "ext_4",
    name: "React Developer Tools",
    version: "5.2.0",
    enabled: true,
    type: "extension",
    isApp: false,
    description: "Adds React debugging tools to the Chrome Developer Tools.",
    optionsUrl: "",
    icon: makeSvgIcon("⚛", "#20232a", "#61dafb"),
    icons: [{ size: 128, url: makeSvgIcon("⚛", "#20232a", "#61dafb") }],
    mayDisable: true,
    installType: "development",
    permissions: [],
    hostPermissions: [],
    installedDate: Date.now() - 86400000 * 60,
    lastUpdateDate: Date.now() - 86400000 * 1,
  },
  ext_5: {
    id: "ext_5",
    name: "Vimium",
    version: "2.1.2",
    enabled: false,
    type: "extension",
    isApp: false,
    description: "The Hacker\x27s Browser. Vimium provides keyboard shortcuts for navigation and control in the spirit of Vim.",
    optionsUrl: "options.html",
    icon: makeSvgIcon("V", "#007acc"),
    icons: [{ size: 128, url: makeSvgIcon("V", "#007acc") }],
    mayDisable: true,
    installType: "normal",
    permissions: ["tabs"],
    hostPermissions: ["<all_urls>"],
    installedDate: Date.now() - 86400000 * 15,
    lastUpdateDate: Date.now() - 86400000 * 15,
  },
  ext_6: {
    id: "ext_6",
    name: "Tampermonkey",
    version: "5.1.1",
    enabled: true,
    type: "extension",
    isApp: false,
    description: "The world\x27s most popular userscript manager.",
    optionsUrl: "options.html",
    icon: makeSvgIcon("TM", "#004853"),
    icons: [{ size: 128, url: makeSvgIcon("TM", "#004853") }],
    mayDisable: true,
    installType: "normal",
    permissions: ["storage", "unlimitedStorage"],
    hostPermissions: ["<all_urls>"],
    installedDate: Date.now() - 86400000 * 40,
    lastUpdateDate: Date.now() - 86400000 * 8,
  },
  app_1: {
    id: "app_1",
    name: "Google Keep",
    version: "3.1.2",
    enabled: true,
    type: "app",
    isApp: true,
    description: "Save your thoughts, wherever you are.",
    optionsUrl: "",
    icon: makeSvgIcon("💡", "#fb0"),
    icons: [{ size: 128, url: makeSvgIcon("💡", "#fb0") }],
    mayDisable: true,
    installType: "normal",
    permissions: [],
    hostPermissions: [],
    installedDate: Date.now() - 86400000 * 100,
    lastUpdateDate: Date.now() - 86400000 * 50,
  },
};

const FIXTURE_GROUPS = [
  {
    id: "NooBoss-Group_1",
    name: "Development",
    appList: ["ext_4", "ext_6"],
  },
  {
    id: "NooBoss-Group_2",
    name: "Privacy & Security",
    appList: ["ext_1", "ext_2"],
  },
];

const FIXTURE_RULES = [
  {
    action: "enableOnly",
    ids: ["ext_4"],
    match: { url: "github.com", isWildcard: false },
    disabled: false,
  },
  {
    action: "disableWhen",
    ids: ["ext_3"],
    match: { url: "*.bank.com/*", isWildcard: true },
    disabled: false,
  },
];

const FIXTURE_HISTORY = [
  {
    id: "ext_1",
    name: "uBlock Origin",
    version: "1.58.0",
    event: "enabled",
    date: Date.now() - 1000 * 60 * 5,
    icon: makeSvgIcon("uB", "#800000"),
  },
  {
    id: "ext_3",
    name: "Dark Reader",
    version: "4.9.86",
    event: "disabled",
    date: Date.now() - 1000 * 60 * 60 * 2,
    icon: makeSvgIcon("DR", "#1f2428"),
  },
  {
    id: "ext_4",
    name: "React Developer Tools",
    version: "5.2.0",
    event: "update",
    date: Date.now() - 1000 * 60 * 60 * 24,
    icon: makeSvgIcon("⚛", "#20232a", "#61dafb"),
  },
  {
    id: "ext_2",
    name: "Bitwarden Password Manager",
    version: "2024.6.0",
    event: "install",
    date: Date.now() - 1000 * 60 * 60 * 48,
    icon: makeSvgIcon("BW", "#175ddc"),
  },
];

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split("?")[0];
  if (reqUrl === "/" || reqUrl === "/popup.html") {
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>NooBoss 0.1.9 Golden</title>
    <style>
      body { margin: 0; padding: 0; background: #fff; }
    </style>
    <script>
      const messages = ${JSON.stringify(enMessages)};
      const extensions = ${JSON.stringify(FIXTURE_EXTENSIONS)};
      const groupList = ${JSON.stringify(FIXTURE_GROUPS)};
      const autoStateRuleList = ${JSON.stringify(FIXTURE_RULES)};
      const historyRecords = ${JSON.stringify(FIXTURE_HISTORY)};
      
      const storageSync = {
        mainColor: { r: 195, g: 147, b: 220, a: 1 },
        subColor: { r: 90, g: 90, b: 90, a: 1 },
        viewMode: "tile",
        zoom: 1,
        joinCommunity: false,
        recoExtensions: false,
      };

      const listeners = [];

      window.browser = {
        i18n: {
          getMessage: (key) => (messages[key] ? messages[key].message : key),
          getUILanguage: () => "en",
        },
        runtime: {
          onMessage: {
            addListener: (fn) => listeners.push(fn),
            removeListener: (fn) => {
              const idx = listeners.indexOf(fn);
              if (idx !== -1) listeners.splice(idx, 1);
            }
          },
          sendMessage: (msg, cb = () => {}) => {
            if (!msg) return;
            switch(msg.job) {
              case "getAllExtensions":
                cb(extensions);
                break;
              case "getGroupList":
                cb(groupList);
                break;
              case "getAutoStateRuleList":
                cb(autoStateRuleList);
                break;
              case "set":
                storageSync[msg.key] = msg.value;
                cb(msg.value);
                break;
              default:
                cb({});
            }
          }
        },
        storage: {
          sync: {
            get: (key, cb) => {
              if (typeof key === "string") {
                cb({ [key]: storageSync[key] });
              } else if (Array.isArray(key)) {
                const res = {};
                key.forEach(k => res[k] = storageSync[k]);
                cb(res);
              } else {
                cb(storageSync);
              }
            },
            set: (obj, cb = () => {}) => {
              Object.assign(storageSync, obj);
              cb();
            }
          }
        },
        management: {
          getSelf: (cb) => cb({ id: "aajodjghehmlpahhboidcpfjcncmcklf", name: "NooBoss" }),
        }
      };

      window.chrome = {
        ...window.browser,
        tabs: {
          query: (q, cb) => cb([{ url: "https://github.com/AInoob/NooBoss" }]),
        }
      };

      const openReq = indexedDB.open("NooBoss", 1);
      openReq.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("Store")) {
          db.createObjectStore("Store", { keyPath: "key" });
        }
      };
      openReq.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction("Store", "readwrite");
        const store = tx.objectStore("Store");
        store.put({ key: "history_records", value: historyRecords });
        for (const [id, ext] of Object.entries(extensions)) {
          store.put({ key: ext.icon, value: ext.icon });
          store.put({ key: id + "_" + ext.version + "_icon", value: ext.icon });
          store.put({ key: id + "_icon", value: ext.icon });
        }
        for (const grp of groupList) {
          store.put({ key: grp.id + "_icon", value: makeSvgIcon("G", "#667eea") });
        }
      };
    </script>
  </head>
  <body>
    <div id="nooboss"></div>
    <script src="/js/popup.js"></script>
  </body>
</html>`;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  const filePath = path.join(LEGACY_DIR, reqUrl);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    let contentType = "text/plain";
    if (reqUrl.endsWith(".js")) contentType = "application/javascript";
    if (reqUrl.endsWith(".png")) contentType = "image/png";
    if (reqUrl.endsWith(".svg")) contentType = "image/svg+xml";
    if (reqUrl.endsWith(".json")) contentType = "application/json";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const PORT = 8991;

async function run() {
  server.listen(PORT, async () => {
    console.log(`Legacy server listening on http://localhost:${PORT}`);
    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 800, height: 620, deviceScaleFactor: 2 });

      // 1. Overview
      await page.goto(`http://localhost:${PORT}/popup.html?page=overview`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(GOLDEN_DIR, "1_overview.png") });
      console.log("Saved 1_overview.png");

      // 2. Extensions Manage - Tile
      await page.goto(`http://localhost:${PORT}/popup.html?page=extensions`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(GOLDEN_DIR, "2_manage_tile.png") });
      console.log("Saved 2_manage_tile.png");

      // Hover over first tile to capture 3D flip card
      const firstTile = await page.$(".extensionBrief");
      if (firstTile) {
        await firstTile.hover();
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(GOLDEN_DIR, "2b_manage_tile_hover.png") });
        console.log("Saved 2b_manage_tile_hover.png");
      }

      // 3. Switch to Big Tile
      const bigTileBtn = await page.$("#bigTile");
      if (bigTileBtn) {
        await bigTileBtn.click();
        await new Promise(r => setTimeout(r, 800));
        await page.screenshot({ path: path.join(GOLDEN_DIR, "3_manage_big_tile.png") });
        console.log("Saved 3_manage_big_tile.png");
      }

      // 4. Switch to List
      const listBtn = await page.$("#list");
      if (listBtn) {
        await listBtn.click();
        await new Promise(r => setTimeout(r, 800));
        await page.screenshot({ path: path.join(GOLDEN_DIR, "4_manage_list.png") });
        console.log("Saved 4_manage_list.png");
      }

      // 5. AutoState
      await page.goto(`http://localhost:${PORT}/popup.html?page=extensions`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 800));
      await page.evaluate(() => {
        const navLinks = Array.from(document.querySelectorAll("nav .link"));
        const extNav = navLinks.find(l => l.innerText.includes("Extensions") || l.innerText.includes("extensions"));
        if (extNav) {
          const subLink = Array.from(extNav.querySelectorAll(".sub .link")).find(sl => sl.innerText.includes("Auto"));
          if (subLink) subLink.click();
        }
      });
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(GOLDEN_DIR, "5_autostate.png") });
      console.log("Saved 5_autostate.png");

      // 6. History
      await page.goto(`http://localhost:${PORT}/popup.html?page=history`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(GOLDEN_DIR, "6_history.png") });
      console.log("Saved 6_history.png");

      // 7. Options
      await page.goto(`http://localhost:${PORT}/popup.html?page=options`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 1200));
      await page.evaluate(() => {
        document.querySelectorAll(".displayMore").forEach(el => el.checked = true);
      });
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(GOLDEN_DIR, "7_options.png") });
      console.log("Saved 7_options.png");

      // 8. About
      await page.goto(`http://localhost:${PORT}/popup.html?page=about`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(GOLDEN_DIR, "8_about.png") });
      console.log("Saved 8_about.png");

      // 9. SubWindow (Extension Detail)
      await page.goto(`http://localhost:${PORT}/popup.html?page=extensions`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 1000));
      await page.evaluate(() => {
        const icon = document.querySelector(".extensionIcon");
        if (icon) icon.click();
      });
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(GOLDEN_DIR, "9_subwindow_extension.png") });
      console.log("Saved 9_subwindow_extension.png");

      // 10. SubWindow (Group Editor)
      await page.goto(`http://localhost:${PORT}/popup.html?page=extensions`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 1000));
      await page.evaluate(() => {
        const grpIcon = document.querySelector(".groupIcon");
        if (grpIcon) grpIcon.click();
      });
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(GOLDEN_DIR, "10_subwindow_group.png") });
      console.log("Saved 10_subwindow_group.png");

      console.log("✅ All golden reference screenshots captured successfully!");
    } catch (err) {
      console.error("Error running legacy harness:", err);
    } finally {
      if (browser) await browser.close();
      server.close();
      process.exit(0);
    }
  });
}

run();
