/**
 * NooBoss Localization / Strings Helper
 */

const EN_MESSAGES: Record<string, string> = {
  "ASM": "AD/Spam/Bad",
  "RegExp": "RegExp",
  "about": "About",
  "action": "Action",
  "add_rule": "Add rule",
  "advanced": "Advanced",
  "all": "All",
  "all_websites": "All websites",
  "app": "App",
  "app_s": "[\"app\",\"apps\"]",
  "are_you_sure": "Are you sure?",
  "autoState": "Auto State",
  "autoState_rule_s": "[\"AutoState rule\",\"AutoState rules\"]",
  "backup": "Backup",
  "basics": "Basics",
  "buggy": "Buggy",
  "cancel": "Cancel",
  "clean": "Clean",
  "confirm": "Confirm",
  "description": "Description",
  "detail": "Detail",
  "disable": "Disable",
  "disableOnly": "Disable only",
  "disableWhen": "Disable when",
  "disabled": "Disabled",
  "download_crx": "Download CRX",
  "empty_history": "Empty history",
  "enable": "Enable",
  "enableOnly": "Enable only",
  "enableWhen": "Enable when",
  "enabled": "Enabled",
  "event": "Event",
  "experience": "Experience",
  "export_extensions_to_html": "Export extensions to html",
  "export_options": "Export options",
  "extension": "Extension",
  "extension_description": "A powerful Extensions Manager and Userscript Manager with many unique features",
  "extension_name": "NooBoss",
  "extension_s": "[\"extension\",\"extensions\"]",
  "extensions": "Extensions",
  "failed_to_import": "Failed to import",
  "first_installed": "First installed",
  "for_X_seconds": "for X second(s)",
  "group": "Group",
  "group_s": "[\"group\",\"groups\"]",
  "history": "History",
  "homepage_url": "Home url",
  "host_permissions": "Host permissions",
  "icon": "Icon",
  "id": "ID",
  "import_options": "Import options",
  "install": "Install",
  "install_type": "Install type",
  "is_disabled": "is disabled",
  "is_enabled": "is enabled",
  "join_community": "Join community",
  "join_nooboss_community": "Join NooBoss Community",
  "laggy": "Laggy",
  "last_update": "Last update'",
  "launch_type": "Launch type",
  "main_color": "Main color",
  "manage": "Manage",
  "manifest_file": "Manifest file",
  "match": "Match",
  "may_disable": "May disable",
  "name": "Name",
  "new_group": "New group",
  "new_rule": "New Rule",
  "none": "None",
  "nooboss_tags": "NooBoss Tags",
  "not_working": "Not working",
  "notification": "Notification",
  "notifications": "Notifications",
  "notify_extension_state_change": "Notify extension state change",
  "notify_installation": "Notify installation/update",
  "notify_removal": "Notify removal",
  "notify_state_change": "Notify state change",
  "official_rating": "Official rating",
  "offline_enabled": "Offline enabled",
  "options": "Options",
  "overview": "Overview",
  "pattern": "Pattern",
  "permissions": "Permissions",
  "recommend": "Recommend",
  "recommend_extensions": "Recommend extensions",
  "recommended_for": "Recommended for X",
  "record_disable": "Record disable event",
  "record_enable": "Record enable event",
  "record_installation": "Record installation",
  "record_removal": "Record removal",
  "record_update": "Record update",
  "redo": "Redo",
  "remove": "Remove",
  "removed": "Removed",
  "reset_everything": "Reset everything (Be careful!)",
  "rules": "Rules",
  "select_extensions": "Select extensions",
  "select_target_s": "Select target(s)",
  "set_as_current_website": "Set as current website",
  "set_zoom_to_100": "Set NooBoss zoom to 100%",
  "short_name": "Short name",
  "state": "State",
  "sub_color": "Sub color",
  "successfully_emptied_history": "Successfully emptied history",
  "successfully_exported": "Successfully exported, the file name is \"NooBoss.options\"",
  "successfully_exported_extensions": "Successfully exported, the file name is \"Extensions.html\"",
  "successfully_imported": "Successfully imported",
  "successfully_reset_everything": "Successfully reset everything",
  "target_s": "Target(s)",
  "theme": "Theme",
  "theme_s": "theme",
  "type": "Type",
  "undo": "Undo",
  "update": "Update",
  "update_url": "Update url",
  "useful": "Useful",
  "userscripts": "Userscripts",
  "version": "Version",
  "was_disabled": " was disabled",
  "was_enabled": " was enabled",
  "was_installed": " was installed",
  "was_removed": " was removed",
  "was_updated": " was updated",
  "when": "When",
  "wildcard": "Wildcard",
  "working": "Working",
  "x_1": "No one has recommended any extension for this website yet, do you have a wonderful extension for X?",
  "x_2": "Extension(s) recommended successfully! Extensions that are not in NooBoss database will be added soon.",
  "x_3": "Page zoom for NooBoss is not 100%, please click confirm to set zoom to 100%",
  "x_4": "Successfully reset NooBoss page zoom to 100%",
  "x_5": "By turning off join community, you will no longer get any community features, and you will not send any NooBoss usage to AInoob, so he will not be able to make a better NooBoss based on user usage",
  "x_6": "NooBoss zoom is already 100%",
  "x_7": "X1 X2 by autoState rule #X3",
  "you_have": "You have",
  "zoom": "Zoom"
};

export function GL(key: string): string {
  if (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getMessage) {
    const msg = chrome.i18n.getMessage(key);
    if (msg) return msg;
  }
  return EN_MESSAGES[key] || key;
}

export function GLS(key: string, count: number): string {
  const raw = GL(key);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return count === 1 || count === 0 ? parsed[0] : parsed[1];
    }
  } catch {
    // not JSON
  }
  return raw;
}

export function timeAgo(timestamp: number): string {
  if (!timestamp) return "";
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);
  if (diffSec < 45) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
}
