/**
 * Canonical external URLs and safe navigation helper.
 * MV3 compliant: no remote scripts, no background network calls.
 */

export const BUY_ME_A_BEER_URL = "https://www.buymeacoffee.com/avavavava";

export function openExternalLink(url: string, e?: MouseEvent): void {
  if (e) {
    e.preventDefault();
  }
  if (typeof chrome !== "undefined" && chrome.tabs?.create) {
    chrome.tabs.create({ url });
  } else if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
