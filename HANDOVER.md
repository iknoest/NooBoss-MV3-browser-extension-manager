# Handover

Snapshot: 2026-09-12T17:07:00+02:00

## Work completed
- **AutoState Clarity UX Milestone**:
  - Replaced ambiguous AutoState terminology with user-friendly lifecycle labels: *"Keep on while matching site is open"*, *"Keep off while matching site is open"*, *"Turn on when a matching site opens"*, and *"Turn off when a matching site opens"*, accompanied by inline explanatory guidance.
  - Renamed pattern matching modes: default is now *"Website pattern"* (`wildcard`), with *"Regular expression (advanced)"* (`RegExp`) as the secondary option; provided inline helper explanations and pattern examples.
  - Added smart URL helper button (*"Set as current website"* via active tab query) with graceful handling and warning messages for internal `chrome://`, `edge://`, `about:`, or file URLs.
  - Upgraded AutoState rules table layout with explicit column headers (`#`, `Target(s)`, `Action`, `Match`, `Pattern`, `State`), lifecycle action labels, pattern type badges, target icons, and action buttons.
- **Group Usability & Membership UX Milestone**:
  - Disentangled group card interactions: clicking the card body activates a temporary focused extensions view; clicking the settings/edit icon explicitly opens the group membership editor.
  - Added a prominent, dismissible group-focus banner in the Extensions view showing group name, live running counter (`Group: <name> · X / Y running`), shortcut to `[Edit group]`, and `[×]` clear button (with `Escape` key support).
  - Enhanced group membership selector with dynamic `<N> assigned` counter badge, an *"Assigned only"* toggle button, and membership-aware sorting (assigned members partitioned at top, running members first, alphabetical order).
  - Refined top-level taxonomy filter to dynamically show *"Apps"* and *"Themes"* only when items of those types are actually present in the library, preventing clutter.
  - Added dynamic search placeholder reflecting the active scope (*"Search extensions and groups"*, *"Search extensions in group..."*, *"Search extensions"*, etc.).

## Tests and verification
- **Unit test suite**: 10 test files, 132 tests passing (`npm test` via Vitest), including dedicated new test suites `tests/unit/autostate-clarity.test.ts` (12 tests) and `tests/unit/group-usability.test.ts` (9 tests).
- **Static verification**: `npm run typecheck` (`tsc --noEmit`) and `npm run lint` (`eslint src/`) pass with 0 errors and 0 warnings.
- **Production build**: `npm run build` generates production assets cleanly (`dist/`) in ~130ms.
- **Visual inspection**: 9 high-fidelity screenshots captured via Puppeteer harness and visually inspected:
  - `01_autostate_new_website_pattern.png`: AutoState tab, New Rule with Website pattern default and inline helper.
  - `02_autostate_new_regex.png`: AutoState tab, New Rule with Regular expression (advanced) and regex pattern.
  - `03_autostate_existing_rule.png`: AutoState tab, Rules table showing column structure, lifecycle labels, and badges.
  - `04_group_editor_membership.png`: Group membership editor showing assigned counter and partitioned members.
  - `05_group_editor_assigned_only.png`: Group membership editor with Assigned only toggle active.
  - `06_group_focused_extensions_view.png`: Extensions view with group-focus context banner active.
  - `07_group_focus_cleared.png`: Extensions view after clearing group focus.
  - `08_top_filter_no_app_theme.png`: Top taxonomy filter without apps/themes present.
  - `09_top_filter_with_app_theme.png`: Top taxonomy filter with apps/themes present.
- **Baseline safety**: Release baseline `f87404a02534d704e00b281a38411f8c204d0cb9` and `release/extension-drawer-1.1.0.zip` preserved frozen; zero permission additions; no version bumps.

## Lessons learned
- Browser profile data can contain extension IDs, user-specific metadata, and personal group naming that must be redacted before any commit.
- Disentangling navigation gestures from configuration actions prevents accidental modal opening and improves keyboard navigability.
- Preact state updates require new array references for memoized selectors to detect changes when injecting dynamic fixtures during testing.

## Recommended next steps
1. Review user feedback on the updated AutoState terminology and group-focus banner.
2. If preparing a future release (e.g. 1.2.0), review manifest versioning and build pipeline in accordance with release procedures.
3. Keep Developer Workspace proposal parked until security, privacy, and token storage architectures are evaluated.

## Ongoing tasks
- Monitor Chrome Web Store MV3 policy updates for any declarativeNetRequest or service worker lifecycle adjustments.
- Maintain existing high unit test coverage (132 tests) across core features.

## Open risks
- Advanced regular expression rules in AutoState can still match unintended URLs if users supply overly broad patterns (mitigated by default wildcard mode and inline guidance).

## Parked items
- **PARKED proposal — Developer Workspace (GitHub / CWS / Google Analytics integration)**:
  - *Boundary Note*: Proposes integrating GitHub issues/stars, Chrome Web Store download/rating analytics, and Google Analytics tracking into the manager UI.
  - *Constraints & Concerns*: Would require extensive additional host permissions (`api.github.com`, `chromewebstore.googleapis.com`, `google-analytics.com`), storage and management of third-party API keys / OAuth tokens, and privacy considerations regarding analytics data collection.
  - *Status*: Strictly parked and excluded from current milestones. Needs dedicated design RFC and security review before any implementation.
- Automated profile recovery for unsupported Chrome builds.
- Cross-browser migration parity checks.
- Long-term preservation of any raw exported profile dumps not suitable for git.

## Owner contact
Team — NooBoss Maintainers

