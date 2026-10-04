# Chrome Web Store Privacy Dashboard Answers

This guide contains copy-ready answers for the **Privacy Practices** tab in the Chrome Web Store Developer Dashboard for **Extension Drawer**.

---

## 1. Single Purpose Description

**Field:** *Single Purpose Description* (under 1,000 characters)

```text
Extension Drawer helps users manage and automate their installed Chrome extensions by organizing them into groups, enabling or disabling them individually or in batches, and applying site-driven extension automation (Site Rules).
```

---

## 2. Permission Justifications

**Field:** *Permission Justification* for each requested API permission

### `management`
```text
Required to list installed extensions and allow users to enable, disable, inspect, group, and uninstall extensions directly within the manager interface.
```

### `storage`
```text
Required to store user-created groups, Site Rules matching configurations, extension event history, UI preferences, and backup-compatible local configuration locally in chrome.storage.local.
```

### `tabs`
```text
Required to inspect URLs of currently open tabs in memory to evaluate user-configured Site Rules, automatically or assistively enabling/disabling designated extensions or groups. Visited URLs are evaluated transiently in memory, are never saved to persistent storage or history, and are never transmitted off the device.
```

### `notifications`
```text
Required to display optional local desktop notifications when extensions are installed or updated, or when Site Rules execute background state transitions.
```

---

## 3. Remote Code Declaration

**Question:** *Does this extension contain or load remote executable code (e.g. scripts from external URLs)?*
- **Answer:** **No** (I am not using remote code).
- **Justification:** All JavaScript, HTML, styles, and font assets (Google Material Symbols) are locally packaged inside the extension ZIP bundle. No scripts, styles, or libraries are loaded from external servers at runtime.

---

## 4. Data Usage / User Data Declarations

### Category: Web History / Browsing Activity *(VERIFY IN CURRENT DASHBOARD)*
- **Is it collected/handled?** **Yes** (Evaluated transiently by the Site Rules feature).
- **Usage Description:**
  ```text
  URLs of currently open tabs are evaluated transiently in memory against user-configured domain and path rules solely to determine which extensions should be enabled or disabled on that website. Browsing history and URLs are never saved to persistent storage, never recorded in extension history, and never transmitted to any external server.
  ```

### Category: User Activity / Installed Extensions *(VERIFY IN CURRENT DASHBOARD)*
- **Is it collected/handled?** **Yes** (Installed extension metadata).
- **Usage Description:**
  ```text
  Extension names, versions, enabled status, and IDs are read locally via chrome.management to display and control extensions in the UI.
  ```

---

## 5. Certification & Policy Compliance Checkboxes

| Question in Dashboard | Required Answer | Verified Fact |
| :--- | :---: | :--- |
| **Do you sell user data?** | **No** | Extension Drawer does not sell or monetize user data. |
| **Do you use or transfer data for personalized advertising?** | **No** | Extension Drawer contains no advertisements or ad tracking. |
| **Do you use or transfer data to determine creditworthiness or for lending purposes?** | **No** | Not applicable; no financial or credit data is handled. |
| **Do you transfer user data to third parties?** | **No** | Core extension data is processed 100% locally; optional developer integrations connect directly to official Google endpoints only upon explicit user authorization. |
| **Is data used for purposes unrelated to the item's core functionality?** | **No** | All data handling is strictly tied to extension management, Site Rules automation, and optional user-authorized developer tooling. |

---

## 6. Privacy Policy URL

**Field:** *Privacy Policy URL*
```text
https://github.com/iknoest/NooBoss-MV3-browser-extension-manager/blob/main/PRIVACY.md
```
