# Extension Drawer — Promotional Media Storyboard & Specification

## 1. Video Specifications

### Main Interactive Product Demo (45s)
- **Filename**: `extension-drawer-demo-45s.mp4`
- **Resolution**: 1920 × 1080 (16:9 Full HD)
- **Framerate**: 30 fps
- **Codec**: H.264 (MPEG-4 AVC), `yuv420p` pixel format
- **Target Duration**: ~43.5 seconds (35–45s bounded range)
- **Interaction Model**: 100% action-driven motion with visible animated mouse cursor, click ripple rings, progressive keystroke typing, and live cause-and-effect state changes. Zero static slideshow holds exceeding 1.5s.
- **Audio**: Caption-first, high-legibility lower-third pills, no copyrighted audio required.

### Social Cut (20s)
- **Filename**: `extension-drawer-demo-20s.mp4`
- **Resolution**: 1920 × 1080 (16:9 Full HD)
- **Framerate**: 30 fps
- **Codec**: H.264, `yuv420p`
- **Target Duration**: ~19.5 seconds (15–20s bounded range)
- **Sequence**: Rapid-fire continuous interaction: Search/type & toggle reaction → Group OFF/ON execution → Site Rule live trigger on `localhost:3000` & tab close restoration → Dev reload & metrics → End card.

---

## 2. 45-Second Interactive Storyboard Breakdown

1. **Scene 1 (0:00 – 0:02.5) · Hook & UI Arrival**
   - *Text*: `Managing 100+ Chrome extensions?`
   - *Action*: Sleek card hook immediately gives way to full Extension Drawer 1.2.1 UI arriving ready for interaction.
2. **Scene 2 (0:02.5 – 0:09.5) · Manage & Progressive Search**
   - *Action*:
     1. Cursor moves smoothly toward search input.
     2. Clicks search box (ripple animation, focus border).
     3. Progressively types `privacy` (letters appear one-by-one).
     4. Tile grid filters in real-time until only *Privacy & Content Shield* remains.
     5. Cursor moves to toggle switch on the card.
     6. Clicks switch: thumb slides OFF, header running count visibly updates (`6 / 8` → `5 / 8 running`).
     7. Cursor clears search, restoring the complete catalog grid.
   - *Caption*: `Search, sort and control your extensions.`
3. **Scene 3 (0:09.5 – 0:16.5) · Workflow Groups (1-Click Command)**
   - *Action*:
     1. Cursor moves to *Groups* filter in header and clicks.
     2. Cursor moves to *Development Stack* group card and clicks.
     3. Focused group opens showing 4 member extensions (*4 / 4 running*).
     4. Cursor moves to `OFF` button in `GroupCommandControl` header.
     5. Clicks `OFF`: all 4 member switches visibly slide to OFF, and counter updates to `0 / 4 running`.
     6. Cursor moves to `ON` button and clicks: all 4 member switches return ON, counter returns to `4 / 4 running`.
   - *Caption*: `Switch whole workflows with one click.`
4. **Scene 4 (0:16.5 – 0:28.5) · Site Rules Hero Automation (Cause & Effect Proof)**
   - *Action*:
     1. Cursor navigates to *Site Rules* in sidebar.
     2. In target selector, cursor selects target extension (*React Developer Tools Demo*, initially OFF).
     3. Cursor moves to scope input, progressively types `localhost:3000`.
     4. Dynamic behavior preview validates: *When opening localhost:3000: Turn ON React Developer Tools Demo · When closing: Restore original state*.
     5. Cursor clicks `Add rule`: rule appears in active rules table.
     6. **Live Split-View Proof**: Side-by-side view renders Extension Drawer on left and a live browser workspace opening `http://localhost:3000` on right.
     7. As `localhost:3000` opens, rule match triggers: target switch automatically slides from `OFF` to `ON`!
     8. Cursor clicks tab close button `✕` on `localhost:3000`.
     9. As tab closes, target switch automatically restores back to `OFF`!
   - *Caption*: `Only run extensions where you actually need them.`
5. **Scene 5 (0:28.5 – 0:34.0) · History Continuity**
   - *Action*:
     1. Cursor clicks *History* in navigator.
     2. History audit log opens displaying the freshly generated management events at top (*Restored after site close*, *Activated on localhost:3000*, *Group ON/OFF*, *Toggle OFF*).
     3. Cursor moves to event filter, clicks and selects `Enabled`.
     4. List instantly filters down to enabled events.
   - *Caption*: `See exactly what changed.`
6. **Scene 6 (0:34.0 – 0:40.0) · Developer Workspace**
   - *Action*:
     1. Cursor clicks *Developer* in navigator.
     2. Workspace opens with unpacked project (*Extension Drawer*, Manifest V3).
     3. Cursor moves to `Reload` button and clicks.
     4. Spin animation triggers, toast confirms `✓ Extension reloaded in 38ms`, and timestamp updates to `Just now`.
     5. Cursor gestures across GitHub link, Store link, and live GA4 store metrics card (*14,200 Active Users*).
   - *Caption*: `Built-in tools for extension developers.`
7. **Scene 7 (0:40.0 – 0:43.5) · Brand Outro**
   - *Visual*: Clean branded end card lockup.
   - *Copy*: `Extension Drawer` · `Free & open source extension manager` · `Available on Chrome Web Store · GitHub`

---

## 3. Store Promotional Graphics Specifications

### Small Promo Tile (440 × 280)
- **Filename**: `small-promo-tile-440x280.png`
- **Target Dimensions**: 440 × 280 pixels (Retina 2x: 880 × 560)
- **Format**: 24-bit PNG
- **Design**: Layered 3D brand icon against deep slate lighting with `Modern Extension Manager` badge.

### Marquee Promo Tile (1400 × 560)
- **Filename**: `marquee-promo-tile-1400x560.png`
- **Target Dimensions**: 1400 × 560 pixels (Retina 2x: 2800 × 1120)
- **Format**: 24-bit PNG
- **Design**: Wide banner showcasing hero typography, feature pills, and floating glass cards displaying live catalog and group commands.

### YouTube Video Thumbnail (1280 × 720)
- **Filename**: `youtube-thumbnail-1280x720.png`
- **Target Dimensions**: 1280 × 720 pixels (Retina 2x: 2560 × 1440)
- **Format**: 24-bit PNG
- **Design**: High-contrast headline `Manage 100+ Chrome Extensions`, feature badges, and glass catalog window with active toggle switches.
