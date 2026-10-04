# Policy Readiness & Compliance Specification

**Product:** Extension Drawer (Chrome Web Store title: *Extension Drawer: Extension Manager & Organizer*)  
**Version:** 1.2.0  
**Target Platform:** Chrome Manifest V3  

---

## 1. Project Scope & Distribution Model

Extension Drawer is an open-source browser extension manager distributed through the **Chrome Web Store** and available for local unpacked development. It provides visual extension management, command-based groups, site-driven extension automation (Site Rules), management history auditing, backup portability, and an optional Developer Workspace.

---

## 2. Permission Architecture & Policy Footprint

Extension Drawer adheres to the Chrome Web Store Principle of Least Privilege by splitting capabilities into **core required permissions** and **explicitly user-authorized optional permissions**.

### A. Core Required Permissions
These permissions are required for Extension Drawer's everyday offline extension management:

- `management`: Required to enumerate installed extensions, query runtime state, toggle enabled/disabled status, inspect extension properties, and initiate uninstall requests.
- `storage`: Required for local state persistence (`chrome.storage.local`) storing groups, Site Rules, UI settings, and activity history records.
- `tabs`: Required exclusively in memory to read the active tab URL for matching against user-defined Site Rules. URLs are processed transiently; visited browsing history is never recorded, persisted, or transmitted.
- `notifications`: Dispatches local system notifications when Site Rules execute background state transitions or when extensions update.

### B. Optional Permissions (Runtime Opt-In)
Advanced features require runtime user authorization and are never requested during installation or ordinary browsing:

1. **Optional Developer Analytics**:
   - `identity`: Authorizes Chrome's native OAuth 2.0 flow via `chrome.identity.getAuthToken`.
   - `https://analyticsdata.googleapis.com/*`: Optional host permission granting access exclusively to Google's official Analytics Data API endpoint.
   - **Boundary**: Requested strictly when a user clicks to link Google Analytics for a project inside the optional Developer Workspace. Users who do not enable Developer Workspace or who do not link analytics are never prompted.

2. **Optional Store Package ZIP Download**:
   - `downloads`: Allows writing unpacked `.zip` archives directly to the user's downloads folder.
   - `https://clients2.google.com/*`<br>`https://clients2.googleusercontent.com/*`: Host permissions allowing package downloads directly from official Chrome Web Store distribution servers.
   - **Boundary**: Requested only when the user explicitly clicks the "Download ZIP" action on an eligible extension card.

---

## 3. Remote Code Policy Compliance

Extension Drawer strictly adheres to Chrome's Manifest V3 prohibition against remote code execution:

- **Zero Remote Code**: The extension does **not** download, fetch, load, or evaluate remote executable scripts (no `eval`, no `new Function`, no external `<script>` injection, no dynamic code loading).
- **Bundled Assets**: All application logic, Preact components, stylesheets, and fonts (including the complete Google Material Symbols catalog) are statically bundled inside the extension package.
- **API Access vs. Remote Code**: Outbound network requests (fetching Web Store `.crx` archives for client-side extraction, or querying Google Analytics Data API for metric numbers) transfer purely static data payloads (binary archives or JSON statistics). At no point is executable code received or executed from the network.

---

## 4. Manifest V3 Service Worker Lifecycle

- Background tasks operate inside a Manifest V3 service worker (`service-worker.ts`), designed for graceful sleep and revival.
- All persistent configuration, active group definitions, and Site Rules are synchronized to `chrome.storage.local`.
- When Chrome restarts or wakes the service worker, state is rehydrated immediately without data loss.

---

## 5. Site Rules Policy & Automation Boundaries

- Site Rules evaluate active website domains against user-configured rules.
- **Rule Lifecycle**:
  - *Temporary while open*: Turns extensions ON (or OFF) while matching tabs are open, reverting automatically when the matching tab closes.
  - *One-time on open*: Applies the change once upon opening without exit reversion.
- All URL evaluation occurs client-side in memory. No URL telemetry or domain logging is transmitted to any server.

---

## 6. Developer Workspace & Telemetry Boundary

- **No First-Party Telemetry**: Extension Drawer does not operate telemetry, tracking servers, or analytics collection on its users.
- **Read-Only Third-Party Analytics**: The Developer Workspace retrieves read-only performance data from Google Analytics Data API via official Google OAuth exclusively for projects configured by extension developers.
- OAuth tokens and telemetry are stored exclusively in the local extension storage and are never relayed to any third party.

---

## 7. Handover & Release Packaging Controls

- **Deterministic Builds**: Releases are generated via `npm run package` from a clean repository state, producing a verified `.zip` archive from `dist/`.
- **Exclusion Verification**: Release archives exclude test suites, development fixtures, review packages, screenshot generation scripts, and local developer configs.
- **Anonymity & Sanitization**: Test fixtures and documentation use neutral generic identities (`Sample Extension`, `Workspace Utility Demo`), ensuring zero private credentials, tokens, or personal identifiers are stored in the codebase.
