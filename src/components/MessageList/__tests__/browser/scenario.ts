import type { Mounted, MountOptions } from './harness';
import {
  mountList,
  readGeometry,
  readRenderedItems,
  sampleFrames,
  settle,
  takeScrollExpectation,
  wait,
} from './harness';
import type { ScrollExpectation } from './harness';
import { RUNTIME } from './trace';

/**
 * After `scrollToIndex` (the initial `initialTopMostItemIndex` scroll included), Virtuoso re-scrolls
 * to the same target whenever item sizes change for a while (v2.19: about 1.2s), so a user scroll
 * within that window is undone. Steps that test something else start after it.
 */
export const SCROLL_TARGET_RETRY_WINDOW_MS = 1300;
import { expectSettledInvariants } from './invariants';
import type { Checkpoint } from './trace';
import { createTrace, summarizeFrames } from './trace';

export type StepOptions = {
  /** Samples every frame while the step runs, tracking where this message sits. */
  anchorId?: string;
  sample?: boolean;
  /** Skips the settled-state invariants, for a step whose end state is not settled by design. */
  skipInvariants?: boolean;
  settle?: Parameters<typeof settle>[1];
  /**
   * The step runs on wall-clock timers (a burst, a stream), so how many renders it took and where an
   * animation stood when sampling stopped vary between runs. Only its settled state is compared.
   */
  timingDependent?: boolean;
};

export type ScenarioContext = {
  mounted: Mounted;
  /** Runs `action`, waits for the list to settle, and records a checkpoint. */
  step: (
    label: string,
    action: () => unknown,
    options?: StepOptions,
  ) => Promise<Checkpoint>;
  checkpoint: (label: string) => Checkpoint;
  /** Invariant failures so far, as messages. */
  violations: string[];
};

/** Pixels a scroll expectation may be off by: sub-pixel layout and rounding. */
const SCROLL_TOLERANCE_PX = 2;

const checkScrollExpectation = (
  mounted: Mounted,
  point: Checkpoint,
  expectation: ScrollExpectation | null,
  violations: string[],
  knownDeviations: string[],
) => {
  if (!expectation) return;
  if (expectation.kind === 'bottom') {
    // The end of an older window loads the next newer page below it, and the reader then stays
    // put above it: that step passes. Otherwise the scroll must end at the end, in an older window
    // too, where ending short of it loads nothing and leaves the reader to scroll again.
    const loadedNewer = point.requests.some(
      (request) => !!(request as { messages?: { id_gt?: string } }).messages?.id_gt,
    );
    if (loadedNewer) return;
    const distance = readGeometry(mounted.frame)?.distanceFromBottom ?? 0;
    if (distance > SCROLL_TOLERANCE_PX) {
      const where = mounted.channel.messagePaginator.hasMoreHead
        ? 'the end of an older window, loading no newer page,'
        : 'the bottom';
      violations.push(
        `${point.label}: ${Math.round(distance)}px short of ${where} after scrolling to it`,
      );
    }
    return;
  }
  const anchor = readRenderedItems(mounted.frame).find(
    (item) => item.id === expectation.anchorId,
  );
  // Scrolled out of the rendered window: nothing to compare.
  if (!anchor) return;
  const error = anchor.top - expectation.expectedTop;
  // Known in both react-virtuoso 2 and 4, intermittently: messages scrolled into view that measure
  // other than estimated can move the content by up to the height the list gained or lost, when the
  // runtime misses compensating it. Recorded and compared (the comparison fails if v4 shows more of
  // them than v2), not failed on.
  const heightChange =
    (readGeometry(mounted.frame)?.scrollHeight ?? 0) - expectation.scrollHeightBefore;
  if (
    Math.abs(error) > SCROLL_TOLERANCE_PX &&
    Math.sign(error) === Math.sign(heightChange) &&
    Math.abs(error) <= Math.abs(heightChange) + SCROLL_TOLERANCE_PX
  ) {
    knownDeviations.push(
      `${point.label}: content moved ${Math.round(error)}px with messages measuring ${Math.round(heightChange)}px off their estimate`,
    );
    return;
  }
  if (Math.abs(error) > SCROLL_TOLERANCE_PX) {
    violations.push(
      `${point.label}: content moved ${Math.round(error)}px more than the ${Math.round(expectation.applied)}px scrolled (anchor ${expectation.anchorId})`,
    );
  }
};

const runInvariants = (mounted: Mounted, point: Checkpoint, violations: string[]) => {
  try {
    expectSettledInvariants(mounted.frame, point);
  } catch (error) {
    violations.push(`${point.label}: ${(error as Error).message.split('\n')[0]}`);
  }
};

/**
 * Mounts the list, records the scenario as a trace of settled checkpoints, checks the settled-state
 * invariants after every step, and writes the trace for the cross-runtime comparison. Invariant
 * failures are collected rather than thrown, so the trace is written either way; the test fails at
 * the end when any were found.
 */
export const runScenario = async (
  name: string,
  options: MountOptions,
  body: (context: ScenarioContext) => Promise<void> | void,
  {
    allowViolations = false,
    quietAfterMountMs = SCROLL_TARGET_RETRY_WINDOW_MS,
  }: { allowViolations?: boolean; quietAfterMountMs?: number } = {},
) => {
  const mounted = await mountList(options);
  const trace = createTrace(name, mounted);
  const violations: string[] = [];
  const knownDeviations: string[] = [];

  await settle(mounted.frame);
  // Lets the initial scroll finish retrying (see SCROLL_TARGET_RETRY_WINDOW_MS) so steps act on a
  // list at rest; B-26 covers acting inside that window.
  await wait(quietAfterMountMs);
  await settle(mounted.frame);
  runInvariants(mounted, trace.checkpoint('mounted'), violations);

  const step: ScenarioContext['step'] = async (label, action, stepOptions = {}) => {
    // An expectation left by a scroll outside a step does not belong to this one.
    takeScrollExpectation();
    let frames;
    if (stepOptions.sample || stepOptions.anchorId) {
      const samples = await sampleFrames(mounted.frame, action, {
        anchorId: stepOptions.anchorId,
      });
      frames = summarizeFrames(samples);
    } else {
      await action();
    }
    await settle(mounted.frame, stepOptions.settle);
    const point = trace.checkpoint(label, frames);
    if (stepOptions.timingDependent) point.timingDependent = true;
    const expectation = takeScrollExpectation();
    if (!stepOptions.skipInvariants) {
      runInvariants(mounted, point, violations);
      checkScrollExpectation(mounted, point, expectation, violations, knownDeviations);
    }
    return point;
  };

  try {
    await body({
      checkpoint: (label) => trace.checkpoint(label),
      mounted,
      step,
      violations,
    });
  } finally {
    await trace.save({ knownDeviations, violations });
  }
  // The v2 runtime is the reference: its defects are recorded for the comparison, not failed on.
  if (!allowViolations && RUNTIME !== 'browser-v2') {
    expect(violations, 'invariant violations').toEqual([]);
  }
  return { mounted, trace, violations };
};
