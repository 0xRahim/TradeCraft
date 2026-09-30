/** Seeded LCG matching the sample screens (16807 / 2^31-1). */
export function createRng(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

/** Largest-remainder apportion of `total` across weights. */
export function apportion(weights: readonly number[], total: number): number[] {
  const sum = weights.reduce((x, y) => x + y, 0);
  const quotas = weights.map((x) => (x * total) / sum);
  const floors = quotas.map(Math.floor);
  const rest = total - floors.reduce((x, y) => x + y, 0);
  const order = quotas
    .map((q, i) => [q - floors[i], i] as const)
    .sort((a, b) => b[0] - a[0])
    .slice(0, rest)
    .map(([, i]) => i);
  for (const i of order) floors[i] += 1;
  return floors;
}
