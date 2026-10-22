import { mark, MARKS } from './marks';

// The settle detector (WEB-PLAN.md §5.4): after a trigger (open, jump, thread open, reconnect), the
// view counts as settled when ALL of these hold:
//   1. no DOM change inside the channel or thread for QUIET_MS,
//   2. the expected marker (e.g. "[2000]") is rendered — the drained-all rule: silence alone fires
//      early when updates are sparse (SCENARIOS.md, M-SETTLE lesson of 2026-09-23),
//   3. no loading indicator or loading skeleton is showing.
// `perf:settled` is then placed at the LAST change, not at the end of the quiet second, so the
// waiting itself is never counted.

export const QUIET_MS = 1000;
const WATCHED = '.str-chat__channel, .str-chat__thread';
const LOADING = '.str-chat__loading-indicator, .str-chat__loading-channel';
const MESSAGE = '.str-chat__li, .str-chat__message';

const rendered = (text: string) =>
  [...document.querySelectorAll(MESSAGE)].some((el) => el.textContent?.includes(text));

export type SettleResult = {
  /** When the trigger happened (performance.now()). */
  trigger: number;
  /** The last change before the view went quiet, = perf:settled's startTime. */
  settled: number;
  durationMs: number;
};

export const settle = (
  trigger: number,
  expectText: string,
  { timeoutMs = 30_000 }: { timeoutMs?: number } = {},
) =>
  new Promise<SettleResult>((resolve, reject) => {
    let last = trigger;
    // Passive: the callback only records a time. Changes outside the channel/thread (channel-list
    // previews, timestamps ticking) don't count as the view changing.
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const node =
          record.target instanceof Element ? record.target : record.target.parentElement;
        if (node?.closest(WATCHED)) {
          last = performance.now();
          return;
        }
      }
    });
    observer.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    const check = () => {
      const now = performance.now();
      if (
        now - last >= QUIET_MS &&
        !document.querySelector(LOADING) &&
        rendered(expectText)
      ) {
        observer.disconnect();
        mark(MARKS.settled, last);
        resolve({ durationMs: last - trigger, settled: last, trigger });
        return;
      }
      if (now - trigger > timeoutMs) {
        observer.disconnect();
        reject(
          new Error(
            `not settled within ${timeoutMs} ms: ` +
              (rendered(expectText)
                ? 'still changing or loading'
                : `"${expectText}" never rendered`),
          ),
        );
        return;
      }
      setTimeout(check, 100);
    };
    setTimeout(check, 100);
  });
