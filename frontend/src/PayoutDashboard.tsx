import { useState } from 'react';
import { usePayouts } from './usePayouts';
import { PayoutFeePreview } from './PayoutFeePreview';
import type { StatusFilter } from './types';

export function PayoutDashboard() {
  const [merchant, setMerchant] = useState('cedar');
  const [status, setStatus] = useState<StatusFilter>('');
  const view = usePayouts(merchant, status);

  return <main>
    <h1>Merchant payouts</h1>
    <label>Merchant <select value={merchant} onChange={event => setMerchant(event.target.value)}>
      <option value="cedar">Cedar</option><option value="maple">Maple</option>
    </select></label>
    <label>Status <select value={status} onChange={event => setStatus(event.target.value as StatusFilter)}>
      <option value="">All</option><option value="pending">Pending</option><option value="paid">Paid</option>
    </select></label>
    {view.error && <p role="alert">{view.error}</p>}
    {view.loading ? <p role="status">Loading payouts...</p> : <table>
      <caption>Payouts for {merchant}</caption>
      <thead><tr><th>Payout</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>{view.rows.map(row => <tr key={`${row.merchantId}:${row.payoutId}`}>
        <td>{row.payoutId}</td>
        <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: row.currency }).format(row.amountCents / 100)}</td>
        <td>{view.sending.includes(row.payoutId) ? 'Sending...' : row.status}</td>
        <td><button disabled={row.status === 'paid' || view.sending.includes(row.payoutId)}
          onClick={() => void view.send(row.payoutId)}>Send payout {row.payoutId}</button></td>
      </tr>)}</tbody>
    </table>}
    {!view.loading && <PayoutFeePreview payouts={view.rows} />}
  </main>;
}
