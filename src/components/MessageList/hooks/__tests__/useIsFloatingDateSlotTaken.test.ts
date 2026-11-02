import { act, renderHook } from '@testing-library/react';

import { useIsFloatingDateSlotTaken } from '../useIsFloatingDateSlotTaken';

vi.mock('lodash.throttle', () => ({
  default: <T extends (...args: never[]) => void>(fn: T) =>
    Object.assign((...args: Parameters<T>) => fn(...args), { cancel: vi.fn() }),
}));

const mockRect = (element: HTMLElement, top: number, bottom: number) =>
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    bottom,
    height: bottom - top,
    left: 0,
    right: 0,
    toJSON: () => ({}),
    top,
    width: 0,
    x: 0,
    y: top,
  });

// The scroller's top edge is at 100px, and the separator is 20px tall.
const makeScroller = (separatorTop: number) => {
  const scroller = document.createElement('div');
  mockRect(scroller, 100, 500);

  const separator = document.createElement('div');
  separator.className = 'str-chat__date-separator';
  const separatorRect = mockRect(separator, separatorTop, separatorTop + 20);
  scroller.appendChild(separator);

  return { scroller, separatorRect };
};

describe('useIsFloatingDateSlotTaken', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is true while an inline separator overlaps the floating spot', () => {
    const { scroller } = makeScroller(110);
    const { result } = renderHook(() => useIsFloatingDateSlotTaken(scroller));

    expect(result.current).toBe(true);
  });

  it('is false while inline separators are above or below the floating spot', () => {
    const { scroller: above } = makeScroller(80);
    const { scroller: below } = makeScroller(120);

    expect(renderHook(() => useIsFloatingDateSlotTaken(above)).result.current).toBe(
      false,
    );
    expect(renderHook(() => useIsFloatingDateSlotTaken(below)).result.current).toBe(
      false,
    );
  });

  it('ignores the floating separator itself', () => {
    const { scroller, separatorRect } = makeScroller(200);
    separatorRect.mockRestore();
    const floating = document.createElement('div');
    floating.className = 'str-chat__date-separator str-chat__date-separator--floating';
    mockRect(floating, 100, 120);
    scroller.appendChild(floating);

    const { result } = renderHook(() => useIsFloatingDateSlotTaken(scroller));

    expect(result.current).toBe(false);
  });

  it('re-checks on scroll', () => {
    const { scroller, separatorRect } = makeScroller(150);
    const { result } = renderHook(() => useIsFloatingDateSlotTaken(scroller));
    expect(result.current).toBe(false);

    separatorRect.mockReturnValue({
      bottom: 125,
      height: 20,
      left: 0,
      right: 0,
      toJSON: () => ({}),
      top: 105,
      width: 0,
      x: 0,
      y: 105,
    });
    act(() => {
      scroller.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);
  });

  it('is false for a window scroller or without one', () => {
    expect(renderHook(() => useIsFloatingDateSlotTaken(window)).result.current).toBe(
      false,
    );
    expect(renderHook(() => useIsFloatingDateSlotTaken(null)).result.current).toBe(false);
  });
});
