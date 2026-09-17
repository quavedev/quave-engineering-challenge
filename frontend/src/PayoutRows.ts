import type { Payout } from './types';

const compareIds = new Intl.Collator('en', { numeric: true }).compare;

/** Immutable naturally ordered payout rows for one merchant. */
export class PayoutRows {
  private readonly rows: Payout[];

  constructor(rows: readonly Payout[]) {
    this.rows = [...rows].sort((left, right) => compareIds(left.payoutId, right.payoutId));
  }

  toArray(): Payout[] {
    return [...this.rows];
  }

  replace(payout: Payout): Payout[] {
    const index = this.lowerBound(payout.payoutId);
    if (index === this.rows.length || compareIds(this.rows[index].payoutId, payout.payoutId) !== 0) {
      return this.toArray();
    }
    return [...this.rows.slice(0, index), payout, ...this.rows.slice(index + 1)];
  }

  private lowerBound(id: string): number {
    let first = 0;
    let last = this.rows.length;
    while (first < last) {
      const middle = first + Math.floor((last - first) / 2);
      if (compareIds(this.rows[middle].payoutId, id) < 0) first = middle + 1;
      else last = middle;
    }
    return first;
  }
}
