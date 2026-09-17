import { expect, test } from 'vitest';
import { PayoutRows } from './PayoutRows';
import type { Payout } from './types';

function payout(payoutId: string): Payout {
  return { merchantId: 'cedar', payoutId, amountCents: 500, currency: 'USD', status: 'pending', transferId: null };
}

test('uses natural ID ordering without mutating the supplied rows', () => {
  const input = ['100', '17', '2'].map(payout);
  const ordered = new PayoutRows(input);
  expect(ordered.toArray().map(row => row.payoutId)).toEqual(['2', '17', '100']);
  expect(input.map(row => row.payoutId)).toEqual(['100', '17', '2']);
});

test('replaces a confirmed record and preserves surrounding records', () => {
  const input = ['100', '17', '2'].map(payout);
  const accepted: Payout = { ...payout('17'), status: 'paid', transferId: 'transfer-17' };
  const result = new PayoutRows(input).replace(accepted);
  expect(result).toEqual([payout('2'), accepted, payout('100')]);
});
