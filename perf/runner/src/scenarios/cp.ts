import { LIVE, liveArgs } from './live-specs.ts';
import type { Page } from 'playwright';

import { live } from '../chatperf.ts';
import { requestsBetween } from '../collect.ts';
import { openNewest } from './ml-live.ts';
import { mlCid } from './ml-15.ts';
import type { RunScenario } from './run.ts';

// Composer (WEB-PLAN.md CP-01, CP-02) → M-INP: the p95 of key interactions, typed through CDP
// (browser input; step 1 Q3: in-page events are invisible to Event Timing).
//
//   CP-01          a 400-character paragraph at 8 cps (50 s) while `chatperf live ml-08` sends 5
//                  messages/s; `cp-01-control` types the same with nothing arriving
//   CP-02          "@perf-u" at 4 cps, then backspaced, ×5, in a 100-member CL-05 channel
//
// Event Timing reports only interactions of 16 ms or more; the rest count as faster than that
// (`interactionCount` says how many there were). Gate typed: the text really landed in the
// composer, and as many interactions happened as keys were pressed.

const COMPOSER = 'textarea.str-chat__message-textarea';
const PARAGRAPH =
  'Performance work is mostly about removing what nobody asked the browser to do. ' +
  'Every keystroke here should cost one small render of the composer, nothing more, ' +
  'while new messages keep arriving below. If typing feels sticky, the list is doing ' +
  'work on the main thread at the moment the key is pressed, and that is what we look for. ' +
  'Typing continues steadily for fifty seconds without ever sending.';

/** p95 of `count` interactions, of which `durations` are the ones Event Timing reported (≥ 16 ms). */
export const inpP95 = (durations: number[], count: number) => {
  const sorted = [...durations].sort((a, b) => a - b);
  const rank = Math.ceil(count * 0.95); // 1-based, over all interactions
  const unreported = count - sorted.length;
  // At or below the unreported ones: faster than Event Timing's 16 ms floor.
  return rank <= unreported ? 16 : sorted[rank - unreported - 1];
};

const typeAndRead = async (page: Page, text: string, cps: number, extraKeys = 0) => {
  const from = await page.evaluate(() => performance.now());
  const before = await page.evaluate((s) => window.__perf!.keyInteractions(s), from);
  await page.keyboard.type(text, { delay: 1000 / cps });
  await page.waitForTimeout(500);
  const after = await page.evaluate((s) => window.__perf!.keyInteractions(s), from);
  const count =
    after.interactionCount !== null && before.interactionCount !== null
      ? after.interactionCount - before.interactionCount
      : text.length + extraKeys;
  return { count, durations: after.durations };
};

const composing = (control: boolean): RunScenario => ({
  context: 'fresh',
  dataset: { reseed: 'per-batch', seed: ['seed', 'ml-01', '--yes'], verify: 'ml-01' },
  id: control ? 'cp-01-control' : 'cp-01',
  lists: true,
  measure: async ({ page, type }) => {
    await openNewest(page, mlCid(type));
    await page.click(COMPOSER);
    const text = PARAGRAPH.slice(0, 400);
    let storm: ReturnType<typeof live> | undefined;
    if (!control) {
      storm = live([
        ...liveArgs(LIVE['cp-01']),
        '--countdown',
        '3',
        '--no-isolate',
        '--channel-type',
        type,
      ]);
      if ((await storm.go) === null) throw new Error((await storm.done).output);
    }
    const typed = await typeAndRead(page, text, 8);
    const result = storm ? await storm.done : undefined;
    const value = await page.inputValue(COMPOSER);
    const gates: string[] = [];
    if (value !== text)
      gates.push(
        `typed: the composer holds ${value.length} of ${text.length} characters`,
      );
    if (typed.count < text.length) {
      gates.push(`typed: ${typed.count} interactions for ${text.length} keys`);
    }
    if (result?.finished?.discard) gates.push('live-achieved: chatperf missed its rate');
    return {
      extra: {
        interactions: typed.count,
        over16ms: typed.durations.length,
        worstMs: Math.max(0, ...typed.durations),
      },
      gates,
      value: inpP95(typed.durations, typed.count),
    };
  },
  metric: 'M-INP',
  types: ['messaging'],
  unit: 'ms',
});

export const cp01 = composing(false);
export const cp01Control = composing(true);

export const cp02: RunScenario = {
  context: 'fresh',
  dataset: { seed: ['seed', 'cl-05', '--concurrency', '4', '--yes'], verify: 'cl-05' },
  id: 'cp-02',
  lists: false,
  measure: async ({ page }) => {
    await page.evaluate(() => window.__perf!.ready());
    const cid = (await page.evaluate(() => window.__perf!.channels.listCids()))[0];
    await page.evaluate((c) => window.__perf!.openChannel(c, ''), cid);
    await page.click(COMPOSER);
    const word = '@perf-u';
    const durations: number[] = [];
    let count = 0;
    let menuSeen = 0;
    await page.evaluate(() => performance.mark('perf:window-start'));
    for (let round = 0; round < 5; round++) {
      const typed = await typeAndRead(page, word, 4);
      if (await page.locator('.str-chat__suggestion-list, [role="listbox"]').count())
        menuSeen++;
      const erased = await (async () => {
        const from = await page.evaluate(() => performance.now());
        const before = await page.evaluate(
          (s) => window.__perf!.keyInteractions(s),
          from,
        );
        for (let i = 0; i < word.length; i++) {
          await page.keyboard.press('Backspace');
          await page.waitForTimeout(250);
        }
        const after = await page.evaluate((s) => window.__perf!.keyInteractions(s), from);
        return {
          count:
            after.interactionCount !== null && before.interactionCount !== null
              ? after.interactionCount - before.interactionCount
              : word.length,
          durations: after.durations,
        };
      })();
      durations.push(...typed.durations, ...erased.durations);
      count += typed.count + erased.count;
    }
    await page.evaluate(() => performance.mark('perf:window-end'));
    const requests = await requestsBetween(page, 'perf:window-start', 'perf:window-end');
    const gates =
      menuSeen === 5
        ? []
        : [`mention-menu: the suggestions opened ${menuSeen} of 5 times`];
    return {
      extra: {
        interactions: count,
        // Server queries while typing (members/users search) vs the local member list.
        mentionQueries: requests.filter((path) => /members|users|query/.test(path))
          .length,
        over16ms: durations.length,
        worstMs: Math.max(0, ...durations),
      },
      gates,
      value: inpP95(durations, count),
    };
  },
  metric: 'M-INP',
  types: ['messaging'],
  unit: 'ms',
};
