/** Run independent work with a fixed maximum number of in-flight requests. */
export async function runLimited<T>(items: readonly T[], limit: number,
  run: (item: T) => Promise<void>): Promise<void> {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('Concurrency must be a positive integer');
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const item = items[next++];
      await run(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
}
