import { renderHook } from '@testing-library/react';

import { useStickToBottomOnGrowth } from '../useStickToBottomOnGrowth';

// jsdom has no layout: the scroller's geometry is set by hand.
const makeScroller = ({
  clientHeight = 500,
  scrollHeight = 2000,
  scrollTop = 1500,
} = {}) => {
  const scroller = document.createElement('div');
  scroller.setAttribute('data-virtuoso-scroller', 'true');
  let height = scrollHeight;
  Object.defineProperty(scroller, 'clientHeight', {
    configurable: true,
    value: clientHeight,
  });
  Object.defineProperty(scroller, 'scrollHeight', {
    configurable: true,
    get: () => height,
  });
  scroller.scrollTop = scrollTop;
  return {
    grow: (by: number) => {
      height += by;
    },
    scroller,
  };
};

const flushFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const setup = (
  scroller: HTMLElement | Window | null,
  { enabled = true, followNewItems = true, itemCount = 10, threshold = 50 } = {},
) =>
  renderHook((props) => useStickToBottomOnGrowth(props), {
    initialProps: { enabled, followNewItems, itemCount, scroller, threshold },
  });

describe('useStickToBottomOnGrowth', () => {
  it('keeps a list at its bottom while its content grows', async () => {
    const { grow, scroller } = makeScroller();
    const { result } = setup(scroller);
    result.current(2000);
    grow(300);
    result.current(2300);
    await flushFrame();
    expect(scroller.scrollTop).toBe(2300);
  });

  it('leaves a list the reader scrolled up in place', async () => {
    const { grow, scroller } = makeScroller();
    const { result } = setup(scroller);
    result.current(2000);
    scroller.scrollTop = 800;
    scroller.dispatchEvent(new Event('scroll'));
    grow(300);
    result.current(2300);
    await flushFrame();
    expect(scroller.scrollTop).toBe(800);
  });

  it('reads the position scrolled to before a later scroll listener grows the list', async () => {
    // Virtuoso's own scroll listener, registered first, renders the newly revealed items at once.
    const { grow, scroller } = makeScroller({ scrollTop: 800 });
    scroller.addEventListener('scroll', () => grow(300));
    const { result } = setup(scroller);
    result.current(2000);
    scroller.scrollTop = 1500;
    scroller.dispatchEvent(new Event('scroll'));
    result.current(2300);
    await flushFrame();
    expect(scroller.scrollTop).toBe(2300);
  });

  it('counts a position within the threshold as the bottom', async () => {
    const { grow, scroller } = makeScroller({ scrollTop: 1460 });
    const { result } = setup(scroller, { threshold: 50 });
    result.current(2000);
    grow(200);
    result.current(2200);
    await flushFrame();
    expect(scroller.scrollTop).toBe(2200);
  });

  it('does nothing while disabled', async () => {
    const { grow, scroller } = makeScroller();
    const { result } = setup(scroller, { enabled: false });
    result.current(2000);
    grow(300);
    result.current(2300);
    await flushFrame();
    expect(scroller.scrollTop).toBe(1500);
  });

  it('with new items not followed, keeps still for new items but not for growth', async () => {
    const { grow, scroller } = makeScroller();
    const { rerender, result } = setup(scroller, { followNewItems: false });
    result.current(2000);
    await flushFrame();
    const settled = scroller.scrollTop;

    // A new message arrives: the list must not move.
    rerender({
      enabled: true,
      followNewItems: false,
      itemCount: 11,
      scroller,
      threshold: 50,
    });
    grow(100);
    result.current(2100);
    await flushFrame();
    expect(scroller.scrollTop).toBe(settled);

    // A message already shown grows (an image loads): the reader stays at the bottom.
    scroller.scrollTop = 1600;
    scroller.dispatchEvent(new Event('scroll'));
    grow(200);
    result.current(2300);
    await flushFrame();
    expect(scroller.scrollTop).toBe(2300);
  });

  it('does not undo a scroll made between the growth and its pin', async () => {
    const { grow, scroller } = makeScroller();
    const { result } = setup(scroller);
    result.current(2000);
    await flushFrame();
    grow(300);
    result.current(2300);
    // The reader scrolls up before the next frame, ahead of the scroll event.
    scroller.scrollTop = 0;
    await flushFrame();
    expect(scroller.scrollTop).toBe(0);
  });

  it('with new items not followed, keeps still while a new item measures in', async () => {
    const { grow, scroller } = makeScroller();
    const { rerender, result } = setup(scroller, { followNewItems: false });
    result.current(2000);
    await flushFrame();
    const settled = scroller.scrollTop;
    rerender({
      enabled: true,
      followNewItems: false,
      itemCount: 11,
      scroller,
      threshold: 50,
    });
    // Reported once at its estimated height, then again once measured, with no new item between.
    grow(50);
    result.current(2050);
    grow(250);
    result.current(2300);
    await flushFrame();
    expect(scroller.scrollTop).toBe(settled);
  });

  it('with new items not followed, still pins when the reader scrolls to the bottom later', async () => {
    const { grow, scroller } = makeScroller();
    const { rerender, result } = setup(scroller, { followNewItems: false });
    result.current(2000);
    await flushFrame();
    // A message arrives (not followed) and measures in; the list keeps still.
    rerender({
      enabled: true,
      followNewItems: false,
      itemCount: 11,
      scroller,
      threshold: 50,
    });
    grow(100);
    result.current(2100);
    await flushFrame();
    // Later the reader scrolls to the bottom, and what it reveals measures taller.
    scroller.scrollTop = 1600;
    scroller.dispatchEvent(new Event('scroll'));
    grow(200);
    result.current(2300);
    await flushFrame();
    expect(scroller.scrollTop).toBe(2300);
  });

  it('stays at the bottom when content shrinks and the offset is compensated twice', async () => {
    const { grow, scroller } = makeScroller();
    const { result } = setup(scroller);
    result.current(2000);
    await flushFrame();
    // The revealed messages measure 300px shorter: the browser clamps the offset, then the list's
    // own compensation subtracts the 300px again.
    grow(-300);
    scroller.scrollTop = 1200;
    result.current(1700);
    scroller.scrollTop = 900;
    await flushFrame();
    expect(scroller.scrollTop).toBe(1700);
  });

  it('keeps the bottom when the list compensates a growth above the viewport first', async () => {
    const { grow, scroller } = makeScroller();
    const { result } = setup(scroller, { threshold: 36 });
    result.current(2000);
    scroller.dispatchEvent(new Event('scroll'));
    await flushFrame();
    // A message above the viewport grows by 120px; the list shifts the offset by 72px to keep it in
    // place (a scroll event, 48px short now), and only then reports the new height.
    grow(120);
    scroller.scrollTop = 1572;
    scroller.dispatchEvent(new Event('scroll'));
    result.current(2120);
    await flushFrame();
    expect(scroller.scrollTop).toBe(2120);
  });

  it('does not chase the bottom once the reader scrolled away after a shrink', async () => {
    const { grow, scroller } = makeScroller();
    const { result } = setup(scroller);
    result.current(2000);
    await flushFrame();
    grow(-100);
    result.current(1900);
    scroller.scrollTop = 200;
    await flushFrame();
    expect(scroller.scrollTop).toBe(200);
  });

  it('leaves a window scroller alone', () => {
    const { result } = setup(window);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    result.current(2000);
    result.current(2300);
    expect(scrollTo).not.toHaveBeenCalled();
    scrollTo.mockRestore();
  });
});
