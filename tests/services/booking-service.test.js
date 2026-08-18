import { describe, expect, it } from 'vitest';
import { calculateBookingTotal } from '../../src/services/bookingService.js';

const operatorId = '507f1f77bcf86cd799439011';
const activity = {
  operatorPrices: [{ operator: operatorId, price: 9500 }],
};

describe('booking total service', () => {
  it('calculates traveller and optional extra totals', () => {
    expect(calculateBookingTotal(activity, operatorId, 2, [])).toBe(19000);
    expect(calculateBookingTotal(activity, operatorId, '3', ['photo', 'meal'])).toBe(29500);
  });

  it('rejects operators without an activity price', () => {
    expect(() =>
      calculateBookingTotal(activity, '507f1f77bcf86cd799439012', 1, []),
    ).toThrow('Selected operator is not available for this activity.');
    expect(() => calculateBookingTotal({}, operatorId, 1, [])).toThrow(
      'Selected operator is not available for this activity.',
    );
  });

  it.each([0, -1, 1.5, 'invalid', undefined])(
    'rejects invalid traveller count %s',
    (count) => {
      expect(() => calculateBookingTotal(activity, operatorId, count, [])).toThrow(
        'At least one traveller is required.',
      );
    },
  );

  it('rejects non-array extras', () => {
    expect(() => calculateBookingTotal(activity, operatorId, 1, 'photo')).toThrow(
      'Extras must be an array.',
    );
  });

  it.each([
    [['photo', ' Photo '], 'Extras must not contain duplicates.'],
    [[42], 'Each extra must be a non-empty string'],
    [[''], 'Each extra must be a non-empty string'],
    [[...Array.from({ length: 11 }, (_, index) => `extra-${index}`)], 'No more than 10 extras'],
  ])('rejects malformed extras %j', (extras, message) => {
    expect(() => calculateBookingTotal(activity, operatorId, 1, extras)).toThrow(message);
  });
});
