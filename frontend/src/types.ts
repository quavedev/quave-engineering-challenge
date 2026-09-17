export type StatusFilter = '' | 'pending' | 'paid';
export type Payout = {
  merchantId: string;
  payoutId: string;
  amountCents: number;
  currency: 'USD';
  status: 'pending' | 'paid';
  transferId: string | null;
};
