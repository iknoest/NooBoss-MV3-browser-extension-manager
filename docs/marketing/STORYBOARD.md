# Extension Drawer — Authentic Promotional Media Storyboard & Specification (Final Composition)

## 1. Video Specifications

### Main Product Demo (40–45s)
- **Filename**: `extension-drawer-demo-final-45s.mp4` (mirrored to `extension-drawer-demo-director-cut-45s.mp4`)
- **Resolution**: 1920 × 1080 (16:9 Full HD)
- **Framerate**: 30 fps
- **Codec**: H.264 (MPEG-4 AVC), `yuv420p` pixel format
- **Target Duration**: 40.0s – 45.0s (measured: 44.5s / 1336 frames)
- **Execution Model**: 100% genuine Chrome runtime (Google Chrome for Testing `155.0.8059.39`), authentic unpacked Chrome Web Store extensions (Dark Reader, React Developer Tools, Wappalyzer, OneTab), live real website (Wikipedia), and real Developer Workspace. Zero synthetic `window.chrome` mocks. Zero personal profile data.
- **Visual Composition Pass & Stability Polish**:
  - **Browser Context Preserved**: The Chrome tab strip, omnibox displaying `https://en.wikipedia.org/wiki/Google_Chrome` with `wikipedia.org` prominently highlighted, and toolbar extension status indicators are visibly present so the viewer immediately understands the real browser context.
  - **Safe Area & Dead Whitespace Eliminated**: Balanced camera framing at scale 1.22 centered on active UI bounds (margins ≥80px horizontal and ≥60px vertical), ensuring content occupies 75%–85% of the frame without clipping or touching edges.
  - **Clamped Spotlight Vignette & Guided Focus**: Radial vignettes clamped to 30% background dimming (`rgba(15, 23, 42, 0.30)`) with smooth cubic easing in/out, preventing abrupt brightness pops.
  - **7-Frame Linear Cross-Dissolves**: Seamless luminance transitions across scene cuts (Site Rules ➔ Wikipedia Window ➔ Split Screen ➔ Options ➔ Workspace ➔ Outro) completely eliminating flash/luminance jumps.
  - **Dynamic State Callout Pills**: High-contrast floating indicators (`⚡`, `✦`, `⚙️`, `📦`) positioned strictly within safe bounds.
  - **Cause & Effect Split-Screen**: Live side-by-side demonstration linking Extension Drawer rule status with instant website rendering, smoothly cross-fading from genuine Light Mode into true Dark Mode.

### Simplified Social Cut (20.0s)
- **Filename**: `extension-drawer-demo-final-20s.mp4` (mirrored to `extension-drawer-demo-director-cut-20s.mp4`)
- **Resolution**: 1920 × 1080 (16:9 Full HD)
- **Framerate**: 30 fps
- **Codec**: H.264, `yuv420p`
- **Target Duration**: Exactly 20.0s (measured: 20.0s, strictly 600 frames)
- **Editorial Pacing & Simplification**: Ordinary search and single-extension toggle are dropped completely to give differentiating features sufficient breathing room:
  - `0.0s – 1.5s` (45 frames): Title Hook Slate (`Extension Drawer · Manage · Automate · Develop`)
  - `1.5s – 6.0s` (135 frames): Concept 1 · Workflow Groups (Dev Stack `2/2 running` ➔ `0/2` ➔ `2/2`)
  - `6.0s – 14.0s` (240 frames): Concept 2 · Site Rules Cause & Effect (Rule row ➔ Live Wikipedia match & Dark mode ➔ Tab closed restore)
  - `14.0s – 18.5s` (135 frames): Concept 3 · Developer Workspace (Options toggle ON ➔ Navbar Dev tab ➔ Project card & 1-click Reload)
  - `18.5s – 20.0s` (45 frames): Branded Outro Card (`Star on GitHub · Install from Chrome Web Store`)

### 4-Panel Simultaneous Concept Evaluation (20s Alternative Test)
- **Filename**: `20s-grid-concept.png`
- **Resolution**: 2400 × 1350 (16:9 4K-ready evaluation artifact)
- **Purpose**: Empirical assessment comparing a simultaneous 4-quadrant layout against the sequential progressive cut for short-form video.
- **Evaluation Findings**:
  - *Desktop Fullscreen (1920px width)*: Each quadrant occupies 960×540px. Headings are legible, but simultaneous movement across 4 panels causes cognitive split.
  - *Mobile Feed / Reddit / Twitter (400px player embed)*: **FATAL DEFECT**. Each quadrant shrinks to 200×112px. Normal 13px UI text reduces to ~2.7px sub-pixel blurs. Extension names and URLs are completely unreadable.
  - *Verdict*: **REJECTED** for final 20s marketing video. The sequential cut is adopted for 100% legibility and maximum viewer conversion.

### 8-Panel Verification Contact Sheet
- **Filename**: `contact-sheet.png`
- **Resolution**: 2400 × 1350 (16:9 4K-ready verification sheet)
- **Panels**:
  1. `1. Site Rule: wikipedia.org → Dark Reader` (Hero rule row with spotlight and callout)
  2. `2. Wikipedia Baseline: Light Mode (OFF)` (Chrome window with tab strip and omnibox `https://en.wikipedia.org/wiki/Google_Chrome`)
  3. `3. Wikipedia Live Match: Dark Mode (ON)` (Split screen: rule triggers, Dark Reader turns ON, Wikipedia darkens)
  4. `4. Tab Closed: Dark Reader Restored to OFF` (Split screen: tab closed, Dark Reader automatically restores to OFF)
  5. `5. Options: Developer Workspace Toggle ON` (Options setting toggled ON with centered framing and no dead space)
  6. `6. Navigation: Developer Tab Activated` (Dynamic appearance of Developer tab in top navigation)
  7. `7. Developer Workspace: Local Build Card` (Extension Drawer card with local build, GitHub, and Store links)
  8. `8. 1-Click Action: Extension Reload Confirmed` (1-click Reload button interaction with refresh confirmation)

---

## 2. Storyboard Breakdown (Main 45s Product Demo)

1. **Scene 1 (0:00 – 0:02.0) · Opening Hook & Framing**
   - *Visual*: Clean light Material UI overview with compact 3-column card wrap and camera scale `1.58` (origin `40px, 10px`), ensuring content bounds fill ~80% of the 1080p frame and completely eliminating the bottom 60% empty whitespace. Floating callout pill `⚡ Managing too many Chrome extensions?`.
   - *Caption*: `✦ The clean, powerful extension manager for Chrome`
   - *Framing*: Centered title transition into live Extension Drawer catalog.

2. **Scene 2 (0:02.0 – 0:08.0) · Extension Library Search & 1-Click Toggle**
   - *Framing*: Camera punch-in (140% scale, origin: 460, 240) framing search input and React DevTools card. Content occupies ~80% of usable frame; bottom dead whitespace is cropped out.
   - *Action*:
     1. Cursor moves to `#nameFilter`.
     2. Types `react` progressively.
     3. Catalog filters dynamically to React Developer Tools.
     4. Cursor clicks switch: React DevTools disables in Chrome (`enabled: false`).
     5. Callout: `Syncs live with Chrome runtime`.
     6. Clears search and restores full inventory.
   - *Caption*: `✦ Search and control extensions in one place` ➔ `✦ Toggle extensions on or off with immediate Chrome sync`

3. **Scene 3 (0:08.0 – 0:14.0) · Workflow Groups (Dev & Daily)**
   - *Framing*: Camera punch-in (145% scale, origin: 440, 230) centered on Dev and Daily workflow group cards. Zero bottom whitespace.
   - *Action*:
     1. Cursor moves to `Dev` group card (`React DevTools + Wappalyzer`).
     2. Callout: `Dev Stack · 2 / 2 running`.
     3. Cursor clicks segmented `OFF`: stack disables in Chrome (`0 / 2 running`).
     4. Cursor clicks segmented `ON`: stack restores to enabled in Chrome (`2 / 2 running`).
   - *Caption*: `✦ Switch whole workflows with one click`

4. **Scene 4 (0:14.0 – 0:26.5) · Site Rules Hero (Cause & Effect)**
   - *Shot A: Explain the Rule Row (0:14.0 – 0:17.5)*:
     - Navigates to `Site Rules` tab.
     - Camera punch-in (135% scale, origin: 960, 290) centered on the `wikipedia.org ➔ Dark Reader` row.
     - Spotlight highlights `wikipedia.org` and `Temporary while open`.
     - Milestone 1: `1_site_rule.png`.
   - *Shot B: Wikipedia Baseline Before (0:17.5 – 0:19.5)*:
     - Full authentic Google Chrome browser window:
       - Active tab: `Google Chrome - Wikipedia` with Wikipedia favicon.
       - Omnibox: `🔒 https://en.wikipedia.org/wiki/Google_Chrome` with `wikipedia.org` highlighted.
       - Toolbar: Dark Reader icon with `OFF` status badge.
     - Wikipedia renders in bright Light Mode.
     - Callout: `☀️ Before · Dark Reader OFF`.
     - Milestone 2: `2_wiki_before.png`.
   - *Shot C: Split-Screen Cause & Effect (0:19.5 – 0:24.0)*:
     - Side-by-side view: Left panel (40%) shows Extension Drawer Site Rules monitor; Right panel (60%) shows Chrome window with tab and omnibox `wikipedia.org`.
     - Live match triggers: Dark Reader flips `ON` on the left; Wikipedia instantly darkens on the right!
     - Callout: `Open Wikipedia → Dark Reader turns ON automatically`.
     - Milestone 3: `3_wiki_after.png`.
   - *Shot D: Tab Closed & Restored to OFF (0:24.0 – 0:26.5)*:
     - Cursor clicks close button `✕` on Wikipedia tab.
     - Right panel: tab closes.
     - Left panel: Rule immediately detects tab close (`TAB CLOSED`), Dark Reader switch automatically flips back to `OFF`!
     - Milestone 4: `4_darkreader_restored_off.png`.

5. **Scene 5 (0:26.5 – 0:40.0) · Authentic Developer Workspace**
   - *Shot A: Options Toggle OFF -> ON (0:26.5 – 0:31.0)*:
     - Navigates to `Options` tab.
     - Smooth scroll to `#optionsDeveloperRow`.
     - Camera punch-in (125% scale, origin: 960, rowY) centered on the Developer Workspace row.
     - Cursor clicks toggle switch: switch flips ON.
     - Milestone 5: `5_dev_toggle_on.png`.
   - *Shot B: Dynamic Developer Tab in Navigation (0:31.0 – 0:34.5)*:
     - Camera pans to navbar.
     - `Developer` tab dynamically appears between History and Options!
     - Callout: `Developer tab enabled`.
     - Milestone 6: `6_dev_tab_appeared.png`.
     - Cursor clicks `Developer` tab.
   - *Shot C: Real Project Card (0:34.5 – 0:37.5)*:
     - Developer Workspace displays local Extension Drawer project card: `Extension Drawer` (`DEV · v1.2.1 · Active build`).
     - Camera punch-in (145% scale) centered on the project card. Content occupies ~80% of usable frame; dead whitespace below is eliminated.
     - Callout: `Local build · GitHub · Store · ZIP`.
     - Milestone 7: `7_dev_workspace_card.png`.
   - *Shot D: 1-Click Reload Action (0:37.5 – 0:40.0)*:
     - Cursor moves to `.reload-btn` and clicks.
     - Reload spin animation + badge: `✓ Refreshed in 32ms · Code active`.
     - Milestone 8: `8_dev_reloaded.png`.

6. **Scene 6 (0:40.0 – 0:41.6) · Light Brand Outro Lockup**
   - *Visual*: High-contrast light brand outro on off-white/pale-blue radial gradient (`#ffffff` to `#eff6ff`), white squircle container with crisp drop-shadowed Extension Drawer icon, dark neutral typography (`#0f172a`), and single deduplicated CTA row:
     - Primary: `⚡ Install on Chrome Web Store` (brand blue `#2563eb` pill)
     - Secondary: `✦ GitHub` (white pill with `#cbd5e1` border)
   - *Cursor & Captions*: Mouse cursor hidden off-screen; duplicate lower-third caption eliminated for clean visual presentation.
   - Milestone Outro Frame: `final-outro-frame.png`.

---

## 3. Store Promotional Graphics Specifications

- **Small Promo Tile (440 × 280)**: `small-promo-tile-440x280.png`
- **Marquee Promo Tile (1400 × 560)**: `marquee-promo-tile-1400x560.png`
- **YouTube Video Thumbnail (1280 × 720)**: `youtube-thumbnail-1280x720.png`
