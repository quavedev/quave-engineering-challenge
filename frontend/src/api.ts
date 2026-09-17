import { createDeliveryId } from './deliveryId';
import type { Payout, StatusFilter } from './types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

export const api = {
  listPayouts(merchantId: string, status: StatusFilter): Promise<Payout[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/merchants/${encodeURIComponent(merchantId)}/payouts${query}`);
  },
  dispatch(merchantId: string, payoutId: string): Promise<Payout> {
    return request(`/api/merchants/${encodeURIComponent(merchantId)}/payouts/${encodeURIComponent(payoutId)}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_id: createDeliveryId() }),
    });
  },
};
