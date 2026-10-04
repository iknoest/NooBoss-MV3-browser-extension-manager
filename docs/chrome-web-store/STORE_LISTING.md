# Chrome Web Store Listing Package: Extension Drawer

This document contains canonical, copy-ready fields for submitting **Extension Drawer 1.2.0** to the Chrome Web Store Developer Dashboard.

---

## 1. Store Metadata

### Product Name
```text
Extension Drawer: Extension Manager & Organizer
```

### In-Product / Brand Name
```text
Extension Drawer
```

### Short Name (Manifest)
```text
Ext Drawer
```

### Short Description (107 / 132 characters)
```text
Manage, group and automate Chrome extensions with Site Rules, history, backup and optional developer tools.
```

### Primary Category (Dashboard Selection)
```text
Productivity
```
*(Alternative Category: Developer Tools / Workflow & Planning)*

### Language
```text
English (United States)
```

---

## 2. Detailed Description

```text
Extension Drawer is a fast, modern, and privacy-first extension manager that gives you complete control over your Chrome extensions with visual management, command-based groups, site automation, and developer tools.

Whether you manage developer plugins, privacy tools, shopping helpers, or everyday extensions, Extension Drawer keeps your browser fast, organized, and uncluttered.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY CAPABILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. EXTENSION MANAGEMENT
• Instant Controls: Enable, disable, inspect Chrome metadata, open options pages, or uninstall extensions in a single click.
• 3 Flexible View Modes:
  - Big Tile: 2-column balanced cards with metadata and quick actions.
  - List View: Compact 44px rows for high-density scanning.
  - Tile View: Compact grid with responsive, contained action overlays.
• User-Centered Sorting:
  - Recently installed / updated: Quickly find newly added extensions.
  - Enabled first: Keep active extensions at the top.
  - Recently changed: Sort by latest toggle or management activity.
  - Name A–Z: Clean alphabetical order.
• Instant Search: Filter extensions in real time by name, category (extensions, apps, themes), or runtime state.
• Live Status Summary: Real-time status badge (e.g., "12 / 24 running") with one-click filtering.
• Store Package ZIP Download: Download unpacked .zip archives directly from Chrome Web Store distribution endpoints for supported extensions.

2. COMMAND-BASED GROUPS
• One-Shot Bulk Commands: Toggle entire workflows on or off with a single click using [ OFF | ON ] segmented controls.
• Live Running Counters: Monitor real-time status on every group card (e.g., "5 / 6 running").
• Seamless Overlap: Groups act as convenient command shortcuts without persistent state-fighting. Overlapping groups and individual extension toggles work together naturally.
• Safe Handling: Uninstalled ("1 missing") and policy-restricted ("1 unavailable") extensions are clearly indicated without blocking batch commands for eligible members.
• 3,000+ Icons: Choose from self-hosted Google Material Symbols, curated presets, or custom icon uploads.

3. SITE RULES AUTOMATION
• Context-Aware Automation: Automatically turn extensions ON or OFF when specific websites open or close.
• Flexible Scope Matching:
  - This site: Domain and subdomain matching (e.g. github.com).
  - Exact page: Specific URL matching (e.g. example.com/editor).
  - Custom: Wildcards (e.g. *.slack.com) or advanced regular expressions.
• Clear Lifecycle:
  - Temporary while open: Turns extensions on while matching tabs are open, reverting automatically when the last matching tab closes.
  - One-time on open: Applies the change once upon opening without exit reversion.
• Dynamic Behavior Preview: Clear, live bullet-point summaries of exact rule behavior before saving.
• Local Privacy: Visited URLs are evaluated transiently in local browser memory. Visited URLs are never saved to history and never transmitted over the network.

4. HISTORY & BACKUP
• Activity Audit Trail: Timestamped log tracking install, update, enable, and disable events.
• Search & Filter: Filter history by event type or search by extension name.
• Single Canonical Backup Location: Centralized under Options → Backup & Data.
• Export Configuration (JSON): Save groups, Site Rules, and preferences to a portable JSON file.
• Export Extension List (HTML): Generate a clean, offline HTML catalog of your installed extensions with direct Web Store links.
• Export History (CSV): Export complete activity logs as a standard CSV spreadsheet.
• Import Backup (JSON): Easily restore your setup on any browser.

5. GUIDED GETTING STARTED
• Built-in 6-Step Walkthrough: An interactive tour introducing Extensions, Groups, Site Rules, History, Backup & Data, and optional Developer Workspace.
• Accessible Anytime: Available upon first install or rerun via About → Getting started.

6. OPTIONAL DEVELOPER WORKSPACE
• Designed for Extension Creators: Completely hidden by default until explicitly enabled in Settings.
• Local Unpacked Projects: Connect local unpacked extensions with one-click code reload and manifest diagnostics.
• Repository & Store Quicklinks: Direct links to GitHub repositories and Chrome Web Store listings.
• Read-Only Store Listing Analytics: Connect Google Analytics 4 (GA4) property data via official Google OAuth to view 28-day listing metrics (active users, new users, views, engagement rate).
• Store Package ZIP Download: Retrieve production extension packages directly from official Chrome endpoints.

7. LOCAL-FIRST PRIVACY
• No First-Party Telemetry: Extension Drawer does not operate analytics servers, tracking infrastructure, or advertising networks.
• No Monetization: We never sell, rent, or monetize your data.
• Local Storage: All configuration, rules, and history reside on your device in chrome.storage.local.
• Permission Transparency: Core extension management requires only local permissions (management, storage, tabs, notifications). Optional features (Google Analytics connection, ZIP downloads) request identity, downloads, or host permissions only upon explicit user action.

8. OPEN SOURCE & ORIGIN
Extension Drawer is an independently maintained Manifest V3 continuation inspired by the classic open-source NooBoss extension originally created by AInoob.
• Source Code: https://github.com/iknoest/NooBoss-MV3-browser-extension-manager
• Upstream Origin: https://github.com/AInoob/NooBoss
• License: GNU General Public License v3.0 (GPL-3.0)
```

---

## 3. URLs and Support

### Homepage URL
```text
https://github.com/iknoest/NooBoss-MV3-browser-extension-manager
```

### Support URL
```text
https://github.com/iknoest/NooBoss-MV3-browser-extension-manager/issues
```

### Privacy Policy URL
```text
https://github.com/iknoest/NooBoss-MV3-browser-extension-manager/blob/main/PRIVACY.md
```

---

## 4. Official Screenshot Assets

The accepted, release-ready 1280×800 full-bleed screenshots for Chrome Web Store upload are located in:

```text
docs/chrome-web-store/screenshots/cws/
├── 1-manage-groups.png        # Extensions & Groups (Catalog controls, 5/6 running, Big Tile)
├── 2-site-rules.png           # Site Rules (Rules table and complete, unclipped New Rule builder)
├── 3-history-backup.png       # History & Backup Split (Audit log and dominant Backup & Data section)
├── 4-developer-workspace.png  # Developer Workspace (Neutral fictional projects, optional GA4 telemetry)
└── 5-getting-started.png      # Getting Started (Default first-run navigation without Developer tab)
```
