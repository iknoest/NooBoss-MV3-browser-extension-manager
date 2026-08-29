# Privacy Policy for Extension Drawer

**Effective Date:** August 29, 2026
**Product:** Extension Drawer (Chrome Web Store title: *Extension Drawer: Extension Manager & Organizer*)
**Repository:** [https://github.com/iknoest/NooBoss-MV3-browser-extension-manager](https://github.com/iknoest/NooBoss-MV3-browser-extension-manager)

---

## Overview

**Extension Drawer** is an open-source, local-first browser extension manager designed to help you organize, group, and control your Chrome extensions.

Your privacy is a fundamental design principle:
- **Zero Remote Telemetry**: Extension Drawer contains no tracking code, analytics SDKs, or background telemetry.
- **Zero Advertising**: The extension does not display ads or collect user data for advertising purposes.
- **No Background Data Transmission**: No telemetry or background transmission of browsing activity or extension-management data.
- **100% Local Storage**: All settings, groups, rules, and history records remain strictly on your local device.

---

## Information We Access and How It Is Used

Extension Drawer requests only the permissions necessary to fulfill its core functionality as an extension manager:

### 1. Installed Extension Information (`management` permission)
- **What is accessed**: Information about extensions installed in your browser, including extension name, ID, version, description, icons, enabled/disabled state, install type, and permissions.
- **Why it is accessed**: To display your extensions in the management interface, allow you to enable/disable or uninstall extensions, group extensions together, and inspect extension metadata.
- **Where it is stored**: Query results are held in memory while the management interface is open. Bounded records of install, update, enable, and disable events are recorded in local storage.

### 2. Active Tab URLs for AutoState Automation (`tabs` permission)
- **What is accessed**: The URL of the currently active browser tab when the AutoState feature is active.
- **Why it is accessed**: AutoState evaluates the active website URL against your custom pattern rules (for example, `*.github.com` or `amazon.com`) to automatically or assistively enable/disable designated extension groups.
- **How it is handled**: URLs are evaluated **transiently in-memory**. Full browsing history and visited URLs are **never saved to storage**, never logged to the event history table, and never transmitted over the network.

### 3. Local Configuration and Preferences (`storage` permission)
- **What is stored**:
  - Custom user groups and icon selections
  - AutoState URL matching rules created by the user
  - UI preferences (theme mode, accent color, view mode)
  - Local extension event history log (install/uninstall/enable/disable events with timestamps)
- **Where it is stored**: All data is stored locally in your browser profile using Chrome's `chrome.storage.local` API.

### 4. Local Notifications (`notifications` permission)
- **What is used**: Chrome's native notification system.
- **Why it is used**: To display optional, unobtrusive local alerts when an extension is installed or uninstalled, or when an AutoState rule requires manual user confirmation in assisted mode. Notifications are generated locally; no external notification service is used.

---

## Data Sharing and Third Parties

- **No Sale of Data**: We do not sell, rent, or monetize your data.
- **No Third-Party Services**: Extension Drawer does not integrate with third-party analytics, crash reporting, or cloud backends.
- **No Remote Code**: All code, styles, and font assets (including Google Material Symbols) are packaged locally inside the extension. No external scripts or styles are fetched at runtime.

---

## Data Retention and Deletion

- **Local Retention**: Your groups, rules, and preferences remain in `chrome.storage.local` on your computer for as long as you use the extension.
- **User Deletion**: You can clear your event history or reset settings at any time directly within the extension options.
- **Uninstalling**: Removing Extension Drawer from Chrome automatically purges all locally stored configuration and history data managed by Chrome.

---

## Backup and Data Portability

Extension Drawer provides a built-in Backup & Restore feature:
- You can export your groups, rules, and settings to a local `.json` file at any time.
- You can import previously exported `.json` configuration files to restore your setup.
- Exported files remain under your complete control and are saved directly to your local file system.

---

## Chrome Web Store Limited Use Compliance

Extension Drawer complies with the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data/), including the Limited Use requirements:
1. The use of data is restricted exclusively to providing and improving the user-facing features of the extension.
2. Data is never transferred to third parties, except as strictly required to execute local browser functionality.
3. Data is never used or transferred for advertising, personalized ads, creditworthiness, or lending purposes.

---

## Contact and Open Source

Extension Drawer is free and open-source software licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).

If you have questions or wish to inspect the complete source code, visit our GitHub repository:
[https://github.com/iknoest/NooBoss-MV3-browser-extension-manager](https://github.com/iknoest/NooBoss-MV3-browser-extension-manager)
