# Chrome Web Store Screenshots (Extension Drawer 1.2.0)

This directory contains the canonical, release-ready screenshot set for Extension Drawer 1.2.0 on the Chrome Web Store.

All assets are programmatically produced from the authentic production build (`dist/`) using headless Chrome and Puppeteer, composed with restrained marketing framing in accordance with official Chrome Web Store developer image guidelines.

---

## 1. Screenshot Assets Overview

| # | Filename | Dimensions | Marketing Title | Marketing Subtitle |
|---|---|---|---|---|
| 1 | `1-manage-groups.png` | 1280 × 800 | **Manage all your extensions in one place** | Search, sort, group and control your Chrome extensions with live running status. |
| 2 | `2-site-rules.png` | 1280 × 800 | **Automate extensions with Site Rules** | Turn extensions on or off automatically based on the websites you open. |
| 3 | `3-history-backup.png` | 1280 × 800 | **Review changes and keep your data portable** | Search management history and export configuration, extension lists and history locally. |
| 4 | `4-developer-workspace.png` | 1280 × 800 | **Optional tools for extension developers** | Connect local builds, GitHub, Chrome Web Store, analytics and Store packages. |
| 5 | `5-getting-started.png` | 1280 × 800 | **Get started in about 2 minutes** | A guided tour introduces Extensions, Groups, Site Rules, History, Backup & Data and Developer Workspace. |

---

## 2. Detailed Asset Specifications

### Screenshot 1: `1-manage-groups.png`
- **Surface**: Extension Drawer Manager (`?page=extensions`)
- **Key UI Elements**:
  - Top Navigation with **Extensions** active
  - Catalog action bar: Everything filter, Search extensions & groups input, Sort by *Recently installed / updated*, visibility batch controls, undo/redo, **+ New group** button, and view mode switcher
  - Live running badge: `5 / 6 running` with active status dot
  - Groups row: *Daily Essentials* (`2 / 2 running`) and *Web Development* (`2 / 2 running`) with quick-toggle controls, copy, edit, and delete actions
  - Extension cards: Big Tile grid with crisp icons, version numbers, enable switches, trash, and Chrome Web Store details actions
- **Data Privacy**: 100% generic, neutral fixtures (e.g., Privacy & Content Shield, Markdown Preview Pro, Color Picker & Palette, JSON & API Formatter).

### Screenshot 2: `2-site-rules.png`
- **Surface**: Site Rules Manager (`?page=autostate`)
- **Key UI Elements**:
  - Top Navigation with **Site Rules** active
  - Site Rules capability introduction card
  - Configured rules table:
    - `github.com` → *Web Development* (Keep on while matching site is open, Active switch ON)
    - `figma.com` → *Color Picker & Palette* (Keep on while matching site is open, Active switch ON)
  - Active New Rule builder card:
    - Scope selection: `This site (recommended)`
    - Input populated with `app.slack.com` and `Set as current website` action
    - Explanatory copy: *"Applies to all pages on this site."*
- **Terminology Integrity**: Zero obsolete "AutoState" terminology; fully aligned with 1.2.0 canonical *Site Rules* branding.

### Screenshot 3: `3-history-backup.png`
- **Surface**: Dual-panel composite of History View (`?page=history`) + Options Backup & Data (`?page=options`)
- **Key UI Elements**:
  - **Left panel (History)**:
    - All events filter, search input, Empty history action
    - Chronological event trail with timestamps: Enabled, Updated, Disabled, Installed events with extension icons
  - **Right panel (Backup & Data)**:
    - Developer Workspace toggle (Show Developer workspace ON)
    - **Backup & Data** section: Export Configuration (JSON), Export Extension List (HTML), Export History (CSV), and Import Backup (JSON)
- **Architecture Integrity**: Demonstrates single canonical export placement under Backup & Data without duplicate entry in History toolbar.

### Screenshot 4: `4-developer-workspace.png`
- **Surface**: Developer Workspace (`?page=developer`)
- **Key UI Elements**:
  - Top Navigation with **Developer** active
  - Header with Chrome Web Store Developer Dashboard quick-link and **+ Project** action
  - Connected Project card (*NoWebP - Image Format Converter*):
    - Local unpacked build indicator (`DEV · v1.2.0`, `Runtime ON`, Reload action)
    - Integration chips: GitHub linked, Store linked, Analytics connected, Download ZIP
    - Google Analytics 4 performance telemetry bar:
      - Active users: `14,820` (`+12.4%`)
      - New users: `3,140` (`+8.1%`)
      - Views: `52,400` (`+15.2%`)
      - Engagement: `64%` (`+3.4%`)
  - Secondary Project card (*Tab Session Organizer*):
    - Local build indicator (`DEV · v2.0.4`, `Runtime OFF`)
    - Integration chips illustrating unlinked optional analytics
- **Optionality**: Clearly communicates that Developer Workspace and Google Analytics permissions are strictly user-opt-in and optional.

### Screenshot 5: `5-getting-started.png`
- **Surface**: Welcome & Guided Tour Hub (`?page=welcome`)
- **Key UI Elements**:
  - Extension Drawer logo icon and welcome header
  - 4 primary capability cards: *Manage extensions*, *Organize with Groups*, *Site Rules*, *History & Backup*
  - Developer tools callout: *Developer tools · Optional*
  - Onboarding call-to-actions:
    - Primary: **Start quick tour →** with subtext **About 2 minutes**
    - Secondary: **Skip and open Extension Drawer**

---

## 3. Chrome Web Store Compliance Checklist

- [x] **Dimensions**: Exactly 1280 × 800 pixels (16:10 aspect ratio) on all 5 images.
- [x] **Format**: 24-bit PNG (RGB, no transparency/alpha on outer canvas, solid neutral background).
- [x] **Quantity**: Exactly 5 primary screenshots (CWS maximum is 5).
- [x] **Truthfulness**: Captured directly from compiled extension manager bundle (`dist/manager/manager.html`).
- [x] **Privacy & Anonymity**: No personal user data, private tokens, internal file paths, or private emails.
- [x] **Design Standards**: Clean Chrome window framing with subtle shadows, crisp typography, and neutral background.
- [x] **Policy Compliance**: No misleading badges, fake star ratings, promotional discount claims, or deceptive elements.

---

## 4. Reproducing Screenshot Generation

To regenerate all 5 screenshot assets from source:

```bash
# 1. Build extension production bundle
npm run build

# 2. Run the automated screenshot pipeline
node scripts/generate-cws-120-screenshots.mjs
```

The script will launch headless Google Chrome, serve `dist/` locally, render each view with verified fixtures, compose the marketing frame, and output the 1280x800 PNG files directly into this directory.
