import { pickOperation } from './fuzzOperations';
import type { FuzzState } from './fuzzOperations';
import { readGeometry, unmountAll, waitUntil } from './harness';
import { runScenario } from './scenario';
import { RUNTIME } from './trace';

// See VirtualizedMessageList.scroll.browser.test.tsx: the probe records the SDK ↔ Virtuoso calls.
vi.mock('react-virtuoso', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-virtuoso')>();
  const { wrapVirtuoso } = await import('./virtuosoProbe');
  return { ...actual, Virtuoso: wrapVirtuoso(actual.Virtuoso as never) };
});

afterEach(unmountAll);

declare const VIRTUOSO_TEST_FUZZ_SEEDS: string;

/** How many seeds to run: `VIRTUOSO_FUZZ_SEEDS`, 25 by default. */
const SEED_COUNT = Number(
  typeof VIRTUOSO_TEST_FUZZ_SEEDS === 'string' && VIRTUOSO_TEST_FUZZ_SEEDS
    ? VIRTUOSO_TEST_FUZZ_SEEDS
    : 25,
);
const STEPS_PER_SEED = 30;

describe('VirtualizedMessageList fuzzing', () => {
  const seeds = Array.from({ length: SEED_COUNT }, (_, i) => 1000 + i);

  it.each(seeds)(
    'seed %i keeps its invariants',
    async (seed) => {
      await runScenario(
        `F-${seed}`,
        { historySize: 300, pageSize: 40, seed },
        async ({ mounted, step, violations }) => {
          // The operations draw from their own stream, so the history a seed builds stays the same
          // when operations are added.
          const { createRng } = await import('./prng');
          const rng = createRng(seed * 7919);
          const state: FuzzState = { suppressAutoscroll: false, viewportHeight: 600 };
          for (let index = 0; index < STEPS_PER_SEED; index += 1) {
            const operation = pickOperation(rng);
            let detail = '';
            const point = await step(
              `${index} ${operation.name}`,
              async () => {
                detail = await operation.run(mounted, rng, state);
              },
              // Fuzzing looks for behavior that diverges; render cost is B-20's job.
              { settle: { timeoutMs: 6000 }, timingDependent: true },
            );
            // A jump that loads the page around its target centers the target in it, so the list is
            // at neither edge and loads no other page: one loaded above or below means the list
            // reported an edge while it was being positioned. On v2 that is its known remount race
            // (allowlisted for the comparison); on v4 it fails the seed. A jump to a message loaded
            // before shows the stretch it is in, whose edge the target may sit at: not checked.
            if (operation.name === 'jump to a message' && RUNTIME !== 'browser-v2') {
              const queries = point.requests.map(
                (request) =>
                  (
                    request as {
                      messages?: { id_around?: string; id_gt?: string; id_lt?: string };
                    }
                  ).messages,
              );
              const loadedAround = queries.some((query) => !!query?.id_around);
              const pages = queries.filter((query) => !!(query?.id_gt || query?.id_lt));
              if (loadedAround && pages.length) {
                violations.push(
                  `${point.label}: loaded ${pages.length} page(s) besides the jump's own`,
                );
              }
            }
            // Keeps the label informative in the trace without changing the comparison key.
            mounted.frame.setAttribute('data-last-operation', detail);
          }
          await waitUntil(() => !!readGeometry(mounted.frame), 1000);
        },
        // v2's known defects (blank frames on prepend) are recorded, not failed; v4 is strict.
        { allowViolations: RUNTIME === 'browser-v2' },
      );
    },
    120_000,
  );
});
