import { useMemo, useState } from 'react';
import { allocateFee } from './allocateFee';
import type { Payout } from './types';

const usd = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export function PayoutFeePreview({ payouts }: { payouts: readonly Payout[] }) {
  const [draft, setDraft] = useState('100');
  const [requestedFee, setRequestedFee] = useState<number | null>(null);
  const result = useMemo(() => {
    if (requestedFee === null) return null;
    try { return { shares: allocateFee(payouts, requestedFee), error: null }; }
    catch (error) { return { shares: null, error: (error as Error).message }; }
  }, [payouts, requestedFee]);

  return <section aria-label="Fee allocation preview">
    <h2>Fee allocation preview</h2>
    <p>Allocate a fixed fee across the visible payouts. This calculation does not change payouts or send a payment.</p>
    <form onSubmit={event => {
      event.preventDefault();
      setRequestedFee(draft.trim() === '' ? NaN : Number(draft));
    }}>
      <label>Fee (USD cents) <input type="number" min="0" step="1" required value={draft}
        onChange={event => setDraft(event.target.value)} /></label>
      <button type="submit">Preview fee</button>
    </form>
    {result?.error && <p role="alert">{result.error}</p>}
    {result?.shares && <table>
      <caption>Preview for {usd(requestedFee!)} total fee</caption>
      <thead><tr><th>Payout</th><th>Allocated fee</th><th>Net amount</th></tr></thead>
      <tbody>{result.shares.map(share => <tr key={JSON.stringify([share.payout.merchantId, share.payout.payoutId])}>
        <td>{share.payout.payoutId}</td><td>{usd(share.feeCents)}</td><td>{usd(share.netCents)}</td>
      </tr>)}</tbody>
    </table>}
  </section>;
}
