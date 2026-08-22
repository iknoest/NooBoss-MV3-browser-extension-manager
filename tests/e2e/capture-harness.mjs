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

// Simple static file server for dist directory
function startStaticServer(port = 8787) {
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
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

  const server = await startStaticServer(8787);
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
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_placeholder" }],
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
      enabled: true,
      type: "extension",
      installType: "normal",
      mayDisable: true,
      description: "Redux dev tools inspection and state time-traveling.",
      icons: [{ size: 48, url: "https://lh3.googleusercontent.com/fife/ALs6j_redux" }],
    },
  ];

  // Assign extensions and rich material icons to migrated groups
  const groupsWithExts = (migratedData.groups || []).map((g, idx) => {
    if (idx === 0) return { ...g, icon: { type: "material", name: "shopping_cart" }, extensionIds: ["ghbmnnjggjcganegdakffhaeglpncmno", "cjpalhdlnbpafiamejdnhcphjbkeiagm"] };
    if (idx === 1) return { ...g, icon: { type: "material", name: "code" }, extensionIds: ["fmkadmapgofadopljbjfkapdkoienihi", "lmhkpmbekcpmknklioeibfkpmmfibljd"] };
    if (idx === 2) return { ...g, icon: { type: "material", name: "shield" }, extensionIds: ["eimadpbcbfnmbkopoojfekhnkhdbieeh"] };
    if (idx === 3) return { ...g, icon: { type: "material", name: "work" }, extensionIds: ["nkbihfbeogaeaoehlefnkodbefgpgknn"] };
    if (idx === 4) return { ...g, icon: { type: "material", name: "movie" }, extensionIds: [] };
    if (idx === 5) return { ...g, icon: { type: "material", name: "palette" }, extensionIds: [] };
    return { ...g, icon: { type: "material", name: "folder" }, extensionIds: [] };
  });

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 560 });

  // Injected chrome API bridge
  await page.evaluateOnNewDocument((exts, grps, rls, setts) => {
    let internalExts = [...exts];
    let internalGrps = [...grps];
    let internalRls = [...rls];
    let internalSetts = { ...setts, theme: "system", accentPreset: "default", accentColor: "#1a73e8" };
    let internalHist = [
      { id: "h1", extensionId: "ghbmnnjggjcganegdakffhaeglpncmno", extensionName: "ChatGPT for Chrome", action: "enabled", timestamp: Date.now() - 3600000 },
      { id: "h2", extensionId: "cjpalhdlnbpafiamejdnhcphjbkeiagm", extensionName: "uBlock Origin", action: "installed", timestamp: Date.now() - 7200000 },
    ];

    window.chrome = {
      runtime: {
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
              return internalHist;
            case "GET_SETTINGS":
              return internalSetts;
            case "GET_PENDING_CHANGES":
              return [];
            case "TOGGLE_EXTENSION": {
              const ext = internalExts.find((e) => e.id === msg.id);
              if (ext) ext.enabled = msg.enabled;
              return { success: true };
            }
            case "TOGGLE_GROUP": {
              const grp = internalGrps.find((g) => g.id === msg.id);
              if (grp) {
                grp.extensionIds.forEach((id) => {
                  const ext = internalExts.find((e) => e.id === id);
                  if (ext) ext.enabled = msg.enabled;
                });
              }
              return { success: true };
            }
            case "SAVE_SETTINGS":
              internalSetts = { ...internalSetts, ...msg.settings };
              return { success: true };
            case "UPDATE_GROUP": {
              internalGrps = internalGrps.map((g) => (g.id === msg.group.id ? msg.group : g));
              return { success: true };
            }
            case "CREATE_GROUP": {
              const newGrp = { id: "g_" + Date.now(), name: msg.name, extensionIds: [], color: "#1a73e8" };
              internalGrps.push(newGrp);
              return { success: true, group: newGrp };
            }
            case "DELETE_GROUP":
              internalGrps = internalGrps.filter((g) => g.id !== msg.id);
              return { success: true };
            case "CLEAR_HISTORY":
              internalHist = [];
              return { success: true };
            case "EXPORT_DATA":
              return { version: 1, exportedAt: Date.now(), groups: internalGrps, autoStateRules: internalRls, settings: internalSetts };
            default:
              return { success: true };
          }
        },
        onMessage: {
          addListener: () => {},
          removeListener: () => {},
        },
      },
      i18n: {
        getMessage: (key) => key,
      },
    };
  }, sampleExtensions, groupsWithExts, migratedData.autoStateRules || [], migratedData.settings || {});

  console.log("Navigating to popup on localhost:8787...");
  await page.goto("http://localhost:8787/popup/popup.html", { waitUntil: "networkidle0" });
  await sleep(1000);

  // 1. Default landing page (Extensions / Manage) in Tile View (76x76)
  const s1Path = path.join(ARTIFACT_DIR, "modern_01_manage_tile_default.png");
  await page.screenshot({ path: s1Path });
  console.log("Captured:", s1Path);

  // 2. Big Tile View (212x66)
  const bigTileBtn = await page.$("button[title=\"Big tile view\"]");
  if (bigTileBtn) {
    await bigTileBtn.click();
    await sleep(400);
  }
  const s2Path = path.join(ARTIFACT_DIR, "modern_02_manage_big_tile.png");
  await page.screenshot({ path: s2Path });
  console.log("Captured:", s2Path);

  // 3. List View (33px row)
  const listBtn = await page.$("button[title=\"List view\"]");
  if (listBtn) {
    await listBtn.click();
    await sleep(400);
  }
  const s3Path = path.join(ARTIFACT_DIR, "modern_03_manage_list.png");
  await page.screenshot({ path: s3Path });
  console.log("Captured:", s3Path);

  // 4. Options View (Modern Appearance & Settings)
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll(".nav-link")).find(
      (el) => el.textContent.includes("Options") || el.textContent.includes("options")
    );
    if (btn) btn.click();
  });
  await sleep(600);
  const s4Path = path.join(ARTIFACT_DIR, "modern_04_options_appearance.png");
  await page.screenshot({ path: s4Path });
  console.log("Captured:", s4Path);

  // 5. Dark Theme in Options
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll(".settings-select"));
    if (selects[0]) {
      selects[0].value = "dark";
      selects[0].dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await sleep(600);
  const s5Path = path.join(ARTIFACT_DIR, "modern_05_dark_mode.png");
  await page.screenshot({ path: s5Path });
  console.log("Captured:", s5Path);

  // Switch back to Light theme
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll(".settings-select"));
    if (selects[0]) {
      selects[0].value = "light";
      selects[0].dispatchEvent(new Event("change", { bubbles: true }));
    }
    const manageBtn = Array.from(document.querySelectorAll(".sub-link")).find(
      (el) => el.textContent.includes("Manage") || el.textContent.includes("manage")
    );
    if (manageBtn) manageBtn.click();
  });
  await sleep(600);

  // 6. Group Edit Modal & Single Tri-State State Control
  await page.evaluate(() => {
    const editBtns = document.querySelectorAll(".list-actions svg, .item-controls svg");
    if (editBtns[1]) {
      editBtns[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  await sleep(600);
  const s6Path = path.join(ARTIFACT_DIR, "modern_06_group_edit_modal.png");
  await page.screenshot({ path: s6Path });
  console.log("Captured:", s6Path);

  // 7. Group Icon Picker Modal
  const iconEditBtn = await page.$(".group-icon-edit-btn");
  if (iconEditBtn) {
    await iconEditBtn.click();
    await sleep(500);
  }
  const s7Path = path.join(ARTIFACT_DIR, "modern_07_group_icon_picker.png");
  await page.screenshot({ path: s7Path });
  console.log("Captured:", s7Path);

  // 8. Group Icon Search
  const searchInput = await page.$(".icon-picker-search-bar input");
  if (searchInput) {
    await searchInput.type("cart");
    await sleep(400);
  }
  const s8Path = path.join(ARTIFACT_DIR, "modern_08_group_icon_search.png");
  await page.screenshot({ path: s8Path });
  console.log("Captured:", s8Path);

  await browser.close();
  server.close();
  console.log("All modern visual screenshots generated successfully!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
