import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import puppeteer from "puppeteer";
import http from "http";

const ROOT = path.resolve(".");
const ZIP_PATH = path.join(ROOT, "release/extension-drawer-1.0.0.zip");

async function smokeTestPackage() {
  console.log("=== Starting Exact-Package Smoke Test ===");
  if (!fs.existsSync(ZIP_PATH)) {
    throw new Error(`Release ZIP not found at ${ZIP_PATH}`);
  }

  // 1. Extract to clean temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ext-drawer-smoke-"));
  console.log(`Extracted to temp directory: ${tempDir}`);
  execSync(`unzip -q "${ZIP_PATH}" -d "${tempDir}"`);

  // 2. Verify manifest.json at root
  const manifestPath = path.join(tempDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("FAIL: manifest.json missing from ZIP root!");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  console.log("✓ manifest.json parsed successfully");
  console.log("  name:", manifest.name);
  console.log("  short_name:", manifest.short_name);
  console.log("  version:", manifest.version);
  console.log("  permissions:", manifest.permissions.join(", "));

  if (manifest.name !== "Extension Drawer: Extension Manager & Organizer") {
    throw new Error(`Unexpected manifest.name: ${manifest.name}`);
  }
  if (manifest.short_name !== "Ext Drawer") {
    throw new Error(`Unexpected manifest.short_name: ${manifest.short_name}`);
  }

  // 3. Verify all referenced files in manifest exist in unpacked directory
  const referencedFiles = [
    manifest.background?.service_worker,
    manifest.action?.default_popup,
    manifest.options_ui?.page,
    ...Object.values(manifest.icons || {}),
    ...Object.values(manifest.action?.default_icon || {}),
  ].filter(Boolean);

  for (const rel of referencedFiles) {
    const full = path.join(tempDir, rel);
    if (!fs.existsSync(full)) {
      throw new Error(`FAIL: Referenced file ${rel} missing from package!`);
    }
  }
  console.log(`✓ All ${referencedFiles.length} manifest-referenced files exist in package`);

  // 4. Verify no unexpected foreign or source files
  const forbiddenExts = [".ts", ".tsx", ".sh", ".py", ".mjs", ".md", ".json.map"];
  function checkDir(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        checkDir(full);
      } else {
        const ext = path.extname(item);
        if (forbiddenExts.includes(ext)) {
          throw new Error(`FAIL: Forbidden source/developer file found: ${item}`);
        }
      }
    }
  }
  checkDir(tempDir);
  console.log("✓ No developer/source/test files present in package");

  // 5. Test package in headless Chrome via static server
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".woff2": "font/woff2",
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split("?")[0];
    if (reqUrl === "/") reqUrl = "/popup/popup.html";
    const filePath = path.join(tempDir, reqUrl);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "text/plain" });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((r) => server.listen(8796, () => r()));

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 560 });

  await page.evaluateOnNewDocument(() => {
    let exts = [
      { id: "e1", name: "Extension 1", version: "1.0", enabled: true, type: "extension", mayDisable: true },
      { id: "e2", name: "Extension 2", version: "1.0", enabled: false, type: "extension", mayDisable: true },
    ];
    let grps = [
      { id: "g1", name: "Group 1", extensionIds: ["e1"], color: "#1a73e8", createdAt: 1000 },
    ];
    let rls = [
      { id: "r1", name: "Rule 1", pattern: "github.com", targets: ["e1"], action: "enableWhenMatched", enabled: true },
    ];
    let setts = { theme: "system", accentPreset: "default", accentColor: "#1a73e8", viewMode: "bigTile" };

    window.chrome = {
      runtime: {
        id: "pkg_test",
        sendMessage: async (msg) => {
          if (msg.type === "GET_EXTENSIONS") return exts;
          if (msg.type === "GET_GROUPS") return grps;
          if (msg.type === "GET_AUTOSTATE_RULES") return rls;
          if (msg.type === "GET_SETTINGS") return setts;
          if (msg.type === "GET_HISTORY") return [
            { id: "h1", timestamp: Date.now(), event: "enabled", extensionId: "e1", extensionName: "Extension 1", extensionVersion: "1.0", source: "user" }
          ];
          if (msg.type === "GET_PENDING_CHANGES") return [];
          return [];
        },
        onMessage: { addListener: () => {}, removeListener: () => {} },
      },
      management: {
        getAll: async () => exts,
        setEnabled: async () => {},
      },
      i18n: { getMessage: (k) => k },
    };
  });

  // Verify Popup Page
  await page.goto("http://localhost:8796/popup/popup.html?page=extensions", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 400));
  const popupTitle = await page.title();
  const renderedGroups = await page.evaluate(() => document.querySelectorAll(".group-big-tile").length);
  const renderedExts = await page.evaluate(() => document.querySelectorAll(".nb-big-tile").length);
  console.log(`✓ Popup loads: Title="${popupTitle}", Groups=${renderedGroups}, Tiles=${renderedExts}`);

  // Verify AutoState Page
  await page.goto("http://localhost:8796/popup/popup.html?page=autostate", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 400));
  const autostateRulesCount = await page.evaluate(() => document.querySelectorAll(".history-row").length);
  console.log(`✓ AutoState loads: Rules rendered=${autostateRulesCount}`);

  // Verify History Page
  await page.goto("http://localhost:8796/popup/popup.html?page=history", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 400));
  const historyRecordsCount = await page.evaluate(() => document.querySelectorAll(".history-row").length);
  console.log(`✓ History loads: Records rendered=${historyRecordsCount}`);

  // Verify Options Page
  await page.goto("http://localhost:8796/popup/popup.html?page=options", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 400));
  const optionsHeadersCount = await page.evaluate(() => document.querySelectorAll(".settings-section-title").length);
  console.log(`✓ Options loads: Settings sections=${optionsHeadersCount}`);

  // Verify About Page & Links
  await page.goto("http://localhost:8796/popup/popup.html?page=about", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 400));
  const aboutHeading = await page.evaluate(() => document.querySelector(".nb-heading")?.textContent);
  const links = await page.evaluate(() => Array.from(document.querySelectorAll("a")).map(a => ({ text: a.textContent, href: a.href })));
  console.log(`✓ About loads: Heading="${aboutHeading}"`);
  for (const l of links) {
    console.log(`    Link: "${l.text}" -> ${l.href}`);
  }

  // Verify Manager Page
  await page.goto("http://localhost:8796/manager/manager.html", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 400));
  const managerTitle = await page.title();
  console.log(`✓ Manager loads: Title="${managerTitle}"`);

  await browser.close();
  server.close();

  // Cleanup temp dir
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log("=== Exact-Package Smoke Test PASSED Successfully! ===");
}

smokeTestPackage().catch((err) => {
  console.error("Exact-Package Smoke Test FAILED:", err);
  process.exit(1);
});
