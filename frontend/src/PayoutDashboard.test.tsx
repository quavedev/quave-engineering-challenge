import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { api } from './api';
import { PayoutDashboard } from './PayoutDashboard';
import type { Payout } from './types';

vi.mock('./api', () => ({ api: { listPayouts: vi.fn(), dispatch: vi.fn() } }));
const payout: Payout = { merchantId: 'cedar', payoutId: '17', amountCents: 18750, currency: 'USD', status: 'pending', transferId: null };
beforeEach(() => { vi.resetAllMocks(); vi.mocked(api.listPayouts).mockResolvedValue([payout]); });

test('shows a payout amount and its status', async () => {
  render(<PayoutDashboard />);
  expect(await screen.findByText('$187.50')).toBeInTheDocument();
  expect(screen.getByText('pending', { selector: 'td' })).toBeInTheDocument();
});

test('submits the selected payout and shows confirmed success', async () => {
  vi.mocked(api.dispatch).mockResolvedValue({ ...payout, status: 'paid', transferId: 'transfer-1' });
  render(<PayoutDashboard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Send payout 17' }));
  await waitFor(() => expect(screen.getByText('paid', { selector: 'td' })).toBeInTheDocument());
  expect(api.dispatch).toHaveBeenCalledWith('cedar', '17');
});

test('passes the selected filter to the Rails API', async () => {
  render(<PayoutDashboard />);
  await screen.findByText('$187.50');
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'pending' } });
  await waitFor(() => expect(api.listPayouts).toHaveBeenLastCalledWith('cedar', 'pending'));
});
