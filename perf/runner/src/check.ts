import { LIVE, liveArgs } from './scenarios/live-specs.ts';
import { launchBrowser, newIteration } from './browser.ts';
import { chatperf, live, userToken } from './chatperf.ts';
import type { ListImplementation } from './config.ts';
import { startHost } from './host.ts';
import { gesture, REST_MS, scrollerRect } from './input.ts';
import { writeRun } from './results.ts';
import { mlCid } from './scenarios/ml-15.ts';

// `perf check ml-08-oldest`: a correctness check, not a timed row (WEB-PLAN.md ML-08). On livestream
// the list holds at most 230 messages, and the prune drops the oldest as new ones arrive; React
// never pauses it (WEB-PLAN.md §13 F3). So: scroll up to the oldest *loaded* messages, run the
// ML-08 flood (300 messages, more than the cap), and record whether the message the reader was
// looking at disappears from under them. Yes = a finding for the SDK team, with the marker.

const CAP = 230;
const MAX_GESTURES = 80;
/** How often the watched message is looked up during the flood. A check, so reading is allowed. */
const SAMPLE_MS = 2000;

export type CheckOptions = {
  id: string;
  lists: ListImplementation[] | null;
  seed: boolean;
  verify: boolean;
  headless: boolean;
};

export const check = async (options: CheckOptions) => {
  if (options.id !== 'ml-08-oldest') {
    throw new Error(`no check '${options.id}' (have: ml-08-oldest)`);
  }
  const apiKey = process.env.STREAM_KEY;
  if (!apiKey) throw new Error('STREAM_KEY is not set (source your chatperf env first)');
  const typeArgs = ['--channel-type', 'livestream'];
  if (options.seed) {
    console.log('seeding ml-01 (livestream) …');
    await chatperf(['seed', 'ml-01', '--yes', ...typeArgs]);
  }
  if (options.verify) await chatperf(['verify', 'ml-01', ...typeArgs]);
  const token = await userToken();
  const cid = mlCid('livestream');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  const host = await startHost('prod', { rebuild: true });
  const browser = await launchBrowser(options.headless);
  try {
    for (const list of options.lists ?? (['standard', 'virtualized'] as const)) {
      const { context, cdp, page } = await newIteration(browser, 'chrome-desktop');
      await page.goto(
        `${host.origin}/?api_key=${apiKey}&token=${token}&user_id=qatest1&list=${list}&type=livestream`,
      );
      await page.evaluate(() => window.__perf!.ready());
      const newest = await page.evaluate(
        (c) => window.__perf!.messages.newestMarker(c),
        cid,
      );
      await page.evaluate(([c, m]) => window.__perf!.openChannel(c, m), [cid, newest]);
      const rect = await scrollerRect(page, '.str-chat__li');
      const position = () =>
        page.evaluate((c) => window.__perf!.messages.viewPosition(c), cid);

      // Up until the list holds the cap's worth (or the whole channel): the top of the view is
      // then the oldest loaded message, the first one the prune takes.
      let start = await position();
      let gestures = 0;
      while (gestures < MAX_GESTURES && start.loaded < CAP) {
        await gesture(cdp, rect, 'G-SLOW', 'up');
        await page.waitForTimeout(REST_MS);
        start = await position();
        gestures++;
        if (await page.evaluate((c) => window.__perf!.messages.oldestLoaded(c), cid))
          break;
      }
      const watched = start.top;
      if (watched === null) throw new Error('no message row at the top of the view');
      // Live runs number their messages from [9001] each time: a repeated marker can't be followed.
      if (start.markerCopies > 1) {
        throw new Error(
          `[${watched}] is loaded ${start.markerCopies}× (earlier live runs): run the check on a fresh seed`,
        );
      }
      const oldestBefore = await page.evaluate(
        (c) => window.__perf!.messages.loadedMarkers(c)[0],
        cid,
      );

      const storm = live([
        ...liveArgs(LIVE['ml-08-oldest']),
        '--countdown',
        '3',
        '--no-isolate',
        ...typeArgs,
      ]);
      await storm.go;
      const samples: Array<{
        s: number;
        loaded: boolean;
        onScreen: boolean;
        top: number | null;
      }> = [];
      const t0 = Date.now();
      let finished = false;
      void storm.done.then(() => {
        finished = true;
      });
      while (!finished) {
        const state = await page.evaluate(
          ([c, m]) => window.__perf!.messages.markerState(c, m as number),
          [cid, watched] as const,
        );
        const { top } = await position();
        samples.push({ s: Math.round((Date.now() - t0) / 100) / 10, top, ...state });
        await page.waitForTimeout(SAMPLE_MS);
      }
      const result = await storm.done;
      await page.waitForTimeout(REST_MS);
      const end = await position();
      const endState = await page.evaluate(
        ([c, m]) => window.__perf!.messages.markerState(c, m as number),
        [cid, watched] as const,
      );
      const vanished = samples.find((s) => !s.loaded || !s.onScreen) ?? null;
      const answer = endState.loaded && endState.onScreen && !vanished ? 'no' : 'yes';
      const record = {
        answer,
        end,
        endState,
        gestures,
        list,
        oldestBefore,
        samples,
        sent: result.finished?.sent ?? null,
        start,
        vanished,
        watched,
      };
      const file = writeRun(`check-ml-08-oldest-${list}-${stamp}`, record);
      console.log(
        `  ml-08-oldest ${list}: ${answer === 'yes' ? 'YES, the reader lost' : 'no, the reader kept'} ` +
          `[${String(watched).padStart(4, '0')}]` +
          (vanished
            ? ` (${vanished.loaded ? 'scrolled off screen' : 'pruned'} at ${vanished.s}s; top row then ${vanished.top})`
            : '') +
          ` — loaded ${start.loaded} → ${end.loaded}, top ${start.top} → ${end.top} → ${file}`,
      );
      await context.close();
    }
  } finally {
    await browser.close();
    host.stop();
  }
};
