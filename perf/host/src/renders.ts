// M-RENDERS: which rows rendered in each React commit, and which of them no event had touched
// (WEB-SCENARIOS.md §1.5). A minimal React DevTools hook, installed BEFORE React loads; React calls
// onCommitFiberRoot after every commit.
//
// Counting rule: a fiber that did work in a commit (React's PerformedWork flag) and was already
// mounted (it has an alternate) re-rendered. Fibers are grouped into rows by their `message` prop
// (message rows) or `channel` prop (channel rows), so every part of a row — MessageText,
// MessageActions, … — counts towards it, whichever component re-rendered. Component names are not
// needed for the count, so it survives minification.
//
// Never installed in the prod build: walking the tree on every commit costs time, so builds that
// count renders don't report timings, and the build that reports timings doesn't count renders.

type Fiber = {
  alternate: Fiber | null;
  child: Fiber | null;
  flags: number;
  memoizedProps: Record<string, unknown> | null;
  memoizedState: unknown;
  return: Fiber | null;
  sibling: Fiber | null;
  tag: number;
  type: unknown;
};

const PERFORMED_WORK = 1;
// React work tags (react-reconciler ReactWorkTags).
const MEMO_COMPONENT = 14;
const SIMPLE_MEMO_COMPONENT = 15;
/**
 * Fibers that run user code and so can "perform work": function (0), class (1), forwardRef (11) and
 * memo (14, 15) components. Fragments, context providers, Suspense and host nodes never set
 * PerformedWork, so treating them as components would make every child look like a render origin.
 */
const COMPONENT_TAGS = new Set([0, 1, 11, MEMO_COMPONENT, SIMPLE_MEMO_COMPONENT]);
const isComponent = (fiber: Fiber) => COMPONENT_TAGS.has(fiber.tag);

/**
 * How long an id an event touched counts as "targeted". The message paginator publishes state at
 * most every 500 ms (stateThrottleMs), so the commit that renders a touched row can come up to
 * ~500 ms after the event, and after unrelated commits in between: an id must not stop counting as
 * touched at the first commit. Twice the throttle.
 */
const TOUCH_WINDOW_MS = 1000;

export type CommitRecord = {
  commit: number;
  t: number;
  /** Events dispatched since the previous commit. */
  events: number;
  messageRows: number;
  untargetedMessageRows: number;
  channelRows: number;
  untargetedChannelRows: number;
  /** Ground truth (only with ?ground_truth=1): message UI slot renders, counted by the component itself. */
  slotRows?: number;
  untargetedSlotRows?: number;
};

/**
 * Why an untargeted row re-rendered, the way React DevTools' "why did this render" reads it:
 *   origin     the first component in the row that rendered although the component above it did
 *              not, i.e. where the render STARTED inside the row, and what triggered it there
 *              ('props' changed, 'state' (incl. store subscriptions) changed, or neither = 'context')
 *   memo       the first memo boundary in the row the render got through, and the props that
 *              differed by identity there (its comparator may compare deeper; it still let it pass)
 *   cascade    the nearest re-rendered ancestor outside the row, when the render came from above
 */
export type UntargetedReason = {
  origin: {
    component: string;
    cause: 'props' | 'state' | 'context';
    changedProps: string[];
  } | null;
  memo: { component: string; changedProps: string[] } | null;
  cascade: string | null;
};

export type RenderSummary = {
  commits: number;
  events: number;
  commitsWithEvents: number;
  messageRowsPerCommit: { median: number; max: number };
  untargetedMessageRowsPerCommit: { median: number; max: number };
  channelRowsPerCommit: { median: number; max: number };
  untargetedChannelRowsPerCommit: { median: number; max: number };
  /** Ground truth, when enabled: the same two numbers counted by the message UI slot itself. */
  slotRowsPerCommit?: { median: number; max: number };
  untargetedSlotRowsPerCommit?: { median: number; max: number };
  /** Most frequent reasons an untargeted row re-rendered, with how often. */
  reasons: Array<UntargetedReason & { count: number }>;
  /** Component names that rendered most (readable in the dev and profiling builds only). */
  topComponents: Array<[string, number]>;
  /** The first few untargeted rows in full: every fiber of the row, and the chain above it. */
  samples: RowSample[];
  perCommit: CommitRecord[];
};

const nameOf = (fiber: Fiber): string => {
  const t = fiber.type as
    | null
    | string
    | {
        displayName?: string;
        name?: string;
        type?: { displayName?: string; name?: string };
      };
  if (!t) return `#${fiber.tag}`;
  if (typeof t === 'string') return t;
  return (
    t.displayName ||
    t.name ||
    t.type?.displayName ||
    t.type?.name ||
    `anonymous#${fiber.tag}`
  );
};

const messageIdOf = (fiber: Fiber) => {
  const message = fiber.memoizedProps?.message as { id?: unknown } | undefined;
  return typeof message?.id === 'string' ? message.id : undefined;
};

const channelCidOf = (fiber: Fiber) => {
  const channel = fiber.memoizedProps?.channel as { cid?: unknown } | undefined;
  return typeof channel?.cid === 'string' ? channel.cid : undefined;
};

/**
 * The fiber objects of the previous commit's tree. When React skips an unchanged subtree it reuses
 * those exact objects, flags and all, so a fiber that rendered once keeps PerformedWork set on every
 * later commit it sits through untouched. A fiber rendered in THIS commit is always the other buffer
 * (a different object). So "rendered" = did work AND is not an object from the previous tree — the
 * same rule React DevTools uses. Without it every row that rendered once is counted again forever.
 */
let previousTree = new WeakSet<Fiber>();

const rerendered = (fiber: Fiber) =>
  fiber.alternate !== null &&
  (fiber.flags & PERFORMED_WORK) !== 0 &&
  !previousTree.has(fiber);

const rememberTree = (root: Fiber) => {
  const tree = new WeakSet<Fiber>();
  const stack: Fiber[] = [root];
  while (stack.length) {
    const fiber = stack.pop()!;
    tree.add(fiber);
    if (fiber.sibling) stack.push(fiber.sibling);
    if (fiber.child) stack.push(fiber.child);
  }
  previousTree = tree;
};

const changedProps = (fiber: Fiber) => {
  const next = fiber.memoizedProps ?? {};
  const prev = fiber.alternate?.memoizedProps ?? {};
  return [...new Set([...Object.keys(next), ...Object.keys(prev)])]
    .filter((key) => key !== 'children' && next[key] !== prev[key])
    .sort();
};

const nearestComponentAncestor = (fiber: Fiber) => {
  for (let f = fiber.return; f; f = f.return) if (isComponent(f)) return f;
  return null;
};

const explainRow = (fibers: Fiber[]): UntargetedReason => {
  let origin: UntargetedReason['origin'] = null;
  let memo: UntargetedReason['memo'] = null;
  for (const fiber of fibers) {
    const parent = nearestComponentAncestor(fiber);
    if (!origin && parent && !rerendered(parent)) {
      const props = changedProps(fiber);
      const stateChanged = fiber.memoizedState !== fiber.alternate?.memoizedState;
      origin = {
        cause: props.length ? 'props' : stateChanged ? 'state' : 'context',
        changedProps: props,
        component: nameOf(fiber),
      };
    }
    if (!memo && (fiber.tag === MEMO_COMPONENT || fiber.tag === SIMPLE_MEMO_COMPONENT)) {
      memo = { changedProps: changedProps(fiber), component: nameOf(fiber) };
    }
  }
  return {
    cascade: origin ? null : nearestRerenderedAncestorOutsideRow(fibers[0], messageIdOf),
    memo,
    origin,
  };
};

const nearestRerenderedAncestorOutsideRow = (
  fiber: Fiber,
  rowKey: (f: Fiber) => unknown,
) => {
  const key = rowKey(fiber);
  for (let f = fiber.return; f; f = f.return) {
    if (!isComponent(f)) continue;
    if (rowKey(f) === key) continue;
    if (rerendered(f)) return nameOf(f);
  }
  return null;
};

let counting = false;
let commitNo = 0;
let eventsSinceCommit = 0;
let touchedMessages = new Map<string, number>();
let touchedChannels = new Map<string, number>();
let records: CommitRecord[] = [];
let reasonCounts = new Map<string, UntargetedReason & { count: number }>();
let componentCounts = new Map<string, number>();

type FiberInfo = {
  name: string;
  tag: number;
  rendered: boolean;
  messageId?: string;
  changedProps?: string[];
};
export type RowSample = { commit: number; row: FiberInfo[]; above: FiberInfo[] };
const MAX_SAMPLES = 3;
let samples: RowSample[] = [];

const info = (fiber: Fiber, withProps = false): FiberInfo => ({
  messageId: messageIdOf(fiber),
  name: nameOf(fiber),
  rendered: rerendered(fiber),
  tag: fiber.tag,
  ...(withProps ? { changedProps: changedProps(fiber) } : {}),
});

const sampleRow = (fibers: Fiber[]) => {
  if (samples.length >= MAX_SAMPLES) return;
  const above: FiberInfo[] = [];
  for (let f = fibers[0].return; f && above.length < 10; f = f.return) {
    if (isComponent(f)) above.push(info(f));
  }
  samples.push({
    above,
    commit: commitNo,
    row: fibers.slice(0, 12).map((f) => info(f, true)),
  });
};

const countReason = (reason: UntargetedReason) => {
  const key = JSON.stringify(reason);
  const entry = reasonCounts.get(key);
  if (entry) entry.count += 1;
  else reasonCounts.set(key, { ...reason, count: 1 });
};

const onCommit = (root: { current: Fiber }) => {
  try {
    if (counting) countCommit(root);
  } finally {
    // Every commit, counting or not, so the first counted commit already has a previous tree.
    rememberTree(root.current);
  }
};

const countCommit = (root: { current: Fiber }) => {
  commitNo += 1;

  // Preorder walk, so a row's outermost fiber is seen before its descendants. Every fiber belongs to
  // the row of its nearest ancestor-or-self carrying a `message` prop (else a `channel` prop): parts
  // of a row that re-render on their own — a store subscription in MessageActions, say — carry no
  // `message` prop themselves, but are still that row's work.
  type Entry = { fiber: Fiber; message?: string; channel?: string };
  const messageRows = new Map<string, Fiber[]>();
  const channelRows = new Map<string, Fiber>();
  const stack: Entry[] = [{ fiber: root.current }];
  while (stack.length) {
    const { channel: inheritedChannel, fiber, message: inheritedMessage } = stack.pop()!;
    const message = (isComponent(fiber) && messageIdOf(fiber)) || inheritedMessage;
    const channel = message
      ? undefined
      : (isComponent(fiber) && channelCidOf(fiber)) || inheritedChannel;
    if (rerendered(fiber) && isComponent(fiber)) {
      const name = nameOf(fiber);
      componentCounts.set(name, (componentCounts.get(name) ?? 0) + 1);
      if (message !== undefined) {
        const row = messageRows.get(message);
        if (row) row.push(fiber);
        else messageRows.set(message, [fiber]);
      } else if (channel !== undefined && !channelRows.has(channel)) {
        channelRows.set(channel, fiber);
      }
    }
    // A sibling shares this fiber's parent, so it inherits what this fiber inherited; a child
    // inherits this fiber's own row.
    if (fiber.sibling) {
      stack.push({
        channel: inheritedChannel,
        fiber: fiber.sibling,
        message: inheritedMessage,
      });
    }
    if (fiber.child) stack.push({ channel, fiber: fiber.child, message });
  }

  const now = performance.now();
  const touched = (ids: Map<string, number>, id: string) =>
    now - (ids.get(id) ?? -Infinity) <= TOUCH_WINDOW_MS;

  let untargetedMessageRows = 0;
  for (const [id, fibers] of messageRows) {
    if (touched(touchedMessages, id)) continue;
    untargetedMessageRows += 1;
    countReason(explainRow(fibers));
    sampleRow(fibers);
  }
  let untargetedChannelRows = 0;
  for (const [cid] of channelRows) {
    if (!touched(touchedChannels, cid)) untargetedChannelRows += 1;
  }

  const groundTruth = slotRendersSinceCommit
    ? {
        slotRows: slotRendersSinceCommit.size,
        untargetedSlotRows: [...slotRendersSinceCommit].filter(
          (id) => !touched(touchedMessages, id),
        ).length,
      }
    : {};
  records.push({
    channelRows: channelRows.size,
    commit: commitNo,
    events: eventsSinceCommit,
    messageRows: messageRows.size,
    t: now,
    untargetedChannelRows,
    untargetedMessageRows,
    ...groundTruth,
  });
  eventsSinceCommit = 0;
  if (slotRendersSinceCommit) slotRendersSinceCommit = new Set();
};

/**
 * Ground truth for the fiber-based count: a component in the message UI slot reports each time its
 * own body runs (see GroundTruthMessageUI). Off unless the host was opened with ?ground_truth=1,
 * because adding a component to every row is itself a customisation.
 */
let slotRendersSinceCommit: Set<string> | null = null;
export const enableGroundTruth = () => {
  slotRendersSinceCommit = new Set();
};
export const noteSlotRender = (messageId: string) => {
  if (counting && slotRendersSinceCommit) slotRendersSinceCommit.add(messageId);
};

export const rendersAvailable = __PERF_BUILD__ !== 'production';

if (rendersAvailable) {
  let rendererId = 0;
  (window as unknown as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    checkDCE() {},
    inject() {
      rendererId += 1;
      return rendererId;
    },
    onCommitFiberRoot(_id: number, root: { current: Fiber }) {
      onCommit(root);
    },
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    onScheduleFiberRoot() {},
    renderers: new Map(),
    supportsFiber: true,
  };
}

/** The only parts of an event the counter reads. */
export type TouchingEvent = {
  cid?: string;
  message?: { id?: string; parent_id?: string };
};

/** Called for every event the client dispatches: what it touched is "targeted" in the next commit. */
export const noteEvent = (event: TouchingEvent) => {
  if (!counting) return;
  eventsSinceCommit += 1;
  const now = performance.now();
  if (event.cid) touchedChannels.set(event.cid, now);
  if (event.message?.id) touchedMessages.set(event.message.id, now);
  // A reply changes its parent's reply count, so the parent row is legitimately touched.
  if (event.message?.parent_id) touchedMessages.set(event.message.parent_id, now);
};

const stats = (values: number[]) => {
  if (!values.length) return { max: 0, median: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
  };
};

export const startCounting = () => {
  if (!rendersAvailable) {
    throw new Error('render counting is only available in the dev and profiling builds');
  }
  counting = true;
  commitNo = 0;
  eventsSinceCommit = 0;
  touchedMessages = new Map();
  touchedChannels = new Map();
  records = [];
  reasonCounts = new Map();
  componentCounts = new Map();
  samples = [];
  if (slotRendersSinceCommit) slotRendersSinceCommit = new Set();
};

export const stopCounting = (): RenderSummary => {
  counting = false;
  // Commits with no event in them (focus, timers, layout effects) are reported but not part of the
  // per-event question; the medians are over commits that carried at least one event.
  const withEvents = records.filter((r) => r.events > 0);
  return {
    channelRowsPerCommit: stats(withEvents.map((r) => r.channelRows)),
    commits: records.length,
    commitsWithEvents: withEvents.length,
    events: records.reduce((n, r) => n + r.events, 0),
    messageRowsPerCommit: stats(withEvents.map((r) => r.messageRows)),
    perCommit: records,
    reasons: [...reasonCounts.values()].sort((a, b) => b.count - a.count).slice(0, 10),
    samples,
    topComponents: [...componentCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20),
    untargetedChannelRowsPerCommit: stats(withEvents.map((r) => r.untargetedChannelRows)),
    ...(slotRendersSinceCommit
      ? {
          slotRowsPerCommit: stats(withEvents.map((r) => r.slotRows ?? 0)),
          untargetedSlotRowsPerCommit: stats(
            withEvents.map((r) => r.untargetedSlotRows ?? 0),
          ),
        }
      : {}),
    untargetedMessageRowsPerCommit: stats(withEvents.map((r) => r.untargetedMessageRows)),
  };
};
