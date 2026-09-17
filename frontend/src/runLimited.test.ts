import { expect, test } from 'vitest';
import { runLimited } from './runLimited';

test('covers all work while respecting the concurrency bound', async () => {
  let active = 0;
  let peak = 0;
  const completed: number[] = [];
  await runLimited([1, 2, 3, 4, 5], 2, async value => {
    active += 1;
    peak = Math.max(peak, active);
    await Promise.resolve();
    completed.push(value);
    active -= 1;
  });
  expect(peak).toBe(2);
  expect(completed.sort()).toEqual([1, 2, 3, 4, 5]);
});
