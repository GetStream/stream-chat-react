/** Deterministic PRNG (mulberry32): the same seed yields the same scenario on every runtime. */
export const createRng = (seed: number) => {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    /** Integer in [min, max]. */
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    next,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
  };
};

export type Rng = ReturnType<typeof createRng>;
