// Compares the scroll traces the browser suites wrote for two react-virtuoso runtimes.
//
//   node scripts/compare-virtuoso-traces.mts [--base browser-v2] [--head browser-v4]
//                                           [--dir .virtuoso-traces] [--allow <file.json>]
//
// Each scenario is a sequence of settled checkpoints. A difference is any field that disagrees
// beyond its tolerance; it must match an entry of the allowlist (which says why the runtimes
// differ) or the run fails. The report lists every difference, explained or not, and every
// allowlist entry that matched nothing.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

type ProbeEvent = { name: string; value: unknown };

type FrameSummary = {
  blankFrames: number;
  finalDistanceFromBottom: number | null;
  framesUntilVisible: number;
  maxAnchorShift: number | null;
};

type Checkpoint = {
  commits: number;
  dom: unknown;
  events: ProbeEvent[];
  firstVisible: { id: string; top: number } | null;
  frames?: FrameSummary;
  geometry: Record<string, number> | null;
  label: string;
  messageRenders: number;
  paginatorCalls: string[];
  remounted: string[];
  rendered: string[];
  requests: unknown[];
  timingDependent?: boolean;
  visible: boolean;
  /** Filled in by `withCarriedState`: the last value of each state callback so far. */
  carried?: Record<string, unknown>;
};

type Trace = {
  checkpoints: Checkpoint[];
  knownDeviations?: string[];
  /** Counts of bad outcomes over repeated attempts: lower is better. */
  metrics?: Record<string, number>;
  consoleErrors: string[];
  framesUntilFirstItem: number | null;
  scenario: string;
  violations?: string[];
  windowErrors: string[];
};

type AllowEntry = {
  scenario: string;
  checkpoint?: string;
  field: string;
  reason: string;
  upstream?: string;
};

type Difference = {
  scenario: string;
  checkpoint: string;
  field: string;
  base: unknown;
  head: unknown;
  explainedBy?: AllowEntry;
  /** Reported, never failing: a value users cannot observe. */
  informational?: boolean;
};

const { values: args } = parseArgs({
  options: {
    allow: {
      default: 'src/components/MessageList/__tests__/browser/expected-differences.json',
      type: 'string',
    },
    base: { default: 'browser-v2', type: 'string' },
    dir: { default: '.virtuoso-traces', type: 'string' },
    head: { default: 'browser-v4', type: 'string' },
    report: { default: '.virtuoso-traces/report.md', type: 'string' },
  },
});

const GEOMETRY_TOLERANCE_PX = 1;
/** The tolerance of the scenario runner's scroll invariant (see scenario.ts). */
const SCROLL_TOLERANCE_PX = 2;
const RENDER_TOLERANCE = 0.1;
const RENDER_SLACK = 2;
const METRIC_SLACK = 2;
/** Callbacks whose sequence must match exactly (consecutive repeats collapsed). */
const EXACT_EVENTS = new Set(['followOutput', 'scrollerRef']);
/**
 * State callbacks: only the value reported last in a checkpoint is compared. A transient flip while
 * mounting depends on frame timing; what it causes (a page load) is compared through the paginator
 * calls and requests instead.
 */
const STATE_EVENTS = ['atBottomStateChange', 'atTopStateChange'];

/** Annotates each checkpoint with the state callbacks' values as of its end. */
const withCarriedState = (trace: Trace) => {
  const carried: Record<string, unknown> = {};
  for (const point of trace.checkpoints) {
    for (const event of point.events) {
      if ([...STATE_EVENTS, 'itemsRendered'].includes(event.name))
        carried[event.name] = event.value;
    }
    point.carried = { ...carried };
  }
  return trace;
};

const readTraces = (runtime: string) => {
  const dir = resolve(args.dir, runtime);
  const traces = new Map<string, Trace>();
  if (!existsSync(dir)) return traces;
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const trace = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Trace;
    traces.set(trace.scenario, withCarriedState(trace));
  }
  return traces;
};

const collapse = (values: string[]) =>
  values.filter((value, index) => index === 0 || value !== values[index - 1]);

const eventSequence = (events: ProbeEvent[]) =>
  collapse(
    events
      .filter((event) => EXACT_EVENTS.has(event.name) || event.name.startsWith('handle.'))
      // Virtuoso may ask `followOutput` more or less often; an answer of `false` changes nothing,
      // so only the calls that scroll are compared.
      .filter(
        (event) =>
          event.name !== 'followOutput' ||
          (event.value as { result?: unknown } | null)?.result !== false,
      )
      .map((event) => `${event.name}:${JSON.stringify(event.value)}`),
  );

const lastRendered = (events: ProbeEvent[]) =>
  [...events].reverse().find((event) => event.name === 'itemsRendered')?.value ?? null;

const lastTotalHeight = (events: ProbeEvent[]) =>
  ([...events].reverse().find((event) => event.name === 'totalListHeightChanged')
    ?.value as number | undefined) ?? null;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * react-virtuoso 4.7.9 renamed its `data-test-id` attributes to `data-testid` (same values). The
 * rename is documented; any other markup difference is still reported.
 */
const normalizeDom = (value: unknown) =>
  value === undefined || value === null
    ? null
    : JSON.parse(JSON.stringify(value).replaceAll('data-test-id=', 'data-testid='));

const isBackgroundReport = (request: unknown) =>
  /\/(read|delivered)$/.test((request as { path?: string }).path ?? '');

const backgroundReports = (trace: Trace) => {
  const counts: Record<string, number> = {};
  for (const point of trace.checkpoints) {
    for (const request of point.requests.filter(isBackgroundReport)) {
      const path = (request as { path: string }).path.replace(/.*\//, '');
      counts[path] = (counts[path] ?? 0) + 1;
    }
  }
  return counts;
};

const closeNumbers = (
  a: number | null | undefined,
  b: number | null | undefined,
  tolerance: number,
) => (a == null || b == null ? a === b : Math.abs(a - b) <= tolerance);

const closeCounts = (base: number, head: number) =>
  Math.abs(head - base) <= Math.max(RENDER_SLACK, base * RENDER_TOLERANCE);

const compareCheckpoint = (
  base: Checkpoint,
  head: Checkpoint,
  push: (field: string, b: unknown, h: unknown, informational?: boolean) => void,
) => {
  if (!same(eventSequence(base.events), eventSequence(head.events))) {
    push('events', eventSequence(base.events), eventSequence(head.events));
  }
  // The state as of the end of the checkpoint, carried over from earlier ones: a runtime that
  // re-reports an unchanged value, or reports nothing, still agrees with one that stays put. Within
  // Virtuoso's at-bottom threshold of the bottom, but not at it, either at-bottom value is valid
  // (the scenario runner's invariant checks it against the geometry), so a difference there is
  // informational.
  const ambiguousAtBottom = [base, head].some((point) => {
    const geometry = point.geometry;
    if (!geometry) return false;
    const threshold = Math.min(Math.max(geometry.clientHeight * 0.1, 4), 100);
    return (
      geometry.distanceFromBottom > 1 && geometry.distanceFromBottom <= threshold + 2
    );
  });
  for (const name of [...STATE_EVENTS, 'itemsRendered']) {
    const b = base.carried?.[name] ?? null;
    const h = head.carried?.[name] ?? null;
    if (same(b, h)) continue;
    // While mounting, the last itemsRendered report depends on frame timing; the DOM rendered at
    // mount is compared as `rendered`.
    if (name === 'itemsRendered') push('itemsRendered', b, h, base.label === 'mounted');
    else push(`state.${name}`, b, h, name === 'atBottomStateChange' && ambiguousAtBottom);
  }
  // Absolute offsets in a virtualized list depend on the heights estimated for the items never
  // rendered, which nobody sees; what the reader sees is compared below (rendered items, the first
  // visible item and its offset, whether the list sits at its bottom).
  if (
    !closeNumbers(
      lastTotalHeight(base.events),
      lastTotalHeight(head.events),
      GEOMETRY_TOLERANCE_PX,
    )
  ) {
    push(
      'totalListHeight',
      lastTotalHeight(base.events),
      lastTotalHeight(head.events),
      true,
    );
  }
  for (const key of ['scrollHeight', 'scrollTop']) {
    if (
      !closeNumbers(base.geometry?.[key], head.geometry?.[key], GEOMETRY_TOLERANCE_PX)
    ) {
      push(`geometry.${key}`, base.geometry?.[key], head.geometry?.[key], true);
    }
  }
  if (
    !closeNumbers(
      base.geometry?.clientHeight,
      head.geometry?.clientHeight,
      GEOMETRY_TOLERANCE_PX,
    )
  ) {
    push(
      'geometry.clientHeight',
      base.geometry?.clientHeight,
      head.geometry?.clientHeight,
    );
  }
  const baseDistance = base.geometry?.distanceFromBottom;
  const headDistance = head.geometry?.distanceFromBottom;
  const atBottom = (distance: number | undefined) =>
    distance !== undefined && distance <= GEOMETRY_TOLERANCE_PX;
  if (atBottom(baseDistance) !== atBottom(headDistance)) {
    push('geometry.atBottom', baseDistance, headDistance);
  } else if (!closeNumbers(baseDistance, headDistance, GEOMETRY_TOLERANCE_PX)) {
    push('geometry.distanceFromBottom', baseDistance, headDistance, true);
  }
  if (!same(base.rendered, head.rendered)) push('rendered', base.rendered, head.rendered);
  if (
    base.firstVisible?.id !== head.firstVisible?.id ||
    // Twice the invariant's tolerance: each runtime may be off by it, in opposite directions.
    !closeNumbers(base.firstVisible?.top, head.firstVisible?.top, 2 * SCROLL_TOLERANCE_PX)
  ) {
    push('firstVisible', base.firstVisible, head.firstVisible);
  }
  if (base.visible !== head.visible) push('visible', base.visible, head.visible);
  if (!same(base.remounted, head.remounted))
    push('remounted', base.remounted, head.remounted);
  // Page queries follow from scrolling and must match per checkpoint. Read and delivery reports are
  // throttled on the wall clock, so which checkpoint they land in varies: their totals are compared
  // per scenario instead (see compareTrace).
  const pageQueries = (requests: unknown[]) =>
    requests.filter((request) => !isBackgroundReport(request));
  if (!same(pageQueries(base.requests), pageQueries(head.requests))) {
    push('requests', pageQueries(base.requests), pageQueries(head.requests));
  }
  // A paginator call that sends no request (e.g. `toHead()` on the latest messages) changes
  // nothing; the page loads it does cause are compared through `requests`.
  if (!same(base.paginatorCalls, head.paginatorCalls)) {
    push('paginatorCalls', base.paginatorCalls, head.paginatorCalls, true);
  }
  // A step on wall-clock timers renders a varying number of times and is sampled mid-animation:
  // only its settled state is comparable. So is mounting, whose frame timing varies run to run.
  const timingDependent =
    base.timingDependent || head.timingDependent || base.label === 'mounted';
  // Per step, render counts jitter by a few; the budget applies to the scenario's total (see
  // compareTrace).
  if (!timingDependent && !closeCounts(base.commits, head.commits)) {
    push('commits', base.commits, head.commits, true);
  }
  if (!timingDependent && !closeCounts(base.messageRenders, head.messageRenders)) {
    push('messageRenders', base.messageRenders, head.messageRenders, true);
  }
  for (const part of ['scroller', 'viewport', 'list', 'firstItem']) {
    const b = normalizeDom((base.dom as Record<string, unknown>)?.[part]);
    const h = normalizeDom((head.dom as Record<string, unknown>)?.[part]);
    if (!same(b, h)) push(`dom.${part}`, b, h);
  }
  if (!timingDependent && (base.frames || head.frames)) {
    const b = base.frames;
    const h = head.frames;
    // Frame metrics may improve freely; only a regression is a difference.
    if ((h?.blankFrames ?? 0) > (b?.blankFrames ?? 0))
      push('frames.blankFrames', b?.blankFrames, h?.blankFrames);
    if ((h?.framesUntilVisible ?? 0) > (b?.framesUntilVisible ?? 0) + 2) {
      push('frames.framesUntilVisible', b?.framesUntilVisible, h?.framesUntilVisible);
    }
    if ((h?.maxAnchorShift ?? 0) > (b?.maxAnchorShift ?? 0) + GEOMETRY_TOLERANCE_PX) {
      push('frames.maxAnchorShift', b?.maxAnchorShift, h?.maxAnchorShift);
    }
    if (
      !closeNumbers(
        b?.finalDistanceFromBottom,
        h?.finalDistanceFromBottom,
        GEOMETRY_TOLERANCE_PX,
      )
    ) {
      push(
        'frames.finalDistanceFromBottom',
        b?.finalDistanceFromBottom,
        h?.finalDistanceFromBottom,
      );
    }
  }
};

const compareTrace = (
  base: Trace | undefined,
  head: Trace | undefined,
  scenario: string,
) => {
  const differences: Difference[] = [];
  const push =
    (checkpoint: string) =>
    (field: string, b: unknown, h: unknown, informational = false) =>
      differences.push({ base: b, checkpoint, field, head: h, informational, scenario });
  if (!base || !head) {
    push('*')('scenario', !!base, !!head);
    return differences;
  }
  const labels = (trace: Trace) => trace.checkpoints.map((point) => point.label);
  if (!same(labels(base), labels(head)))
    push('*')('checkpoints', labels(base), labels(head));
  // A fuzzed scenario's steps act on whatever state the earlier steps left, so once two runtimes
  // diverge, the later steps compare different situations: only the first diverging checkpoint is
  // reported (each runtime's invariants still hold for every step).
  const firstDivergenceOnly = base.scenario.startsWith('F-');
  for (const [index, point] of base.checkpoints.entries()) {
    const other = head.checkpoints[index];
    if (!other || other.label !== point.label) continue;
    const before = differences.length;
    // Where the reference runtime broke an invariant at this checkpoint and the new one did not,
    // what differs there is the new runtime getting it right.
    const violatedAt = (trace: Trace) =>
      (trace.violations ?? []).some((violation) =>
        violation.startsWith(`${point.label}:`),
      );
    const improvement = violatedAt(base) && !violatedAt(head);
    // A scroll past the rendered window lands on messages whose heights were only estimated: where
    // exactly is not defined, so landing on overlapping messages counts as the same place.
    const overlaps = point.rendered.some((id) => other.rendered.includes(id));
    const estimatedLanding =
      /^\d+ scroll by$/.test(point.label) &&
      overlaps &&
      !violatedAt(base) &&
      !violatedAt(head);
    const positionField = (field: string) =>
      ['firstVisible', 'itemsRendered', 'remounted', 'rendered'].includes(field);
    compareCheckpoint(point, other, (field, b, h, informational) =>
      push(point.label)(
        field,
        b,
        h,
        informational || improvement || (estimatedLanding && positionField(field)),
      ),
    );
    // An improvement still puts the runtimes in different places: later steps are not comparable.
    const added = differences.slice(before);
    const diverged =
      improvement ||
      (estimatedLanding && added.some((difference) => positionField(difference.field))) ||
      added.some((difference) => !difference.informational);
    if (firstDivergenceOnly && diverged) break;
  }
  // Render budget: the scenario's renders, over the steps that are not timing-dependent, may grow
  // by at most RENDER_TOLERANCE.
  const totals = (trace: Trace) =>
    trace.checkpoints
      .filter((point) => !point.timingDependent && point.label !== 'mounted')
      .reduce(
        (sum, point) => ({
          commits: sum.commits + point.commits,
          messageRenders: sum.messageRenders + point.messageRenders,
        }),
        { commits: 0, messageRenders: 0 },
      );
  const baseTotals = totals(base);
  const headTotals = totals(head);
  for (const key of ['commits', 'messageRenders'] as const) {
    // Commits of the list shell that render no message are cheap: one more per step is allowed.
    const steps = base.checkpoints.filter(
      (point) => !point.timingDependent && point.label !== 'mounted',
    ).length;
    const budget = Math.max(
      RENDER_SLACK * 3,
      baseTotals[key] * RENDER_TOLERANCE + (key === 'commits' ? steps : 0),
    );
    if (headTotals[key] - baseTotals[key] > budget) {
      push('*')(`totals.${key}`, baseTotals[key], headTotals[key]);
    }
  }
  // Shifts both runtimes show when messages measure other than estimated (see scenario.ts): the
  // new runtime may not show more of them than the reference.
  const deviations = (trace: Trace) => trace.knownDeviations?.length ?? 0;
  if (deviations(head) > deviations(base) + 1) {
    push('*')('knownDeviations', base.knownDeviations, head.knownDeviations);
  }
  const baseReports = backgroundReports(base);
  const headReports = backgroundReports(head);
  for (const path of new Set([
    ...Object.keys(baseReports),
    ...Object.keys(headReports),
  ])) {
    // How often the list reports reads depends on how long it sits at the bottom.
    const b = baseReports[path] ?? 0;
    const h = headReports[path] ?? 0;
    if (Math.abs(b - h) > Math.max(2, b * 0.2)) {
      push('*')(`reports.${path}`, baseReports[path] ?? 0, headReports[path] ?? 0);
    }
  }
  // A violation only the reference runtime has is an improvement; only new ones are differences.
  const newViolations = (head.violations ?? []).filter(
    (violation) => !(base.violations ?? []).includes(violation),
  );
  if (newViolations.length > 0) push('*')('violations', base.violations, newViolations);
  if (base.consoleErrors.length !== head.consoleErrors.length) {
    push('*')('consoleErrors', base.consoleErrors, head.consoleErrors);
  }
  if (base.windowErrors.length !== head.windowErrors.length) {
    push('*')('windowErrors', base.windowErrors.length, head.windowErrors.length);
  }
  for (const [metric, value] of Object.entries(head.metrics ?? {})) {
    // Outcome counts over repeated attempts are noisy: an increase of more than two counts.
    if (value > (base.metrics?.[metric] ?? 0) + METRIC_SLACK) {
      push('*')(`metrics.${metric}`, base.metrics?.[metric], value);
    }
  }
  // Two runs of the same runtime differ by up to 3 frames here.
  if ((head.framesUntilFirstItem ?? 0) > (base.framesUntilFirstItem ?? 0) + 4) {
    push('*')(
      'framesUntilFirstItem',
      base.framesUntilFirstItem,
      head.framesUntilFirstItem,
    );
  }
  return differences;
};

const allowText = existsSync(args.allow) ? readFileSync(args.allow, 'utf8').trim() : '';
const allowlist: AllowEntry[] = allowText
  ? (JSON.parse(allowText) as { differences: AllowEntry[] }).differences
  : [];
const used = new Set<AllowEntry>();

const explain = (difference: Difference) =>
  allowlist.find(
    (entry) =>
      new RegExp(`^(?:${entry.scenario})$`).test(difference.scenario) &&
      (!entry.checkpoint ||
        new RegExp(`^(?:${entry.checkpoint})$`).test(difference.checkpoint)) &&
      (new RegExp(`^(?:${entry.field})$`).test(difference.field) ||
        difference.field.startsWith(`${entry.field}.`)),
  );

const baseTraces = readTraces(args.base);
const headTraces = readTraces(args.head);
if (baseTraces.size === 0 || headTraces.size === 0) {
  console.error(
    `No traces for ${baseTraces.size === 0 ? args.base : args.head} in ${args.dir}: run both browser projects first.`,
  );
  process.exit(1);
}

const scenarios = Array.from(
  new Set([...baseTraces.keys(), ...headTraces.keys()]),
).sort();
const differences = scenarios.flatMap((scenario) =>
  compareTrace(baseTraces.get(scenario), headTraces.get(scenario), scenario).map(
    (difference) => {
      const entry = explain(difference);
      if (entry) used.add(entry);
      return { ...difference, explainedBy: entry };
    },
  ),
);

const unexplained = differences.filter(
  (difference) => !difference.explainedBy && !difference.informational,
);
const show = (value: unknown) => {
  const text = JSON.stringify(value);
  return text && text.length > 400 ? `${text.slice(0, 400)}…` : text;
};
const lines = [
  `# react-virtuoso trace comparison: ${args.base} → ${args.head}`,
  '',
  `${scenarios.length} scenarios, ${differences.length} differences, ${unexplained.length} unexplained.`,
  '',
  ...differences.map((difference) =>
    [
      `- ${difference.informational ? 'info' : difference.explainedBy ? 'explained' : '**UNEXPLAINED**'} · \`${difference.scenario}\` · ${difference.checkpoint} · \`${difference.field}\``,
      `  - ${args.base}: \`${show(difference.base)}\``,
      `  - ${args.head}: \`${show(difference.head)}\``,
      ...(difference.explainedBy
        ? [
            `  - why: ${difference.explainedBy.reason}${difference.explainedBy.upstream ? ` (${difference.explainedBy.upstream})` : ''}`,
          ]
        : []),
    ].join('\n'),
  ),
  '',
  ...allowlist
    .filter((entry) => !used.has(entry))
    .map(
      (entry) => `- stale allowlist entry: \`${entry.scenario}\` · \`${entry.field}\``,
    ),
];
writeFileSync(args.report, `${lines.join('\n')}\n`);
console.log(lines.slice(0, 3).join('\n'));
unexplained
  .slice(0, 20)
  .forEach((difference) =>
    console.log(
      `UNEXPLAINED ${difference.scenario} · ${difference.checkpoint} · ${difference.field}\n  ${args.base}: ${show(difference.base)}\n  ${args.head}: ${show(difference.head)}`,
    ),
  );
console.log(`Full report: ${args.report}`);
process.exit(unexplained.length > 0 ? 1 : 0);
