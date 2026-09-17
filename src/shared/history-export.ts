/**
 * History export utility for Extension Drawer.
 * Exports stored history records as standard CSV with stable machine-readable timestamps.
 */

import type { HistoryRecord } from './types';

/**
 * Escapes a field according to RFC-4180 CSV standards.
 * Wraps in double quotes and escapes existing double quotes if the field contains
 * commas, quotes, carriage returns, or line feeds.
 */
export function escapeCSVField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats an array of HistoryRecord items into a valid CSV string.
 * Columns: timestamp,event,extension_name,extension_id,version
 * Timestamps are formatted as ISO 8601 strings (e.g. 2026-09-17T21:40:00.000Z).
 */
export function formatHistoryCSV(records: HistoryRecord[]): string {
  const header = 'timestamp,event,extension_name,extension_id,version';
  const rows = records.map((rec) => {
    const timestamp = new Date(rec.timestamp).toISOString();
    const event = escapeCSVField(rec.event);
    const extName = escapeCSVField(rec.extensionName);
    const extId = escapeCSVField(rec.extensionId);
    const version = escapeCSVField(rec.extensionVersion ?? '');
    return `${timestamp},${event},${extName},${extId},${version}`;
  });
  return [header, ...rows].join('\r\n');
}

/**
 * Generates the suggested filename for the history export.
 * Format: extension-drawer-history-YYYY-MM-DD.csv
 */
export function getHistoryExportFilename(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `extension-drawer-history-${yyyy}-${mm}-${dd}.csv`;
}

/**
 * Initiates a browser download of the history records as CSV.
 * Uses client-side Blob creation to avoid extra browser permissions.
 */
export function exportHistoryCSV(records: HistoryRecord[], filename?: string): void {
  const csvContent = formatHistoryCSV(records);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || getHistoryExportFilename();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
