# Handover

Snapshot: 2026-09-13T22:47:00+02:00

## Current release state (1.1.0 continuity)
- `f87404a02534d704e00b281a38411f8c204d0cb9` is the frozen accepted 1.1.0 source and release baseline.
- `release/extension-drawer-1.1.0.zip` remains frozen and must not be modified or replaced.
- Chrome Web Store 1.1.0 upload / submission / approval / publication is NOT CONFIRMED by current repository evidence.
- Therefore, the 1.1.0 CWS publication loop remains open until externally verified (do not guess CWS dashboard state).
- The GitHub `v1.1.0` tag and release should remain pending until public 1.1.0 publication is confirmed.
- Current UX work (at `4fbdbcb`, `c12e195`, `f22a1e4`, `e014bf4`, and follow-up commits) is post-1.1.0 local work and must not silently become part of the frozen 1.1.0 release artifact.

## Work completed
- **Developer Mode v1 Shell & Developer Actions Milestone**:
  - **Outcome 1 — Options > Developer Mode Switch**:
    - Added `developerMode: boolean` to `AppSettings` interface and defaulted it to `false` in `DEFAULT_SETTINGS`.
    - Added validation for `developerMode` in `validateSettings` and preserved it through export/import round-tripping.
    - Added standardized Developer Mode row in `OptionsView.tsx` with M3 switch primitive (`#setting-developer-mode`), label `"Developer Mode"`, and supporting text `"Show developer tools and extension package actions."`
  - **Outcome 2 — Unpacked Extensions Behavior**:
    - When `developerMode: true`: renders subtle `DEV` chip badge next to extension name, orange status dot on icon slot, and Developer Reload button (`refresh` icon) in control strip and SubWindow header controls.
    - When `developerMode: false` (default): normal catalog card layout is rendered without any developer badges, dots, or reload buttons.
    - Unpacked reload checks self-targeting protection and executes safe disable-enable reload cycle with retry recovery.
  - **Outcome 3 — Store-Installed Extensions Behavior**:
    - When `developerMode: true`: exposes compact developer actions popover menu (`details.dev-menu-container` with `terminal` icon button).
    - Popover includes: `Open store page` (`https://chrome.google.com/webstore/detail/${id}`), `Open extension details` (`chrome://extensions/?id=${id}`), and disabled `Download store package` action.
    - Required copy displayed on disabled package download: `"Store package download requires additional browser permission."`
    - Does NOT expose store package download on unpacked extensions.
    - When `developerMode: false`: zero developer affordances or popover menus on store extensions.
  - **Outcome 4 & 5 — Interaction Grammar & SubWindow Integration**:
    - Preserved exact base component and layout dimensions: unpacked and store extensions reuse identical `ExtensionBrief` card templates (`bigTile`, `tile`, `list`).
    - Fixed CSS stacking context (`z-index: 200` on card when `details[open]`) ensuring open popover is never covered by sibling cards or containers.
    - SubWindow detail modal reflects `developerMode`: shows `DEV` chip and Reload button for unpacked extensions, and adds a dedicated "Developer Actions" section for store extensions with store link, details link, and disabled store package download.
    - Zero new permissions added: `src/manifest.json` completely untouched. Zero external network calls.
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
- **Unit test suite**: 11 test files, 183 tests passing (`npm test` via Vitest), including `tests/unit/developer-mode.test.ts` (20 tests covering default OFF, persistence, Options row, unpacked vs store behavior, SubWindow contracts) and `tests/unit/unpacked-reload.test.ts` (35 tests).
- **Static verification**: `npm run typecheck` (`tsc --noEmit`) and `npm run lint` (`eslint src/`) pass with 0 errors and 0 warnings.
- **Production build**: `npm run build` generates production assets cleanly (`dist/`) in ~150ms.
- **Visual inspection**: 7 high-fidelity Developer Mode v1 screenshots captured via Puppeteer harness and visually inspected (`devmode_01_options_mode_off.png` through `devmode_07_card_layout_reuse.png`), bundled into `/private/tmp/agent-review/20260913_2246_AGY_developer-mode-v1_7files.zip`.
- **Gate receipt**: Recorded and validated via `agentos_final_gate.py record` and `agentos_final_gate.py validate --agent AGY` (`decision: allow`, code: `OK`).
- **Baseline safety**: Release baseline `f87404a02534d704e00b281a38411f8c204d0cb9` and `release/extension-drawer-1.1.0.zip` preserved frozen; zero permission additions; no version bumps.
- **Real-Chrome smoke**: Verified environment capability boundary via `tests/e2e/runner.mjs` and `tests/e2e/real-chrome-test.mjs`. Chrome unpacked extension CLI loading (`--load-extension`) in this headless macOS environment does not register target IDs; this is an environment capability limitation, not an extension bundle defect.

## Lessons learned
- Browser profile data can contain extension IDs, user-specific metadata, and personal group naming that must be redacted before any commit.
- Disentangling navigation gestures from configuration actions prevents accidental modal opening and improves keyboard navigability.
- Preact state updates require new array references for memoized selectors to detect changes when injecting dynamic fixtures during testing.
- Fixed-width or constrained input fields require compact placeholder copy to avoid visual ellipsis truncation across varying OS font metrics.

## Recommended next steps
1. Perform external CWS dashboard check to verify whether 1.1.0 has been submitted/published.
2. Once 1.1.0 publication is externally confirmed, apply GitHub tag/release `v1.1.0` to commit `f87404a02534d704e00b281a38411f8c204d0cb9`.
3. Review user feedback on the updated AutoState terminology and group-focus banner.
4. Keep Developer Workspace proposal parked until security, privacy, and token storage architectures are evaluated.

## Ongoing tasks
- Maintain existing high unit test coverage (132 tests) across core features.
- Review remaining browser profile data for compatibility with current Chrome APIs.
- Validate recovered extension state against managed groups and extension configuration entries.
- Keep cautious handling of LevelDB and IndexedDB data in local-only recovery steps.

## Open risks
- Advanced regular expression rules in AutoState can still match unintended URLs if users supply overly broad patterns (mitigated by default wildcard mode and inline guidance).
- Chrome profile state may vary by version, channel, or user account.

## Parked items
- **PARKED proposal — Developer Workspace**:
  - *Approved concept*: `local unpacked extension ↔ GitHub repo ↔ Chrome Web Store item ↔ analytics`
  - *Potential future surface*: local/test extension state, linked GitHub repository/project, published Chrome Web Store version/status, and a small set (maximum roughly four) of useful analytics/store metrics.
  - *Status & Constraints*: External API/authentication/privacy implications require a separate feasibility investigation; exact APIs, scopes, permissions, token handling, and metric definitions remain unresolved; no implementation is approved.
- Automated profile recovery for unsupported Chrome builds.
- Cross-browser migration parity checks.
- Long-term preservation of any raw exported profile dumps not suitable for git.

## Owner contact
Team — NooBoss Maintainers

