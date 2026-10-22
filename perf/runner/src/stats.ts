// ≥ 3 iterations, the first dropped (caches, JIT warm-up), the median reported (WEB-SCENARIOS.md).

export const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** (max − min) ÷ median: how far apart the kept iterations are. */
export const spread = (values: number[]) => {
  if (values.length < 2) return 0;
  const m = median(values);
  return m === 0 ? 0 : (Math.max(...values) - Math.min(...values)) / m;
};

/** Above this spread a row is kept but flagged `unstable` (WEB-PLAN.md §6.7). */
export const UNSTABLE_SPREAD = 0.15;

/**
 * …but only if the range is also wider than one 60 Hz frame. A small quantity (CL-10's client share is
 * ~45 ms) swings 17 % on a single frame of jitter, which says nothing about the SDK. Measured
 * 2026-10-21: three CL-10 runs with client medians 44.1 / 47.4 / 46.5 ms each read as 17–36 % "spread".
 */
const UNSTABLE_MIN_RANGE: Record<string, number> = {
  // Two percentage points: CL-11's dropped-frame % moved 1.5–2.3 points between iterations of one
  // run (2026-10-21) while its medians stayed within ±15 % of each other.
  '%': 2,
  ms: 17,
};

export const isUnstable = (values: number[], unit: string) =>
  spread(values) > UNSTABLE_SPREAD &&
  Math.max(...values) - Math.min(...values) > (UNSTABLE_MIN_RANGE[unit] ?? 0);

export const dropFirst = <T>(values: T[]) =>
  values.length > 1 ? values.slice(1) : values;
