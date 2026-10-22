import type { CDPSession, Page } from 'playwright';

// Browser-level scroll input (WEB-SCENARIOS.md §1.4): CDP Input.synthesizeScrollGesture goes
// through the browser's input pipeline and the compositor, like a real touch or wheel scroll, and
// runs no JavaScript in the page. Verified on Chromium 148 (step 6 spike): it lands on the scroller
// and triggers the channel list's pagination to the end; touch gestures fling with momentum.

export type Gesture = 'G-FAST' | 'G-SLOW';
export type Rect = { x: number; y: number; width: number; height: number };

const PROFILES: Record<
  Gesture,
  { speed: number; fraction: number; preventFling: boolean }
> = {
  // A flick that keeps travelling after the finger lifts (momentum), then comes to rest.
  'G-FAST': { fraction: 0.9, preventFling: false, speed: 4000 },
  // A slow, controlled drag of half the list height that stops when the finger lifts.
  'G-SLOW': { fraction: 0.5, preventFling: true, speed: 800 },
};

/** Pause after each gesture: lets a fling come to rest and pagination land (SCENARIOS.md §1.4). */
export const REST_MS = 1000;

/** Locates a list's scroller BEFORE the window opens: the nearest scrollable ancestor of `rowSelector`. */
export const scrollerRect = (page: Page, rowSelector: string) =>
  page.evaluate((selector) => {
    let el = document.querySelector(selector) as HTMLElement | null;
    while (
      el &&
      !(
        el.scrollHeight > el.clientHeight + 10 &&
        /(auto|scroll)/.test(getComputedStyle(el).overflowY)
      )
    ) {
      el = el.parentElement;
    }
    if (!el) throw new Error(`no scrollable ancestor of ${selector}`);
    el.setAttribute('data-perf-scroller', '');
    const r = el.getBoundingClientRect();
    return { height: r.height, width: r.width, x: r.x, y: r.y };
  }, rowSelector);

/** One gesture. `down` moves towards the end of the list (content moves up). */
export const gesture = (
  cdp: CDPSession,
  rect: Rect,
  profile: Gesture,
  direction: 'down' | 'up',
) => {
  const { fraction, preventFling, speed } = PROFILES[profile];
  const distance = Math.round(rect.height * fraction);
  return cdp.send('Input.synthesizeScrollGesture', {
    gestureSourceType: 'touch',
    preventFling,
    speed,
    x: Math.round(rect.x + rect.width / 2),
    y: Math.round(rect.y + rect.height / 2),
    yDistance: direction === 'down' ? -distance : distance,
  });
};

/**
 * Gestures until `done()` says the target is reached. `done` is read only during the rest pause
 * between gestures, never while one is moving. Returns how many gestures it took.
 */
export const scrollUntil = async (
  page: Page,
  cdp: CDPSession,
  rect: Rect,
  profile: Gesture,
  direction: 'down' | 'up',
  done: () => Promise<boolean>,
  maxGestures = 200,
) => {
  for (let n = 1; n <= maxGestures; n++) {
    await gesture(cdp, rect, profile, direction);
    await page.waitForTimeout(REST_MS);
    if (await done()) return n;
  }
  throw new Error(`target not reached after ${maxGestures} ${profile} gestures`);
};

/** Scroll position of the marked scroller (read in a rest pause). */
export const scrollEdge = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector('[data-perf-scroller]') as HTMLElement;
    return {
      atBottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 2,
      atTop: el.scrollTop <= 1,
    };
  });
