# Chrome Web Store Screenshot Assets (Extension Drawer 1.2.0)

This directory contains the release screenshot assets for Extension Drawer 1.2.0.

To maintain strict compliance with official Chrome Web Store developer guidelines while preserving assets for GitHub and external documentation, screenshots are organized into two distinct sets:

1. **`cws/` (Official Store Upload Set)**: Pure full-bleed screenshots capturing the authentic Extension Drawer UI with square corners and zero outer canvas padding.
2. **`marketing/` (Marketing & GitHub Set)**: Framed screenshots featuring browser window chrome, drop shadows, and headline banners, ideal for repository documentation and release announcements.

---

## 1. Directory Structure

```text
docs/chrome-web-store/screenshots/
├── cws/                          # Official Chrome Web Store upload set (Full Bleed)
│   ├── 1-manage-groups.png
│   ├── 2-site-rules.png
│   ├── 3-history-backup.png
│   ├── 4-developer-workspace.png
│   └── 5-getting-started.png
├── marketing/                    # Framed marketing assets for GitHub / release notes
│   ├── 1-manage-groups.png
│   ├── 2-site-rules.png
│   ├── 3-history-backup.png
│   ├── 4-developer-workspace.png
│   └── 5-getting-started.png
└── README.md                     # Asset documentation & compliance reference
```

---

## 2. Official CWS Upload Set (`cws/`)

All images in `cws/` strictly comply with Google's official Chrome Web Store developer image specifications:

| # | Filename | Dimensions | Description / Key Elements |
|---|---|---|---|
| 1 | `1-manage-groups.png` | 1280 × 800 | **Extensions & Groups**: Catalog action bar (search, sort, view mode), live `5 / 6 running` status badge, group cards (*Daily Essentials*, *Web Development*) with batch toggles, and Big Tile extension cards with developer badges. |
| 2 | `2-site-rules.png` | 1280 × 800 | **Site Rules**: Configured rules table and a complete, unified New Rule builder with target selection, `app.slack.com` pattern, timing, action, dynamic behavior preview box, and primary `Add rule` action. |
| 3 | `3-history-backup.png` | 1280 × 800 | **History & Backup Split**: 640+640 dual-pane view. Left: chronological management history log. Right: Options page with **Backup & Data** as the dominant visible section (JSON config export, HTML extension list, CSV history export, JSON backup restore). |
| 4 | `4-developer-workspace.png` | 1280 × 800 | **Developer Workspace**: Neutral fictional projects (*Sample Extension*, *Workspace Utility Demo*), local build controls, GitHub/CWS/ZIP integration chips, and opt-in Google Analytics 4 performance telemetry bar. |
| 5 | `5-getting-started.png` | 1280 × 800 | **Welcome & Guided Tour Hub**: Clean onboarding surface featuring 4 core capability cards, Developer tools optional card, and both CTAs (*Start quick tour* and *Skip and open Extension Drawer*) fully visible. |

---

## 3. Compliance & Policy Verification

### Chrome Web Store Guidelines Adherence
- [x] **Dimensions**: Exactly 1280 × 800 pixels (16:10 aspect ratio) across all 5 assets.
- [x] **Format**: 24-bit PNG (RGB, solid, no alpha or transparent outer borders).
- [x] **Quantity**: Exactly 5 screenshots (the maximum allowed by CWS).
- [x] **Full Bleed**: Square image corners, no simulated operating system framing, no fake browser tabs, authentic Extension Drawer UI fills 100% of the frame.
- [x] **Layout Integrity**:
  - Screenshot 2 displays the New Rule builder as an unbroken, complete visual unit.
  - Screenshot 3 positions Backup & Data directly beneath the navigator, avoiding unrelated developer toggles.
  - Screenshot 5 fits all onboarding cards and both call-to-action buttons without viewport clipping.
- [x] **Data Privacy & Neutrality**:
  - No personal user data, private tokens, internal file paths, or private emails.
  - Developer Workspace showcases neutral fictional extension identities (`Sample Extension`, `Workspace Utility Demo`).
  - Simulated analytics telemetry is strictly decoupled from real extensions or products.
- [x] **Store Policy Compliance**: No misleading badges, fake star ratings, promotional discount claims, or deceptive claims.

---

## 4. Marketing Framed Set (`marketing/`)

The assets under `marketing/` are preserved from the 1.2.0 milestone for use in:
- GitHub `README.md`
- Release notes and changelog announcements
- External developer documentation

Each image is 1280 × 800 with a neutral slate background, prominent feature headline and descriptive subtitle, and a subtle macOS-style window frame with drop shadow.

---

## 5. Automated Regeneration Pipeline

To reproduce all screenshot assets directly from the production bundle:

```bash
# 1. Build extension production bundle
npm run build

# 2. Run the automated screenshot pipeline
node scripts/generate-cws-120-screenshots.mjs
```

The script launches headless Google Chrome via Puppeteer, serves `dist/` over an internal HTTP server, loads verified mock fixtures, renders each view with pixel-perfect viewport dimensions, and outputs the 1280×800 PNG files directly into `docs/chrome-web-store/screenshots/cws/`.
