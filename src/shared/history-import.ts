/**
 * History CSV import utility for Extension Drawer.
 * Implements RFC-4180 compliant CSV parsing, validation, deduplication,
 * and merge retention controls.
 */

import type { HistoryRecord } from './types';

/**
 * Parses RFC-4180 CSV text into a 2D array of strings.
 * Handles quoted fields, escaped double quotes (""), commas, CRLF / LF line endings,
 * and leading UTF-8 BOM markers.
 */
export function parseCSV(csvText: string): string[][] {
  if (!csvText) return [];

  // Strip BOM if present
  let text = csvText.startsWith('\uFEFF') ? csvText.slice(1) : csvText;

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          // Escaped double quote ("")
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += c;
        i++;
        continue;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (c === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (c === '\r') {
        if (i + 1 < text.length && text[i + 1] === '\n') {
          i++; // skip \n of \r\n
        }
        currentRow.push(currentField);
        currentField = '';
        // Only push row if it contains at least one non-empty field or multiple fields
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (c === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += c;
        i++;
        continue;
      }
    }
  }

  // Push final field and row
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

const VALID_EVENTS = new Set(['installed', 'uninstalled', 'enabled', 'disabled', 'updated']);

/**
 * Normalizes and validates raw CSV rows into HistoryRecord objects.
 * Expects columns: timestamp, event, extension_name, extension_id, version
 */
export function parseHistoryCSV(csvText: string): {
  success: boolean;
  records: HistoryRecord[];
  errors: string[];
} {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return {
      success: false,
      records: [],
      errors: ['CSV file is empty'],
    };
  }

  // Parse header row
  const headerRow = rows[0].map((h) => h.trim().toLowerCase());
  const timestampIdx = headerRow.findIndex((h) => h === 'timestamp');
  const eventIdx = headerRow.findIndex((h) => h === 'event');
  const nameIdx = headerRow.findIndex((h) => h === 'extension_name' || h === 'name' || h === 'extensionname');
  const idIdx = headerRow.findIndex((h) => h === 'extension_id' || h === 'id' || h === 'extensionid');
  const versionIdx = headerRow.findIndex((h) => h === 'version' || h === 'extension_version' || h === 'extensionversion');

  if (timestampIdx === -1 || eventIdx === -1 || idIdx === -1) {
    return {
      success: false,
      records: [],
      errors: ['Missing required columns: timestamp, event, and extension_id must be present'],
    };
  }

  const records: HistoryRecord[] = [];
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // Skip empty lines
    if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue;

    const rawTimestamp = row[timestampIdx]?.trim();
    const rawEvent = row[eventIdx]?.trim().toLowerCase();
    const rawId = row[idIdx]?.trim();
    const rawName = nameIdx !== -1 ? row[nameIdx]?.trim() : '';
    const rawVersion = versionIdx !== -1 ? row[versionIdx]?.trim() : '';

    if (!rawTimestamp) {
      errors.push(`Row ${r + 1}: Missing timestamp`);
      continue;
    }

    let timestamp: number;
    if (/^\d+$/.test(rawTimestamp)) {
      timestamp = parseInt(rawTimestamp, 10);
    } else {
      timestamp = new Date(rawTimestamp).getTime();
    }

    if (isNaN(timestamp) || timestamp <= 0) {
      errors.push(`Row ${r + 1}: Invalid timestamp "${rawTimestamp}"`);
      continue;
    }

    if (!rawEvent || !VALID_EVENTS.has(rawEvent)) {
      errors.push(`Row ${r + 1}: Invalid event type "${rawEvent}"`);
      continue;
    }

    if (!rawId) {
      errors.push(`Row ${r + 1}: Missing extension ID`);
      continue;
    }

    const event = rawEvent as HistoryRecord['event'];
    const extensionId = rawId;
    const extensionName = rawName || extensionId;
    const extensionVersion = rawVersion || '';

    records.push({
      id: `hist_import_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp,
      event,
      extensionId,
      extensionName,
      extensionVersion,
      source: 'external',
    });
  }

  if (records.length === 0 && errors.length > 0) {
    return {
      success: false,
      records: [],
      errors,
    };
  }

  return {
    success: true,
    records,
    errors,
  };
}

/**
 * Returns a stable composite key for deduplicating history records:
 * timestamp + event + extension_id + version
 */
export function getHistoryCompositeKey(
  record: Pick<HistoryRecord, 'timestamp' | 'event' | 'extensionId' | 'extensionVersion'>
): string {
  return `${record.timestamp}|${record.event}|${record.extensionId}|${record.extensionVersion || ''}`;
}

export interface HistoryMergePreview {
  newRecords: HistoryRecord[];
  importedCount: number;
  skippedCount: number;
  totalMergedCount: number;
  willExceedLimit: boolean;
  recordsToTrimCount: number;
}

/**
 * Previews the merge between existing and incoming history records without mutating state.
 * Deduplicates by stable composite key and checks against maximum record retention limit.
 */
export function previewHistoryMerge(
  existingRecords: HistoryRecord[],
  incomingRecords: HistoryRecord[],
  maxRecords: number = 5000
): HistoryMergePreview {
  const existingKeys = new Set(existingRecords.map(getHistoryCompositeKey));
  const newRecords: HistoryRecord[] = [];
  let skippedCount = 0;

  for (const record of incomingRecords) {
    const key = getHistoryCompositeKey(record);
    if (existingKeys.has(key)) {
      skippedCount++;
    } else {
      existingKeys.add(key);
      newRecords.push(record);
    }
  }

  const importedCount = newRecords.length;
  const totalMergedCount = existingRecords.length + importedCount;
  const willExceedLimit = totalMergedCount > maxRecords;
  const recordsToTrimCount = willExceedLimit ? totalMergedCount - maxRecords : 0;

  return {
    newRecords,
    importedCount,
    skippedCount,
    totalMergedCount,
    willExceedLimit,
    recordsToTrimCount,
  };
}

/**
 * Merges existing and incoming records into a chronologically sorted array,
 * applying the maxRecords retention limit if specified.
 */
export function applyHistoryMerge(
  existingRecords: HistoryRecord[],
  newRecords: HistoryRecord[],
  maxRecords: number = 5000
): HistoryRecord[] {
  const combined = [...existingRecords, ...newRecords];
  // Sort ascending by timestamp (canonical storage order)
  combined.sort((a, b) => a.timestamp - b.timestamp);

  if (combined.length > maxRecords) {
    return combined.slice(combined.length - maxRecords);
  }

  return combined;
}
