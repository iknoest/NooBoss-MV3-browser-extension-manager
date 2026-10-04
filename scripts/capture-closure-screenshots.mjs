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

function startStaticServer(port = 8799) {
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

// Sample fixtures
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
    pattern: "^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)*linkedin\\.com(?::\\d+)?(?:\\/.*)?$",
    isWildcard: false,
    targets: ["ext_linkedin_helper"],
    action: "enableOnlyWhileMatched",
    priority: 1,
    createdAt: 1000,
  },
];

async function main() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const server = await startStaticServer(8799);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    // Use taller viewport so complete form with buttons and errors is visible
    await page.setViewport({ width: 920, height: 1100 });

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
          query: async () => [{ url: "https://www.linkedin.com/jobs/view/123" }],
        },
        i18n: { getMessage: () => "" },
      };
    }, sampleExtensions, sampleGroups, sampleRules);

    // =========================================================================
    // 1. Site Rules default "This site" scope
    // =========================================================================
    await page.goto("http://localhost:8799/manager/manager.html?page=autostate", {
      waitUntil: "networkidle0",
    });
    await sleep(600);

    // Click "Set as current website" to populate clean linkedin.com
    await page.evaluate(() => {
      const setSiteBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Set as current website")
      );
      if (setSiteBtn) setSiteBtn.click();

      // Select target
      const targetRow = Array.from(document.querySelectorAll(".selectable-row")).find((r) =>
        r.textContent.includes("LinkedIn Talent Assistant")
      );
      if (targetRow) targetRow.click();
    });
    await sleep(300);

    const s1Path = path.join(ARTIFACT_DIR, "01_site_rules_this_site_default.png");
    await page.screenshot({ path: s1Path });
    console.log("Captured 01:", s1Path);

    // =========================================================================
    // 2. Exact page scope
    // =========================================================================
    await page.evaluate(() => {
      const scopeSel = document.getElementById("ruleScopeSelector");
      if (scopeSel) {
        scopeSel.value = "exact";
        scopeSel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await sleep(200);

    await page.evaluate(() => {
      const setPageBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Set as current page")
      );
      if (setPageBtn) {
        setPageBtn.click();
      } else {
        const scopeInput = document.getElementById("ruleScopeInput");
        if (scopeInput) {
          scopeInput.value = "https://www.linkedin.com/jobs/view/123";
          scopeInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    });
    await sleep(300);

    const s2Path = path.join(ARTIFACT_DIR, "02_site_rules_exact_page.png");
    await page.screenshot({ path: s2Path });
    console.log("Captured 02:", s2Path);

    // =========================================================================
    // 3. Custom simple URL pattern
    // =========================================================================
    await page.evaluate(() => {
      const scopeSel = document.getElementById("ruleScopeSelector");
      if (scopeSel) {
        scopeSel.value = "custom";
        scopeSel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await sleep(200);

    await page.evaluate(() => {
      const scopeInput = document.getElementById("ruleScopeInput");
      if (scopeInput) {
        scopeInput.value = "linkedin.com/jobs/*";
        scopeInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      const regexCb = document.getElementById("customUseRegexCheckbox");
      if (regexCb && regexCb.checked) {
        regexCb.click();
      }
    });
    await sleep(300);

    const s3Path = path.join(ARTIFACT_DIR, "03_site_rules_custom_simple_url.png");
    await page.screenshot({ path: s3Path });
    console.log("Captured 03:", s3Path);

    // =========================================================================
    // 4. Custom with Advanced regex expanded
    // =========================================================================
    await page.evaluate(() => {
      const regexCb = document.getElementById("customUseRegexCheckbox");
      if (regexCb && !regexCb.checked) {
        regexCb.click();
      }
    });
    await sleep(200);

    await page.evaluate(() => {
      const scopeInput = document.getElementById("ruleScopeInput");
      if (scopeInput) {
        scopeInput.value = "^https://.*linkedin\\.com/jobs/.*";
        scopeInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await sleep(300);

    const s4Path = path.join(ARTIFACT_DIR, "04_site_rules_custom_advanced_regex.png");
    await page.screenshot({ path: s4Path });
    console.log("Captured 04:", s4Path);

    // =========================================================================
    // 5. Temporary + ON preview
    // =========================================================================
    await page.evaluate(() => {
      // Revert to site scope for clean domain preview
      const scopeSel = document.getElementById("ruleScopeSelector");
      if (scopeSel) {
        scopeSel.value = "site";
        scopeSel.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const scopeInput = document.getElementById("ruleScopeInput");
      if (scopeInput) {
        scopeInput.value = "linkedin.com";
        scopeInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      const timingSel = document.getElementById("ruleTimingSelector");
      if (timingSel) {
        timingSel.value = "temporary";
        timingSel.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const effectSel = document.getElementById("ruleEffectSelector");
      if (effectSel) {
        effectSel.value = "on";
        effectSel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await sleep(300);

    const s5Path = path.join(ARTIFACT_DIR, "05_site_rules_temporary_on_preview.png");
    await page.screenshot({ path: s5Path });
    console.log("Captured 05:", s5Path);

    // =========================================================================
    // 6. One-time + ON preview
    // =========================================================================
    await page.evaluate(() => {
      const timingSel = document.getElementById("ruleTimingSelector");
      if (timingSel) {
        timingSel.value = "onetime";
        timingSel.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const effectSel = document.getElementById("ruleEffectSelector");
      if (effectSel) {
        effectSel.value = "on";
        effectSel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await sleep(300);

    const s6Path = path.join(ARTIFACT_DIR, "06_site_rules_onetime_on_preview.png");
    await page.screenshot({ path: s6Path });
    console.log("Captured 06:", s6Path);

    // =========================================================================
    // 7. Add Rule with zero targets selected (disabled button + inline error)
    // =========================================================================
    await page.evaluate(() => {
      // Deselect all targets
      const selectedRows = document.querySelectorAll(".selectable-row.selected");
      selectedRows.forEach((r) => r.click());
    });
    await sleep(300);

    const s7Path = path.join(ARTIFACT_DIR, "07_site_rules_disabled_zero_targets.png");
    await page.screenshot({ path: s7Path });
    console.log("Captured 07:", s7Path);

    // =========================================================================
    // 8. Group card with obvious member-control entry
    // =========================================================================
    await page.goto("http://localhost:8799/manager/manager.html?page=extensions", {
      waitUntil: "networkidle0",
    });
    await sleep(600);

    const s8Path = path.join(ARTIFACT_DIR, "08_group_card_control_members_entry.png");
    await page.screenshot({ path: s8Path });
    console.log("Captured 08:", s8Path);

    // =========================================================================
    // 9. Group Focus with persistent individual ON/OFF switches
    // =========================================================================
    await page.evaluate(() => {
      const controlBtn = document.querySelector(".group-big-tile .group-control-members-btn");
      if (controlBtn) {
        controlBtn.click();
      } else {
        const titleSpan = Array.from(document.querySelectorAll(".group-big-tile .item-name")).find(
          (el) => el.textContent.includes("Job search")
        );
        if (titleSpan) titleSpan.click();
      }
    });
    await sleep(600);

    const s9Path = path.join(ARTIFACT_DIR, "09_group_focus_persistent_individual_toggles.png");
    await page.screenshot({ path: s9Path });
    console.log("Captured 09:", s9Path);

    // =========================================================================
    // 10. Group Edit with no header/input/close overlap
    // =========================================================================
    await page.evaluate(() => {
      const editBtn = document.querySelector(".group-focus-edit-btn");
      if (editBtn) {
        editBtn.click();
      } else {
        const anyEdit = document.querySelector("button[aria-label='Edit members']");
        if (anyEdit) anyEdit.click();
      }
    });
    await sleep(600);

    const s10Path = path.join(ARTIFACT_DIR, "10_group_edit_no_header_overlap.png");
    await page.screenshot({ path: s10Path });
    console.log("Captured 10:", s10Path);

    // =========================================================================
    // 11. Group membership Undo enabled
    // =========================================================================
    // Toggle an extension inside the group editor to populate the undo stack
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll(".subwindow-box .selectable-row"));
      const codeRow = rows.find((r) => r.textContent.includes("Code Editor Snippets"));
      if (codeRow) codeRow.click();
    });
    await sleep(400);

    const s11Path = path.join(ARTIFACT_DIR, "11_group_membership_undo_enabled.png");
    await page.screenshot({ path: s11Path });
    console.log("Captured 11:", s11Path);

    // =========================================================================
    // 12. Group membership Undo disabled
    // =========================================================================
    // Click undo button to empty the undo stack
    await page.evaluate(() => {
      const undoBtn = document.querySelector(".subwindow-box .membership-undo-btn");
      if (undoBtn) undoBtn.click();
    });
    await sleep(400);

    const s12Path = path.join(ARTIFACT_DIR, "12_group_membership_undo_disabled.png");
    await page.screenshot({ path: s12Path });
    console.log("Captured 12:", s12Path);

    console.log("🎉 All 12 closure milestone screenshots captured successfully!");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
