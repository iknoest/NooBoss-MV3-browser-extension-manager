# Handover

Snapshot: 2026-09-12T21:30:00+02:00

## Current release state (1.1.0 continuity)
- `f87404a02534d704e00b281a38411f8c204d0cb9` is the frozen accepted 1.1.0 source and release baseline.
- `release/extension-drawer-1.1.0.zip` remains frozen and must not be modified or replaced.
- Chrome Web Store 1.1.0 upload / submission / approval / publication is NOT CONFIRMED by current repository evidence.
- Therefore, the 1.1.0 CWS publication loop remains open until externally verified (do not guess CWS dashboard state).
- The GitHub `v1.1.0` tag and release should remain pending until public 1.1.0 publication is confirmed.
- Current UX work (at `4fbdbcb` and follow-up commits) is post-1.1.0 local work and must not silently become part of the frozen 1.1.0 release artifact.

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
  - Compact search placeholders preventing toolbar clipping: `"Search extensions & groups"` for normal combined view, `"Search this group"` for focused group view, and `"Search extensions"` for extension-only contexts.
- **Historical Migration / Recovery Foundations**:
  - Added a concise handover summary to `README.md` for the current repository state.
  - Documented policy expectations around sensitive browser metadata and raw migration dumps.
  - Added extraction guidance for legacy Chrome profile recovery in `docs/EXTRACT_LEGACY_DATA.md`.
  - Created a sanitized migration template at `migrated-nooboss-import-anon.json` and excluded raw migration files via `.gitignore`.

## Tests and verification
- **Unit test suite**: 10 test files, 132 tests passing (`npm test` via Vitest), including dedicated test suites `tests/unit/autostate-clarity.test.ts` (12 tests) and `tests/unit/group-usability.test.ts` (9 tests).
- **Static verification**: `npm run typecheck` (`tsc --noEmit`) and `npm run lint` (`eslint src/`) pass with 0 errors and 0 warnings.
- **Production build**: `npm run build` generates production assets cleanly (`dist/`) in ~150ms.
- **Visual inspection**: 9 high-fidelity screenshots captured via Puppeteer harness and visually inspected at 840px viewport (`01_autostate_new_website_pattern.png` through `09_top_filter_with_app_theme.png`); all compact search placeholders verified fully visible without truncation or clipping.
- **Real-Chrome smoke**: Verified environment capability boundary via `tests/e2e/runner.mjs` and `tests/e2e/real-chrome-test.mjs`. Chrome unpacked extension CLI loading (`--load-extension`) in this headless macOS environment does not register target IDs; this is an environment capability limitation, not an extension bundle defect.
- **Baseline safety**: Release baseline `f87404a02534d704e00b281a38411f8c204d0cb9` and `release/extension-drawer-1.1.0.zip` preserved frozen; zero permission additions; no version bumps.

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

