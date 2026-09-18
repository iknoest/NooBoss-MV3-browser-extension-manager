import { describe, it, expect } from "vitest";
import {
  parseCrx,
  sanitizePackageFilename,
  CrxParseError,
} from "../../src/shared/crx-parser";

/**
 * Helper to build a synthetic CRX3 buffer for testing.
 */
function createSyntheticCrx3(headerBytes: Uint8Array, zipBytes: Uint8Array): ArrayBuffer {
  const headerLength = headerBytes.byteLength;
  const totalLength = 12 + headerLength + zipBytes.byteLength;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);

  // Magic "Cr24" = 0x34327243
  view.setUint32(0, 0x34327243, true);
  // Version 3 = 0x00000003
  view.setUint32(4, 3, true);
  // Header size
  view.setUint32(8, headerLength, true);

  // Copy header
  u8.set(headerBytes, 12);
  // Copy zip payload
  u8.set(zipBytes, 12 + headerLength);

  return buffer;
}

/**
 * Helper to build a synthetic CRX2 buffer for testing.
 */
function createSyntheticCrx2(
  pubKey: Uint8Array,
  sig: Uint8Array,
  zipBytes: Uint8Array
): ArrayBuffer {
  const totalLength = 16 + pubKey.byteLength + sig.byteLength + zipBytes.byteLength;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);

  // Magic "Cr24"
  view.setUint32(0, 0x34327243, true);
  // Version 2
  view.setUint32(4, 2, true);
  // Pubkey length
  view.setUint32(8, pubKey.byteLength, true);
  // Sig length
  view.setUint32(12, sig.byteLength, true);

  let offset = 16;
  u8.set(pubKey, offset);
  offset += pubKey.byteLength;
  u8.set(sig, offset);
  offset += sig.byteLength;
  u8.set(zipBytes, offset);

  return buffer;
}

describe("CRX Parser & Security Validator", () => {
  // Standard minimal ZIP local header magic bytes: PK\x03\x04
  const validZipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x0a, 0x00, 0x00, 0x00]);
  const emptyZipHeader = new Uint8Array([0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00]);

  describe("parseCrx - CRX3 format", () => {
    it("successfully parses valid CRX3 buffer and extracts ZIP payload", () => {
      const dummyHeader = new Uint8Array([0x08, 0x01, 0x12, 0x04, 0x74, 0x65, 0x73, 0x74]);
      const zipPayload = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0xde, 0xad, 0xbe, 0xef]);
      const crxBuffer = createSyntheticCrx3(dummyHeader, zipPayload);

      const extractedZip = parseCrx(crxBuffer);
      expect(extractedZip.byteLength).toBe(zipPayload.byteLength);

      const extractedU8 = new Uint8Array(extractedZip);
      expect(Array.from(extractedU8)).toEqual(Array.from(zipPayload));
    });

    it("successfully parses CRX3 with empty ZIP archive (PK\\x05\\x06)", () => {
      const dummyHeader = new Uint8Array([0x01, 0x02]);
      const crxBuffer = createSyntheticCrx3(dummyHeader, emptyZipHeader);

      const extractedZip = parseCrx(crxBuffer);
      expect(extractedZip.byteLength).toBe(emptyZipHeader.byteLength);
    });

    it("throws INVALID_HEADER_SIZE if CRX3 headerSize exceeds buffer bounds", () => {
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      view.setUint32(0, 0x34327243, true); // Cr24
      view.setUint32(4, 3, true); // version 3
      view.setUint32(8, 500, true); // header_size = 500 > 20

      expect(() => parseCrx(buffer)).toThrowError(CrxParseError);
      try {
        parseCrx(buffer);
      } catch (err: any) {
        expect(err.code).toBe("INVALID_HEADER_SIZE");
      }
    });
  });

  describe("parseCrx - CRX2 format", () => {
    it("successfully parses valid CRX2 buffer and extracts ZIP payload", () => {
      const pubKey = new Uint8Array([0x01, 0x02, 0x03]);
      const sig = new Uint8Array([0x04, 0x05]);
      const zipPayload = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x11, 0x22, 0x33, 0x44]);
      const crxBuffer = createSyntheticCrx2(pubKey, sig, zipPayload);

      const extractedZip = parseCrx(crxBuffer);
      expect(extractedZip.byteLength).toBe(zipPayload.byteLength);

      const extractedU8 = new Uint8Array(extractedZip);
      expect(Array.from(extractedU8)).toEqual(Array.from(zipPayload));
    });

    it("throws INVALID_HEADER_SIZE if CRX2 pubKey + sig lengths exceed buffer bounds", () => {
      const buffer = new ArrayBuffer(24);
      const view = new DataView(buffer);
      view.setUint32(0, 0x34327243, true); // Cr24
      view.setUint32(4, 2, true); // version 2
      view.setUint32(8, 50, true); // pubKey = 50
      view.setUint32(12, 50, true); // sig = 50 -> 16 + 100 = 116 > 24

      expect(() => parseCrx(buffer)).toThrowError(CrxParseError);
      try {
        parseCrx(buffer);
      } catch (err: any) {
        expect(err.code).toBe("INVALID_HEADER_SIZE");
      }
    });
  });

  describe("parseCrx - Validation & Error Boundaries", () => {
    it("throws BUFFER_TOO_SMALL if buffer is null, undefined, or < 12 bytes", () => {
      expect(() => parseCrx(null as any)).toThrowError(CrxParseError);
      expect(() => parseCrx(new ArrayBuffer(8))).toThrowError(CrxParseError);
      try {
        parseCrx(new ArrayBuffer(8));
      } catch (err: any) {
        expect(err.code).toBe("BUFFER_TOO_SMALL");
      }
    });

    it("throws INVALID_MAGIC if magic bytes do not equal Cr24", () => {
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      view.setUint32(0, 0x12345678, true); // Not Cr24

      expect(() => parseCrx(buffer)).toThrowError(CrxParseError);
      try {
        parseCrx(buffer);
      } catch (err: any) {
        expect(err.code).toBe("INVALID_MAGIC");
      }
    });

    it("throws UNSUPPORTED_VERSION if CRX version is neither 2 nor 3", () => {
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      view.setUint32(0, 0x34327243, true); // Cr24
      view.setUint32(4, 4, true); // version 4 (unsupported)

      expect(() => parseCrx(buffer)).toThrowError(CrxParseError);
      try {
        parseCrx(buffer);
      } catch (err: any) {
        expect(err.code).toBe("UNSUPPORTED_VERSION");
      }
    });

    it("throws NO_ZIP_PAYLOAD if payload offset reaches end of buffer", () => {
      const buffer = new ArrayBuffer(12);
      const view = new DataView(buffer);
      view.setUint32(0, 0x34327243, true); // Cr24
      view.setUint32(4, 3, true); // version 3
      view.setUint32(8, 0, true); // headerSize = 0 -> payloadOffset = 12, remaining = 0

      expect(() => parseCrx(buffer)).toThrowError(CrxParseError);
      try {
        parseCrx(buffer);
      } catch (err: any) {
        expect(err.code).toBe("NO_ZIP_PAYLOAD");
      }
    });

    it("throws INVALID_ZIP_MAGIC if payload does not start with standard ZIP PK signature", () => {
      const dummyHeader = new Uint8Array([0x01, 0x02]);
      const badZipPayload = new Uint8Array([0x7f, 0x45, 0x4c, 0x46]); // ELF header, not PK
      const crxBuffer = createSyntheticCrx3(dummyHeader, badZipPayload);

      expect(() => parseCrx(crxBuffer)).toThrowError(CrxParseError);
      try {
        parseCrx(crxBuffer);
      } catch (err: any) {
        expect(err.code).toBe("INVALID_ZIP_MAGIC");
      }
    });
  });

  describe("sanitizePackageFilename", () => {
    it("formats clean name with version", () => {
      expect(sanitizePackageFilename("NoWebP - WebP to PNG", "0.1.0")).toBe(
        "nowebp-webp-to-png-0.1.0.zip"
      );
    });

    it("strips illegal filesystem characters and collapses separators", () => {
      expect(
        sanitizePackageFilename('Awesome Tool: Super / Best * (v2) <Edition>?', "v1.4.2")
      ).toBe("awesome-tool-super-best-v2-edition-1.4.2.zip");
    });

    it("handles extension without version", () => {
      expect(sanitizePackageFilename("AdBlocker Deluxe")).toBe("adblocker-deluxe.zip");
    });

    it("falls back to extension ID if name is blank or invalid", () => {
      expect(
        sanitizePackageFilename("", "", "hbphcpflnkpnjfcggfdmofklbpamindj")
      ).toBe("hbphcpflnkpnjfcggfdmofklbpamindj.zip");
      expect(
        sanitizePackageFilename("   ", undefined, "hbphcpflnkpnjfcggfdmofklbpamindj")
      ).toBe("hbphcpflnkpnjfcggfdmofklbpamindj.zip");
    });

    it("falls back to generic extension.zip if everything is empty", () => {
      expect(sanitizePackageFilename("", "", "")).toBe("extension.zip");
      expect(sanitizePackageFilename(undefined, undefined, undefined)).toBe("extension.zip");
    });
  });
});
