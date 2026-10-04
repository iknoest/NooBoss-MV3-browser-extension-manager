# Privacy Policy for Extension Drawer

**Effective Date:** October 4, 2026  
**Product:** Extension Drawer (Chrome Web Store title: *Extension Drawer: Extension Manager & Organizer*)  
**Version:** 1.2.0  
**Repository:** [https://github.com/iknoest/NooBoss-MV3-browser-extension-manager](https://github.com/iknoest/NooBoss-MV3-browser-extension-manager)  

---

## 1. Core Architecture & Privacy Principles

Extension Drawer is an open-source, local-first browser extension manager designed to give you clear control over your installed extensions, groups, and site-based automation.

### Our Privacy Commitments
- **No First-Party Telemetry**: Extension Drawer does not operate its own analytics infrastructure, behavioral logging, telemetry servers, or user-tracking backends.
- **No Data Monetization**: We never sell, rent, monetize, or broker personal or browsing data.
- **No Advertising**: The extension contains zero ads and does not profile users for commercial targeting.
- **Local-First Storage**: Your settings, groups, Site Rules, and management history records are stored directly on your machine in `chrome.storage.local`.

---

## 2. Core Local Data Handling

Extension Drawer accesses local data through Chrome extension APIs strictly to perform requested management actions:

### Installed Extension Metadata (`management` permission)
- **Data Accessed**: Extension names, IDs, version numbers, descriptions, icon URLs, enabled/disabled status, installation types (normal, development, admin), and declared permissions.
- **Purpose**: To render your extension catalog, provide one-click toggle and uninstall actions, calculate group runtime statuses (`X / Y running`), and inspect technical metadata.
- **Handling**: Queried on demand and maintained in memory while the management window is open. Management events (install, update, enable, disable) are recorded in local history.

### Active Tab URLs for Site Rules (`tabs` permission)
- **Data Accessed**: The URL of the active browser tab when Site Rules evaluation is active.
- **Purpose**: Evaluates website domains and URL paths against your custom Site Rules (e.g. `github.com` or `app.slack.com`) to automatically turn designated extensions ON or OFF.
- **Handling**: URLs are evaluated **transiently in local memory**. Visited URLs and browsing history are **never written to persistent storage**, never recorded in the activity history log, and never sent across the network.

### Local Configuration & History (`storage` permission)
- **Data Stored**:
  - Custom extension groups, color tags, and icon choices
  - Site Rules definitions (patterns, scopes, timing, and target extension IDs)
  - Management event audit log (timestamp, event type, extension ID, name, version)
  - UI preferences (appearance theme, accent preset, view mode, Developer Workspace visibility)
- **Storage Location**: Stored exclusively in your local browser profile via Chrome's native `chrome.storage.local` API.

### Local Alerts (`notifications` permission)
- **Purpose**: To display optional, unobtrusive desktop notifications when Site Rules execute background state changes or when an extension update occurs.
- **Handling**: Alerts are dispatched locally via Chrome's notification service; no remote push service is used.

---

## 3. Optional Features & User-Initiated Network Access

Extension Drawer does not run background network trackers. However, the extension provides two advanced, user-initiated features that connect to official Google endpoints only upon explicit user command:

### A. Optional Developer Analytics
Extension Drawer includes an optional Developer Workspace designed for extension authors.
- **Activation**: Completely disabled and hidden by default. Only visible if explicitly toggled on under **Options → Developer Workspace**.
- **Permissions**:
  - `identity`: Requested at runtime when the user clicks to connect Google Analytics.
  - `https://analyticsdata.googleapis.com/*`: Optional host permission requested concurrently.
- **Data Flow**:
  1. The user explicitly initiates connection to Google Analytics for their project.
  2. Chrome prompts the user for runtime permission authorization.
  3. The extension uses Chrome's native `chrome.identity.getAuthToken` to obtain an OAuth token with the read-only scope `https://www.googleapis.com/auth/analytics.readonly`.
  4. The token is sent directly to Google's official Analytics Data API (`analyticsdata.googleapis.com`) to retrieve aggregate 28-day listing metrics (active users, new users, screen page views, and engagement rate) for the Google Analytics property ID specified by the user.
- **Privacy Guarantees**:
  - Tokens and telemetry remain local to the browser profile.
  - Explicit user connection: Ordinary users who never connect Developer Analytics are never prompted for the `identity` permission or Google OAuth.
  - Read-only scope: Connects exclusively via `https://www.googleapis.com/auth/analytics.readonly`.
  - No automatic interactive OAuth: Background stale cache refreshes (after 24 hours) execute via non-interactive silent authentication only (`interactive: false`); they never trigger unprompted login windows.
  - Extension Drawer servers or third parties never receive OAuth tokens or property metrics.

### B. Optional Store Package ZIP Download
Users can download unpacked `.zip` archives of extensions available in the Chrome Web Store.
- **Activation**: Triggered strictly and user-initiated when the user clicks the "Download ZIP" action for an extension with a valid Chrome Web Store ID.
- **Permissions**:
  - `downloads`: Optional permission requested at runtime to save the resulting archive to the user's local disk.
  - `https://clients2.google.com/*` and `https://clients2.googleusercontent.com/*`: Optional host permissions used to fetch the official `.crx` package file directly from Google's distribution servers.
- **Data Flow**:
  1. The extension requests package data directly from Google's official Chrome Web Store download endpoint.
  2. The downloaded CRX archive is extracted and unpacked into a `.zip` archive entirely in local browser memory via client-side processing.
  3. The `.zip` file is written directly to the user's local downloads folder.
- **Privacy Guarantees**:
  - All package processing and decompression happen client-side.
  - No Extension Drawer relay server, proxy server, or intermediate third-party backend is involved.

---

## 4. Data Sharing & Third-Party Services

- **No Third-Party Advertising or Telemetry**: We do not embed SDKs from advertising networks, analytics aggregators, crash reporters, or behavioral tracking vendors.
- **Direct User-Initiated Connections**: Network requests occur exclusively when the user explicitly triggers an optional feature (retrieving a package from Google Web Store endpoints or querying Google Analytics Data API via Google OAuth). These requests communicate directly between your browser and Google's official infrastructure.
- **No Remote Code Execution**: All application scripts, user interface templates, and styling assets (including Material Symbols fonts) are bundled locally within the extension package. No executable code is fetched or evaluated remotely.

---

## 5. Data Deletion, Portability & Retention

- **Local Retention**: Configuration, rules, and history records persist in `chrome.storage.local` until explicitly cleared or until the extension is uninstalled.
- **Clear History**: You can clear all recorded extension management history entries at any time under **Options → Backup & Data**.
- **Data Portability, Export & Import**:
  - **Export Configuration (JSON)**: Export all groups, Site Rules, and preferences to a portable `.json` file.
  - **Import Configuration (JSON)**: Restore your setup from a previously exported `.json` configuration file.
  - **Export Extension List (HTML)**: Export an offline-readable HTML directory of all installed extensions with Chrome Web Store links.
  - **Export History (CSV)**: Export the complete activity history audit log as a standard `.csv` spreadsheet.
  - **Import History (CSV)**: Safely import activity history records from a `.csv` file. Imported records are merged chronologically into local storage using composite-key deduplication (`timestamp + event + extension_id + version`), ensuring re-importing identical records produces zero duplicates. If total records exceed the configured retention limit, users are prompted before older records are pruned.
- **Complete Deletion upon Uninstall**: Uninstalling Extension Drawer from Chrome immediately and permanently removes all stored data managed by Chrome's local extension storage.

---

## 6. Chrome Web Store Limited Use Compliance

Extension Drawer strictly adheres to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data/), including the Limited Use requirements:
1. **Feature Necessity**: Access to extension metadata, active tab URLs, and optional developer APIs is limited exclusively to delivering user-facing extension management and developer capabilities.
2. **No Data Transfers for Advertising**: Data accessed by Extension Drawer is never sold, transferred, or used for advertising, personalized promotions, creditworthiness, or consumer profiling.
3. **No Unrelated Data Transfers**: Data is never transferred to third parties except for direct, user-authorized communication with Google API endpoints for requested features.

---

## 7. Open Source & Contact

Extension Drawer is free and open-source software licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).

Source code, issue tracking, and security discussions are hosted transparently on GitHub:  
[https://github.com/iknoest/NooBoss-MV3-browser-extension-manager](https://github.com/iknoest/NooBoss-MV3-browser-extension-manager)
