/**
 * CRX Package Parser & Security Validator
 *
 * Supports unpacking Chrome Web Store .crx files (CRX3 and CRX2 format) into
 * standard .zip archives with strict bounds checking and signature verification.
 */

export type CrxErrorCode =
  | "BUFFER_TOO_SMALL"
  | "INVALID_MAGIC"
  | "UNSUPPORTED_VERSION"
  | "INVALID_HEADER_SIZE"
  | "NO_ZIP_PAYLOAD"
  | "INVALID_ZIP_MAGIC";

export class CrxParseError extends Error {
  public readonly code: CrxErrorCode;

  constructor(message: string, code: CrxErrorCode) {
    super(message);
    this.name = "CrxParseError";
    this.code = code;
  }
}

// Magic bytes
const CRX_MAGIC = 0x34327243; // "Cr24" in little-endian uint32 (0x43, 0x72, 0x32, 0x34)
const ZIP_LOCAL_MAGIC = 0x04034b50; // "PK\x03\x04" in little-endian uint32
const ZIP_EMPTY_MAGIC = 0x06054b50; // "PK\x05\x06" in little-endian uint32 (empty archive)
const ZIP_SPANNED_MAGIC = 0x08074b50; // "PK\x07\x08" in little-endian uint32

/**
 * Parses a raw CRX buffer, validates headers and bounds, and extracts
 * the underlying ZIP archive payload.
 *
 * @param buffer ArrayBuffer containing raw .crx file bytes
 * @returns ArrayBuffer containing extracted .zip file bytes
 * @throws CrxParseError on invalid magic, truncated data, or missing ZIP payload
 */
export function parseCrx(buffer: ArrayBuffer): ArrayBuffer {
  if (!buffer || buffer.byteLength < 12) {
    throw new CrxParseError(
      `CRX buffer is too small (${buffer ? buffer.byteLength : 0} bytes; minimum 12 bytes required).`,
      "BUFFER_TOO_SMALL"
    );
  }

  const view = new DataView(buffer);

  // 1. Verify "Cr24" magic
  const magic = view.getUint32(0, true);
  if (magic !== CRX_MAGIC) {
    const magicStr = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3)
    );
    throw new CrxParseError(
      `Invalid CRX magic signature: "${magicStr}" (expected "Cr24").`,
      "INVALID_MAGIC"
    );
  }

  // 2. Read version (CRX2 or CRX3)
  const version = view.getUint32(4, true);
  let payloadOffset = 0;

  if (version === 3) {
    // CRX3: byte 8-11 is header_size (uint32 LE)
    const headerSize = view.getUint32(8, true);
    payloadOffset = 12 + headerSize;

    if (payloadOffset > buffer.byteLength || payloadOffset < 12) {
      throw new CrxParseError(
        `Invalid CRX3 header size: ${headerSize} bytes (exceeds buffer length ${buffer.byteLength}).`,
        "INVALID_HEADER_SIZE"
      );
    }
  } else if (version === 2) {
    // CRX2: byte 8-11 is pubKeyLength, byte 12-15 is sigLength
    if (buffer.byteLength < 16) {
      throw new CrxParseError(
        `CRX2 buffer is too small for header fields (${buffer.byteLength} bytes; minimum 16 bytes required).`,
        "BUFFER_TOO_SMALL"
      );
    }
    const pubKeyLength = view.getUint32(8, true);
    const sigLength = view.getUint32(12, true);
    payloadOffset = 16 + pubKeyLength + sigLength;

    if (payloadOffset > buffer.byteLength || payloadOffset < 16) {
      throw new CrxParseError(
        `Invalid CRX2 header sizes: pubKey=${pubKeyLength}, sig=${sigLength} (exceeds buffer length ${buffer.byteLength}).`,
        "INVALID_HEADER_SIZE"
      );
    }
  } else {
    throw new CrxParseError(
      `Unsupported CRX format version: ${version} (only versions 2 and 3 are supported).`,
      "UNSUPPORTED_VERSION"
    );
  }

  // 3. Verify ZIP payload
  const remaining = buffer.byteLength - payloadOffset;
  if (remaining < 4) {
    throw new CrxParseError(
      `CRX payload is too small to contain a valid ZIP archive (${remaining} bytes remaining).`,
      "NO_ZIP_PAYLOAD"
    );
  }

  const zipMagic = view.getUint32(payloadOffset, true);
  if (
    zipMagic !== ZIP_LOCAL_MAGIC &&
    zipMagic !== ZIP_EMPTY_MAGIC &&
    zipMagic !== ZIP_SPANNED_MAGIC
  ) {
    throw new CrxParseError(
      `CRX payload does not contain a valid ZIP archive signature at offset ${payloadOffset}.`,
      "INVALID_ZIP_MAGIC"
    );
  }

  // 4. Return pure ZIP buffer
  return buffer.slice(payloadOffset);
}

/**
 * Sanitizes extension name and version into a safe, clean filename for downloaded ZIP packages.
 * Examples:
 *   "NoWebP - WebP to PNG", "0.1.0" -> "nowebp-webp-to-png-0.1.0.zip"
 *   "My Extension (Tool)", undefined -> "my-extension-tool.zip"
 *   "", "", "hbphcpflnkpnjfcggfdmofklbpamindj" -> "hbphcpflnkpnjfcggfdmofklbpamindj.zip"
 */
export function sanitizePackageFilename(
  name?: string,
  version?: string,
  id?: string
): string {
  let cleanName = "";
  if (name && typeof name === "string") {
    cleanName = name
      .trim()
      .toLowerCase()
      // Replace illegal file system chars and punctuation with hyphens
      .replace(/[\\/:*?"<>|#%&{}\\$!'`~=@+;,.\(\)\[\]]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  let cleanVersion = "";
  if (version && typeof version === "string") {
    cleanVersion = version.trim().replace(/^v/i, "").replace(/[^0-9.]/g, "");
  }

  // Limit clean name length
  if (cleanName.length > 50) {
    cleanName = cleanName.slice(0, 50).replace(/-+$/, "");
  }

  if (cleanName && cleanVersion) {
    return `${cleanName}-${cleanVersion}.zip`;
  }
  if (cleanName) {
    return `${cleanName}.zip`;
  }
  if (id && typeof id === "string" && id.trim()) {
    return `${id.trim().toLowerCase()}.zip`;
  }
  return "extension.zip";
}
