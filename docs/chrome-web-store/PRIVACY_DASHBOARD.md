# Chrome Web Store Privacy Dashboard Answers

This guide contains copy-ready answers for the **Privacy Practices** tab in the Chrome Web Store Developer Dashboard for **Extension Drawer**.

---

## 1. Single Purpose Description

**Field:** *Single Purpose Description* (under 1,000 characters)

```text
Extension Drawer helps users manage and automate their installed Chrome extensions by organizing them into groups, enabling or disabling them individually or in batches, and applying optional URL-based AutoState rules.
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
Required to store user-created groups, AutoState URL matching rules, extension event history, UI preferences, and backup-compatible local configuration locally in chrome.storage.local.
```

### `tabs`
```text
Required to detect active tab URLs in-memory when the user enables AutoState, matching website domains against user-defined rules to automatically or assistively enable/disable designated extension groups. Visited URLs are never saved to storage, never logged to history, and never transmitted off the device.
```

### `notifications`
```text
Required to display optional local desktop notifications when extensions are installed/uninstalled or when an AutoState rule requires manual user confirmation in assisted mode.
```

---

## 3. Remote Code Declaration

**Question:** *Does this extension contain or load remote executable code (e.g. scripts from external URLs)?*
- **Answer:** **No** (I am not using remote code).
- **Justification:** All JavaScript, HTML, styles, and font assets (Google Material Symbols) are locally packaged inside the extension ZIP bundle. No scripts, styles, or libraries are loaded from external servers at runtime.

---

## 4. Data Usage / User Data Declarations

### Category: Web History / Browsing Activity *(VERIFY IN CURRENT DASHBOARD)*
- **Is it collected/handled?** **Yes** (Evaluated transiently by the AutoState feature).
- **Usage Description:**
  ```text
  Active tab URLs are evaluated in-memory against user-configured domain/pattern rules solely to determine which extension groups should be enabled or disabled on that website. Browsing history and URLs are never saved to persistent storage, never logged, and never transmitted to any external server.
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
| **Do you transfer user data to third parties?** | **No** | Zero external data transmission; 100% local processing. |
| **Is data used for purposes unrelated to the item's core functionality?** | **No** | All data handling is strictly tied to extension management and AutoState automation. |

---

## 6. Privacy Policy URL

**Field:** *Privacy Policy URL*
```text
https://github.com/iknoest/NooBoss-MV3-browser-extension-manager/blob/main/PRIVACY.md
```
