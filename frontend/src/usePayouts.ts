import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { runLimited } from './runLimited';
import { PayoutRows } from './PayoutRows';
import type { Payout, StatusFilter } from './types';

type View = { key: string; rows: Payout[]; loading: boolean; error: string | null; sending: string[] };
const empty = (key: string): View => ({ key, rows: [], loading: true, error: null, sending: [] });

export function usePayouts(merchantId: string, status: StatusFilter) {
  const key = JSON.stringify([merchantId, status]);
  const [view, setView] = useState<View>(() => empty(key));
  const generation = useRef(0);
  const batches = useRef(new Map<string, Set<string>>());
  const [queued, setQueued] = useState<{ key: string; ids: string[] }>({ key, ids: [] });

  useEffect(() => {
    const current = ++generation.current;
    setView(empty(key));
    setQueued({ key, ids: [...(batches.current.get(key) ?? [])] });
    api.listPayouts(merchantId, status).then(
      rows => { if (generation.current === current) setView({ key, rows: new PayoutRows(rows).toArray(), loading: false, error: null, sending: [] }); },
      error => { if (generation.current === current) setView({ ...empty(key), loading: false, error: String(error.message) }); },
    );
    return () => { generation.current += 1; };
  }, [merchantId, status, key]);

  async function send(payoutId: string) {
    const current = generation.current;
    setView(value => ({ ...value, error: null, sending: [...value.sending, payoutId] }));
    try {
      const accepted = await api.dispatch(merchantId, payoutId);
      if (generation.current !== current) return;
      setView(value => ({ ...value, rows: new PayoutRows(value.rows).replace(accepted)
        .filter(row => !status || row.status === status) }));
    } catch (error) {
      if (generation.current === current) setView(value => ({ ...value, error: (error as Error).message }));
    } finally {
      if (generation.current === current) setView(value => ({ ...value, sending: value.sending.filter(id => id !== payoutId) }));
    }
  }

  async function sendVisible() {
    const current = generation.current;
    const waiting = batches.current.get(key) ?? new Set<string>();
    const ids = view.rows.filter(row => row.status === 'pending'
      && !view.sending.includes(row.payoutId) && !waiting.has(row.payoutId))
      .map(row => row.payoutId);
    if (ids.length === 0) return;
    ids.forEach(id => waiting.add(id));
    batches.current.set(key, waiting);
    setQueued({ key, ids: [...waiting] });

    await runLimited(ids, 2, async id => {
      try {
        await send(id);
      } finally {
        waiting.delete(id);
        if (waiting.size === 0 && batches.current.get(key) === waiting) batches.current.delete(key);
        if (generation.current === current) setQueued({ key, ids: [...waiting] });
      }
    });
  }

  const visible = view.key === key ? view : empty(key);
  return { ...visible,
    sending: [...new Set([...visible.sending, ...(queued.key === key ? queued.ids : [])])],
    send, sendVisible };

}
