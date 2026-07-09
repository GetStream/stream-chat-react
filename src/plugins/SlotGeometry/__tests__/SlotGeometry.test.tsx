import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { measureObscured, SlotGeometryProvider, useSlotGeometry } from '../SlotGeometry';
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
});
