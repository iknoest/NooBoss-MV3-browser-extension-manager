import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(ROOT, "screenshots");

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
    await page.setViewport({ width: 860, height: 780 });

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
    // 1. Site Rules: Default "This website" Scope & While+ON Preview - Screenshot 01
    // =========================================================================
    await page.goto("http://localhost:8798/manager/manager.html?page=autostate", {
      waitUntil: "networkidle0",
    });
    await sleep(600);

    // Populate LinkedIn via "Set as current website"
    await page.evaluate(() => {
      const setSiteBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Set as current website")
      );
      if (setSiteBtn) setSiteBtn.click();
    });
    await sleep(400);

    const s1Path = path.join(ARTIFACT_DIR, "01_site_rules_this_website_default.png");
    await page.screenshot({ path: s1Path });
    console.log("Captured:", s1Path);

    // =========================================================================
    // 2. Site Rules: Scope Dropdown Showing All 4 Options - Screenshot 02
    // =========================================================================
    await page.evaluate(() => {
      const scopeSel = document.getElementById("ruleScopeSelector");
      if (scopeSel) {
        scopeSel.size = 4;
        scopeSel.style.height = "auto";
        scopeSel.style.minHeight = "95px";
        scopeSel.style.background = "#ffffff";
        scopeSel.style.zIndex = "100";
        scopeSel.style.padding = "4px";
      }
    });
    await sleep(300);

    const s2Path = path.join(ARTIFACT_DIR, "02_site_rules_scope_dropdown_options.png");
    await page.screenshot({ path: s2Path });
    console.log("Captured:", s2Path);

    // Restore scope selector
    await page.evaluate(() => {
      const scopeSel = document.getElementById("ruleScopeSelector");
      if (scopeSel) {
        scopeSel.size = 1;
        scopeSel.style.height = "";
        scopeSel.style.minHeight = "";
        scopeSel.style.background = "";
      }
    });
    await sleep(200);

    // =========================================================================
    // 3. Site Rules: Dynamic Behavior Preview (When + ON) - Screenshot 03
    // =========================================================================
    await page.evaluate(() => {
      const timingSel = document.getElementById("ruleTimingSelector");
      if (timingSel) {
        timingSel.value = "when";
        timingSel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await sleep(400);

    const s3Path = path.join(ARTIFACT_DIR, "03_site_rules_dynamic_behavior_preview_when.png");
    await page.screenshot({ path: s3Path });
    console.log("Captured:", s3Path);

    // =========================================================================
    // 4. Group Membership Editor with Undo / Redo Controls - Screenshot 04
    // =========================================================================
    await page.goto("http://localhost:8798/manager/manager.html?page=extensions", {
      waitUntil: "networkidle0",
    });
    await sleep(600);

    // Open Job search edit dialog
    await page.evaluate(() => {
      const editBtn = document.querySelector(".group-big-tile button[title='Edit Group']");
      if (editBtn) editBtn.click();
    });
    await sleep(600);

    // Toggle an extension to populate undo stack so Undo is enabled and visible
    await page.evaluate(() => {
      // Toggle Code Editor Snippets (ext_code_editor)
      const rows = Array.from(document.querySelectorAll(".selectable-row"));
      const codeRow = rows.find((r) => r.textContent.includes("Code Editor Snippets"));
      if (codeRow) codeRow.click();
    });
    await sleep(400);

    const s4Path = path.join(ARTIFACT_DIR, "04_group_membership_editor_undo_redo.png");
    await page.screenshot({ path: s4Path });
    console.log("Captured:", s4Path);

    // Close SubWindow
    await page.evaluate(() => {
      const closeBtn = document.querySelector(".subwindow-close-btn");
      if (closeBtn) closeBtn.click();
    });
    await sleep(400);

    // =========================================================================
    // 5. Group Focus: Member Extensions with Visible Individual ON/OFF - Screenshot 05
    // =========================================================================
    // Click Job search group card to activate focus
    await page.evaluate(() => {
      const titleSpan = Array.from(document.querySelectorAll(".group-big-tile .item-name")).find(
        (el) => el.textContent.includes("Job search")
      );
      if (titleSpan) titleSpan.click();
    });
    await sleep(600);

    const s5Path = path.join(ARTIFACT_DIR, "05_group_focused_individual_toggles_visible.png");
    await page.screenshot({ path: s5Path });
    console.log("Captured:", s5Path);

    console.log("🎉 All 5 UX milestone screenshots generated successfully!");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
