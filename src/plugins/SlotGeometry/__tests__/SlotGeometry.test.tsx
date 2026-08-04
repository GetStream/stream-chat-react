import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  measureObscured,
  resolveRevealAction,
  SlotGeometryProvider,
  useSlotGeometry,
} from '../SlotGeometry';
import type { SlotGeometryContextValue } from '../SlotGeometry';

const rect = (left: number, top: number, width: number, height: number): DOMRect =>
  ({
    bottom: top + height,
    height,
    left,
    right: left + width,
    toJSON: () => ({}),
    top,
    width,
    x: left,
    y: top,
  }) as DOMRect;

const elementAt = (r: DOMRect) =>
  ({ getBoundingClientRect: () => r }) as unknown as HTMLElement;

describe('measureObscured', () => {
  it('treats a collapsed (~0 area) element as obscured regardless of others', () => {
    expect(measureObscured(elementAt(rect(0, 0, 0, 100)), [])).toBe(true);
    expect(measureObscured(elementAt(rect(0, 0, 0, 0)), [])).toBe(true);
  });

  it('is not obscured when visible with no other slots', () => {
    expect(measureObscured(elementAt(rect(0, 0, 100, 100)), [])).toBe(false);
  });

  it('is not obscured by a side-by-side neighbour (no overlap)', () => {
    const target = elementAt(rect(0, 0, 100, 100));
    const neighbour = elementAt(rect(100, 0, 100, 100));
    expect(measureObscured(target, [neighbour])).toBe(false);
  });

  it('is obscured when another slot fully covers it', () => {
    const target = elementAt(rect(0, 0, 100, 100));
    const cover = elementAt(rect(0, 0, 100, 100));
    expect(measureObscured(target, [cover])).toBe(true);
  });

  it('respects the coverage threshold (0.6)', () => {
    const target = elementAt(rect(0, 0, 100, 100));
    // Covers 50% → below threshold → not obscured.
    expect(measureObscured(target, [elementAt(rect(50, 0, 100, 100))])).toBe(false);
    // Covers 70% → above threshold → obscured.
    expect(measureObscured(target, [elementAt(rect(30, 0, 100, 100))])).toBe(true);
  });
});

describe('resolveRevealAction', () => {
  it('clears when there is no reveal intent', () => {
    expect(resolveRevealAction(undefined, { obscured: {} })).toBe('clear');
    expect(resolveRevealAction(undefined, { obscured: { main: true } })).toBe('clear');
  });

  it('waits until the target slot has been measured', () => {
    // The target's view may have only just become active; its element isn't measured yet, so we
    // must not act (or clear) prematurely — this is the cross-view (threads → channels) gate.
    expect(resolveRevealAction('main', { obscured: {} })).toBe('wait');
    expect(resolveRevealAction('main', { obscured: { other: true } })).toBe('wait');
  });

  it('acts when the measured target is obscured', () => {
    expect(resolveRevealAction('main', { obscured: { main: true } })).toBe('act');
  });

  it('clears when the measured target is already visible', () => {
    // Wide / side-by-side layout: the channel isn't covered, so we leave the thread and just
    // settle the one-shot intent.
    expect(resolveRevealAction('main', { obscured: { main: false } })).toBe('clear');
  });
});

describe('SlotGeometryProvider', () => {
  const OriginalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    globalThis.ResizeObserver = class implements ResizeObserver {
      disconnect() {}
      observe() {}
      unobserve() {}
    };
  });

  afterEach(() => {
    globalThis.ResizeObserver = OriginalResizeObserver;
    vi.restoreAllMocks();
  });

  const renderProvider = () => {
    let geometry: SlotGeometryContextValue | undefined;
    const Capture = () => {
      geometry = useSlotGeometry();
      return null;
    };
    render(
      <SlotGeometryProvider>
        <Capture />
      </SlotGeometryProvider>,
    );
    if (!geometry) throw new Error('geometry context not captured');
    return () => geometry as SlotGeometryContextValue;
  };

  it('reports a registered, collapsed slot as obscured (live check)', () => {
    const geometry = renderProvider();
    act(() => geometry().register('main', elementAt(rect(0, 0, 0, 600))));
    expect(geometry().isObscured('main')).toBe(true);
  });

  it('reports a visible registered slot as not obscured', () => {
    const geometry = renderProvider();
    act(() => geometry().register('main', elementAt(rect(0, 0, 400, 600))));
    expect(geometry().isObscured('main')).toBe(false);
  });

  it('reports a slot covered by another registered slot as obscured', () => {
    const geometry = renderProvider();
    act(() => {
      geometry().register('main', elementAt(rect(0, 0, 400, 600)));
      geometry().register('side', elementAt(rect(0, 0, 400, 600)));
    });
    expect(geometry().isObscured('main')).toBe(true);
  });

  it('returns false for unregistered / unknown slots', () => {
    const geometry = renderProvider();
    expect(geometry().isObscured('missing')).toBe(false);
    act(() => geometry().register('main', elementAt(rect(0, 0, 0, 0))));
    act(() => geometry().register('main', null));
    expect(geometry().isObscured('main')).toBe(false);
  });

  it('tracks a reveal intent (instance-scoped, no module state) and clears it', () => {
    const geometry = renderProvider();
    expect(geometry().revealSlot).toBeUndefined();

    act(() => geometry().requestReveal('main'));
    expect(geometry().revealSlot).toBe('main');

    act(() => geometry().clearReveal());
    expect(geometry().revealSlot).toBeUndefined();
  });
});
