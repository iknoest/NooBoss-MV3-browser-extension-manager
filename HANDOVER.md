# Handover

Snapshot: 2026-09-18T00:18:00+02:00

## Current release state (1.1.0 continuity)
- `f87404a02534d704e00b281a38411f8c204d0cb9` is the frozen accepted 1.1.0 source and release baseline.
- `release/extension-drawer-1.1.0.zip` remains frozen and must not be modified or replaced.
- Chrome Web Store 1.1.0 upload / submission / approval / publication is NOT CONFIRMED by current repository evidence.
- Therefore, the 1.1.0 CWS publication loop remains open until externally verified (do not guess CWS dashboard state).
- The GitHub `v1.1.0` tag and release should remain pending until public 1.1.0 publication is confirmed.
- Current UX work (at `4fbdbcb`, `c12e195`, `f22a1e4`, `e014bf4`, `14ff0e0`, and follow-up commits) is post-1.1.0 local work and must not silently become part of the frozen 1.1.0 release artifact.

## Work completed
- **Developer Analytics Canonical Terminology, Global Reporting Scope & Options History Export Milestone**:
  - **Outcome 1 — Canonical Google Analytics Terminology**:
    - Replaced all instances of `Visitors` with canonical GA4 term `Active users` (`activeUsers`).
    - Replaced all instances of `New visitors` with canonical GA4 term `New users` (`newUsers`).
    - Standardized metric taxonomy across Developer Workspace (`DeveloperView.tsx`), GA4 client (`ga4-client.ts`), and modal specifications: `Active users`, `Views` (`screenPageViews`), `Engagement` (`engagementRate`), and `New users` (`newUsers`).
  - **Outcome 2 — Global Reporting Scope Context**:
    - Removed repeated per-project section heading `STORE LISTING · LAST 28 DAYS` and redundant divider lines.
    - Communicated reporting scope once globally in Developer Workspace description: `Connect local test extensions to GitHub repositories, Chrome Web Store items, and Google Analytics. Analytics shows the last 28 days of Chrome Web Store listing performance.`.
  - **Outcome 3 — Dual-Surface History CSV Export in Backup & Data (`OptionsView.tsx`)**:
    - Added explicit `Export History` settings row under `Backup & Data` with description `Export Extension Drawer history records to CSV` and button `Export CSV` (`#optionsExportHistoryBtn`).
    - Directly calls canonical `exportHistoryCSV(historyRecords)` implementation from `src/shared/history-export.ts` without formatting duplication.
    - Preserves clean decoupling between Configuration backup (`Export JSON`) and History export (`Export CSV`).
    - Preserves existing History-page `Export history` button.
  - **Outcome 4 — Analytics Action Streamlining**:
    - Retained `Analytics connected ↗` chip as the direct external navigation affordance.
    - Simplified the metrics action row to contain `Refresh` as the sole action (eliminating duplicate `Analytics` navigation button).
- **Final Developer Workspace UX Closure & History CSV Export Milestone**:
  - **Outcome 8 — Final Developer Workspace UX Closure & Explicit History CSV Export**:
    - *Simplified Developer Analytics Hierarchy*: Cleanly separated connection status (`● Analytics connected`, `Analytics not linked`, `Analytics not connected`, `Analytics connecting…`, `Analytics error`) with adjacent external-link affordance from the reporting context heading (`STORE LISTING · LAST 28 DAYS`, eliminating duplicate "Store analytics" labels and "28D" abbreviation).
    - *Restored 4 Primary Decision Metrics in Main Row*: `Visitors` (`activeUsers`), `New visitors` (`newUsers`), `Views` (`screenPageViews`), and `Engagement` (`engagementRate`), with a single honest "No previous-period baseline" note when applicable.
    - *Eliminated Nested-Card Appearance*: Neutral surface, transparent background, subtle divider (`border-top: 1px solid var(--border-subtle)`), normal text hierarchy, and zero green container fill or borders.
    - *Standardized Integration Chips*: GitHub linked, Store linked, Analytics connected, and Package status. Shared 24px height, consistent radius, 0 8px horizontal padding, 16px leading/trailing icon treatment, aligned baseline, and 8px gap. `Package not enabled` styled as informational status, not a disabled button.
    - *Direct Google Analytics Navigation*: Centralized `getGA4PropertyReportsUrl(propertyId)` generating `https://analytics.google.com/analytics/web/#/p<PROPERTY_ID>/reports`. Direct external link affordances placed adjacent to the connection status chip and in the metrics action group next to `Refresh`.
    - *Simplified Extension Sorting Help*: Replaced verbose copy with concise popover text: `Based on Extension Drawer history.`.
    - *Explicit History Export*: Added `Export history` button on History page exporting ALL stored records as CSV (`timestamp,event,extension_name,extension_id,version`) with ISO 8601 timestamps and RFC-4180 escaping to `extension-drawer-history-YYYY-MM-DD.csv`. Not truncated by active filter or search.
    - *Configuration Backup vs History Export Boundary*: Configuration backup (`Export settings`) strictly excludes history records (`nooboss_history`) to preserve compact and reliable configuration portability; History maintains its own independent and explicit CSV export path via the `Export history` affordance.
- **Developer Project Deletion Safety & Analytics Information Design Milestone**:
  - **Outcome 1 — Enforced Project Deletion Safety & Atomic Metadata Cleanup (`src/background/service-worker.ts`)**:
    - Strictly enforced non-destructive Developer Project removal: `DELETE_DEVELOPER_PROJECT` operates solely on Extension Drawer metadata (`developerProjects` and `nooboss_ga4_metrics`).
    - Added atomic cleanup via `clearProjectGA4Metrics(id)` to prevent orphan analytics entries upon project deletion.
    - Non-destructive invariant: strictly guaranteed that project deletion never calls `chrome.management.uninstall`, never disables an extension (`chrome.management.setEnabled`), never removes unpacked extensions, and never emits an `Uninstalled` history record.
  - **Outcome 2 — Accessible Material-3 Project Removal Confirmation Dialog (`src/popup/components/DeveloperView.tsx`, `nooboss.css`)**:
    - Replaced unstyled confirmation dialog with full Material-3 modal dialog primitives (`.confirm-modal-box`, `.confirm-modal-title`, `.confirm-modal-actions`, `.dev-delete-confirm-text`, and `.dev-delete-confirm-btn`).
    - Exact title: *"Remove project from Developer Workspace?"*.
    - Exact copy: *"This removes only the project's Developer Workspace links, analytics settings, and local project metadata. The extension itself will remain installed and unchanged."*
    - Actions: Neutral `Cancel` and destructive red `Remove project` button.
    - Keyboard and interaction ergonomics: Added `Escape` key listener to dismiss the modal, background scrim click dismissal, and high-contrast styling across light and dark themes.
  - **Outcome 3 — Baseline-Aware Trend Calculations & Zero-Baseline Noise Suppression (`src/shared/ga4-client.ts`, `src/shared/storage.ts`, `tests/unit/ga4-client.test.ts`)**:
    - Enhanced trend calculations (`computeCountTrend` and `computeRateTrend`) to return `undefined` when the previous 28-day baseline is zero or null.
    - Eliminated repetitive and distracting `New` badges on zero-baseline metrics, replacing them with a single compact, honest note: *"No previous-period baseline"*.
    - Formatted active trends with concise unicode prefixes (`+18%`, `−12%`, `+4pt`, `−3pt`).
    - Stored `hasPreviousBaseline` boolean flag in `StoredGA4MetricsRecord` to indicate baseline availability.
  - **Outcome 4 — Decision-Useful 3-KPI Main Row & Full 4-Metric Editor Modal (`src/popup/components/DeveloperView.tsx`, `nooboss.css`)**:
    - Streamlined the project row summary (`.dev-ga4-metrics-bar`) to exactly 3 primary decision KPIs: `Visitors` (`activeUsers`), `Views` (`screenPageViews`), and `Engagement` (`engagementRate`).
    - Moved acquisition telemetry (`New users`) out of the row into the Project Editor modal (`ProjectEditorModal`) in a dedicated 4-metric grid (`.dev-editor-metrics-grid`).
    - Preserved high-density scanability (64–76px row height) while making critical engagement insights immediately visible.
  - **Outcome 5 — Neutral Surface Styling & Honest Status Indicator (`src/popup/components/nooboss.css`, `DeveloperView.tsx`)**:
    - Removed decorative green background and border styling from `.dev-ga4-metrics-bar.dev-ga4-metrics-connected`, replacing them with neutral surface tokens (`var(--bg-secondary)` and `var(--border-subtle)`).
    - Preserved semantic green status strictly for the live connection health indicator dot (`● Store analytics · Connected`).
  - **Outcome 6 — Clarified Store Listing Telemetry Scope (`src/popup/components/DeveloperView.tsx`)**:
    - Updated row and chip labeling from generic "Tracking" to explicit `Store analytics · 28d` and `Store analytics · Connected`.
    - Added explanatory copy in both the live row and the project editor clarifying that data represents Chrome Web Store listing telemetry, avoiding user confusion with in-extension runtime activity.
  - **Outcome 7 — Comprehensive Test Coverage & Live Chrome Verification**:
    - Expanded unit tests in `tests/unit/ga4-client.test.ts` (12 tests) and `tests/unit/developer-mode.test.ts` (29 tests, including 4 new regression tests for deletion safety, storage invariants, M3 dialog, and KPI layout). Total test suite: 15 test files, 238 passing tests.
    - Verified live in Chrome instance (Window `12374` / AppleScript `864996558`): confirmed M3 confirmation dialog appearance, Escape key dismissal, Cancel button behavior, temporary project creation, safe project removal with extension remaining installed in Chrome and returned to Unlinked extensions, and zero `Uninstalled` history events.
- **Live Read-Only NoWebP Google Analytics Data Milestone**:
  - **Outcome 1 — Manifest Permissions & Extension Identity Alignment (`src/manifest.json`, `dist/manifest.json`)**:
    - Added `identity` permission, `host_permissions: ["https://analyticsdata.googleapis.com/*"]`, and `oauth2` configuration (`client_id: "799106519083-4abp5ksuf8mmqnh6tjret0guni0dbpt2.apps.googleusercontent.com"`, `scopes: ["https://www.googleapis.com/auth/analytics.readonly"]`).
    - Added extension `key` in manifest to preserve extension ID `onkcjpfgllpfbimnchjehboikhippnka` across unpacked builds and reloads.
  - **Outcome 2 — Secure Chrome Identity OAuth Authentication (`src/shared/ga4-client.ts`)**:
    - User-initiated OAuth prompt via `getAuthToken(interactive: true)` when clicking "Connect" or "Authorize & Connect".
    - Security invariant: Raw OAuth access tokens are exclusively kept in memory for authenticated requests; tokens are NEVER written to `chrome.storage.local` or disk.
    - Added token invalidation helpers (`removeCachedAuthToken`, `clearAuthToken`) for 401 recovery and clean disconnection.
  - **Outcome 3 — Live GA4 Data API v1beta Integration & Metrics Persistence (`src/shared/ga4-client.ts`, `src/shared/storage.ts`, `src/shared/types.ts`)**:
    - Implemented `fetchGA4Report(propertyId, interactive)` querying Google Analytics Data API v1beta (`https://analyticsdata.googleapis.com/v1beta/properties/{id}:runReport`) over the rolling 28-day window (`startDate: "28daysAgo"`, `endDate: "today"`).
    - Fetches the 4 approved target metrics: Active users (`activeUsers`), New users (`newUsers`), Event count (`eventCount`), and Key events (`keyEvents`).
    - Stored parsed metric aggregates under `STORAGE_KEYS.GA4_METRICS` (`nooboss_ga4_metrics`) with `fetchedAt` timestamps.
  - **Outcome 4 — Developer Workspace Live Telemetry & UI Clarity (`src/popup/components/DeveloperView.tsx`, `nooboss.css`)**:
    - Integrated `GA4ConnectModal` with detailed permission and scope transparency before connection.
    - Updated `.dev-status-chip`: when connected, shows green `Tracking connected · 28d` chip with tooltip showing GA4 property ID.
    - Updated `.dev-ga4-metrics-bar`: displays live numeric metrics (`Active: 6`, `New: 6`, `Events: 23`, `Key: 0` for NoWebP property `553647047`).
    - Added live `Refresh` action button to fetch fresh data on demand, with animated spin indicator during fetch.
    - Added `Disconnect` affordance in project editor modal to clear stored metrics and cached token.
  - **Outcome 5 — Test Suite & Live Verification**:
    - Added comprehensive unit tests in `tests/unit/ga4-connection.test.ts` (9 tests covering manifest, token lifecycle, error handling, 401 invalidation, 403 handling, and storage security invariant). Total test suite: 15 test files, 228 passing tests.
    - Static verification: `npm run typecheck` and `npm run lint` clean (0 errors, 0 warnings).
    - Build: `npm run build` succeeds cleanly.
    - Live Chrome verification: Verified live in Chrome instance with Extension Drawer (`onkcjpfgllpfbimnchjehboikhippnka`), completing OAuth consent for `iknoest@gmail.com`, enabling Google Analytics Data API in Cloud Console project `799106519083`, fetching live telemetry (Active 6, New 6, Events 23, Key 0) from GA4 property `553647047`, and confirming visual display.
- **Extension Sorting UX Clarification & GA4 Read-Only Integration Path Milestone**:
  - **Outcome A — Clarified Extension Sorting UX (`Selector.tsx`, `nooboss.css`, `tests/unit/sorting-ux.test.ts`)**:
    - Consolidated sort modes into exactly 5 clear, user-facing modes:
      1. `Default` (`default`): Standard catalog order (and assigned-first priority when editing group membership).
      2. `Name A–Z` (`name_asc`): Alphabetical sorting via `localeCompare`.
      3. `Enabled first` (`enabled_first`): Active extensions at the top, disabled extensions at the bottom, alphabetical tie-break within each group, backed by live `ext.enabled`.
      4. `Latest change` (`latest_change`): Most recent recorded management event descending, no-history extensions placed last (preserves legacy `recently_changed` alias).
      5. `Most changes` (`most_changes`): Total count of recorded management events descending, 0-event extensions placed last (preserves legacy `most_changed` alias).
    - Toolbar Prefix: Added explicit `⇅ Sort:` prefix label before `#sortModeSelect` so the control purpose is immediately apparent.
    - Contextual Help Popover: Added a `?` help button next to `#sortModeSelect` with floating popover containing verbatim copy:
      > Changes are install, update, enable and disable events recorded by Extension Drawer. This is not extension usage.
    - Popover includes a dedicated dismiss button (`×`) and dismisses on outside clicks or toggle.
  - **Outcome B — Real GA4 Read-Only Integration Path & Honest Metrics Preview (`src/shared/ga4-client.ts`, `DeveloperView.tsx`, `tests/unit/ga4-client.test.ts`)**:
    - Completed technical investigation for Google Analytics Data API v1beta:
      - API endpoint: `POST https://analyticsdata.googleapis.com/v1beta/properties/{PROPERTY_ID}:runReport`.
      - Target metrics: Active users (`activeUsers`), New users (`newUsers`), Event count (`eventCount`), Key events (`keyEvents`).
      - Target date range: Rolling 28-day window (`startDate: "28daysAgo"`, `endDate: "yesterday"`).
      - Target OAuth scope: `https://www.googleapis.com/auth/analytics.readonly`.
    - Created `src/shared/ga4-client.ts` with report payload generator, response parser, and full specification metadata.
    - Developer Workspace UI update:
      - For projects with a linked `gaPropertyId`, renders a dedicated `.dev-ga4-metrics-bar` displaying the 4 target metric slots (`Active users: —`, `New users: —`, `Event count: —`, `Key events: —` with subtitle `28d · Not connected (Setup required)`).
      - Preserved honest disconnected state: zero fake/dummy metrics, zero unauthorized external network requests, zero manifest permission alterations.
      - Updated Project Editor Modal with clear setup requirements.
  - **Tests & Live Chrome Visual Verification**:
    - 14 test files, 219 tests passing (`npm test`).
    - Added `tests/unit/sorting-ux.test.ts` (10 tests) and `tests/unit/ga4-client.test.ts` (8 tests).
    - Updated `tests/unit/history-sorting-devclarity.test.ts`.
    - Clean `npm run typecheck`, `npm run lint`, and `npm run build`.
    - Visual verification in live Chrome session (`kgenlcljnnalkmbhlolfomnfpdmnnapi`) across 4 verified screenshots.
- **History Event Filtering, History-Backed Extension Sorting & Developer Status Clarity Milestone**:
  - **Outcome 1 — History Event Filtering & Search (`HistoryView.tsx`)**:
    - Added dedicated toolbar (`.history-toolbar`) with event type dropdown (`#historyEventFilter`) and live search input (`#historySearch`).
    - Supported filter values: `All events`, `Installed` (`installed`), `Uninstalled` (`uninstalled`), `Enabled` (`enabled`), `Disabled` (`disabled`), `Updated` (`updated`).
    - Filter and search compose seamlessly in reverse-chronological order.
    - Differentiates between zero total history records ("No history records yet.") and no filter matches ("No events match the current filter.").
  - **Outcome 2 — History-Backed Extension Sorting (`Selector.tsx`, `NooBossApp.tsx`, `SubWindow.tsx`)**:
    - Added compact Sort dropdown (`#sortModeSelect`) directly following search input in the Extensions catalog toolbar.
    - Supported sort modes:
      - `Default`: Standard catalog order (and assigned-first priority when editing group membership).
      - `Name A–Z`: Case-insensitive alphabetical sorting via `localeCompare`.
      - `Recently changed`: Newest management event timestamp first; extensions with no recorded history sort after.
      - `Most changed`: Event count descending; 0-event extensions sort last. Explicitly labeled `Most changed` (never "Most used" to avoid misleading activity implications).
      - `First seen`: Earliest `installed` event timestamp, falling back to earliest recorded event, with 0-event extensions sorting last. Does NOT fabricate Chrome install dates, truthfully reflecting only Extension Drawer history.
    - Preserved independent Type filter (`All`, `Extensions`, `Apps`, `Themes`) and full view mode / group focus compatibility.
  - **Outcome 3 — Developer Workspace Status Clarity & Direct Actions (`DeveloperView.tsx`)**:
    - Status-first row wording:
      - Local/Test: `Runtime ON` / `Runtime OFF` with direct toggle switch, reload icon button, and Chrome details button.
      - GitHub: `GitHub linked` / `GitHub not linked`.
      - Store: `Store linked` / `Store not linked`.
      - Analytics: `Tracking: property linked · not connected` / `Tracking: not linked`.
      - Package: `Package: not enabled`.
    - Single configuration entry point: removed redundant settings gear icon from project rows (clicking row or edit button opens project editor; reload and toggle remain direct).
    - Added `Open CWS Dashboard ↗` button in header linking directly to `https://chrome.google.com/webstore/devconsole/`.
    - Modal editor additions: added `Open Chrome details` button under Local Test Extension; added integration specification notices explaining upcoming GA4 Data API and Store ZIP download requirements.
  - **Outcome 4 — Options Workspace Alignment (`OptionsView.tsx`)**:
    - Renamed section to `Developer Workspace`.
    - Renamed toggle setting label to `Show Developer workspace` (preserving internal `developerMode` boolean and storage key).
    - Updated description: *"Show Developer workspace in navigation and reveal developer tools."*
  - **Integrations Status & Safety Constraints**:
    - Live Tracking & Store ZIP remain strictly permission-gated (0 new manifest permissions, 0 external network requests, 0 downloads).
    - Site Rules remains CLOSED.
- **Developer Workspace Compact Scanability & Status Chip Milestone**:
  - **Outcome 1 — 2-Line Project Row Architecture**:
    - Replaced the compressed 7-column table with a compact, highly scannable 2-line project row model (row height 64–76px).
    - *Primary Line*: Project icon, name, DEV / Published badges; concise local test state (`DEV · v... · ON/OFF` with switch, reload, and details buttons); trailing `Edit` and `Delete` action buttons.
    - *Secondary Line*: Aligned compact integration status chips: `GitHub ✓` / `GitHub +`, `Store ✓` / `Store +`, `GA4 · Connect` / `GA4 +`, `Package locked`.
    - Removed long IDs, repository URLs, CWS IDs, and API explanation text from the main list, reserving them for the project detail/editor surface.
  - **Outcome 2 — Simplified Unlinked Development Rows**:
    - Eliminated empty columns with meaningless dashes (`—`).
    - Unlinked development extensions render as clean, single-line records: icon, name, DEV and Unlinked badges, runtime state (`DEV · v... · ON/OFF` with reload and details), and a prominent `Set up` primary button.
    - Preserved complete zero-clipping parity for all detected unpacked builds via `getUnlinkedDevExtensions`.
  - **Outcome 3 — Responsive Presentation Without Horizontal Scrolling**:
    - Designed specifically for the actual Extension Drawer manager width (760px), fitting 5+ entities simultaneously in one screen with zero horizontal scrollbar.
    - Expands gracefully to wider viewports (e.g. 1080px) while maintaining legibility and Material-3 design grammar.
- **Developer Workspace Compact Table & Binding Correction Milestone**:
  - **Outcome 1 — Compact Data-Grid Dashboard**:
    - Replaced sprawling 5-card project layout with an aligned, compact data-grid table (`Project | Local / Test | GitHub | Store | Analytics | Package | Actions`, target row height 56–72px).
    - Established clear row grammar: clicking any project row opens the editor modal; embedded action controls, switches, and external links stop propagation.
    - Integrated compact cells:
      - *Project*: Icon, project name, DEV / Published badges.
      - *Local / Test*: `DEV · v... · ON/OFF` with switch, reload icon button, and Chrome details button.
      - *GitHub*: Compact `✓ org/repo` link pill opening repository in new tab, or subtle `Link` button.
      - *Store*: Compact `✓ Listing` link pill opening CWS listing in new tab, or subtle `Link` button.
      - *Analytics*: Compact `GA4 linked` pill with tooltip and telemetry status, or subtle `Link` button.
      - *Package*: Honest `Not enabled` chip without misleading non-functional download buttons.
      - *Actions*: Quick `Edit` and `Delete` action icon buttons.
  - **Outcome 2 — Unlinked DEV Extensions Resolution (5 vs 3 Fix)**:
    - Root cause identified and eliminated: removed hardcoded `.slice(0, 3)` in `DeveloperView.tsx`.
    - Every detected unpacked development extension (`installType === "development"`) not bound to a project is rendered as a dedicated unlinked table row.
    - Unlinked rows feature full runtime controls (switch, reload, details) and a primary `Set up` action button that opens the project editor pre-filled with the extension's name and ID.
    - Exported and verified `getUnlinkedDevExtensions` helper to ensure complete zero-clipping parity.
  - **Outcome 3 — Local/Test Binding Isolation in Project Editor**:
    - Restricted the `Local Test Extension` dropdown strictly to `(None linked)` and unpacked development extensions (`installType === "development"`).
    - Removed normal Chrome Web Store extensions from this selector to maintain clear separation between test builds and store items.
    - Added explanatory copy: *"Only unpacked development extensions can be linked as local test builds."*
  - **Outcome 4 — Responsive Container Handling**:
    - Wrapped table in `.dev-table-container` with smooth horizontal scrolling for narrow viewport widths, preserving column alignment at desktop/manager widths.
- **Top-Level Developer Workspace & Clean Interaction Foundation Milestone**:
  - **Outcome 1 — Top-Level Developer Route & Navigator**:
    - Added `developer` as a first-class route in `MainLocation` (`extensions | autostate | history | developer | options | about`).
    - Navigator displays `Developer` tab positioned between `History` and `Options` when `developerMode` is ON, and hides it immediately when OFF.
    - Added guarded routing and auto-redirection in `NooBossApp.tsx`: if Developer Mode is turned off while on the Developer page, the user is redirected to `extensions`.
  - **Outcome 2 — Project-Oriented Data Model & Persistence**:
    - Defined `DeveloperProject` interface (`id`, `name`, `localExtensionId`, `cwsExtensionId`, `githubUrl`, `gaPropertyId`, `createdAt`, `updatedAt`).
    - Stored under `STORAGE_KEYS.DEVELOPER_PROJECTS` in `chrome.storage.local`.
    - Added full export/import lifecycle support in `src/shared/import-export.ts` with strict schema validation.
    - Added service worker message handlers for `GET_DEVELOPER_PROJECTS`, `SAVE_DEVELOPER_PROJECT`, and `DELETE_DEVELOPER_PROJECT`.
  - **Outcome 3 — Developer Workspace Surface (`DeveloperView.tsx`)**:
    - Header with workspace title, subtitle, and `+ Add Project` action.
    - Detected unlinked unpacked development extensions banner with quick-create shortcut buttons.
    - Clean empty state with primary creation call-to-action when no projects exist.
    - Project cards featuring 5 structured integration pillars:
      1. *Local / Test Extension*: Real status for linked unpacked build (`DEV` badge, version, enabled toggle switch, reload action, Chrome details link).
      2. *GitHub Repository*: Link display, `Open GitHub` button, honest disconnected status ("Status: Not connected").
      3. *Chrome Web Store*: Link display, `Open Store Listing` button, honest disconnected status ("Status: Listing linked").
      4. *Google Analytics*: Property ID display, honest disconnected status ("Analytics not connected"), and 4 reserved metric slots (Users, Sessions, Engagement, Events) marked "API required".
      5. *Store Package*: Scoped package action area with "Permission setup required" badge and explanatory text.
    - Project Editor Modal (`ProjectEditorModal`): M3-aligned modal for creating/editing projects with auto-extraction of 32-character CWS IDs from pasted URLs.
  - **Outcome 4 — Card Clutter Elimination**:
    - Completely removed `renderDevActionsMenu` (the multi-item terminal popover) from ordinary extension cards across all catalog modes (`bigTile`, `list`, `tile`).
    - Unpacked development extensions retain only the context-appropriate `DEV` chip badge and Developer Reload button.
  - **Outcome 5 — SubWindow Cleanliness**:
    - Removed misleading non-functional download button from SubWindow details dialog.
  - **Outcome 6 — Manager Scroll Container Fix**:
    - Fixed container layout in manager mode (`.nooboss-app.full-manager { height: 100vh; width: 100%; overflow: hidden; }`), restoring independent scrolling for `.main-content`.
- **Developer Mode v1 Shell & Developer Actions (Preserved Elements)**:
  - Preserved `developerMode` toggle in Options, unpacked reload mechanics, and `installType === "development"` detection.
- **Options Shared-Control Consistency & Grammar Milestone**:
  - **Standardized Row Structure & Tokens**:
    - Established shared tokens in `:root`: `--settings-select-width: 240px;`, `--settings-action-width: 140px;`.
    - Standardized `.settings-row` to `min-height: 56px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); justify-content: space-between;`.
    - Row grammar enforced: `[label + supporting text] [trailing control column]`.
  - **Control Column Alignment & Sizing**:
    - Dropdowns (`.settings-select`): Standardized to 240px width across Appearance (Theme Mode, Accent Color) and Site Rules Engine (Operation Mode).
    - Composite controls (`.accent-control-group`): Fixed total container width to 240px (`flex: 1` on select, 32px color square) so trailing boundary never jumps between preset and custom colors.
    - Action buttons (`.settings-action-btn`): Standardized to 140px width, 32px height, centered text (`Export JSON`, `Export HTML`, `Import JSON`, `Clear history`).
    - Destructive confirmation (`.settings-confirm-actions`): Flex row with 90px min-width buttons (`Confirm erase` and `Cancel`), fitting cleanly into trailing column.
    - Number inputs (`.settings-number-input`): Standardized to 32px height, 90px width, 6px radius, with matching focus rings.
    - Switches: Aligned right on trailing axis with keyboard focus outline on `.switch-input:focus-visible + .switch-label`.
  - **Action Copy & Grammar**:
    - Standardized action copy to clean sentence casing without ellipsis: replaced `Clear History...` with `Clear history`. Preserved standard acronyms (`JSON`, `HTML`).
- **Interaction Grammar & Material-3-Aligned Shared UI Primitives Milestone**:
  - **Outcome 1 & 2 — Unified Card Body Navigation & Single Edit Affordance**:
    - Removed redundant `Control members` / tune buttons from Group cards (`bigTile`, `list`, `tile`).
    - Standardized card-body navigation across all three views: clicking the card body enters the group-filtered extensions view.
    - Ensured all nested interactive controls (`[OFF | ON]`, duplicate, edit, delete) call `e.stopPropagation()` so interacting with controls never triggers card-body navigation.
    - Fixed tile mode bug where `.group-tile-hover-panel` intercepted card clicks.
  - **Outcome 3 — Identical Catalog Presentation in Group Focus**:
    - Removed custom `.tile-persistent-switch` overlay and eliminated `isGroupFocused` card variant branch in `ExtensionBrief`.
    - Extension cards rendered inside group focus now look and behave identically to normal catalog cards (same icon, layout, switch, hover, disabled/enabled states).
  - **Outcome 4 — Standardized Back Navigation Affordance**:
    - Replaced `×` dismissal icon in `.group-focus-banner` with a local Material Symbol `arrow_back` back button.
    - Unified header grammar: `← [Icon] <Group Name> · X / Y running [OFF | ON] [gear/edit]`.
  - **Outcome 5 — Honest Auto-Save Semantics in Group Editor**:
    - Verified data flow: group edits (name, icon, membership toggles, undo/redo) persist immediately to storage via `UPDATE_GROUP`.
    - Removed confusing `Control members` button from modal header; introduced prominent `Done` button (`btn-primary`) and close `×` button.
    - Completely avoided fake "Cancel" state to honestly communicate immediate persistence.
  - **Outcome 6 & 7 — Material-3 Compact Form Primitives & Global Dropdown Arrow Spacing**:
    - Established shared compact control tokens in `:root`: `--control-height: 32px`, `--control-radius: 6px`, `--control-padding-h: 12px`, `--form-primary-width: 380px`.
    - Standardized `select, .settings-select`: `appearance: none`, 32px height, 12px start padding, 32px reserved end padding, and local Material Symbol `arrow_drop_down` SVG data URI positioned at `right 8px center` (including light and dark mode variants).
    - Standardized `input[type="text"], input[type="search"]` with 32px height, 12px padding, 6px radius, and standard focus ring.
  - **Outcome 8 — Form Field Width Alignment in Site Rules**:
    - Standardized `#ruleScopeSelector`, `#ruleScopeInput`, `#ruleTimingSelector`, and `#ruleEffectSelector` to `.form-primary-field` (380px width).
    - Positioned `[Set as current website]` button in its own trailing flex column without shrinking or distorting the input.
  - **Outcome 9 — Documented Core UI Grammar Rules**:
    1. *Card Body = Primary Navigation*: Clicking any entity card body navigates into its filtered view or details.
    2. *Embedded Controls = Stop Propagation*: Batch switches, action icon buttons, and inputs inside cards must stop click propagation.
    3. *Single Configuration Affordance*: One clear gear/edit icon opens the modal editor; no duplicate secondary config buttons.
    4. *Catalog Presentation Parity*: Catalog views (normal vs filtered) share the exact same card component and visual affordances.
    5. *Hierarchical Back Affordance*: Sub-contexts use `arrow_back` to return to the catalog root, reserving `×` for dismissing overlays/modals.
    6. *Honest Persistence Semantics*: Surfaces with immediate auto-save feature `Done` and `Close`, never pseudo "Cancel" controls.
- **Site Rules 3-Mode Primary Scope Model & Usability Milestone**:
  - Simplified the scope model to exactly three primary choices: `This site (recommended)`, `Exact page`, `Custom` (with secondary advanced regex toggle).
  - Explicit timing and effect decisions: `Temporary while open` vs `One-time on open`, `Turn extension ON` vs `Turn extension OFF`.
  - Blocked invalid and targetless rules with live inline validation and dynamic behavior preview.
- **Group Usability & Membership UX Milestone**:
  - Added membership-aware sorting, `<N> assigned` counter badge, *"Assigned only"* toggle button, and membership undo/redo stacks.
  - Refined top-level taxonomy filter to dynamically show *"Apps"* and *"Themes"* only when items exist.
- **Historical Migration / Recovery Foundations**:
  - Sanitized migration templates, documentation for legacy profile recovery, and sensitive data exclusion.

## Investigations completed
- **Developer Mode v1 & Store Package Download Feasibility**:
  - *Unpacked Local Extensions (`installType === "development"`)*: Chrome sandboxing and `chrome.management` APIs strictly protect local file systems; extensions cannot access directory paths or read file contents of other unpacked extensions. Local source packaging is infeasible via web extension APIs. Developer Mode v1 for local extensions should provide a `DEV` badge, quick reload (`setEnabled` toggle), and direct links to `chrome://extensions/?id=...`.
  - *Store-Installed Extensions*: Public packages can be acquired from Chromium update endpoint `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=[VERSION]&acceptformat=crx2,crx3&x=id%3D[ID]%26uc`.
  - *CRX3-to-ZIP Conversion*: CRX3 has a 12-byte header + `header_size` protobuf, immediately followed by the standard ZIP payload (`PK\x03\x04`). Slicing at `12 + headerSize` yields a pure standard ZIP in memory without third-party dependencies.
  - *Permissions*: Requires `downloads` permission and host permissions (`clients2.google.com`, `googleusercontent.com`). Can be declared as `optional_permissions` and `optional_host_permissions` in MV3, requested just-in-time on user click to avoid install-time warnings.
  - *Unsupported cases*: Unpacked/dev extensions (no CWS package), extensions removed/delisted from CWS, enterprise policy-installed extensions without public store URLs.

## Tests and verification
- **Unit test suite**: 16 test files, 252 tests passing (`npm test` via Vitest), including `tests/unit/developer-mode.test.ts` (32 tests covering default OFF, persistence, Options row, unpacked vs store behavior, deletion safety, M3 modal, SubWindow contracts, canonical GA4 metric terms, global description, single refresh button, and Options history export row), `tests/unit/ga4-client.test.ts` (12 tests covering canonical metric labels and payloads), `tests/unit/history-export.test.ts` (11 tests covering RFC-4180 formatting, ISO 8601 timestamps, header preservation, edge case escaping), `tests/unit/sorting-ux.test.ts` (10 tests), `tests/unit/history-sorting-devclarity.test.ts` (14 tests), and `tests/unit/unpacked-reload.test.ts` (35 tests).
- **Static verification**: `npm run typecheck` (`tsc --noEmit`) and `npm run lint` (`eslint src/`) pass with 0 errors and 0 warnings.
- **Production build**: `npm run build` generates production assets cleanly (`dist/`) in ~155ms.
- **Visual inspection**: Live visual inspection in test Chrome window `864997649` (Quartz `4122`):
  - `developer_workspace_canonical.png`: Canonical GA4 metric terms (`Active users`, `New users`, `Views`, `Engagement`), global 28-day store listing reporting scope in workspace subtitle, single `Refresh` button in metrics row, aligned `Analytics connected ↗` chip.
  - `options_backup_and_data_clean.png`: `Export History` row under Backup & Data alongside `Export Configuration`, `Export Extension List`, and `Import Backup`.
  - Tested `#optionsExportHistoryBtn` click: cleanly downloaded `extension-drawer-history-YYYY-MM-DD.csv` to `~/Downloads`.
  - `history_export_action.png`: Verified preserved `Export history` button on History page.
- **Gate receipt**: Recorded and validated via `agentos_final_gate.py record` and `agentos_final_gate.py validate --session a61582c5-ddf9-422d-8e81-0925bfcf4db8 --agent AGY` (`decision: allow`, code: `OK`).
- **Baseline safety**: Release baseline `f87404a02534d704e00b281a38411f8c204d0cb9` and `release/extension-drawer-1.1.0.zip` preserved frozen; zero permission additions; no version bumps; strictly zero git push.

## Lessons learned
- Browser profile data can contain extension IDs, user-specific metadata, and personal group naming that must be redacted before any commit.
- Disentangling navigation gestures from configuration actions prevents accidental modal opening and improves keyboard navigability.
- Preact state updates require new array references for memoized selectors to detect changes when injecting dynamic fixtures during testing.
- Fixed-width or constrained input fields require compact placeholder copy to avoid visual ellipsis truncation across varying OS font metrics.
- Slicing collections for quick-action shortcuts (`.slice(0, 3)`) risks hiding valid entities from users; full tabular presentation with inline setup affordances is superior and transparent.
- Form selector dropdowns must reflect entity semantics: store-installed extensions must never be selectable as "local test builds".
- Table layouts in manager windows benefit from fixed layout with min-widths and container overflow scrolling to ensure high-density responsiveness across screen sizes.
- Configuration backup and operational event history serve different lifecycles: configuration backups should remain lightweight and portable, while activity history is best served by dedicated standard RFC-4180 CSV exports.

## Recommended next steps
1. Store ZIP/CRX package download implementation (next scheduled milestone).
2. Maintain zero write access / zero push boundary; keep frozen 1.1.0 release ZIP untouched.
3. Once 1.1.0 publication is externally confirmed, apply GitHub tag/release `v1.1.0` to commit `f87404a02534d704e00b281a38411f8c204d0cb9`.

## Consolidated External Integration Matrix (Status Update)
| Integration | API / Protocol | Endpoint | Required Manifest Permissions | Required Host Permissions | OAuth2 Scopes | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Analytics** | Google Analytics Data API v1beta | `https://analyticsdata.googleapis.com/v1beta/properties/{PROPERTY_ID}:runReport` | `identity`, `storage` | `https://analyticsdata.googleapis.com/*` | `https://www.googleapis.com/auth/analytics.readonly` | **Connected & Live** (Read-only rolling 28-day telemetry for NoWebP property `553647047`) |
| **Chrome Web Store** | Chrome Web Store API v2 | `https://chromewebstore.googleapis.com/v2/publishers/{PUBLISHER_ID}/items/{EXTENSION_ID}:fetchStatus` | `identity`, `storage` | `https://chromewebstore.googleapis.com/*` | `https://www.googleapis.com/auth/chromewebstore` | Pending approval |
| **GitHub** | GitHub REST API v3 / GraphQL | `https://api.github.com/repos/{OWNER}/{REPO}` | `identity` (if OAuth) or PAT | `https://api.github.com/*` | `repo` (or PAT `Contents: read`, `Actions: read`) | Pending approval |
| **Store CRX / ZIP Package** | Chromium CRX binary update service | `https://clients2.google.com/service/update2/crx?response=redirect&prodversion={CHROME_VERSION}&x=id%3D{EXTENSION_ID}%26installsource%3Dondemand%26uc` | `downloads` (optional) | `https://clients2.google.com/service/update2/crx*`, `https://chromewebstore.google.com/*` | None | Pending approval |

### Analytics Recommended Metrics (Google Analytics Data API v1beta)
For extension telemetry over the standard rolling 28-day window:
1. `activeUsers`: Count of distinct active extension users over the period (Live: 6).
2. `newUsers`: Count of users who launched or interacted with the extension for the first time (Live: 6).
3. `eventCount`: Total number of user events (Live: 23).
4. `keyEvents`: Count of key events / primary workflow completions (Live: 0).

## Ongoing tasks
- Maintain existing high unit test coverage (252 tests across 16 test files) across core features.
- Review remaining browser profile data for compatibility with current Chrome APIs.
- Validate recovered extension state against managed groups and extension configuration entries.
- Keep cautious handling of LevelDB and IndexedDB data in local-only recovery steps.

## Open risks
- External API calls and OAuth token handling require explicit user permission grants and privacy policy declarations before activation.
- Chrome Web Store Publish API and Google Analytics Data API require Cloud Console project client IDs.

## Parked items
- Automated profile recovery for unsupported Chrome builds.
- Cross-browser migration parity checks.
- Long-term preservation of any raw exported profile dumps not suitable for git.

## Owner contact
Team — NooBoss Maintainers

