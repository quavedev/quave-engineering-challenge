import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import type { Payout, StatusFilter } from './types';

type View = { key: string; rows: Payout[]; loading: boolean; error: string | null; sending: string[] };
const empty = (key: string): View => ({ key, rows: [], loading: true, error: null, sending: [] });

export function usePayouts(merchantId: string, status: StatusFilter) {
  const key = JSON.stringify([merchantId, status]);
  const [view, setView] = useState<View>(() => empty(key));
  const generation = useRef(0);

  useEffect(() => {
    const current = ++generation.current;
    setView(empty(key));
    api.listPayouts(merchantId, status).then(
      rows => { if (generation.current === current) setView({ key, rows, loading: false, error: null, sending: [] }); },
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
      setView(value => ({ ...value, rows: value.rows
        .map(row => row.payoutId === payoutId ? accepted : row)
        .filter(row => !status || row.status === status) }));
    } catch (error) {
      if (generation.current === current) setView(value => ({ ...value, error: (error as Error).message }));
    } finally {
      if (generation.current === current) setView(value => ({ ...value, sending: value.sending.filter(id => id !== payoutId) }));
    }
  }

  return { ...(view.key === key ? view : empty(key)), send };
}
