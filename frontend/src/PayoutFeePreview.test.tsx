import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { PayoutFeePreview } from './PayoutFeePreview';
import type { Payout } from './types';

const payout: Payout = { merchantId: 'cedar', payoutId: '17', amountCents: 20000,
  currency: 'USD', status: 'pending', transferId: null };

test('previews fee and net amount without modifying the payout', () => {
  render(<PayoutFeePreview payouts={[payout]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Preview fee' }));
  const table = screen.getByRole('table');
  expect(within(table).getByText('$1.00')).toBeInTheDocument();
  expect(within(table).getByText('$199.00')).toBeInTheDocument();
  expect(payout.status).toBe('pending');
});

test('recomputes an applied fee when the visible payout list changes', () => {
  const { rerender } = render(<PayoutFeePreview payouts={[payout]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Preview fee' }));
  rerender(<PayoutFeePreview payouts={[payout, { ...payout, payoutId: '18' }]} />);
  expect(screen.getAllByText('$0.50')).toHaveLength(2);
});

test('displays a validation error for a fee above the visible payout total', () => {
  render(<PayoutFeePreview payouts={[payout]} />);
  fireEvent.change(screen.getByLabelText('Fee (USD cents)'), { target: { value: '20001' } });
  fireEvent.click(screen.getByRole('button', { name: 'Preview fee' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Fee cannot exceed the visible payout total.');
});
