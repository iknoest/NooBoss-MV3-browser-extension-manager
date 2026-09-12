import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const ARTIFACT_DIR = "/Users/ava/.gemini/antigravity/brain/a61582c5-ddf9-422d-8e81-0925bfcf4db8/screenshots";

async function sleep(ms) {
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

// Sample extension fixtures
const sampleExtensions = [
  {
    id: "ext_linkedin_helper",
    name: "LinkedIn Talent Assistant",
    version: "2.1.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Search candidate profiles with advanced filters.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_job_tracker",
    name: "Job Application Tracker",
    version: "1.4.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Keep track of active job submissions.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_resume_formatter",
    name: "Resume PDF Formatter",
    version: "3.0.1",
    enabled: false,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Export and format clean resume templates.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_code_editor",
    name: "Code Editor Snippets",
    version: "1.0.0",
    enabled: true,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Insert programming boilerplate snippets.",
    icons: [{ size: 48, url: "" }],
  },
  {
    id: "ext_ad_shield",
    name: "Content Shield",
    version: "2.0.0",
    enabled: false,
    type: "extension",
    installType: "normal",
    mayDisable: true,
    description: "Block unwanted ads and trackers.",
    icons: [{ size: 48, url: "" }],
  },
];

const sampleGroups = [
  {
    id: "g_job_search",
    name: "Job search",
    extensionIds: ["ext_linkedin_helper", "ext_job_tracker", "ext_resume_formatter"],
    color: "#1a73e8",
    createdAt: 1000,
    icon: { type: "material", name: "business_center" },
  },
  {
    id: "g_dev",
    name: "Developer Tools",
    extensionIds: ["ext_code_editor"],
    color: "#34a853",
    createdAt: 2000,
    icon: { type: "material", name: "code" },
  },
];

const sampleRules = [
  {
    id: "rule_linkedin",
    enabled: true,
    name: "LinkedIn Automation",
    pattern: "https://www.linkedin.com/*",
    isWildcard: true,
    targets: ["g_job_search", "ext_linkedin_helper"],
    action: "enableOnlyWhileMatched",
    priority: 1,
    createdAt: 1000,
  },
];

async function main() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const server = await startStaticServer(8798);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 840, height: 620 });

    await page.evaluateOnNewDocument((exts, grps, rls) => {
      window.__INTERNAL_EXTS = JSON.parse(JSON.stringify(exts));
      window.__INTERNAL_GRPS = JSON.parse(JSON.stringify(grps));
      window.__INTERNAL_RLS = JSON.parse(JSON.stringify(rls));
      window.__INTERNAL_SETTS = {
        theme: "light",
        accentPreset: "default",
        accentColor: "#1a73e8",
        viewMode: "bigTile",
        showRecommendedIcons: true,
      };

      window.__MESSAGE_LISTENERS = [];

      window.chrome = {
        runtime: {
          id: "nooboss_test_id",
          sendMessage: async (msg) => {
            if (!msg || !msg.type) return null;
            switch (msg.type) {
              case "GET_EXTENSIONS":
                return JSON.parse(JSON.stringify(window.__INTERNAL_EXTS));
              case "GET_GROUPS":
                return JSON.parse(JSON.stringify(window.__INTERNAL_GRPS));
              case "GET_AUTOSTATE_RULES":
                return JSON.parse(JSON.stringify(window.__INTERNAL_RLS));
              case "GET_HISTORY":
                return [];
              case "GET_SETTINGS":
                return window.__INTERNAL_SETTS;
              case "GET_PENDING_CHANGES":
                return [];
              case "SAVE_SETTINGS":
                window.__INTERNAL_SETTS = { ...window.__INTERNAL_SETTS, ...msg.settings };
                return { success: true };
              case "SAVE_AUTOSTATE_RULES":
                window.__INTERNAL_RLS = [...msg.rules];
                return { success: true };
              case "UPDATE_GROUP":
                window.__INTERNAL_GRPS = window.__INTERNAL_GRPS.map((g) =>
                  g.id === msg.group.id ? msg.group : g
                );
                return { success: true };
              default:
                return { success: true };
            }
          },
          onMessage: {
            addListener: (fn) => window.__MESSAGE_LISTENERS.push(fn),
            removeListener: (fn) => {
              window.__MESSAGE_LISTENERS = window.__MESSAGE_LISTENERS.filter((f) => f !== fn);
            },
          },
        },
        management: {
          setEnabled: async (id, enabled) => {
            const ext = window.__INTERNAL_EXTS.find((e) => e.id === id);
            if (ext) ext.enabled = enabled;
            return Promise.resolve();
          },
          get: async (id) => window.__INTERNAL_EXTS.find((e) => e.id === id),
          getAll: async () => window.__INTERNAL_EXTS,
        },
        tabs: {
          query: async () => [{ url: "https://www.linkedin.com/feed/" }],
        },
        // Returning empty string triggers fallback to EN_MESSAGES in i18n.ts
        i18n: { getMessage: () => "" },
      };
    }, sampleExtensions, sampleGroups, sampleRules);

    // =========================================================================
    // 1. Top Filter Baseline (No App / Theme) - Screenshot 08
    // =========================================================================
    await page.goto("http://localhost:8798/manager/manager.html?page=extensions", {
      waitUntil: "networkidle0",
    });
    await sleep(600);

    // Expand select so options are visually visible in screenshot
    await page.evaluate(() => {
      const sel = document.getElementById("typeFilter");
      if (sel) {
        sel.size = sel.options.length;
        sel.style.height = "auto";
        sel.style.minHeight = "75px";
        sel.style.background = "#ffffff";
        sel.style.zIndex = "100";
        sel.style.padding = "4px";
      }
    });
    await sleep(200);

    const s8Path = path.join(ARTIFACT_DIR, "08_top_filter_no_app_theme.png");
    await page.screenshot({ path: s8Path });
    console.log("Captured:", s8Path);

    // Restore select size
    await page.evaluate(() => {
      const sel = document.getElementById("typeFilter");
      if (sel) {
        sel.size = 1;
        sel.style.background = "";
      }
    });
    await sleep(200);

    // =========================================================================
    // 2. Group Focus (Outcome C): Click Job search card body - Screenshot 06
    // =========================================================================
    await page.evaluate(() => {
      const groupTile = document.querySelector(".group-big-tile");
      if (groupTile) groupTile.click();
    });
    await sleep(500);

    const s6Path = path.join(ARTIFACT_DIR, "06_group_focused_extensions_view.png");
    await page.screenshot({ path: s6Path });
    console.log("Captured:", s6Path);

    // =========================================================================
    // 3. Clear Group Focus (Outcome C): Click [×] button - Screenshot 07
    // =========================================================================
    await page.evaluate(() => {
      const clearBtn = document.querySelector(".group-focus-clear-btn");
      if (clearBtn) clearBtn.click();
    });
    await sleep(500);

    const s7Path = path.join(ARTIFACT_DIR, "07_group_focus_cleared.png");
    await page.screenshot({ path: s7Path });
    console.log("Captured:", s7Path);

    // =========================================================================
    // 4. Open Group Membership Editor (Outcome B) - Screenshot 04
    // =========================================================================
    await page.evaluate(() => {
      const editBtn = document.querySelector(".group-big-tile button[title='Edit Group']");
      if (editBtn) editBtn.click();
    });
    await sleep(600);

    const s4Path = path.join(ARTIFACT_DIR, "04_group_editor_membership.png");
    await page.screenshot({ path: s4Path });
    console.log("Captured:", s4Path);

    // =========================================================================
    // 5. Toggle "Assigned only" in Group Editor (Outcome B) - Screenshot 05
    // =========================================================================
    await page.evaluate(() => {
      const assignedOnlyBtn = document.querySelector(".assigned-only-toggle-btn");
      if (assignedOnlyBtn) assignedOnlyBtn.click();
    });
    await sleep(500);

    const s5Path = path.join(ARTIFACT_DIR, "05_group_editor_assigned_only.png");
    await page.screenshot({ path: s5Path });
    console.log("Captured:", s5Path);

    // Close SubWindow
    await page.evaluate(() => {
      const closeBtn = document.querySelector(".subwindow-close-btn");
      if (closeBtn) closeBtn.click();
    });
    await sleep(400);

    // =========================================================================
    // 6. Navigate to AutoState Tab: Rules Table (Outcome A3) - Screenshot 03
    // =========================================================================
    await page.goto("http://localhost:8798/manager/manager.html?page=autostate", {
      waitUntil: "networkidle0",
    });
    await sleep(600);

    const s3Path = path.join(ARTIFACT_DIR, "03_autostate_existing_rule.png");
    await page.screenshot({ path: s3Path });
    console.log("Captured:", s3Path);

    // =========================================================================
    // 7. AutoState: New Rule with Website pattern (Outcome A1) - Screenshot 01
    // =========================================================================
    // Populate LinkedIn URL via "Set as current website"
    await page.evaluate(() => {
      const setSiteBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Set as current website")
      );
      if (setSiteBtn) setSiteBtn.click();

      // Scroll the new rule section into view
      const newRuleHeadings = Array.from(document.querySelectorAll("h2"));
      const newRuleHeader = newRuleHeadings.find((h) => h.textContent.includes("New Rule") || h.textContent.includes("Add rule"));
      if (newRuleHeader) newRuleHeader.scrollIntoView({ behavior: "instant", block: "start" });
    });
    await sleep(400);

    const s1Path = path.join(ARTIFACT_DIR, "01_autostate_new_website_pattern.png");
    await page.screenshot({ path: s1Path });
    console.log("Captured:", s1Path);

    // =========================================================================
    // 8. AutoState: Regular expression (advanced) (Outcome A1) - Screenshot 02
    // =========================================================================
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll("select"));
      const patternSelect = selects.find((s) =>
        Array.from(s.options).some((o) => o.value === "RegExp" || o.value === "wildcard")
      );
      if (patternSelect) {
        patternSelect.value = "RegExp";
        patternSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await sleep(300);

    await page.evaluate(() => {
      const setSiteBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Set as current website")
      );
      if (setSiteBtn) setSiteBtn.click();
    });
    await sleep(400);

    const s2Path = path.join(ARTIFACT_DIR, "02_autostate_new_regex.png");
    await page.screenshot({ path: s2Path });
    console.log("Captured:", s2Path);

    // =========================================================================
    // 9. Conditional App/Theme in Type Filter (Outcome D) - Screenshot 09
    // =========================================================================
    // Navigate back to extensions view
    await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll(".nav-link"));
      const extBtn = navLinks.find((el) => el.textContent.includes("Extensions"));
      if (extBtn) extBtn.click();
    });
    await sleep(500);

    // Inject an app and a theme and notify listeners
    await page.evaluate(() => {
      window.__INTERNAL_EXTS = [
        ...window.__INTERNAL_EXTS,
        {
          id: "app_sheets_sample",
          name: "Sheets Web Workspace",
          version: "1.2.0",
          enabled: true,
          type: "hosted_app",
          installType: "normal",
          mayDisable: true,
          description: "Spreadsheet web application.",
          icons: [],
        },
        {
          id: "theme_dark_slate",
          name: "Slate Dark Theme",
          version: "1.0.0",
          enabled: true,
          type: "theme",
          installType: "normal",
          mayDisable: true,
          description: "Custom dark contrast theme.",
          icons: [],
        },
      ];
      if (window.__MESSAGE_LISTENERS) {
        window.__MESSAGE_LISTENERS.forEach((fn) => fn({ type: "STATE_CHANGED" }));
      }
    });
    await sleep(600);

    // Expand select so all 5 options are visible
    await page.evaluate(() => {
      const sel = document.getElementById("typeFilter");
      if (sel) {
        sel.size = sel.options.length;
        sel.style.height = "auto";
        sel.style.minHeight = "120px";
        sel.style.background = "#ffffff";
        sel.style.zIndex = "100";
        sel.style.padding = "4px";
      }
    });
    await sleep(200);

    const s9Path = path.join(ARTIFACT_DIR, "09_top_filter_with_app_theme.png");
    await page.screenshot({ path: s9Path });
    console.log("Captured:", s9Path);

    console.log("🎉 All 9 screenshots generated successfully!");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
