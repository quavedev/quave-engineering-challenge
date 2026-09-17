import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

test('submits visible pending payouts and keeps already paid payouts unchanged', async () => {
  const rows: Payout[] = [payout, { ...payout, payoutId: '18' },
    { ...payout, payoutId: '19' }, { ...payout, payoutId: '20', status: 'paid', transferId: 'existing' }];
  vi.mocked(api.listPayouts).mockResolvedValue(rows);
  vi.mocked(api.dispatch).mockImplementation(async (_merchant, id) =>
    ({ ...payout, payoutId: id, status: 'paid', transferId: `transfer-${id}` }));
  render(<PayoutDashboard />);
  await screen.findByRole('button', { name: 'Send payout 17' });
  fireEvent.click(screen.getByRole('button', { name: 'Send visible pending payouts' }));
  await waitFor(() => expect(screen.getAllByText('paid', { selector: 'td' })).toHaveLength(4));
  expect(api.dispatch).toHaveBeenCalledTimes(3);
  expect(api.dispatch).not.toHaveBeenCalledWith('cedar', '20');
});

test('recomputes the visible fee preview when a confirmed send removes a pending row', async () => {
  vi.mocked(api.listPayouts).mockResolvedValue([payout, { ...payout, payoutId: '18' }]);
  vi.mocked(api.dispatch).mockResolvedValue({ ...payout, status: 'paid', transferId: 'transfer-1' });
  render(<PayoutDashboard />);
  await screen.findByRole('button', { name: 'Send payout 17' });
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'pending' } });
  await screen.findByRole('button', { name: 'Send payout 17' });
  fireEvent.click(screen.getByRole('button', { name: 'Preview fee' }));
  const preview = screen.getByRole('region', { name: 'Fee allocation preview' });
  expect(within(preview).getAllByText('$0.50')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Send payout 17' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Send payout 17' })).not.toBeInTheDocument());
  expect(within(preview).getByText('$1.00')).toBeInTheDocument();
  expect(within(preview).queryByText('17')).not.toBeInTheDocument();
});
