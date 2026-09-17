import { afterEach, expect, test, vi } from 'vitest';
import { api } from './api';

afterEach(() => vi.unstubAllGlobals());

function mockFetch() {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'paid' }) });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

test('dispatch uses native UUID generation when available', async () => {
  const id = '6d2cbd67-972a-4a4e-9472-8711cac0669c';
  const randomUUID = vi.fn().mockReturnValue(id);
  vi.stubGlobal('crypto', { randomUUID });
  const fetch = mockFetch();
  await api.dispatch('cedar', '17');
  expect(fetch).toHaveBeenCalledWith('/api/merchants/cedar/payouts/17/dispatch', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ delivery_id: id }),
  }));
  expect(randomUUID).toHaveBeenCalledOnce();
});

test('dispatch works over HTTP without randomUUID and generates a fresh ID for each attempt', async () => {
  let attempt = 0;
  const getRandomValues = vi.fn((bytes: Uint8Array) => {
    bytes.fill(++attempt);
    return bytes;
  });
  vi.stubGlobal('crypto', { getRandomValues });
  const fetch = mockFetch();
  await expect(api.dispatch('cedar', '17')).resolves.toEqual({ status: 'paid' });
  await api.dispatch('cedar', '17');
  const ids = fetch.mock.calls.map(([, options]) => JSON.parse(options.body).delivery_id);
  expect(ids).toEqual(['01010101-0101-4101-8101-010101010101', '02020202-0202-4202-8202-020202020202']);
  expect(getRandomValues).toHaveBeenCalledTimes(2);
});
