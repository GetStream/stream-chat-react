import React, { forwardRef } from 'react';
import { act, render, renderHook } from '@testing-library/react';
import type { ListProps } from 'react-virtuoso';

import {
  ListPositioningReporterContext,
  makePositioningReportingList,
} from '../positioningList';
import { useAfterInitialLocation } from '../useAfterInitialLocation';

const flushFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

// A custom list that keeps no test ID and ignores the style it is given.
const BareList = forwardRef<HTMLDivElement, ListProps>(function BareList(
  { children },
  ref,
) {
  return (
    <section data-custom-list='' ref={ref}>
      {children}
    </section>
  );
});

describe('makePositioningReportingList', () => {
  const renderList = (
    List: ReturnType<typeof makePositioningReportingList>,
    report: (hidden: boolean) => void,
    visibility?: 'hidden',
  ) => (
    <ListPositioningReporterContext.Provider value={report}>
      <List
        context={undefined}
        data-testid='virtuoso-item-list'
        style={visibility ? { visibility } : {}}
      >
        <div>item</div>
      </List>
    </ListPositioningReporterContext.Provider>
  );

  it("reports a custom list hidden from Virtuoso's style, whatever markup it renders", () => {
    const report = vi.fn();
    const List = makePositioningReportingList(BareList as never);
    const { container, rerender, unmount } = render(renderList(List, report, 'hidden'));
    expect(container.querySelector('[data-custom-list]')).not.toBeNull();
    expect(container.querySelector('[data-testid]')).toBeNull();
    expect(report).toHaveBeenLastCalledWith(true);
    rerender(renderList(List, report));
    expect(report).toHaveBeenLastCalledWith(false);
    rerender(renderList(List, report, 'hidden'));
    unmount();
    expect(report).toHaveBeenLastCalledWith(false);
  });

  it('leaves the report to the main list: the top-item list neither reports nor clears it', () => {
    // Virtuoso renders the items pinned by `topItemCount` with the same `components.List`; that
    // list unmounting while the main one is still hidden must not report the list shown.
    const report = vi.fn();
    const List = makePositioningReportingList();
    const { unmount } = render(
      <ListPositioningReporterContext.Provider value={report}>
        <List context={undefined} data-testid='virtuoso-top-item-list' style={{}}>
          <div>pinned</div>
        </List>
      </ListPositioningReporterContext.Provider>,
    );
    unmount();
    expect(report).not.toHaveBeenCalled();
  });

  it("renders Virtuoso's own list as Virtuoso does, without the context prop", () => {
    const report = vi.fn();
    const List = makePositioningReportingList();
    const { container } = render(renderList(List, report, 'hidden'));
    const list = container.querySelector<HTMLElement>(
      '[data-testid="virtuoso-item-list"]',
    );
    expect(list?.tagName).toBe('DIV');
    expect(list?.style.visibility).toBe('hidden');
    expect(list?.hasAttribute('context')).toBe(false);
    expect(report).toHaveBeenLastCalledWith(true);
  });
});

describe('useAfterInitialLocation', () => {
  it('runs at once while the list is shown', () => {
    const hiddenRef = { current: false };
    const { result } = renderHook(() => useAfterInitialLocation(hiddenRef, 0));
    const callback = vi.fn();
    result.current(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  const withFakeTimeouts = async (body: () => Promise<void>) => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      await body();
    } finally {
      vi.useRealTimers();
    }
  };

  it('waits while the list is hidden, and runs once it is shown', () =>
    withFakeTimeouts(async () => {
      const hiddenRef = { current: true };
      const { result } = renderHook(() => useAfterInitialLocation(hiddenRef, 0));
      const callback = vi.fn();
      result.current(callback);
      await act(flushFrame);
      await act(flushFrame);
      vi.advanceTimersByTime(100);
      expect(callback).not.toHaveBeenCalled();
      hiddenRef.current = false;
      await act(flushFrame);
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    }));

  it('drops a pending callback when the list is replaced (a jump remounts it)', () =>
    withFakeTimeouts(async () => {
      const hiddenRef = { current: false };
      const { rerender, result } = renderHook(
        ({ listKey }) => useAfterInitialLocation(hiddenRef, listKey),
        { initialProps: { listKey: 0 } },
      );
      const callback = vi.fn();
      hiddenRef.current = true;
      result.current(callback);
      hiddenRef.current = false;
      await act(flushFrame);
      // The settle timeout is pending when the next jump replaces the list.
      rerender({ listKey: 1 });
      vi.advanceTimersByTime(100);
      expect(callback).not.toHaveBeenCalled();
    }));

  it('waits again when the list is hidden again by the time the callback is due', () =>
    withFakeTimeouts(async () => {
      const hiddenRef = { current: true };
      const { result } = renderHook(() => useAfterInitialLocation(hiddenRef, 0));
      const callback = vi.fn();
      result.current(callback);
      hiddenRef.current = false;
      await act(flushFrame);
      hiddenRef.current = true;
      vi.advanceTimersByTime(100);
      expect(callback).not.toHaveBeenCalled();
      hiddenRef.current = false;
      await act(flushFrame);
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    }));
});
