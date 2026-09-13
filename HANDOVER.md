# Handover

Snapshot: 2026-09-12T22:15:00+02:00

## Current release state (1.1.0 continuity)
- `f87404a02534d704e00b281a38411f8c204d0cb9` is the frozen accepted 1.1.0 source and release baseline.
- `release/extension-drawer-1.1.0.zip` remains frozen and must not be modified or replaced.
- Chrome Web Store 1.1.0 upload / submission / approval / publication is NOT CONFIRMED by current repository evidence.
- Therefore, the 1.1.0 CWS publication loop remains open until externally verified (do not guess CWS dashboard state).
- The GitHub `v1.1.0` tag and release should remain pending until public 1.1.0 publication is confirmed.
- Current UX work (at `4fbdbcb` and follow-up commits) is post-1.1.0 local work and must not silently become part of the frozen 1.1.0 release artifact.

## Work completed
- **Final Site Rules & Group Usability Closure Milestone (Post-QA)**:
  - **Site Rules 3-Mode Primary Scope Model**:
    - Simplified the scope model to exactly three primary choices:
      1. `This site (recommended)`: clean domain (e.g. `linkedin.com`), no asterisks required, matching `http://` and `https://`, the apex domain, `www.`, and arbitrary subdomains (`*.linkedin.com`), while strictly rejecting lookalike/unrelated domains (`evil-linkedin.com`, query strings);
      2. `Exact page`: matches full URL strictly (e.g. `https://www.linkedin.com/jobs/view/123`);
      3. `Custom`: simple URL pattern (e.g. `linkedin.com/jobs/*`) with secondary `Use advanced regular expression` checkbox (`^https://.*linkedin.com/jobs/.*`), removing regex from top-level clutter.
  - **Replaced Confusing When / While Labels**:
    - Replaced cryptic lifecycle labels with two explicit decisions:
      - Timing: `Temporary while open` vs `One-time on open`;
      - Effect: `Turn extension ON` vs `Turn extension OFF`.
    - Bijectively maps to all 4 internal engine actions (`enableOnlyWhileMatched`, `disableOnlyWhileMatched`, `enableWhenMatched`, `disableWhenMatched`) without changing engine semantics.
    - Added live dynamic behavior preview box explicitly explaining tab open and tab close lifecycle effects.
    - Updated page intro copy to clearly explain both temporary and one-time behaviors.
  - **Blocked Invalid and Targetless Rules**:
    - `Add rule` button is disabled whenever zero targets are selected or input syntax is invalid.
    - Added prominent inline validation guidance (`Select at least one extension or group.`).
  - **Discoverable Individual Group Controls & Runtime Management**:
    - Added dedicated `Control members` affordance across group card layouts (`bigTile`, `list`, `tile`), with informative hover titles.
    - Added secondary `Control members` shortcut inside Group Edit modal header to jump straight to runtime control.
    - Group Focus banner visibly shows `<group name> · X / Y running [Turn all OFF] [Turn all ON] [Edit members] [×]`.
    - Every member extension card in a focused group displays a persistent, directly clickable ON/OFF switch without requiring hover.
  - **Structural UI Quality Fixes**:
    - Fixed Group Edit modal header overlap defect: moved Close `×` and secondary `Control members` button into dedicated `.group-edit-actions` container (`flex-shrink: 0; margin-left: auto;`), ensuring group-name input never overlaps or clips buttons.
    - Made group membership Undo and Redo buttons visually distinct between enabled (bordered, card background, active cursor) and disabled (opacity 0.25, transparent background and border, not-allowed cursor) states.
    - Updated taxonomy filter to display `All extensions` / `All items` instead of confusing `Everything` when viewing extensions.
  - **Consistent Terminology Audit**:
    - Cleaned all copy across Site Rules and Group workflows to purge misleading terms.
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
- **Unit test suite**: 10 test files, 148 tests passing (`npm test` via Vitest), including dedicated test suites `tests/unit/autostate-clarity.test.ts` (26 tests) and `tests/unit/group-usability.test.ts` (11 tests).
- **Static verification**: `npm run typecheck` (`tsc --noEmit`) and `npm run lint` (`eslint src/`) pass with 0 errors and 0 warnings.
- **Production build**: `npm run build` generates production assets cleanly (`dist/`) in ~150ms.
- **Visual inspection**: 12 high-fidelity screenshots captured via Puppeteer harness and visually inspected (`01_site_rules_this_site_default.png` through `12_group_membership_undo_disabled.png`), bundled into `/private/tmp/agent-os-gate/a61582c5-ddf9-422d-8e81-0925bfcf4db8/screenshots.zip` per Agent-OS Playbook §5b.
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

