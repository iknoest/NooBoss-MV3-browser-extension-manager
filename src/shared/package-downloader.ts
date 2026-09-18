/**
 * Chrome Web Store Extension Package Downloader
 *
 * Downloads published CRX packages directly from Chrome Web Store update endpoints,
 * strips CRX headers using the security-bounded CRX parser, and delivers the clean ZIP archive.
 */

import { parseCrx, sanitizePackageFilename, CrxParseError } from "./crx-parser";

export const DOWNLOAD_PERMISSIONS: chrome.permissions.Permissions = {
  permissions: ["downloads"],
  origins: [
    "https://clients2.google.com/*",
    "https://clients2.googleusercontent.com/*",
  ],
};

export type PackageDownloadErrorCode =
  | "PERMISSION_DENIED"
  | "INVALID_ID"
  | "NOT_AVAILABLE"
  | "NETWORK_ERROR"
  | "INVALID_CRX"
  | "DOWNLOAD_FAILED";

export interface PackageDownloadOptions {
  extensionId: string;
  name?: string;
  version?: string;
}

export interface PackageDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
  errorCode?: PackageDownloadErrorCode;
}

const CWS_ID_REGEX = /^[a-p]{32}$/i;

/**
 * Validates whether an extension ID matches the canonical 32-character Chrome Web Store format.
 */
export function isValidCwsId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return CWS_ID_REGEX.test(id.trim());
}

/**
 * Generates the direct CRX download URL from Chrome Web Store update servers.
 */
export function getCwsCrxUrl(extensionId: string): string {
  const cleanId = extensionId.trim().toLowerCase();
  return `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=128.0.0.0&acceptformat=crx2,crx3&x=id%3D${encodeURIComponent(cleanId)}%26uc`;
}

/**
 * Checks whether optional permissions (downloads API and CWS download origins) are granted.
 */
export async function checkDownloadPermissions(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.permissions || !chrome.permissions.contains) {
    return true; // Non-extension / test environment fallback
  }
  try {
    return await chrome.permissions.contains(DOWNLOAD_PERMISSIONS);
  } catch (err) {
    console.warn("[PackageDownloader] Failed to check permissions:", err);
    return false;
  }
}

/**
 * Requests optional permissions for downloads and CWS download origins.
 * Must be invoked directly within a user gesture handler (e.g. click).
 */
export async function requestDownloadPermissions(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.permissions || !chrome.permissions.request) {
    return true; // Non-extension / test environment fallback
  }
  try {
    return await chrome.permissions.request(DOWNLOAD_PERMISSIONS);
  } catch (err) {
    console.warn("[PackageDownloader] Permission request failed or rejected:", err);
    return false;
  }
}

/**
 * Fetches, unpacks, and downloads the ZIP package for an extension from the Chrome Web Store.
 */
export async function downloadExtensionZip(
  options: PackageDownloadOptions
): Promise<PackageDownloadResult> {
  const cleanId = (options.extensionId || "").trim().toLowerCase();

  // 1. Validate ID format
  if (!isValidCwsId(cleanId)) {
    return {
      success: false,
      error: "Invalid Chrome Web Store extension ID (must be 32 characters a-p).",
      errorCode: "INVALID_ID",
    };
  }

  // 2. Check and request permissions if needed
  const hasPerms = await checkDownloadPermissions();
  if (!hasPerms) {
    const granted = await requestDownloadPermissions();
    if (!granted) {
      return {
        success: false,
        error: "Download permission was not granted.",
        errorCode: "PERMISSION_DENIED",
      };
    }
  }

  // 3. Fetch CRX package from CWS endpoint
  const crxUrl = getCwsCrxUrl(cleanId);
  let crxBuffer: ArrayBuffer;
  try {
    const response = await fetch(crxUrl);
    if (!response.ok) {
      return {
        success: false,
        error: `Package unavailable from Chrome Web Store (HTTP ${response.status}).`,
        errorCode: "NOT_AVAILABLE",
      };
    }
    crxBuffer = await response.arrayBuffer();
  } catch (err: any) {
    return {
      success: false,
      error: `Network error downloading package: ${err?.message || "connection failed"}`,
      errorCode: "NETWORK_ERROR",
    };
  }

  if (!crxBuffer || crxBuffer.byteLength === 0) {
    return {
      success: false,
      error: "Received empty package response from Chrome Web Store.",
      errorCode: "NOT_AVAILABLE",
    };
  }

  // 4. Strip CRX headers and extract ZIP payload
  let zipBuffer: ArrayBuffer;
  try {
    zipBuffer = parseCrx(crxBuffer);
  } catch (err) {
    if (err instanceof CrxParseError) {
      return {
        success: false,
        error: `Failed to extract ZIP archive from CRX: ${err.message}`,
        errorCode: "INVALID_CRX",
      };
    }
    return {
      success: false,
      error: "Unknown error extracting ZIP archive from CRX package.",
      errorCode: "INVALID_CRX",
    };
  }

  // 5. Trigger download of ZIP archive
  const filename = sanitizePackageFilename(options.name, options.version, cleanId);

  try {
    const blob = new Blob([zipBuffer], { type: "application/zip" });
    const blobUrl = URL.createObjectURL(blob);

    // In browser document contexts (Extension Drawer manager/popup), an anchor element
    // with the HTML5 `download` attribute strictly and reliably preserves the exact filename.
    // In background/service worker contexts without a DOM, fall back to chrome.downloads.download.
    if (typeof document !== "undefined" && document.createElement) {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (
      typeof chrome !== "undefined" &&
      chrome.downloads &&
      typeof chrome.downloads.download === "function"
    ) {
      await chrome.downloads.download({
        url: blobUrl,
        filename,
        saveAs: false,
      });
    }

    // Revoke object URL after slight delay to ensure download has initiated
    setTimeout(() => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore
      }
    }, 15000);

    return {
      success: true,
      filename,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to initiate download: ${err?.message || "browser download failed"}`,
      errorCode: "DOWNLOAD_FAILED",
    };
  }
}
