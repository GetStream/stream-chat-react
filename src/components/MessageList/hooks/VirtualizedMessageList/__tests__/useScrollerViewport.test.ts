import { act, renderHook } from '@testing-library/react';

import { useScrollerViewport } from '../useScrollerViewport';

// The thresholds and the true-bottom check are only meaningful once something has been measured.
// Before that the hook deliberately reports the slack a full-height list always had.
const UNMEASURED_THRESHOLD = 100;

describe('useScrollerViewport', () => {
  it('reports the full-height defaults until a scroller arrives', () => {
    const { result } = renderHook(() => useScrollerViewport());

    expect(result.current.threshold).toBe(UNMEASURED_THRESHOLD);
    expect(result.current.isAtTrueBottom).toBe(true);
  });

  it('measures the element it is given', () => {
    const scroller = document.createElement('div');
    Object.defineProperty(scroller, 'clientHeight', { value: 300 });
    document.body.appendChild(scroller);

    const { result } = renderHook(() => useScrollerViewport());
    act(() => {
      result.current.handleScrollerRef(scroller);
    });

    expect(result.current.threshold).toBe(30);

    document.body.removeChild(scroller);
  });

  // The gate that gurads mark-read has to agree with the threshold that decides whether a
  // jump-to-latest control is shown. If it were stricter there would be a band where the UI
  // claims the list is at the bottom while the channel silently refuses to go read.
  describe.each([
    [300, 30],
    [200, 20],
    [1200, 100],
  ])('viewport %ipx (threshold %ipx)', (viewportHeight, threshold) => {
    const mount = (distanceFromBottom: number) => {
      const scroller = document.createElement('div');
      Object.defineProperty(scroller, 'clientHeight', { value: viewportHeight });
      Object.defineProperty(scroller, 'scrollHeight', { value: viewportHeight + 5000 });
      scroller.scrollTop = 5000 - distanceFromBottom;
      document.body.appendChild(scroller);

      const { result } = renderHook(() => useScrollerViewport());
      act(() => {
        result.current.handleScrollerRef(scroller);
      });
      document.body.removeChild(scroller);
      return result;
    };

    it('is at the bottom just inside the threshold', () => {
      const result = mount(threshold - 1);
      expect(result.current.threshold).toBe(threshold);
      expect(result.current.isAtTrueBottom).toBe(true);
    });

    it('is not at the bottom just outside the threshold', () => {
      const result = mount(threshold + 1);
      expect(result.current.isAtTrueBottom).toBe(false);
    });
  });

  // With `useWindowScroll` Virtuoso hands back the window rather than an element. Discarding it
  // would leave the list unmeasured, the thresholds at their full-height defaults, and the
  // true-bottom check answering "yes" forever.
  it('measures the document when the list scrolls the window', () => {
    const measured = (document.scrollingElement ??
      document.documentElement) as HTMLElement;
    Object.defineProperty(measured, 'clientHeight', {
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useScrollerViewport());
    act(() => {
      result.current.handleScrollerRef(window);
    });

    expect(result.current.threshold).toBe(50);
  });
});
