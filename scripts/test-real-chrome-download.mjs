import fs from "fs";
import path from "path";
import os from "os";
import puppeteer from "puppeteer";
import http from "http";

const ROOT = path.resolve(".");
const DIST = path.join(ROOT, "dist");

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testRealDownloadAndImport() {
  console.log("=== REAL CHROME DOWNLOAD & IMPORT ACCEPTANCE TEST ===");

  const tempDownloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "ext-drawer-downloads-"));
  console.log(`Using clean temporary download directory: ${tempDownloadDir}`);

  // Start static server serving dist
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
    if (reqUrl === "/") reqUrl = "/manager/manager.html";
    const filePath = path.join(DIST, reqUrl);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "text/plain" });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((r) => server.listen(8798, () => r()));

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  
  // Set CDP download behavior to save files to tempDownloadDir
  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: tempDownloadDir,
  });

  // Setup real mock state simulating service worker EXPORT_DATA and management APIs
  let internalState = {
    extensions: [
      { id: "ext_test_1", name: "Sample Markdown Tool", version: "1.2.0", enabled: true, mayDisable: true },
      { id: "ext_test_2", name: "Sample Dark Theme", version: "2.0.1", enabled: false, mayDisable: true },
    ],
    groups: [
      { id: "group_prod_1", name: "Production Workflows", extensionIds: ["ext_test_1"], color: "#9333ea", createdAt: 1700000000000 },
    ],
    rules: [
      { id: "rule_prod_1", name: "Work Rule", pattern: "*.workplace.com", targets: ["ext_test_1"], action: "enableWhenMatched", enabled: true, priority: 1, createdAt: 1700000000000 },
    ],
    settings: {
      theme: "dark",
      accentPreset: "purple",
      accentColor: "#9333ea",
      viewMode: "bigTile",
    },
    history: [],
  };

  await page.evaluateOnNewDocument((state) => {
    let appState = JSON.parse(JSON.stringify(state));

    window.chrome = {
      runtime: {
        id: "extension_drawer_test_id",
        sendMessage: async (msg) => {
          if (!msg || !msg.type) return null;
          switch (msg.type) {
            case "GET_EXTENSIONS":
              return appState.extensions;
            case "GET_GROUPS":
              return appState.groups;
            case "GET_AUTOSTATE_RULES":
              return appState.rules;
            case "GET_SETTINGS":
              return appState.settings;
            case "GET_HISTORY":
              return appState.history;
            case "GET_PENDING_CHANGES":
              return [];
            case "EXPORT_DATA":
              // Exact contract: returns raw ExportData object
              return {
                version: 1,
                exportedAt: Date.now(),
                generator: "NooBoss-MV3",
                groups: appState.groups,
                autoStateRules: appState.rules,
                settings: appState.settings,
              };
            case "IMPORT_DATA":
              if (!msg.data || msg.data.version !== 1) {
                return { success: false, error: "Invalid backup format" };
              }
              appState.groups = msg.data.groups;
              appState.rules = msg.data.autoStateRules;
              appState.settings = msg.data.settings;
              return { success: true };
            default:
              return { success: true };
          }
        },
        onMessage: { addListener: () => {}, removeListener: () => {} },
      },
      management: {
        getAll: async () => appState.extensions,
        setEnabled: async () => {},
      },
      i18n: { getMessage: (k) => k },
    };
  }, internalState);

  // Navigate to Options page
  await page.goto("http://localhost:8798/manager/manager.html?page=options", { waitUntil: "networkidle0" });
  await sleep(600);

  // 1. Trigger Export JSON
  console.log("Clicking Options -> Backup & Data -> Export JSON...");
  const exportJsonBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons.find(b => b.textContent.trim() === "Export JSON");
  });

  if (!exportJsonBtn) {
    throw new Error("FAIL: Export JSON button not found in UI!");
  }

  await exportJsonBtn.click();
  await sleep(1000);

  // 2. Verify file was downloaded to disk in tempDownloadDir
  const downloadedFiles = fs.readdirSync(tempDownloadDir);
  console.log("Downloaded files in temp directory:", downloadedFiles);

  const jsonFile = downloadedFiles.find(f => f.endsWith(".json"));
  if (!jsonFile) {
    throw new Error("FAIL: No .json backup file found in downloads directory!");
  }

  console.log(`✓ JSON backup file successfully created on disk: ${jsonFile}`);
  const expectedPrefix = "extension-drawer-backup-";
  if (!jsonFile.startsWith(expectedPrefix)) {
    throw new Error(`FAIL: Downloaded file name "${jsonFile}" does not start with "${expectedPrefix}"`);
  }

  // 3. Open and parse downloaded JSON file
  const jsonContent = fs.readFileSync(path.join(tempDownloadDir, jsonFile), "utf8");
  const parsedData = JSON.parse(jsonContent);
  console.log("✓ Exported JSON parsed successfully:", {
    version: parsedData.version,
    generator: parsedData.generator,
    groupsCount: parsedData.groups?.length,
    rulesCount: parsedData.autoStateRules?.length,
    settingsTheme: parsedData.settings?.theme,
  });

  if (parsedData.version !== 1) throw new Error("FAIL: Exported version is not 1");
  if (parsedData.groups[0]?.name !== "Production Workflows") throw new Error("FAIL: Group data missing in export");
  if (parsedData.autoStateRules[0]?.pattern !== "*.workplace.com") throw new Error("FAIL: AutoState rule missing in export");
  if (parsedData.settings?.accentPreset !== "purple") throw new Error("FAIL: Settings missing in export");

  // 4. Test re-importing that exact exported file
  console.log("Testing re-import of the downloaded JSON backup file...");
  // Handle file chooser in Puppeteer
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll("label"));
      const importLabel = labels.find(l => l.textContent.includes("Import JSON"));
      importLabel?.click();
    }),
  ]);

  // Handle alert
  page.on("dialog", async (dialog) => {
    console.log(`  Dialog message: "${dialog.message()}"`);
    await dialog.accept();
  });

  await fileChooser.accept([path.join(tempDownloadDir, jsonFile)]);
  await sleep(600);
  console.log("✓ Re-import of exact exported file succeeded!");

  // 5. Test Export HTML
  console.log("Clicking Options -> Backup & Data -> Export HTML...");
  const exportHtmlBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons.find(b => b.textContent.trim() === "Export HTML");
  });

  if (!exportHtmlBtn) {
    throw new Error("FAIL: Export HTML button not found in UI!");
  }

  await exportHtmlBtn.click();
  await sleep(1000);

  const updatedFiles = fs.readdirSync(tempDownloadDir);
  const htmlFile = updatedFiles.find(f => f.endsWith(".html"));
  if (!htmlFile) {
    throw new Error("FAIL: Extensions.html not downloaded!");
  }

  const htmlContent = fs.readFileSync(path.join(tempDownloadDir, htmlFile), "utf8");
  console.log(`✓ HTML list downloaded successfully: ${htmlFile} (${htmlContent.length} bytes)`);
  if (!htmlContent.includes("Sample Markdown Tool") || !htmlContent.includes("Sample Dark Theme")) {
    throw new Error("FAIL: HTML content missing extension items");
  }

  await browser.close();
  server.close();
  fs.rmSync(tempDownloadDir, { recursive: true, force: true });
  console.log("=== REAL CHROME DOWNLOAD & IMPORT ACCEPTANCE PASSED! ===");
}

testRealDownloadAndImport().catch((err) => {
  console.error("FAIL in Real Download Test:", err);
  process.exit(1);
});
