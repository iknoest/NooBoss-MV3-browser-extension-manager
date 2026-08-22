/**
 * Google Material Symbols (Rounded variant)
 * Licensed under Apache License 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 * Offline bundle with search index and fallback handling.
 */

import { JSX } from "preact";

export interface MaterialSymbolMeta {
  name: string;
  category: string;
  keywords: string[];
  svg: string;
}

export const MATERIAL_SYMBOLS: Record<string, MaterialSymbolMeta> = {
  // General / Core
  folder: {
    name: "folder",
    category: "General",
    keywords: ["folder", "directory", "archive", "group", "files", "collection"],
    svg: "<path d=\"M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z\"/>",
  },
  category: {
    name: "category",
    category: "General",
    keywords: ["category", "shapes", "collection", "group", "organize", "classify"],
    svg: "<path d=\"M12 2l-5.5 9h11z\"/><circle cx=\"17.5\" cy=\"17.5\" r=\"4.5\"/><path d=\"M3 13.5h8v8H3z\"/>",
  },
  extension: {
    name: "extension",
    category: "General",
    keywords: ["extension", "puzzle", "plugin", "addon", "module", "component"],
    svg: "<path d=\"M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5z\"/>",
  },
  widgets: {
    name: "widgets",
    category: "General",
    keywords: ["widgets", "tools", "dashboard", "components", "grid"],
    svg: "<path d=\"M13 13v8h8v-8h-8zM3 21h8v-8H3v8zM3 3v8h8V3H3zm13.66-1.31L11 7.34 16.66 13l5.66-5.66-5.66-5.65z\"/>",
  },
  apps: {
    name: "apps",
    category: "General",
    keywords: ["apps", "grid", "menu", "launcher", "applications"],
    svg: "<path d=\"M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z\"/>",
  },
  star: {
    name: "star",
    category: "General",
    keywords: ["star", "favorite", "bookmark", "rate", "best", "highlight"],
    svg: "<path d=\"M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z\"/>",
  },
  favorite: {
    name: "favorite",
    category: "General",
    keywords: ["favorite", "heart", "love", "like", "save"],
    svg: "<path d=\"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z\"/>",
  },
  bookmark: {
    name: "bookmark",
    category: "General",
    keywords: ["bookmark", "save", "marker", "read later", "favorite"],
    svg: "<path d=\"M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z\"/>",
  },
  tag: {
    name: "tag",
    category: "General",
    keywords: ["tag", "label", "hashtag", "organize", "topic"],
    svg: "<path d=\"M20 10V8h-4V4h-2v4h-4V4H8v4H4v2h4v4H4v2h4v4h2v-4h4v4h2v-4h4v-2h-4v-4h4zm-6 4h-4v-4h4v4z\"/>",
  },
  bolt: {
    name: "bolt",
    category: "General",
    keywords: ["bolt", "lightning", "fast", "power", "quick", "speed", "energy"],
    svg: "<path d=\"M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.9 17.55 11 21 11 21z\"/>",
  },
  visibility: {
    name: "visibility",
    category: "General",
    keywords: ["visibility", "eye", "view", "show", "inspect", "preview"],
    svg: "<path d=\"M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z\"/>",
  },

  // Tech / Development
  code: {
    name: "code",
    category: "Development",
    keywords: ["code", "developer", "html", "script", "coding", "program", "syntax", "dev"],
    svg: "<path d=\"M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z\"/>",
  },
  terminal: {
    name: "terminal",
    category: "Development",
    keywords: ["terminal", "console", "cli", "command", "bash", "shell", "prompt"],
    svg: "<path d=\"M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-2-1h-6v-2h6v2zM7.5 17l-1.4-1.4 3.6-3.6-3.6-3.6L7.5 7l5 5-5 5z\"/>",
  },
  developer_mode: {
    name: "developer_mode",
    category: "Development",
    keywords: ["developer", "mode", "device", "debug", "mobile", "tech"],
    svg: "<path d=\"M7 5h10v2h2V3c0-1.1-.9-1.99-2-1.99L7 1c-1.1 0-2 .9-2 2v4h2V5zm8.41 11.59L20 12l-4.59-4.59L14 8.83 17.17 12 14 15.17l1.41 1.42zM10 15.17L6.83 12 10 8.83 8.59 7.41 4 12l4.59 4.59L10 15.17zM17 19H7v-2H5v4c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-4h-2v2z\"/>",
  },
  bug_report: {
    name: "bug_report",
    category: "Development",
    keywords: ["bug", "issue", "report", "debug", "error", "fix", "inspect"],
    svg: "<path d=\"M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z\"/>",
  },
  database: {
    name: "database",
    category: "Development",
    keywords: ["database", "storage", "sql", "data", "server", "record"],
    svg: "<path d=\"M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2zm0 2c4.42 0 8 1.34 8 2.5S16.42 9 12 9 4 7.66 4 6.5 7.58 4 12 4zm8 13.5c0 1.16-3.58 2.5-8 2.5s-8-1.34-8-2.5V15c1.78 1.23 4.7 2 8 2s6.22-.77 8-2v2.5zm0-4.5c0 1.16-3.58 2.5-8 2.5s-8-1.34-8-2.5V10.5c1.78 1.23 4.7 2 8 2s6.22-.77 8-2V13z\"/>",
  },
  api: {
    name: "api",
    category: "Development",
    keywords: ["api", "interface", "network", "integration", "endpoint", "connect"],
    svg: "<path d=\"M14 12l-2 2-2-2 2-2 2 2zm0-6l-2 2-2-2 2-2 2 2zm0 12l-2 2-2-2 2-2 2 2zm6-6l-2 2-2-2 2-2 2 2zM8 12l-2 2-2-2 2-2 2 2zm4-8c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z\"/>",
  },
  data_object: {
    name: "data_object",
    category: "Development",
    keywords: ["data_object", "json", "object", "curly", "brackets", "struct"],
    svg: "<path d=\"M4 7V4h3V2H4c-1.1 0-2 .9-2 2v3c0 1.1-.9 2-2 2v2c1.1 0 2 .9 2 2v3c0 1.1.9 2 2 2h3v-2H4v-3c0-1.1-.9-2-2-2 1.1 0 2-.9 2-2V7zm16-3v3c0 1.1.9 2 2 2-1.1 0-2 .9-2 2v3c0 1.1-.9 2-2 2h-3v2h3c1.1 0 2-.9 2-2v-3c0-1.1.9-2 2-2v-2c-1.1 0-2-.9-2-2V4c0-1.1-.9-2-2-2h-3v2h3z\"/>",
  },

  // Web & Security
  globe: {
    name: "globe",
    category: "Web & Security",
    keywords: ["globe", "world", "web", "internet", "browser", "international", "online"],
    svg: "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z\"/>",
  },
  lock: {
    name: "lock",
    category: "Web & Security",
    keywords: ["lock", "security", "privacy", "secure", "auth", "password", "safe"],
    svg: "<path d=\"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z\"/>",
  },
  shield: {
    name: "shield",
    category: "Web & Security",
    keywords: ["shield", "security", "antivirus", "protect", "firewall", "guard", "safe"],
    svg: "<path d=\"M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z\"/>",
  },
  vpn_key: {
    name: "vpn_key",
    category: "Web & Security",
    keywords: ["vpn", "key", "access", "auth", "login", "password", "credential"],
    svg: "<path d=\"M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z\"/>",
  },
  block: {
    name: "block",
    category: "Web & Security",
    keywords: ["block", "adblock", "stop", "deny", "ban", "prohibit", "restrict", "ad", "ads"],
    svg: "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z\"/>",
  },
  cookie: {
    name: "cookie",
    category: "Web & Security",
    keywords: ["cookie", "tracker", "privacy", "banner", "web", "storage", "consent"],
    svg: "<path d=\"M21.51 13.06c-.19-.48-.68-.81-1.2-.77-1.19.08-2.37-.42-3.13-1.34-.76-.92-.98-2.14-.59-3.26.17-.49-.01-1.04-.44-1.34-.99-.68-1.57-1.83-1.51-3.04.03-.52-.28-1.01-.76-1.2-.48-.19-1.03-.06-1.37.31C9.69 5.57 6.07 7.78 4.2 11.23c-1.87 3.45-1.59 7.64.71 10.82 2.3 3.18 6.32 4.7 10.27 3.88 3.95-.82 7.08-3.77 7.99-7.53.11-.47-.07-.96-.47-1.22zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm-2 7c.83 0 1.5.67 1.5 1.5S7.33 18 6.5 18 5 17.33 5 16.5 5.67 15 6.5 15zm6 4c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm1-7c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z\"/>",
  },

  // Shopping & Finance
  shopping_cart: {
    name: "shopping_cart",
    category: "Shopping & Finance",
    keywords: ["cart", "shopping_cart", "shopping", "ecommerce", "buy", "store", "checkout", "amazon", "aliexpress"],
    svg: "<path d=\"M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z\"/>",
  },
  shopping_bag: {
    name: "shopping_bag",
    category: "Shopping & Finance",
    keywords: ["shopping_bag", "bag", "store", "retail", "purchase", "market"],
    svg: "<path d=\"M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z\"/>",
  },
  local_offer: {
    name: "local_offer",
    category: "Shopping & Finance",
    keywords: ["offer", "coupon", "discount", "deal", "promo", "tag", "price", "sale"],
    svg: "<path d=\"M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z\"/>",
  },
  payments: {
    name: "payments",
    category: "Shopping & Finance",
    keywords: ["payments", "money", "cash", "finance", "bill", "currency", "bank"],
    svg: "<path d=\"M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-2 0H3V6h14v8zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm13 4v8c0 1.1-.9 2-2 2H5v-2h16v-8h2z\"/>",
  },

  // Productivity & Work
  work: {
    name: "work",
    category: "Productivity",
    keywords: ["work", "briefcase", "job", "business", "office", "career", "professional"],
    svg: "<path d=\"M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z\"/>",
  },
  task_alt: {
    name: "task_alt",
    category: "Productivity",
    keywords: ["task", "todo", "done", "check", "complete", "checklist", "productivity"],
    svg: "<path d=\"M22 5.18L10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18zM19.79 10.22C19.92 10.79 20 11.39 20 12c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8c1.58 0 3.04.46 4.28 1.25l1.44-1.44C16.1 2.67 14.13 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-1.19-.22-2.33-.6-3.39l-1.61 1.61z\"/>",
  },
  note_alt: {
    name: "note_alt",
    category: "Productivity",
    keywords: ["note", "memo", "text", "write", "document", "notepad", "draft"],
    svg: "<path d=\"M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z\"/>",
  },
  schedule: {
    name: "schedule",
    category: "Productivity",
    keywords: ["schedule", "clock", "time", "timer", "alarm", "history", "hour"],
    svg: "<path d=\"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z\"/>",
  },
  build: {
    name: "build",
    category: "Productivity",
    keywords: ["build", "tool", "wrench", "repair", "fix", "settings", "maintenance"],
    svg: "<path d=\"M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z\"/>",
  },

  // Media & Design
  palette: {
    name: "palette",
    category: "Media & Design",
    keywords: ["palette", "color", "paint", "art", "theme", "design", "creative", "brush"],
    svg: "<path d=\"M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 18c-.47.58-.17 1.46.56 1.64.67.16 1.34.25 2.01.27.79.03 1.55-.42 1.83-1.16l.66-1.74c.2-.52.68-.87 1.24-.91.95-.07 1.88-.34 2.71-.8.74-.41 1.67-.18 2.14.54l1.09 1.68c.36.56 1.05.8 1.66.56.77-.31 1.49-.71 2.15-1.2.55-.41.72-1.17.4-1.78l-1.07-2.02c-.28-.54-.2-1.2.22-1.66C20.4 12.02 21 10.58 21 9c0-4.97-4.03-9-9-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z\"/>",
  },
  brush: {
    name: "brush",
    category: "Media & Design",
    keywords: ["brush", "paint", "art", "draw", "canvas", "design"],
    svg: "<path d=\"M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z\"/>",
  },
  photo_camera: {
    name: "photo_camera",
    category: "Media & Design",
    keywords: ["camera", "photo_camera", "photo", "picture", "screenshot", "capture", "image"],
    svg: "<path d=\"M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0 -6.4 0M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z\"/>",
  },
  movie: {
    name: "movie",
    category: "Media & Design",
    keywords: ["movie", "video", "film", "cinema", "player", "stream", "youtube", "media"],
    svg: "<path d=\"M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z\"/>",
  },
  music_note: {
    name: "music_note",
    category: "Media & Design",
    keywords: ["music", "music_note", "audio", "song", "sound", "track", "spotify"],
    svg: "<path d=\"M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z\"/>",
  },
  sports_esports: {
    name: "sports_esports",
    category: "Media & Design",
    keywords: ["game", "sports_esports", "gaming", "controller", "play", "joystick", "arcade"],
    svg: "<path d=\"M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z\"/>",
  },

  // Travel & Lifestyle
  directions_car: {
    name: "directions_car",
    category: "Travel & Lifestyle",
    keywords: ["car", "directions_car", "auto", "vehicle", "drive", "transport", "travel", "ride"],
    svg: "<path d=\"M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17zM7.5 15c-.83 0-1.5-.67-1.5-1.5S6.67 12 7.5 12s1.5.67 1.5 1.5S8.33 15 7.5 15zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z\"/>",
  },
  flight: {
    name: "flight",
    category: "Travel & Lifestyle",
    keywords: ["flight", "plane", "airplane", "travel", "airport", "vacation", "trip"],
    svg: "<path d=\"M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z\"/>",
  },
  local_cafe: {
    name: "local_cafe",
    category: "Travel & Lifestyle",
    keywords: ["cafe", "coffee", "tea", "drink", "cup", "break", "beverage"],
    svg: "<path d=\"M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z\"/>",
  },
  restaurant: {
    name: "restaurant",
    category: "Travel & Lifestyle",
    keywords: ["restaurant", "food", "eat", "dining", "meal", "kitchen", "cook"],
    svg: "<path d=\"M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z\"/>",
  },
  science: {
    name: "science",
    category: "Travel & Lifestyle",
    keywords: ["science", "lab", "experiment", "chemistry", "research", "flask", "study"],
    svg: "<path d=\"M19.8 18.4L14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z\"/>",
  },
  school: {
    name: "school",
    category: "Travel & Lifestyle",
    keywords: ["school", "education", "learn", "study", "university", "academy", "degree"],
    svg: "<path d=\"M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z\"/>",
  },
  lightbulb: {
    name: "lightbulb",
    category: "Travel & Lifestyle",
    keywords: ["lightbulb", "idea", "creative", "tip", "smart", "solution", "inspiration", "ai"],
    svg: "<path d=\"M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z\"/>",
  },
};

export function searchMaterialSymbols(query: string): MaterialSymbolMeta[] {
  const q = (query || "").trim().toLowerCase();
  const all = Object.values(MATERIAL_SYMBOLS);
  if (!q) return all;

  const tokens = q.split(/[\s_\-]+/).filter(Boolean);

  return all
    .map((meta) => {
      let score = 0;
      const lowerName = meta.name.toLowerCase();

      if (lowerName === q) score += 100;
      else if (lowerName.startsWith(q)) score += 50;
      else if (lowerName.includes(q)) score += 25;

      for (const token of tokens) {
        if (lowerName.includes(token)) score += 15;
        if (meta.category.toLowerCase().includes(token)) score += 5;
        for (const kw of meta.keywords) {
          if (kw.toLowerCase() === token) score += 12;
          else if (kw.toLowerCase().startsWith(token)) score += 8;
          else if (kw.toLowerCase().includes(token)) score += 4;
        }
      }

      return { meta, score };
    })
    .filter((res) => res.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((res) => res.meta);
}

interface MaterialSymbolProps {
  name?: string;
  size?: number | string;
  color?: string;
  className?: string;
  style?: JSX.CSSProperties;
}

export function MaterialSymbol({
  name = "folder",
  size = 20,
  color = "currentColor",
  className = "",
  style = {},
}: MaterialSymbolProps) {
  const cleanName = (name || "folder").trim().toLowerCase();
  const iconMeta = MATERIAL_SYMBOLS[cleanName] || MATERIAL_SYMBOLS.folder;
  const numSize = typeof size === "number" ? size : parseInt(String(size), 10) || 20;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={numSize}
      height={numSize}
      fill={color}
      className={`material-symbol ${className}`}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: iconMeta.svg }}
    />
  );
}
