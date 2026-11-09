import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';

// Opt-in module that reports which registered slots are visually obscured: smaller than
// `MIN_VISIBLE_AREA`, or covered by another registered slot past `COVER_THRESHOLD`. App code
// registers the DOM element of each slot (`useRegisterSlotGeometry`) under a
// `SlotGeometryProvider`, which measures them on `ResizeObserver` callbacks and window resize. It
// only detects and never changes the layout, and it does not depend on `LayoutController`, so it
// works with any slotted layout.

/** Slot identifier: a plain string, so the module is layout-agnostic. */
export type SlotId = string;

/**
 * Fraction of a slot's own area that a single other slot must overlap for it to count as covered.
 * A neighbor that only touches an edge overlaps nothing, so it does not count.
 */
const COVER_THRESHOLD = 0.6;
/**
 * Smallest rendered area (CSS px²) at which a slot counts as visible. A smaller slot (collapsed,
 * zero width or height, or `display: none`) is obscured outright; 1 is an epsilon that absorbs
 * floating-point noise.
 */
const MIN_VISIBLE_AREA = 1;

export type SlotCoverage = {
  /** Whether each slot, by ID, is currently obscured (collapsed, or covered by another slot). */
  obscured: Record<SlotId, boolean>;
};

/** What to do with a pending reveal intent, given the current coverage. */
export type RevealAction =
  /** The target is not measured yet (e.g. its view just became active): wait for an update. */
  | 'wait'
  /** The target is obscured: reveal it by releasing whatever covers it. */
  | 'act'
  /** There is no intent, or the target is already visible: clear the intent. */
  | 'clear';

/**
 * Decides what to do about a pending reveal intent: wait until the target is measured, then act
 * only if it is obscured, otherwise clear. Pure, so it can run in an effect keyed on `coverage`.
 *
 * @param revealSlot - Slot pending reveal, if any.
 * @param coverage - Current coverage snapshot.
 * @returns Whether to wait, reveal the slot or clear the intent.
 */
export const resolveRevealAction = (
  revealSlot: SlotId | undefined,
  coverage: SlotCoverage,
): RevealAction => {
  if (revealSlot === undefined) return 'clear';
  if (!(revealSlot in coverage.obscured)) return 'wait';
  return coverage.obscured[revealSlot] ? 'act' : 'clear';
};

export type SlotGeometryContextValue = {
  /** Clears the pending reveal intent. */
  clearReveal: () => void;
  coverage: SlotCoverage;
  /** Live check that measures the DOM at call time, for event handlers where `coverage` may lag. */
  isObscured: (slot: SlotId) => boolean;
  register: (slot: SlotId, element: HTMLElement | null) => void;
  /**
   * Records a one-shot intent to reveal `slot` after navigation. Pair it with
   * `resolveRevealAction(revealSlot, coverage)` in an effect to release whatever covers the slot
   * once it has been measured.
   */
  requestReveal: (slot: SlotId) => void;
  /** Slot pending reveal, or `undefined`. Resolve it with `resolveRevealAction`. */
  revealSlot: SlotId | undefined;
};

const noopContextValue: SlotGeometryContextValue = {
  clearReveal: () => undefined,
  coverage: { obscured: {} },
  isObscured: () => false,
  register: () => undefined,
  requestReveal: () => undefined,
  revealSlot: undefined,
};

const SlotGeometryContext = createContext<SlotGeometryContextValue>(noopContextValue);

const intersectionArea = (a: DOMRect, b: DOMRect) => {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
};

/**
 * @internal Exported for unit tests. A target is obscured when its box is under `MIN_VISIBLE_AREA`
 * or another element covers at least `COVER_THRESHOLD` of it.
 */
export const measureObscured = (target: HTMLElement, others: HTMLElement[]) => {
  const rect = target.getBoundingClientRect();
  const area = rect.width * rect.height;
  if (area < MIN_VISIBLE_AREA) return true;
  let maxCoveredFraction = 0;
  for (const other of others) {
    const fraction = intersectionArea(rect, other.getBoundingClientRect()) / area;
    if (fraction > maxCoveredFraction) maxCoveredFraction = fraction;
  }
  return maxCoveredFraction >= COVER_THRESHOLD;
};

const coverageChanged = (previous: SlotCoverage, next: Record<SlotId, boolean>) => {
  const keys = new Set([...Object.keys(previous.obscured), ...Object.keys(next)]);
  for (const key of keys) {
    if (previous.obscured[key] !== next[key]) return true;
  }
  return false;
};

export const SlotGeometryProvider = ({ children }: PropsWithChildren) => {
  const elementsRef = useRef<Map<SlotId, HTMLElement>>(new Map());
  const observerRef = useRef<ResizeObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  const [coverage, setCoverage] = useState<SlotCoverage>({ obscured: {} });
  // One-shot reveal intent, scoped to this provider instance.
  const [revealSlot, setRevealSlot] = useState<SlotId | undefined>(undefined);

  const requestReveal = useCallback((slot: SlotId) => setRevealSlot(slot), []);
  const clearReveal = useCallback(() => setRevealSlot(undefined), []);

  const othersOf = (slot: SlotId) =>
    [...elementsRef.current.entries()]
      .filter(([id]) => id !== slot)
      .map(([, element]) => element);

  const isObscured = useCallback((slot: SlotId) => {
    const element = elementsRef.current.get(slot);
    if (!element) return false;
    return measureObscured(element, othersOf(slot));
  }, []);

  const recompute = useCallback(() => {
    const next: Record<SlotId, boolean> = {};
    for (const [slot, element] of elementsRef.current.entries()) {
      next[slot] = measureObscured(element, othersOf(slot));
    }
    setCoverage((previous) =>
      coverageChanged(previous, next) ? { obscured: next } : previous,
    );
  }, []);

  // Coalesces bursts of ResizeObserver/resize callbacks into one measurement per frame. This also
  // avoids the "ResizeObserver loop" warning and feedback churn: `recompute` only sets state when
  // an obscured flag flips.
  const scheduleRecompute = useCallback(() => {
    if (typeof requestAnimationFrame === 'undefined') {
      recompute();
      return;
    }
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      recompute();
    });
  }, [recompute]);

  const register = useCallback(
    (slot: SlotId, element: HTMLElement | null) => {
      const elements = elementsRef.current;
      const previous = elements.get(slot);
      if (previous && previous !== element) observerRef.current?.unobserve(previous);

      if (element) {
        elements.set(slot, element);
        observerRef.current?.observe(element);
      } else {
        elements.delete(slot);
      }
      scheduleRecompute();
    },
    [scheduleRecompute],
  );

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => scheduleRecompute());
    observerRef.current = observer;
    // Ref callbacks fire during commit (before this passive effect), so pick up anything that
    // registered before the observer existed.
    for (const element of elementsRef.current.values()) observer.observe(element);

    const onResize = () => scheduleRecompute();
    window.addEventListener('resize', onResize);
    scheduleRecompute();

    return () => {
      observer.disconnect();
      observerRef.current = null;
      window.removeEventListener('resize', onResize);
      if (rafRef.current !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [scheduleRecompute]);

  const value: SlotGeometryContextValue = {
    clearReveal,
    coverage,
    isObscured,
    register,
    requestReveal,
    revealSlot,
  };

  return (
    <SlotGeometryContext.Provider value={value}>{children}</SlotGeometryContext.Provider>
  );
};

export const useSlotGeometry = () => useContext(SlotGeometryContext);

/** Returns a stable callback ref that registers and unregisters the element backing `slot`. */
export const useRegisterSlotGeometry = (slot: SlotId) => {
  const { register } = useSlotGeometry();
  return useCallback(
    (element: HTMLElement | null) => register(slot, element),
    [register, slot],
  );
};
