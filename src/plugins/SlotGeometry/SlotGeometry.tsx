import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';

/**
 * Slot geometry — an opt-in module that reports which registered "slots" are visually **obscured**.
 *
 * The ChatView `LayoutController` is purely logical: slots, bindings, a `hidden` flag, history — it
 * has no idea where slots land on screen. Whether one panel visually *covers* another is a physical
 * concern owned by the app's CSS (e.g. at narrow widths a secondary panel might be laid out at full
 * width, collapsing the primary one). This module is the missing physical half:
 *
 *  - App code registers the DOM element backing each slot (`useRegisterSlotGeometry`).
 *  - It observes those elements (`ResizeObserver` + window resize) and measures real rects.
 *  - It reports which slots are currently obscured — collapsed to ~0 area, or covered by another
 *    registered slot past a threshold — with no knowledge of breakpoints or class names.
 *
 * It is opt-in (wrap a subtree in `SlotGeometryProvider`) and **detection only**: it never mutates
 * the layout. Consumers read `isObscured(slot)` and decide what to do (e.g. release a covering
 * slot). A declarative rules/auto-close layer could sit on top of this.
 *
 * Dependency direction is one-way: this observes the DOM the layout produces; it does not depend on
 * the `LayoutController`, and slot ids are plain strings, so it works with any slotted layout.
 */

/** A slot identifier. Plain string so the module is layout-agnostic (e.g. any `SlotName`). */
export type SlotId = string;

/**
 * How much of a slot another slot must overlap before it counts as "covered", as a fraction of the
 * covered slot's own area. Range `0`–`1`: `0` = any overlap at all counts, `1` = the slot must be
 * completely covered. `0.6` means another slot has to sit over **≥ 60%** of this slot's area (a
 * side-by-side neighbour that only touches an edge overlaps ~0% and does not count).
 */
const COVER_THRESHOLD = 0.6;
/**
 * Smallest rendered area, in CSS pixels² (`width × height`), at which a slot still counts as
 * visible. At or above `1` px² it can be covered/uncovered normally; **below** `1` px² — i.e. a
 * slot collapsed to (almost) nothing, `width`/`height` of 0, or `display: none` — it is treated as
 * obscured outright, with no overlap needed. (1 px² is effectively "zero"; it's a small epsilon to
 * avoid floating-point noise, not a meaningful size.)
 */
const MIN_VISIBLE_AREA = 1;

export type SlotCoverage = {
  /** slot id -> whether it is currently obscured (collapsed, or covered by another slot). */
  obscured: Record<SlotId, boolean>;
};

/** What a consumer should do with a pending "reveal this slot" intent, given current coverage. */
export type RevealAction =
  /** The target hasn't been measured yet (e.g. its view just became active) — do nothing, wait for
   *  the next coverage update. */
  | 'wait'
  /** The target is measured and obscured — reveal it (the consumer releases whatever covers it). */
  | 'act'
  /** Nothing to do (no intent, or the target is measured and already visible) — clear the intent. */
  | 'clear';

/**
 * Decide what to do about a pending reveal intent. This is the core of coverage-driven reveal: it
 * waits until the target slot has actually been measured, then tells the consumer to reveal it only
 * if it's obscured, and otherwise to settle. Pure and synchronous so it can be unit-tested and
 * called from an effect keyed on the reactive `coverage`.
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
  /** Clears a pending reveal intent (see {@link SlotGeometryContextValue.requestReveal}). */
  clearReveal: () => void;
  coverage: SlotCoverage;
  /**
   * Live, synchronous obscured check — measures the DOM at call time, so it is safe to call from
   * event handlers where the reactive `coverage` snapshot might lag a layout change.
   */
  isObscured: (slot: SlotId) => boolean;
  register: (slot: SlotId, element: HTMLElement | null) => void;
  /**
   * Record a one-shot intent to reveal `slot` after navigation. A consumer pairs this with
   * `resolveRevealAction(revealSlot, coverage)` in an effect to release whatever covers the slot
   * once it has been measured — the deferred, coverage-conditional reveal used across a view switch.
   */
  requestReveal: (slot: SlotId) => void;
  /** The slot a consumer asked to reveal, or `undefined`. Reactive; resolve with `resolveRevealAction`. */
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
 * @internal Exported for unit tests. A target is obscured when its own rendered box is ~0 area
 * (collapsed/hidden) or another element covers at least `COVER_THRESHOLD` of it.
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
  // A one-shot "reveal this slot after navigation" intent, scoped to this provider instance (no
  // module-global state). A consumer resolves it against `coverage` via `resolveRevealAction`.
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

  // Coalesce bursts of ResizeObserver/resize callbacks into one measurement per frame. This also
  // keeps us clear of the "ResizeObserver loop" warning and avoids feedback churn: recompute only
  // pushes new state when an obscured flag actually flips, which is a fixed point.
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

/** Returns a stable callback ref that registers/unregisters the element backing `slot`. */
export const useRegisterSlotGeometry = (slot: SlotId) => {
  const { register } = useSlotGeometry();
  return useCallback(
    (element: HTMLElement | null) => register(slot, element),
    [register, slot],
  );
};
