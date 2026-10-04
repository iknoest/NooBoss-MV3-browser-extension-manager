import { describe, expect, it } from 'vitest';
import {
  parseCSV,
  parseHistoryCSV,
  getHistoryCompositeKey,
  previewHistoryMerge,
  applyHistoryMerge,
} from '../../src/shared/history-import';
import { formatHistoryCSV } from '../../src/shared/history-export';
import type { HistoryRecord } from '../../src/shared/types';

describe('History CSV Import', () => {
  describe('RFC-4180 CSV Parser', () => {
    it('parses standard unquoted CSV rows', () => {
      const csv = 'col1,col2,col3\nval1,val2,val3\nval4,val5,val6';
      const result = parseCSV(csv);
      expect(result).toEqual([
        ['col1', 'col2', 'col3'],
        ['val1', 'val2', 'val3'],
        ['val4', 'val5', 'val6'],
      ]);
    });

    it('parses CRLF and LF line endings equivalently', () => {
      const csvCrlf = 'a,b\r\n1,2\r\n3,4';
      const csvLf = 'a,b\n1,2\n3,4';
      expect(parseCSV(csvCrlf)).toEqual(parseCSV(csvLf));
    });

    it('handles quoted fields with embedded commas, newlines, and escaped quotes', () => {
      const csv = 'name,note,count\n"Extension, Inc.","Line 1\nLine 2",10\n"He said ""Hello""",plain,20';
      const result = parseCSV(csv);
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual(['Extension, Inc.', 'Line 1\nLine 2', '10']);
      expect(result[2]).toEqual(['He said "Hello"', 'plain', '20']);
    });

    it('strips UTF-8 BOM if present at start of stream', () => {
      const csv = '\uFEFFtimestamp,event,extension_id\n100,installed,ext1';
      const result = parseCSV(csv);
      expect(result[0][0]).toBe('timestamp');
    });

    it('returns empty array for empty or whitespace-only CSV', () => {
      expect(parseCSV('')).toEqual([]);
      expect(parseCSV('\n\r\n')).toEqual([]);
    });
  });

  describe('History Record Parsing & Validation', () => {
    it('successfully parses valid CSV formatted history records', () => {
      const csv =
        'timestamp,event,extension_name,extension_id,version\r\n' +
        '2026-09-17T21:40:00.000Z,installed,React DevTools,fmkadmapgofadopljbjfkapdkoienihi,5.1.0\r\n' +
        '1726609200000,enabled,uBlock Origin,cjpalhdlnbpafiamejdnhcphjbkeiagm,1.58.0';

      const res = parseHistoryCSV(csv);
      expect(res.success).toBe(true);
      expect(res.records).toHaveLength(2);

      expect(res.records[0].event).toBe('installed');
      expect(res.records[0].extensionName).toBe('React DevTools');
      expect(res.records[0].extensionId).toBe('fmkadmapgofadopljbjfkapdkoienihi');
      expect(res.records[0].extensionVersion).toBe('5.1.0');
      expect(res.records[0].timestamp).toBe(new Date('2026-09-17T21:40:00.000Z').getTime());

      expect(res.records[1].event).toBe('enabled');
      expect(res.records[1].timestamp).toBe(1726609200000);
    });

    it('fails when required columns are missing', () => {
      const csv = 'col_a,col_b,col_c\n1,2,3';
      const res = parseHistoryCSV(csv);
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Missing required columns');
    });

    it('collects errors for invalid rows but continues parsing valid rows', () => {
      const csv =
        'timestamp,event,extension_name,extension_id,version\n' +
        'invalid_date,installed,Ext1,id1,1.0\n' +
        '2026-01-01T00:00:00.000Z,bogus_event,Ext2,id2,1.0\n' +
        '2026-01-01T00:00:00.000Z,enabled,,,\n' +
        '2026-01-01T00:00:00.000Z,enabled,ValidExt,valid_id,2.0';

      const res = parseHistoryCSV(csv);
      expect(res.success).toBe(true);
      expect(res.records).toHaveLength(1);
      expect(res.records[0].extensionId).toBe('valid_id');
      expect(res.errors).toHaveLength(3);
    });
  });

  describe('Deduplication & Stable Composite Key', () => {
    const recordA: HistoryRecord = {
      id: 'h1',
      timestamp: 1700000000000,
      event: 'installed',
      extensionId: 'ext_a',
      extensionName: 'Extension A',
      extensionVersion: '1.0.0',
      source: 'user',
    };

    it('generates consistent composite key irrespective of id or source', () => {
      const key1 = getHistoryCompositeKey(recordA);
      const key2 = getHistoryCompositeKey({
        timestamp: 1700000000000,
        event: 'installed',
        extensionId: 'ext_a',
        extensionVersion: '1.0.0',
      });
      expect(key1).toBe('1700000000000|installed|ext_a|1.0.0');
      expect(key1).toBe(key2);
    });

    it('previewHistoryMerge skips exact duplicate records idempotently', () => {
      const existing: HistoryRecord[] = [recordA];
      const incoming: HistoryRecord[] = [
        { ...recordA, id: 'h_imported_copy' }, // duplicate
        {
          id: 'h2',
          timestamp: 1700000010000,
          event: 'enabled',
          extensionId: 'ext_a',
          extensionVersion: '1.0.0',
          extensionName: 'Extension A',
          source: 'external',
        }, // new
      ];

      const preview = previewHistoryMerge(existing, incoming, 5000);
      expect(preview.importedCount).toBe(1);
      expect(preview.skippedCount).toBe(1);
      expect(preview.totalMergedCount).toBe(2);
      expect(preview.newRecords).toHaveLength(1);
      expect(preview.newRecords[0].event).toBe('enabled');
    });

    it('re-importing the same records results in zero imported and all skipped', () => {
      const existing: HistoryRecord[] = [recordA];
      const preview = previewHistoryMerge(existing, [recordA], 5000);
      expect(preview.importedCount).toBe(0);
      expect(preview.skippedCount).toBe(1);
      expect(preview.totalMergedCount).toBe(1);
    });
  });

  describe('Merge & Retention Controls', () => {
    it('sorts merged records chronologically ascending by timestamp', () => {
      const existing: HistoryRecord[] = [
        {
          id: 'h2',
          timestamp: 200,
          event: 'enabled',
          extensionId: 'ext1',
          extensionName: 'Ext',
          extensionVersion: '1',
          source: 'user',
        },
      ];
      const incoming: HistoryRecord[] = [
        {
          id: 'h3',
          timestamp: 300,
          event: 'disabled',
          extensionId: 'ext1',
          extensionName: 'Ext',
          extensionVersion: '1',
          source: 'external',
        },
        {
          id: 'h1',
          timestamp: 100,
          event: 'installed',
          extensionId: 'ext1',
          extensionName: 'Ext',
          extensionVersion: '1',
          source: 'external',
        },
      ];

      const merged = applyHistoryMerge(existing, incoming, 5000);
      expect(merged.map((r) => r.timestamp)).toEqual([100, 200, 300]);
    });

    it('detects when import exceeds maxRecords limit and trims oldest records upon application', () => {
      const existing: HistoryRecord[] = [
        { id: '1', timestamp: 10, event: 'installed', extensionId: 'a', extensionName: 'A', extensionVersion: '', source: 'user' },
        { id: '2', timestamp: 20, event: 'enabled', extensionId: 'a', extensionName: 'A', extensionVersion: '', source: 'user' },
      ];
      const incoming: HistoryRecord[] = [
        { id: '3', timestamp: 30, event: 'disabled', extensionId: 'a', extensionName: 'A', extensionVersion: '', source: 'external' },
        { id: '4', timestamp: 40, event: 'enabled', extensionId: 'a', extensionName: 'A', extensionVersion: '', source: 'external' },
      ];

      // Limit is 3, total combined is 4
      const preview = previewHistoryMerge(existing, incoming, 3);
      expect(preview.willExceedLimit).toBe(true);
      expect(preview.totalMergedCount).toBe(4);
      expect(preview.recordsToTrimCount).toBe(1);

      const merged = applyHistoryMerge(existing, incoming, 3);
      expect(merged).toHaveLength(3);
      // Oldest record (timestamp 10) was trimmed
      expect(merged.map((r) => r.timestamp)).toEqual([20, 30, 40]);
    });
  });

  describe('Full Round-Trip Export and Import', () => {
    it('exports history to CSV and imports it back with 100% duplicate identity', () => {
      const original: HistoryRecord[] = [
        {
          id: 'rec1',
          timestamp: 1726609200000,
          event: 'installed',
          extensionId: 'abcdefghijklmnopabcdefghijklmnop',
          extensionName: 'Test "Quoted, Name"',
          extensionVersion: '1.2.3',
          source: 'user',
        },
        {
          id: 'rec2',
          timestamp: 1726609205000,
          event: 'enabled',
          extensionId: 'abcdefghijklmnopabcdefghijklmnop',
          extensionName: 'Test "Quoted, Name"',
          extensionVersion: '1.2.3',
          source: 'user',
        },
      ];

      // Step 1: Export to CSV
      const csv = formatHistoryCSV(original);

      // Step 2: Parse CSV back
      const parsed = parseHistoryCSV(csv);
      expect(parsed.success).toBe(true);
      expect(parsed.records).toHaveLength(2);

      // Step 3: Preview merge against original
      const preview = previewHistoryMerge(original, parsed.records, 5000);
      // All records are recognized as duplicates!
      expect(preview.importedCount).toBe(0);
      expect(preview.skippedCount).toBe(2);
      expect(preview.totalMergedCount).toBe(2);
    });
  });
});
