import { expect, test } from 'vitest';
import { allocateFee } from './allocateFee';
import type { Payout } from './types';

const row = (payoutId: string, amountCents: number): Payout => ({ merchantId: 'cedar', payoutId,
  amountCents, currency: 'USD', status: 'pending', transferId: null });

test('allocates a proportional whole-cent fee and leaves source records unchanged', () => {
  const payouts = [row('01', 10000), row('02', 30000)];
  const before = structuredClone(payouts);
  expect(allocateFee(payouts, 400).map(share => [share.feeCents, share.netCents]))
    .toEqual([[100, 9900], [300, 29700]]);
  expect(payouts).toEqual(before);
});

test('gives the residual cent to the largest remainder', () => {
  expect(allocateFee([row('01', 10000), row('02', 20000)], 1).map(share => share.feeCents))
    .toEqual([0, 1]);
});

test('breaks equal remainder ties by exact ID and preserves input display order', () => {
  expect(allocateFee([row('2', 100), row('10', 100)], 1).map(share => share.feeCents))
    .toEqual([0, 1]);
});

test('handles zero and total-sized fees and rejects invalid fees', () => {
  const payouts = [row('01', 100), row('02', 300)];
  expect(allocateFee(payouts, 0).map(share => share.feeCents)).toEqual([0, 0]);
  expect(allocateFee(payouts, 400).map(share => share.netCents)).toEqual([0, 0]);
  for (const fee of [-1, 0.5, NaN, Infinity, 401]) expect(() => allocateFee(payouts, fee)).toThrow();
  expect(allocateFee([], 0)).toEqual([]);
  expect(() => allocateFee([], 1)).toThrow();
});
