import type { Payout } from './types';

export type FeeShare = { payout: Payout; feeCents: number; netCents: number };

/** Distribute whole cents proportionally, awarding residual cents by remainder then ID. */
export function allocateFee(payouts: readonly Payout[], feeCents: number): FeeShare[] {
  if (!Number.isSafeInteger(feeCents) || feeCents < 0) {
    throw new Error('Fee must be a nonnegative whole number of cents.');
  }
  if (payouts.some(payout => !Number.isSafeInteger(payout.amountCents) || payout.amountCents <= 0)) {
    throw new Error('Payout amounts must be positive whole numbers of cents.');
  }
  const total = payouts.reduce((sum, payout) => sum + payout.amountCents, 0);
  if (feeCents > total) throw new Error('Fee cannot exceed the visible payout total.');
  if (payouts.length === 0) return [];

  const shares = payouts.map((payout, index) => {
    const quota = feeCents * payout.amountCents / total;
    const cents = Math.floor(quota);
    return { payout, index, cents, remainder: quota - cents };
  });
  const ranked = [...shares].sort((left, right) => {
    const byRemainder = right.remainder - left.remainder;
    if (byRemainder !== 0) return byRemainder;
    return left.payout.payoutId < right.payout.payoutId ? -1
      : left.payout.payoutId > right.payout.payoutId ? 1 : 0;
  });
  const remaining = feeCents - shares.reduce((sum, share) => sum + share.cents, 0);
  for (let index = 0; index < remaining; index += 1) ranked[index].cents += 1;
  return shares.map(share => ({ payout: share.payout, feeCents: share.cents,
    netCents: share.payout.amountCents - share.cents }));
}
