import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportActivationCodes } from './exportUtils';
import type { ActivationCode, Feature } from '../api/client';

// Mock the dependencies
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
    getNumberOfPages: vi.fn().mockReturnValue(1)
  }))
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn()
}));

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn().mockReturnValue({}),
    json_to_sheet: vi.fn().mockReturnValue({}),
    book_append_sheet: vi.fn()
  },
  write: vi.fn().mockReturnValue(new Uint8Array())
}));

vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}));

describe('exportUtils', () => {
  const mockCodes: ActivationCode[] = [
    {
      _id: '1',
      code: 'TEST-1234-ABCD',
      type: 'trial',
      features: ['feature1', 'feature2'],
      current_uses: 0,
      max_uses: 1,
      used: false,
      created_at: '2024-01-01T00:00:00.000Z',
      expires_at: '2024-12-31T23:59:59.000Z'
    }
  ];

  const mockFeatures: Feature[] = [
    {
      _id: '1',
      name: 'feature1',
      description: 'Test Feature 1',
      category: 'basic',
      active: true
    },
    {
      _id: '2',
      name: 'feature2',
      description: 'Test Feature 2',
      category: 'advanced',
      active: true
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportActivationCodes', () => {
    it('should export all codes when includeSelectedOnly is false', async () => {
      const result = await exportActivationCodes({
        format: 'pdf',
        includeSelectedOnly: false,
        allCodes: mockCodes,
        availableFeatures: mockFeatures
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should export selected codes when includeSelectedOnly is true', async () => {
      const result = await exportActivationCodes({
        format: 'excel',
        includeSelectedOnly: true,
        selectedCodes: ['1'],
        allCodes: mockCodes,
        availableFeatures: mockFeatures
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should throw error when no codes are provided', async () => {
      await expect(exportActivationCodes({
        format: 'pdf',
        allCodes: [],
        availableFeatures: mockFeatures
      })).rejects.toThrow('لا توجد بيانات للتصدير');
    });

    it('should throw error when no selected codes match', async () => {
      await expect(exportActivationCodes({
        format: 'excel',
        includeSelectedOnly: true,
        selectedCodes: ['nonexistent'],
        allCodes: mockCodes,
        availableFeatures: mockFeatures
      })).rejects.toThrow('لا توجد رموز محددة للتصدير');
    });
  });
}); 