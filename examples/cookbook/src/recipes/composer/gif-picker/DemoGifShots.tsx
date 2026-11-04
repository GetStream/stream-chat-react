import { useEffect } from 'react';

/**
 * For the screenshots only, not part of the recipe. In the channel `?channel=`, without sending
 * anything: `?gif=<text>` opens the GIF picker and types the text into its field, and
 * `&pick=<title>` then clicks the result with that title.
 */

type Timers = Set<ReturnType<typeof setInterval>>;

/** Resolves with the element once `find` returns it. The polling interval stays in `timers` until then. */
const waitFor = <T extends Element>(find: () => T | null | undefined, timers: Timers) =>
  new Promise<T>((resolve) => {
    const timer = setInterval(() => {
      const element = find();
      if (!element) return;
      clearInterval(timer);
      timers.delete(timer);
      resolve(element);
    }, 200);
    timers.add(timer);
  });

export const DemoGifShots = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const text = params.get('gif');
    const pick = params.get('pick');
    if (!params.get('channel') || text === null) return;
    let cancelled = false;
    const timers: Timers = new Set();

    void (async () => {
      // Waits for the channel's messages, so the composer has finished setting up.
      await waitFor(
        () => document.querySelector('.str-chat__channel .str-chat__li'),
        timers,
      );
      const button = await waitFor(
        () =>
          document.querySelector<HTMLButtonElement>(
            '.str-chat__channel .cookbook-gif-button',
          ),
        timers,
      );
      if (cancelled) return;
      button.click();
      const input = await waitFor(
        () => document.querySelector<HTMLInputElement>('.cookbook-gif-picker__input'),
        timers,
      );
      if (cancelled) return;
      // Sets the value the way typing does, so React's onChange runs.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
        input,
        text,
      );
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (!pick) return;
      const tile = await waitFor(
        () =>
          document.querySelector<HTMLButtonElement>(
            `.cookbook-gif-picker__tile[aria-label="${CSS.escape(pick)}"]`,
          ),
        timers,
      );
      if (!cancelled) tile.click();
    })();

    return () => {
      cancelled = true;
      timers.forEach((timer) => clearInterval(timer));
      timers.clear();
    };
  }, []);

  return null;
};
