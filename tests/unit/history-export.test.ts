import { describe, it, expect } from 'vitest';
import {
  escapeCSVField,
  formatHistoryCSV,
  getHistoryExportFilename,
} from '../../src/shared/history-export';
import type { HistoryRecord } from '../../src/shared/types';

describe('History CSV Export', () => {
  describe('escapeCSVField', () => {
    it('returns empty string for null and undefined', () => {
      expect(escapeCSVField(null)).toBe('');
      expect(escapeCSVField(undefined)).toBe('');
    });

    it('returns simple strings unquoted', () => {
      expect(escapeCSVField('simple')).toBe('simple');
      expect(escapeCSVField(123)).toBe('123');
    });

    it('quotes strings containing commas', () => {
      expect(escapeCSVField('foo, bar')).toBe('"foo, bar"');
    });

    it('escapes internal quotes and wraps in quotes', () => {
      expect(escapeCSVField('hello "world"')).toBe('"hello ""world"""');
    });

    it('quotes strings containing newlines', () => {
      expect(escapeCSVField("line1\nline2")).toBe('"line1\nline2"');
    });
  });

  describe('formatHistoryCSV', () => {
    const mockRecords: HistoryRecord[] = [
      {
        id: 'hist_1',
        extensionId: 'ext_abc123',
        extensionName: 'NoWebP: WebP to PNG, Copy & Save as PNG',
        extensionVersion: '0.1.1',
        event: 'enabled',
        source: 'user',
        timestamp: 1726500000000,
      },
      {
        id: 'hist_2',
        extensionId: 'ext_def456',
        extensionName: 'Extension "Special" Drawer',
        extensionVersion: '1.1.0',
        event: 'updated',
        source: 'external',
        timestamp: 1726510000000,
      },
      {
        id: 'hist_3',
        extensionId: 'ext_ghi789',
        extensionName: 'Simple Extension',
        extensionVersion: '2.0.0',
        event: 'installed',
        source: 'user',
        timestamp: 1726520000000,
      },
    ];

    it('includes standard machine-readable CSV header with exact columns', () => {
      const csv = formatHistoryCSV(mockRecords);
      const lines = csv.split('\r\n');
      expect(lines[0]).toBe('timestamp,event,extension_name,extension_id,version');
    });

    it('exports all records regardless of filtering', () => {
      const csv = formatHistoryCSV(mockRecords);
      const lines = csv.split('\r\n');
      expect(lines.length).toBe(4); // 1 header + 3 records
    });

    it('uses stable ISO 8601 timestamps', () => {
      const csv = formatHistoryCSV(mockRecords);
      const lines = csv.split('\r\n');
      expect(lines[1]).toContain(new Date(1726500000000).toISOString());
      expect(lines[2]).toContain(new Date(1726510000000).toISOString());
      expect(lines[3]).toContain(new Date(1726520000000).toISOString());
    });

    it('handles commas and quotation marks safely in extension name', () => {
      const csv = formatHistoryCSV(mockRecords);
      const lines = csv.split('\r\n');
      // NoWebP with comma
      expect(lines[1]).toContain('"NoWebP: WebP to PNG, Copy & Save as PNG"');
      // Extension with quotes
      expect(lines[2]).toContain('"Extension ""Special"" Drawer"');
    });

    it('formats empty records list with only the header', () => {
      const csv = formatHistoryCSV([]);
      expect(csv).toBe('timestamp,event,extension_name,extension_id,version');
    });
  });

  describe('getHistoryExportFilename', () => {
    it('generates filename matching extension-drawer-history-YYYY-MM-DD.csv', () => {
      const fixedDate = new Date(2026, 8, 17); // Sept 17, 2026
      const filename = getHistoryExportFilename(fixedDate);
      expect(filename).toBe('extension-drawer-history-2026-09-17.csv');
    });
  });
});
