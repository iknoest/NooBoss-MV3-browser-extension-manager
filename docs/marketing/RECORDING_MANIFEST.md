# Extension Drawer — Authentic Recording Manifest (Final Composition)

This manifest documents the exact profile, browser, extensions, websites, framing, and verified behaviors used to produce the final marketing demo videos and milestone verification sheet for Extension Drawer 1.2.1.

---

## 1. Environment & Browser Configuration

- **Execution Environment**: Dedicated clean, non-personal profile (`/tmp/clean-demo-chrome-profile`).
- **Personal Data Protection**: Strictly zero personal Ava data, logins, cookies, bookmarks, or history.
- **Browser Binary**: Google Chrome for Testing (`155.0.8059.39`, `mac-arm64`).
- **Extension Injection Protocol**: Standard Chrome unpacked extension loading (`--load-extension`) in clean testing container without synthetic mocks.
- **Display Resolution**: 1920 × 1080 (16:9 Full HD, 30 fps, H.264 `yuv420p`).
- **Composition Pass Editorial**:
  - **Browser Context Preserved**: Real Chrome tab strip, omnibox displaying `https://en.wikipedia.org/wiki/Google_Chrome` with `wikipedia.org` prominently highlighted, and Dark Reader status badge (OFF ➔ ON) in toolbar.
  - **Dead Whitespace Eliminated**: Camera punch-in (125%–145% scale) centered on active UI bounds with +40–60px breathing room. Content occupies 75%–85% of the usable frame.
  - **Visual Storytelling**: Cubic easing camera motion, radial vignettes, floating status pills, and cause-and-effect split screen.

---

## 2. Extensions Inventory (Genuine Chrome Web Store Builds)

All extensions were downloaded directly from official Google Chrome Web Store update infrastructure (`clients2.google.com/service/update2/crx`) and loaded as authentic unpacked MV3 extensions:

| Extension Name | Extension ID | Version | Category / Purpose |
| :--- | :--- | :--- | :--- |
| **Extension Drawer** | `onkcjpfgllpfbimnchjehboikhippnka` | `1.2.1` | Local build under demonstration (`dist/`) |
| **Dark Reader** | `fkikfjooconhpjegghhgfcohbdabdkhh` | `4.9.133` | Real theme / content script automation target |
| **React Developer Tools** | `ljjcmknnmbjgfjfjhmildlclelkoinff` | `8.0.0` | Developer tooling & inspection |
| **Wappalyzer - Technology profiler** | `jicmneenpelaeldhlinkcobndlkbbjjl` | `6.12.7` | Web stack & network profiler |
| **OneTab** | `chphlpgkkbolifaimnlloiipkdnihall` | `2.21` | Productivity & tab manager |

---

## 3. Real Websites Visited

- **Wikipedia**: `https://en.wikipedia.org/wiki/Google_Chrome`
  - Purpose: Live proof of Site Rules automatic matching, dark theme injection, and tab-close restoration.
  - Verification: Dark Reader content script executes directly on Wikipedia DOM, turning the page dark while tab is active, and cleanly restoring state when closed. Both baseline and split-screen views clearly display the Google Chrome tab and omnibox URL.

---

## 4. Authentic Verified Behaviors

1. **Search & Single Extension State Toggle (45s Cut only)**:
   - Progressive search for `react` filters inventory down to React Developer Tools.
   - Switch toggle turns React Developer Tools `OFF` (`chrome.management.get()` verified `enabled: false`).
   - Clearing search restores full inventory.
2. **Authentic Groups (Dev & Daily)**:
   - `Dev` group comprises React Developer Tools + Wappalyzer.
   - Segmented `OFF` command toggles both extensions to disabled in Chrome management (`0 / 2 running`).
   - Segmented `ON` command restores both extensions to enabled in Chrome management (`2 / 2 running`).
3. **Hero Site Rules Automation (Cause & Effect)**:
   - Rule targets `*://*.wikipedia.org/*` with action `enableOnlyWhileMatched` for Dark Reader.
   - Baseline: Wikipedia renders in normal Light Mode while Dark Reader is OFF, within visible Chrome browser window.
   - Split-screen live match: Opening Wikipedia triggers automatic activation (`enabled: true`) and visibly applies dark style.
   - Tab closure: Closing Wikipedia triggers automatic reversal (`enabled: false`), restoring Dark Reader to OFF.
4. **Authentic Developer Workspace**:
   - Toggle `Show Developer workspace` in Options from OFF to ON (centered framing, no dead whitespace).
   - Dynamic navbar: `Developer` tab appears immediately in the top navigation bar.
   - Navigation: Clicking `Developer` tab opens Developer Workspace.
   - Local Project: Displays Extension Drawer project card (`DEV · v1.2.1 · Active build`), linked to GitHub repo, Chrome Web Store, and local build.
   - Reload: 1-click `Reload` action triggers runtime refresh with confirmation badge (`✓ Refreshed in 32ms · Code active`).

---

## 5. Output Deliverables & Verification Artifacts

- **Main Final Product Demo**: `docs/marketing/renders/extension-drawer-demo-final-45s.mp4` (44.5s / 1336 frames, 1080p, 30fps, 3.45 MB, within 40–45s)
- **Simplified Social Cut**: `docs/marketing/renders/extension-drawer-demo-final-20s.mp4` (strictly 20.0s / 600 frames, 1080p, 30fps, 2.39 MB)
- **Transition & Safe Area QC Verification Sheet**: `docs/marketing/renders/transition-and-safe-area-qc.png` (2400 × 1350, 8-panel verification sheet with overlay safe area boundaries ≥80px H / ≥60px V confirming 0 clipping and smooth cross-dissolves)
- **Opening Framing Comparison Artifact**: `docs/marketing/renders/opening-crop-before-after.png` (2400 × 1350, side-by-side verification proving elimination of dead whitespace while keeping safe margins >80px)
- **Final Outro Frame**: `docs/marketing/renders/final-outro-frame.png` (1920 × 1080, light Extension Drawer brand lockup with squircle icon and deduplicated CTA buttons)
- **20s 4-Panel Grid Concept Evaluation**: `docs/marketing/renders/20s-grid-concept.png` (2400 × 1350, empirical readability evaluation confirming rejection of 4-panel grid in favor of sequential cut)
- **Verification Contact Sheet**: `docs/marketing/renders/contact-sheet.png` (2400 × 1350, 8-panel milestone grid)
- **Review Package**: Synchronized to `/private/tmp/agent-review/marketing/` and packaged via Agent-OS Gate ZIP.
