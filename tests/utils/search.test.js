import { describe, expect, it } from 'vitest';
import { escapeRegex } from '../../src/utils/search.js';

describe('escapeRegex', () => {
  it('escapes regex metacharacters while preserving normal text', () => {
    expect(escapeRegex('Pokhara (lake).* + trek?')).toBe('Pokhara \\(lake\\)\\.\\* \\+ trek\\?');
    expect(escapeRegex('Everest')).toBe('Everest');
  });
});
