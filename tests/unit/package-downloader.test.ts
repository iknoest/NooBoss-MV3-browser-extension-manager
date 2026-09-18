import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isValidCwsId,
  getCwsCrxUrl,
  checkDownloadPermissions,
  requestDownloadPermissions,
  downloadExtensionZip,
  DOWNLOAD_PERMISSIONS,
} from "../../src/shared/package-downloader";

/**
 * Creates a valid synthetic CRX3 buffer with ZIP local header.
 */
function createSyntheticCrx3(zipContent: Uint8Array): ArrayBuffer {
  const headerBytes = new Uint8Array([0x08, 0x01]);
  const totalLength = 12 + headerBytes.byteLength + zipContent.byteLength;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);

  view.setUint32(0, 0x34327243, true); // Cr24
  view.setUint32(4, 3, true); // Version 3
  view.setUint32(8, headerBytes.byteLength, true); // Header size

  u8.set(headerBytes, 12);
  u8.set(zipContent, 12 + headerBytes.byteLength);

  return buffer;
}

describe("Chrome Web Store Package Downloader", () => {
  const validId = "hbphcpflnkpnjfcggfdmofklbpamindj";
  const validZipPayload = new Uint8Array([
    0x50, 0x4b, 0x03, 0x04, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isValidCwsId", () => {
    it("accepts valid 32-character lowercase CWS IDs (a-p)", () => {
      expect(isValidCwsId("hbphcpflnkpnjfcggfdmofklbpamindj")).toBe(true);
      expect(isValidCwsId("onkcjpfgllpfbimnchjehboikhippnka")).toBe(true);
    });

    it("accepts valid CWS IDs with whitespace or mixed case", () => {
      expect(isValidCwsId("  HBPHCPFLNKPNJFCGGFDMOFKLBPAMINDJ  ")).toBe(true);
    });

    it("rejects invalid lengths", () => {
      expect(isValidCwsId("hbphcpflnkpnjfcggfdmofklbpamind")).toBe(false); // 31 chars
      expect(isValidCwsId("hbphcpflnkpnjfcggfdmofklbpamindja")).toBe(false); // 33 chars
    });

    it("rejects invalid characters (outside a-p, e.g. numbers or q-z)", () => {
      expect(isValidCwsId("hbphcpflnkpnjfcggfdmofklbpamind1")).toBe(false); // digit 1
      expect(isValidCwsId("hbphcpflnkpnjfcggfdmofklbpamindq")).toBe(false); // 'q'
      expect(isValidCwsId("hbphcpflnkpnjfcggfdmofklbpamindz")).toBe(false); // 'z'
    });

    it("rejects empty, null, or undefined values", () => {
      expect(isValidCwsId("")).toBe(false);
      expect(isValidCwsId(null as any)).toBe(false);
      expect(isValidCwsId(undefined as any)).toBe(false);
    });
  });

  describe("getCwsCrxUrl", () => {
    it("generates direct CWS CRX download URL with acceptformat=crx2,crx3", () => {
      const url = getCwsCrxUrl(validId);
      expect(url).toContain("https://clients2.google.com/service/update2/crx");
      expect(url).toContain(`x=id%3D${validId}%26uc`);
      expect(url).toContain("acceptformat=crx2,crx3");
    });
  });

  describe("Permissions", () => {
    it("checkDownloadPermissions calls chrome.permissions.contains", async () => {
      const containsMock = vi.fn().mockResolvedValue(true);
      (globalThis as any).chrome = {
        permissions: {
          contains: containsMock,
        },
      };

      const result = await checkDownloadPermissions();
      expect(result).toBe(true);
      expect(containsMock).toHaveBeenCalledWith(DOWNLOAD_PERMISSIONS);
    });

    it("requestDownloadPermissions calls chrome.permissions.request", async () => {
      const requestMock = vi.fn().mockResolvedValue(true);
      (globalThis as any).chrome = {
        permissions: {
          request: requestMock,
        },
      };

      const result = await requestDownloadPermissions();
      expect(result).toBe(true);
      expect(requestMock).toHaveBeenCalledWith(DOWNLOAD_PERMISSIONS);
    });
  });

  describe("downloadExtensionZip", () => {
    it("rejects invalid extension ID with INVALID_ID", async () => {
      const result = await downloadExtensionZip({ extensionId: "invalid-id-123" });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("INVALID_ID");
    });

    it("handles permission denial cleanly with PERMISSION_DENIED", async () => {
      (globalThis as any).chrome = {
        permissions: {
          contains: vi.fn().mockResolvedValue(false),
          request: vi.fn().mockResolvedValue(false),
        },
      };

      const result = await downloadExtensionZip({ extensionId: validId });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("PERMISSION_DENIED");
      expect(result.error).toContain("permission");
    });

    it("handles network failure cleanly with NETWORK_ERROR", async () => {
      (globalThis as any).chrome = {
        permissions: {
          contains: vi.fn().mockResolvedValue(true),
        },
      };
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("DNS resolution failed"));

      const result = await downloadExtensionZip({ extensionId: validId });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NETWORK_ERROR");
      expect(result.error).toContain("Network error");
    });

    it("handles 404/204 HTTP status cleanly with NOT_AVAILABLE", async () => {
      (globalThis as any).chrome = {
        permissions: {
          contains: vi.fn().mockResolvedValue(true),
        },
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const result = await downloadExtensionZip({ extensionId: validId });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NOT_AVAILABLE");
      expect(result.error).toContain("404");
    });

    it("handles corrupted CRX response cleanly with INVALID_CRX", async () => {
      (globalThis as any).chrome = {
        permissions: {
          contains: vi.fn().mockResolvedValue(true),
        },
      };
      const badBuffer = new ArrayBuffer(30); // All zeros, not Cr24
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        arrayBuffer: vi.fn().mockResolvedValue(badBuffer),
      });

      const result = await downloadExtensionZip({ extensionId: validId });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("INVALID_CRX");
    });

    it("successfully extracts ZIP and initiates chrome.downloads.download", async () => {
      const downloadMock = vi.fn().mockResolvedValue(12345);
      (globalThis as any).chrome = {
        permissions: {
          contains: vi.fn().mockResolvedValue(true),
        },
        downloads: {
          download: downloadMock,
        },
      };

      const syntheticCrx = createSyntheticCrx3(validZipPayload);
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        arrayBuffer: vi.fn().mockResolvedValue(syntheticCrx),
      });

      // Mock URL methods
      globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-cws-url");
      globalThis.URL.revokeObjectURL = vi.fn();

      const result = await downloadExtensionZip({
        extensionId: validId,
        name: "NoWebP - WebP to PNG",
        version: "0.1.0",
      });

      expect(result.success).toBe(true);
      expect(result.filename).toBe("nowebp-webp-to-png-0.1.0.zip");
      expect(downloadMock).toHaveBeenCalledWith({
        url: "blob:mock-cws-url",
        filename: "nowebp-webp-to-png-0.1.0.zip",
        saveAs: false,
      });
    });
  });
});
