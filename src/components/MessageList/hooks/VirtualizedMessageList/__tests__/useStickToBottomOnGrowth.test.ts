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
  { followNewItems = true, itemCount = 10, threshold = 50 } = {},
) =>
  renderHook((props) => useStickToBottomOnGrowth(props), {
    initialProps: { followNewItems, itemCount, scroller, threshold },
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

  it('in an older window, reaches the end on growth but does not follow the newer page', async () => {
    // Scrolled to the end of an older window, the revealed messages measure taller: the reader is
    // kept at the end, which is what loads the next newer page. That page then arrives below the
    // reader (the last one turns following back on), and the list must not follow it.
    const { grow, scroller } = makeScroller();
    const { rerender, result } = setup(scroller, { followNewItems: false });
    result.current(2000);
    await flushFrame();
    grow(300);
    result.current(2300);
    await flushFrame();
    expect(scroller.scrollTop).toBe(2300);
    rerender({ followNewItems: true, itemCount: 30, scroller, threshold: 50 });
    grow(1500);
    result.current(3800);
    await flushFrame();
    expect(scroller.scrollTop).toBe(2300);
  });

  it('with new items not followed, keeps still for new items but not for growth', async () => {
    const { grow, scroller } = makeScroller();
    const { rerender, result } = setup(scroller, { followNewItems: false });
    result.current(2000);
    await flushFrame();
    const settled = scroller.scrollTop;

    // A new message arrives: the list must not move.
    rerender({
      followNewItems: false,
      itemCount: 11,
      scroller,
      threshold: 50,
    });
    grow(100);
    result.current(2100);
    await flushFrame();
    expect(scroller.scrollTop).toBe(settled);

    // The reader scrolls to the bottom, then a message already shown grows (an image loads): the
    // reader stays at the bottom.
    scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
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
      followNewItems: false,
      itemCount: 11,
      scroller,
      threshold: 50,
    });
    grow(100);
    result.current(2100);
    await flushFrame();
    // Later the reader scrolls to the bottom, and what it reveals measures taller.
    scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
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

  describe('with new items not followed', () => {
    const arrive = (
      rerender: (props: Parameters<typeof useStickToBottomOnGrowth>[0]) => void,
      scroller: HTMLElement,
      itemCount = 11,
    ) =>
      rerender({
        followNewItems: false,
        itemCount,
        scroller,
        threshold: 50,
      });

    it("keeps still when the list's own compensating scroll comes between", async () => {
      // A new message arrives; the list compensates a growth above the viewport (a scroll event in
      // the direction of the growth, no further), then the message measures shorter than estimated.
      // The compensation is no reader scroll: the list must not be pinned (pulling the reader).
      const { grow, scroller } = makeScroller();
      const { rerender, result } = setup(scroller, { followNewItems: false });
      result.current(2000);
      await flushFrame();
      arrive(rerender, scroller);
      grow(120);
      result.current(2120);
      scroller.scrollTop = 1560;
      scroller.dispatchEvent(new Event('scroll'));
      grow(-76);
      result.current(2044);
      await flushFrame();
      expect(scroller.scrollTop).toBe(1560);
    });

    it('lets the reader take over with input, and then keeps them at the bottom', async () => {
      const { grow, scroller } = makeScroller();
      const { rerender, result } = setup(scroller, { followNewItems: false });
      result.current(2000);
      await flushFrame();
      arrive(rerender, scroller);
      grow(100);
      result.current(2100);
      await flushFrame();
      // The reader turns the wheel at the bottom; then a message already shown grows.
      scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
      scroller.scrollTop = 1600;
      scroller.dispatchEvent(new Event('scroll'));
      grow(200);
      result.current(2300);
      await flushFrame();
      expect(scroller.scrollTop).toBe(2300);
    });

    it('keeps still when the reader clicks in the list without scrolling', async () => {
      // A click on a message action is input, but no scroll: the new message is still not followed.
      const { grow, scroller } = makeScroller();
      const { rerender, result } = setup(scroller, { followNewItems: false });
      result.current(2000);
      await flushFrame();
      arrive(rerender, scroller);
      const button = document.createElement('button');
      scroller.appendChild(button);
      button.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      grow(300);
      result.current(2300);
      await flushFrame();
      expect(scroller.scrollTop).toBe(1500);
    });

    it('drops a pin scheduled before new items arrived', async () => {
      const { grow, scroller } = makeScroller();
      const { rerender, result } = setup(scroller, { followNewItems: false });
      result.current(2000);
      await flushFrame();
      // A message already shown grows (a pin is scheduled), then a new one arrives before it runs.
      grow(100);
      result.current(2100);
      arrive(rerender, scroller);
      await flushFrame();
      expect(scroller.scrollTop).toBe(1500);
    });
  });

  it('drops a scheduled pin when the reader starts scrolling', async () => {
    // The reader scrolls up 40px before the pin runs: less than the growth could explain, but input
    // shows it is the reader.
    const { grow, scroller } = makeScroller();
    const { result } = setup(scroller);
    result.current(2000);
    await flushFrame();
    grow(100);
    result.current(2100);
    scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }));
    scroller.scrollTop = 1460;
    await flushFrame();
    expect(scroller.scrollTop).toBe(1460);
  });

  it('keeps a scroller from another window at its bottom', async () => {
    // e.g. a popout rendered through a portal: no instance of this window's HTMLElement.
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const foreign = iframe.contentDocument!.createElement('div');
    let height = 2000;
    Object.defineProperty(foreign, 'clientHeight', { configurable: true, value: 500 });
    Object.defineProperty(foreign, 'scrollHeight', {
      configurable: true,
      get: () => height,
    });
    foreign.scrollTop = 1500;
    const { result } = setup(foreign);
    result.current(2000);
    height = 2300;
    result.current(2300);
    await flushFrame();
    expect(foreign.scrollTop).toBe(2300);
    iframe.remove();
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
