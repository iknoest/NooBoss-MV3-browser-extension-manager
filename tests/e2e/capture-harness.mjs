import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DIST = path.join(ROOT, "dist");
const MIGRATED_JSON = path.join(ROOT, "migrated-nooboss-import.json");
const ARTIFACT_DIR = "/Users/ava/.gemini/antigravity/brain/5edd0da1-ee39-4265-8d36-7d1bb76ba72d/.tempmediaStorage";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function startStaticServer(port = 8789) {
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

async function main() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const server = await startStaticServer(8789);
  const migratedData = JSON.parse(fs.readFileSync(MIGRATED_JSON, "utf8"));

  const sampleExtensions = [
    {
      id: "ghbmnnjggjcganegdakffhaeglpncmno",
      name: "ChatGPT for Chrome",
      version: "1.8.0",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Access ChatGPT directly from your browser toolbar.",
      homepageUrl: "https://openai.com",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_gpt" }],
    },
    {
      id: "cjpalhdlnbpafiamejdnhcphjbkeiagm",
      name: "uBlock Origin",
      version: "1.58.0",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Finally, an efficient wide-spectrum content blocker.",
      homepageUrl: "https://github.com/gorhill/uBlock",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_ubo" }],
    },
    {
      id: "eimadpbcbfnmbkopoojfekhnkhdbieeh",
      name: "Dark Reader",
      version: "4.9.80",
      enabled: false,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Dark mode for every website. Take care of your eyes.",
      homepageUrl: "https://darkreader.org",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_dr" }],
    },
    {
      id: "nkbihfbeogaeaoehlefnkodbefgpgknn",
      name: "MetaMask",
      version: "12.2.1",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "An Ethereum Wallet in your Browser",
      homepageUrl: "https://metamask.io",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_mm" }],
    },
    {
      id: "fmkadmapgofadopljbjfkapdkoienihi",
      name: "React Developer Tools",
      version: "5.3.1",
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "React profiling and debugging tools for Chrome.",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_rdt" }],
    },
    {
      id: "lmhkpmbekcpmknklioeibfkpmmfibljd",
      name: "Redux DevTools",
      version: "3.1.6",
      enabled: false,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Redux DevTools for debugging application state changes.",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_rdx" }],
    },
  ];

  const groupsWithExts = (migratedData.groups || []).map((g, idx) => {
    if (idx === 0) return { ...g, icon: { type: "material", name: "shopping_cart" }, extensionIds: ["ghbmnnjggjcganegdakffhaeglpncmno", "cjpalhdlnbpafiamejdnhcphjbkeiagm"] };
    if (idx === 1) return { ...g, icon: { type: "material", name: "code" }, extensionIds: ["fmkadmapgofadopljbjfkapdkoienihi"] };
    if (idx === 2) return { ...g, icon: { type: "material", name: "business_center" }, extensionIds: ["nkbihfbeogaeaoehlefnkodbefgpgknn", "eimadpbcbfnmbkopoojfekhnkhdbieeh"] };
    if (idx === 3) return { ...g, icon: { type: "material", name: "shield" }, extensionIds: ["eimadpbcbfnmbkopoojfekhnkhdbieeh"] };
    return { ...g, icon: undefined, extensionIds: [] };
  });

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 560 });

  await page.evaluateOnNewDocument((exts, grps, rls, setts) => {
    let internalExts = [...exts];
    let internalGrps = [...grps];
    let internalRls = [...rls];
    let internalSetts = { ...setts, theme: "system", accentPreset: "default", accentColor: "#1a73e8", viewMode: "bigTile" };

    window.chrome = {
      runtime: {
        id: "test_nooboss_extension_id",
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
  }, sampleExtensions, groupsWithExts, migratedData.autoStateRules || [], migratedData.settings || {});

  await page.goto("http://localhost:8789/popup/popup.html", { waitUntil: "networkidle0" });
  await sleep(1000);

  // Visual 1: Big Tile Manage view (2 columns maximum, 0 horizontal scroll)
  const s1Path = path.join(ARTIFACT_DIR, "visual_01_big_tile_2col.png");
  await page.screenshot({ path: s1Path });
  console.log("Captured:", s1Path);

  // Check horizontal overflow in Big Tile
  const hasOverflow = await page.evaluate(() => {
    const main = document.querySelector(".main-content");
    return main ? main.scrollWidth > main.clientWidth : false;
  });
  console.log("Big Tile Main Content has horizontal overflow:", hasOverflow);

  // Visual 2: List Manage view
  await page.evaluate(() => {
    const listBtn = document.querySelectorAll(".view-mode-btn")[0];
    if (listBtn) listBtn.click();
  });
  await sleep(400);
  const s2Path = path.join(ARTIFACT_DIR, "visual_02_list_view.png");
  await page.screenshot({ path: s2Path });
  console.log("Captured:", s2Path);

  // Visual 3: Tile Manage view (max 6 columns)
  await page.evaluate(() => {
    const tileBtn = document.querySelectorAll(".view-mode-btn")[2];
    if (tileBtn) tileBtn.click();
  });
  await sleep(400);
  const s3Path = path.join(ARTIFACT_DIR, "visual_03_tile_view_max6.png");
  await page.screenshot({ path: s3Path });
  console.log("Captured:", s3Path);

  // Visual 4: Group Editor List mode
  await page.evaluate(() => {
    const bigTileBtn = document.querySelectorAll(".view-mode-btn")[1];
    if (bigTileBtn) bigTileBtn.click();
  });
  await sleep(300);

  await page.evaluate(() => {
    const editBtns = document.querySelectorAll(".nb-big-tile.group-big-tile .action-icon-btn");
    if (editBtns[1]) {
      editBtns[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  await sleep(600);

  const s4Path = path.join(ARTIFACT_DIR, "visual_04_group_editor_list.png");
  await page.screenshot({ path: s4Path });
  console.log("Captured:", s4Path);

  await browser.close();
  server.close();
  console.log("All visual acceptance screenshots captured successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
