import { StateStore } from '@stream-io/state-store';
import type { Channel } from 'stream-chat';

import type { FakeChannelBackend } from './fakeChannelBackend';
import { ingestUnsentMessage } from './fakeChannelBackend';
import type { WindowsView } from './paginatorWindows';
import {
  describeWindows,
  lastOf,
  rangeOf,
  readWindows,
  shortId,
  windowWith,
} from './paginatorWindows';
import { rnScenarios } from './rnScenarios';
import type { ScenarioChannelInApp } from './scenarioChannel';

/**
 * The message-pagination cases worth seeing, as data: the situation, the rule the SDK must keep,
 * what to look for on screen, the bug the rule prevents, and the steps that set it up against the
 * fake backend. Checks judge the rule from the paginator's real state once their step is done.
 *
 * A step either runs by itself or waits for you (`youDo`): releasing a held answer, scrolling,
 * opening the channel. `ScenarioRun` walks the steps one at a time or all at once. A run first opens
 * or closes the test channel in the app, as the scenario needs; its first step starts from a fresh
 * timeline and a freshly loaded channel, so earlier runs do not leak in.
 */

export type ScenarioContext = {
  /** Shows the test channel in the app or takes it away. */
  app: ScenarioChannelInApp;
  backend: FakeChannelBackend;
  channel: Channel;
  log: (line: string) => void;
};

export type CheckResult = { ok: boolean; text: string };

/** What a check reads: the windows when its step started and now. */
export type CheckInput = ScenarioContext & { before: WindowsView; now: WindowsView };

export type ScenarioCheck = (input: CheckInput) => CheckResult;

export type ScenarioStep = {
  label: string;
  /** Performs the step; for a `youDo` step, what Step does if you would rather not do it by hand. */
  run?: (context: ScenarioContext) => unknown;
  /** What you do in the app; the scenario waits for you here. */
  youDo?: string;
  /** For a `youDo` step: true once you have done it, so the scenario moves on by itself. */
  isDone?: (context: ScenarioContext) => boolean;
  /**
   * Runs once the step is done (by you or by Step), also when it fails, before it is judged: ends
   * a setup that later steps, and what you do after the scenario, must not inherit.
   */
  whenDone?: (context: ScenarioContext) => unknown;
  /** Judged once the step is done. */
  checks?: ScenarioCheck[];
};

/** The headings the dialog groups the scenarios under, in the order it shows them. */
export const scenarioGroups = [
  { id: 'basics', title: 'Basics' },
  { id: 'reconnect', title: 'Reconnect & gaps' },
  { id: 'deletes', title: 'Offline deletes' },
  { id: 'jumps', title: 'Jumps & stale head' },
  { id: 'own', title: 'Own messages & empty channel' },
] as const;

export type ScenarioGroup = (typeof scenarioGroups)[number]['id'];

export type Scenario = {
  id: string;
  title: string;
  group: ScenarioGroup;
  /** Page size of the channel's message queries; the paginator's default when absent. */
  pageSize?: number;
  /** Whether the test channel is open in the app (`channel.active`) when the scenario starts. */
  precondition?: 'open' | 'closed';
  situation: string;
  rule: string;
  lookFor: string;
  bugPrevented: string;
  steps: ScenarioStep[];
  /** The rule itself, judged after the last step. */
  checks: ScenarioCheck[];
};

// ---- reading the state -----------------------------------------------------------------------

const pageSizeOf = (channel: Channel) => channel.messagePaginator.pageSize ?? 100;
const windowsOf = (channel: Channel) => readWindows(channel.messagePaginator);
/** The head: the channel's newest message on the server. */
const headIdOf = ({ backend }: ScenarioContext) => backend.newestMessage?.id;

/** A message far from the head window, so jumping to it needs a query: sim-011. */
const unloadedMessageId = ({ backend }: ScenarioContext) => backend.timeline[10]?.id;
/** The message `count` places before the head. */
const beforeHead = ({ backend }: ScenarioContext, count: number) =>
  backend.timeline[backend.timeline.length - 1 - count]?.id;
/** A message inside the head window, so jumping to it needs none: sim-291 of 300. */
const loadedMessageId = (context: ScenarioContext) => beforeHead(context, 9);
/** The headmost message of the page that loading tailwards brings next to the head window: sim-200 of 300. */
const latePageMessageId = (context: ScenarioContext) =>
  beforeHead(context, pageSizeOf(context.channel));

/** Whether `id` is a message of yours that never reached the server (failed or still sending). */
const isUnsent = (channel: Channel, id: string) => {
  const status = channel.messagePaginator.getItem(id)?.status;
  return status === 'failed' || status === 'sending';
};

const unsentIds = ({ channel, now }: CheckInput) =>
  now.windows
    .flatMap((window) => window.messageIds)
    .filter((id) => isUnsent(channel, id));

/** The read window's range of messages the server has: an unsent one may rightly move away. */
const readRange = (channel: Channel, view: WindowsView) =>
  rangeOf(view.read?.messageIds.filter((id) => !isUnsent(channel, id)));

const verdict = (ok: boolean, pass: string, fail: string): CheckResult => ({
  ok,
  text: ok ? pass : fail,
});

// ---- checks ----------------------------------------------------------------------------------

/** The read window still holds what you were reading; it may have grown, as the list loads
 *  headwards on its own while you sit at the bottom of it. */
const stillReading: ScenarioCheck = ({ before, channel, now }) => {
  const was = readRange(channel, before);
  const is = readRange(channel, now);
  const readIds = new Set(now.read?.messageIds);
  const wasRead = (before.read?.messageIds ?? []).filter((id) => !isUnsent(channel, id));
  return verdict(
    wasRead.every((id) => readIds.has(id)),
    was === is
      ? `You're still on messages ${is}`
      : `You're still on messages ${was}; the list loaded more around them (${is})`,
    `You were moved from ${was} to ${is}`,
  );
};

const readingAround =
  (messageId: (context: ScenarioContext) => string | undefined): ScenarioCheck =>
  (input) => {
    const id = shortId(messageId(input));
    return verdict(
      !!input.now.read?.messageIds.includes(messageId(input) ?? ''),
      `You're reading the window with ${id} (${rangeOf(input.now.read?.messageIds)})`,
      `You're reading ${rangeOf(input.now.read?.messageIds)}, not the window with ${id}`,
    );
  };

const oneHeadWindow: ScenarioCheck = (input) => {
  const heads = input.now.windows.filter((window) => window.headLoaded);
  const headId = headIdOf(input);
  return verdict(
    heads.length === 1 && lastOf(heads[0].messageIds) === headId,
    `One head window (${rangeOf(heads[0]?.messageIds)}), ending at the head ${shortId(headId)}`,
    heads.length
      ? `${heads.length} head windows, ${rangeOf(heads[0]?.messageIds)}; expected one ending at the head ${shortId(headId)}`
      : `No window has the head (${shortId(headId)}) loaded`,
  );
};

/** The window being read holds the head (your unsent messages may follow it). */
const readsHead: ScenarioCheck = (input) =>
  verdict(
    !!input.now.read?.messageIds.includes(headIdOf(input) ?? ''),
    `You're reading the head window (${rangeOf(input.now.read?.messageIds)})`,
    `You're on ${rangeOf(input.now.read?.messageIds)}, not at the head ${shortId(headIdOf(input))}`,
  );

/**
 * Every window's server messages are one unbroken run of the server's timeline: no window spans
 * messages that were never loaded, which would hide them for good.
 */
const noGapGluedShut: ScenarioCheck = ({ backend, channel, now }) => {
  const position = new Map(backend.timeline.map((message, index) => [message.id, index]));
  const glued = now.windows.find((window) => {
    const positions = window.messageIds
      .filter((id) => !isUnsent(channel, id))
      .map((id) => position.get(id))
      .filter((index): index is number => index !== undefined);
    return positions.some((index, i) => i > 0 && index !== positions[i - 1] + 1);
  });
  return verdict(
    !glued,
    'No window skips messages it never loaded',
    `${rangeOf(glued?.messageIds)} skips messages it never loaded: they can never be shown`,
  );
};

const noDuplicates: ScenarioCheck = ({ now }) => {
  const ids = now.windows.flatMap((window) => window.messageIds);
  const repeated = ids.length - new Set(ids).size;
  return verdict(
    !repeated,
    `No message appears twice (${ids.length} loaded)`,
    `${repeated} message(s) appear twice`,
  );
};

const stopsAtTail: ScenarioCheck = ({ backend, now }) => {
  const tailId = backend.timeline[0]?.id;
  return verdict(
    now.read?.messageIds[0] === tailId && !now.read.canLoadTailwards,
    `Loading tailwards stopped at the tail, ${shortId(tailId)}`,
    `Loading tailwards is at ${shortId(now.read?.messageIds[0])} and ${now.read?.canLoadTailwards ? 'still offers more' : 'stopped'}; expected to stop at the tail ${shortId(tailId)}`,
  );
};

const liveAtTheBottom: ScenarioCheck = (input) => {
  const headId = headIdOf(input);
  return verdict(
    lastOf(input.now.read?.messageIds) === headId,
    `New live messages appear at the bottom, as the new head (${shortId(headId)})`,
    windowWith(input.now, headId)
      ? `New live messages went to a hidden window (the head ${shortId(headId)} is not shown)`
      : `New live message ${shortId(headId)} is missing`,
  );
};

const noGhosts: ScenarioCheck = ({ backend, now }) => {
  const onServer = new Set(backend.timeline.map((message) => message.id));
  const ghosts = now.windows
    .flatMap((window) => window.messageIds)
    .filter((id) => id.startsWith('sim-') && !onServer.has(id));
  return verdict(
    !ghosts.length,
    'No message the server deleted is left',
    `${ghosts.map(shortId).join(', ')} still loaded though the server deleted it`,
  );
};

const unsentKept: ScenarioCheck = (input) =>
  verdict(
    unsentIds(input).length > 0,
    'Your unsent message is still there',
    'Your unsent message is gone',
  );

const unsentInHeadWindow: ScenarioCheck = (input) => {
  const [id] = unsentIds(input);
  const home = windowWith(input.now, id);
  return verdict(
    !!home?.headLoaded,
    'It sits in the head window ("jump to latest" shows it)',
    home
      ? `It sits in ${rangeOf(home.messageIds)}, away from the head`
      : 'It is in no window',
  );
};

const storedNotRead =
  (messageId: (context: ScenarioContext) => string | undefined): ScenarioCheck =>
  (input) => {
    const id = messageId(input);
    const home = windowWith(input.now, id);
    return verdict(
      !!home && !home.isRead,
      `The page with ${shortId(id)} is stored (${rangeOf(home?.messageIds)}), not shown`,
      home
        ? `The page with ${shortId(id)} was attached to the window you're reading`
        : `The page with ${shortId(id)} is not loaded`,
    );
  };

const oneRequestWaiting: ScenarioCheck = ({ backend }) => {
  const { pending } = backend.state.getLatestValue();
  return verdict(
    pending.length === 1,
    'Only one request waits: the second tap was ignored',
    `${pending.length} requests wait; expected one`,
  );
};

const noNewWindow: ScenarioCheck = ({ before, now }) =>
  verdict(
    before.windows.length === now.windows.length,
    'No window was added or dropped',
    `Windows went from ${before.windows.length} to ${now.windows.length}`,
  );

/** The shown window's oldest message the server has (an unsent one is not paged from). */
const oldestServerMessageShown = (channel: Channel, view: WindowsView) =>
  view.read?.messageIds.find((id) => !isUnsent(channel, id));

/** The server's message just older than `id`; `undefined` at the tail or for an id it lacks. */
const justOlderOnServer = ({ backend }: ScenarioContext, id: string | undefined) => {
  const index = backend.timeline.findIndex((message) => message.id === id);
  return index > 0 ? backend.timeline[index - 1].id : undefined;
};

/** The message just older, on the server, than the shown window's oldest is now shown. */
const loadedOlderPage: ScenarioCheck = (input) => {
  const oldestShown = oldestServerMessageShown(input.channel, input.before);
  const justOlderId = justOlderOnServer(input, oldestShown);
  const shown = rangeOf(input.now.read?.messageIds);
  if (!justOlderId) {
    return verdict(
      false,
      '',
      `Nothing to load: the shown window started at ${shortId(oldestShown)}, and the server has nothing older than it`,
    );
  }
  return verdict(
    !!input.now.read?.messageIds.includes(justOlderId),
    `Scrolling up loaded the older page: you see ${shown}`,
    `Scrolling up from ${shortId(oldestShown)} did not show ${shortId(justOlderId)}: you see ${shown}`,
  );
};

// ---- steps -----------------------------------------------------------------------------------

/** Seeds `count` messages (or `count` pages) and reloads the channel on them, online, nothing held. */
const seed = (count: number, unit: 'messages' | 'pages' = 'messages'): ScenarioStep => ({
  label:
    unit === 'pages'
      ? `Seed ${count} pages of messages (${count * 100} at the default page size) and load the channel`
      : `Seed ${count} messages and load the channel`,
  run: async ({ backend, channel }) => {
    backend.setHoldAnswers(false);
    backend.setOnline(true);
    backend.seed(unit === 'pages' ? count * pageSizeOf(channel) : count);
    await backend.reopen();
  },
});

const goOffline: ScenarioStep = {
  label: 'Go offline',
  run: ({ backend }) => backend.setOnline(false),
};

/**
 * More messages than a reload asks for — it asks for as many as the head window holds, at least a
 * page — so the reload's page at the head cannot reach the loaded messages.
 */
const gapArrives: ScenarioStep = {
  label: '110 messages arrive while you are offline (no events reach you)',
  run: ({ backend, channel, log }) => {
    const gap =
      Math.max(channel.messagePaginator.anchoredHeadItems.length, pageSizeOf(channel)) +
      10;
    backend.addMessages(gap);
    log(`${gap} messages sent, head ${backend.newestMessage?.id}`);
  },
};

/** Back online, events flow again; then what a reconnect runs: a reload or a channel-list refresh. */
const reconnect = (
  how: 'reload' | 'channel list',
  checks?: ScenarioCheck[],
): ScenarioStep => ({
  checks,
  label:
    how === 'reload'
      ? 'Reconnect: the channel reloads'
      : 'Reconnect: the channel list refreshes (the 25 messages at the head)',
  run: ({ backend, channel }) => {
    backend.setOnline(true);
    return how === 'reload' ? channel.reload() : backend.refreshFromChannelList();
  },
});

const slowServer: ScenarioStep = {
  label: 'The server gets slow: its answers are held',
  run: ({ backend }) => backend.setHoldAnswers(true),
};

/** Starts a jump; `wait: false` leaves it pending, as a held answer keeps it. */
const jump = (
  label: string,
  messageId: (context: ScenarioContext) => string | undefined,
  { checks, wait = false }: { checks?: ScenarioCheck[]; wait?: boolean } = {},
): ScenarioStep => ({
  checks,
  label,
  run: (context) => {
    const id = messageId(context) ?? '';
    const landing = context.channel.messagePaginator
      .jumpToMessage(id)
      .then((landed) =>
        context.log(`jump to ${id}: ${landed ? 'landed' : 'did not land'}`),
      )
      .catch((error: unknown) => context.log(`jump to ${id} failed: ${String(error)}`));
    return wait ? landing : undefined;
  },
});

/**
 * Ends the slow server: the held answers are delivered and later requests are answered at once, so
 * scrolling or jumping after the scenario is not left waiting for a release nobody asks for. The
 * next step starts once the released answers have landed.
 */
const releaseHeld = (checks: ScenarioCheck[] = []): ScenarioStep => ({
  checks,
  isDone: ({ backend }) => !backend.state.getLatestValue().pending.length,
  label: 'Release the held answer (the server answers at once again)',
  run: ({ backend }) => backend.releaseAll(),
  whenDone: async ({ backend }) => {
    backend.setHoldAnswers(false);
    await sleep(CHECK_DELAY_MS);
  },
  youDo: 'Press "Release next" under Held answers: the slow request finishes now.',
});

const MAX_PAGES = 20;

/** What scrolling to one end does: loads page after page until nothing more loads. */
const loadToTheEnd = async (channel: Channel, toward: 'tail' | 'head') => {
  const paginator = channel.messagePaginator;
  for (let page = 0; page < MAX_PAGES; page++) {
    if (!(toward === 'tail' ? paginator.hasMoreTail : paginator.hasMoreHead)) return;
    await (toward === 'tail' ? paginator.toTail() : paginator.toHead());
  }
};

const scrollToTail = (checks: ScenarioCheck[] = []): ScenarioStep => ({
  checks,
  isDone: ({ channel }) => !!windowsOf(channel).read?.tailLoaded,
  label: 'Scroll up to the tail (load more tailwards until nothing more loads)',
  run: ({ channel }) => loadToTheEnd(channel, 'tail'),
  youDo: 'Scroll the message list up until nothing more loads.',
});

const liveMessagesArrive: ScenarioStep = {
  label: '3 live messages arrive (online, with events)',
  run: ({ backend }) => backend.addMessages(3),
};

/** A reconnect whose reload is still in flight: its answer is held until released. */
const reconnectWithSlowReload: ScenarioStep = {
  label: 'Reconnect: the channel reloads, slowly (its answer is held)',
  run: ({ backend, channel }) => {
    backend.setHoldAnswers(true);
    backend.setOnline(true);
    void channel.reload();
  },
};

const liveMessageArrives: ScenarioStep = {
  label: 'A live message arrives (online, with its event)',
  run: ({ backend }) => backend.addMessages(1),
};

/** How long scrolling up waits for the older page; one still not answered then fails its check. */
const SCROLL_UP_TIMEOUT_MS = 3000;

/** What scrolling to the top of the shown window does: loads the page just older than it. */
const scrollUpOnce: ScenarioStep = {
  checks: [loadedOlderPage, stillReading],
  label: 'Scroll up to the top of the list (the page just older than it loads)',
  run: ({ channel }) =>
    Promise.race([channel.messagePaginator.toTail(), sleep(SCROLL_UP_TIMEOUT_MS)]),
};

const sendWhileOffline: ScenarioStep = {
  label: 'You send a message while offline: it waits in the queue (sending)',
  run: ({ channel, log }) => {
    const queued = ingestUnsentMessage(channel, 'sending');
    log(`queued send ${queued.id}`);
  },
};

/**
 * What a reconnect with offline support does first: the queue replays before the reload. The
 * confirmation's event also restores the channel's interrupted watch, which loads the newest page.
 */
const queueReplaysOnReconnect: ScenarioStep = {
  checks: [noGapGluedShut],
  label: 'Reconnect: the queued message is sent first (the server confirms it)',
  run: ({ backend, channel }) => {
    backend.setOnline(true);
    const queued = channel.messagePaginator.items?.find(
      (message) => message.status === 'sending',
    );
    if (queued) backend.acceptQueuedMessage(queued);
  },
};

const openChannel: ScenarioStep = {
  isDone: ({ channel }) => channel.active,
  label: 'Open the test channel in the app',
  run: ({ app }) => app.open(),
  youDo: 'Open the test channel in the app and look at what it shows.',
};

/** The steps, checks and helpers the scenarios of other files are built from (`rnScenarios.ts`). */
const sharedParts = {
  goOffline,
  isUnsent,
  jump,
  liveAtTheBottom,
  liveMessageArrives,
  loadToTheEnd,
  noDuplicates,
  noGapGluedShut,
  noGhosts,
  oneHeadWindow,
  readingAround,
  readsHead,
  reconnect,
  reconnectWithSlowReload,
  seed,
  stillReading,
  stopsAtTail,
  verdict,
};

export type SharedScenarioParts = typeof sharedParts;

// ---- scenarios -------------------------------------------------------------------------------

export const scenarios: Scenario[] = [
  {
    bugPrevented: 'Endless loading tailwards, or messages repeated in the list.',
    checks: [stopsAtTail, noDuplicates],
    group: 'basics',
    id: 'scroll-to-tail',
    lookFor:
      'Each sim-NNN once, from sim-001 up; loading stops at sim-001 and the window shows "tail loaded".',
    rule: 'Loading tailwards stops at the tail, with no duplicates.',
    situation:
      'A channel with 100 messages; you scroll up to its tail, its first message.',
    steps: [seed(100), scrollToTail()],
    title: 'Seed 100, scroll to the tail',
  },
  {
    bugPrevented:
      'Being left on old messages after a reconnect, the gap glued shut so the missed messages can never load, or new messages going to a hidden window.',
    checks: [liveAtTheBottom],
    group: 'reconnect',
    id: 'gap-while-reading-head',
    lookFor:
      'After the reconnect the list shows the newest messages (sim-111–sim-210); scrolling up loads the missed ones down to sim-001 without a jump; live messages appear at the bottom.',
    precondition: 'open',
    rule: 'A reconnect across a gap shows the newest messages and drops the old window; loading tailwards brings back the missed messages; later live messages appear at the bottom.',
    situation:
      "You're reading the head window (the bottom of the list), go offline, 110 messages arrive, and you reconnect.",
    steps: [
      seed(100),
      goOffline,
      gapArrives,
      reconnect('reload', [readsHead, oneHeadWindow, noGapGluedShut]),
      scrollToTail([noGapGluedShut, noDuplicates]),
      liveMessagesArrive,
    ],
    title: 'Reconnect across a gap while reading the head',
  },
  {
    bugPrevented:
      'Being left on an old window while the newest messages pile up unseen, or the gap glued shut.',
    checks: [readsHead, oneHeadWindow, noGapGluedShut],
    group: 'reconnect',
    id: 'gap-while-reading-away-from-head',
    lookFor:
      'After the reconnect the list shows the newest messages (sim-311–sim-410), not sim-011; the window you jumped to is gone.',
    precondition: 'open',
    rule: 'A reconnect across a gap shows the newest messages, also after a jump; the window you jumped to is dropped.',
    situation:
      'You jumped to sim-011, far from the head; you go offline, messages arrive, and you reconnect.',
    steps: [
      seed(3, 'pages'),
      jump('Jump to sim-011', unloadedMessageId, { wait: true }),
      goOffline,
      gapArrives,
      reconnect('reload'),
    ],
    title: 'Same, after jumping far from the head (to sim-011)',
  },
  {
    bugPrevented: 'Opening the channel shows a stale window far from the head.',
    checks: [readsHead],
    group: 'reconnect',
    id: 'gap-in-unread-channel',
    lookFor:
      'Open the channel afterwards: it shows its head window, the newest messages.',
    precondition: 'closed',
    rule: 'A channel nobody reads moves to its head.',
    situation:
      'The test channel is closed in the app; it misses messages while you are offline, then the channel list refreshes on reconnect.',
    steps: [
      seed(100),
      goOffline,
      gapArrives,
      reconnect('channel list', [readsHead, oneHeadWindow]),
      openChannel,
    ],
    title: 'Gap in a channel nobody reads, then channel-list refresh',
  },
  {
    bugPrevented:
      'The unsent message disappears or lands among old messages, away from the head.',
    checks: [unsentKept, unsentInHeadWindow],
    group: 'own',
    id: 'failed-message-across-gap',
    lookFor:
      'After the reconnect the list shows the newest messages with your failed message still at the bottom.',
    precondition: 'open',
    rule: 'A reconnect across a gap shows the newest messages; an unsent message is never lost and stays in the head window.',
    situation:
      'While offline, a message you send fails; meanwhile 110 messages arrive; you reconnect.',
    steps: [
      seed(100),
      goOffline,
      gapArrives,
      {
        label: 'A message you send fails',
        run: ({ channel, log }) => {
          const failed = ingestUnsentMessage(channel, 'failed');
          log(`failed send ${failed.id} while offline`);
        },
      },
      reconnect('reload', [readsHead, noGapGluedShut]),
    ],
    title: 'Failed message, then reconnect across a gap',
  },
  {
    bugPrevented: 'Ghost messages: shown here, gone everywhere else.',
    checks: [noGhosts, readsHead],
    group: 'deletes',
    id: 'hard-delete-while-offline',
    lookFor: 'After the reload sim-100 is gone and the head is sim-099.',
    precondition: 'open',
    rule: 'A message the server no longer has is removed.',
    situation: 'While you are offline, the head message is hard-deleted; you reconnect.',
    steps: [
      seed(100),
      goOffline,
      {
        label: 'The server hard-deletes the head message (no event)',
        run: ({ backend, log }) => {
          const deleted = backend.newestMessage?.id;
          backend.hardDelete(deleted);
          log(`${deleted} hard-deleted`);
        },
      },
      reconnect('reload'),
    ],
    title: 'Hard delete while offline, then reload',
  },
  {
    bugPrevented: 'The slow first jump yanks you away when it finishes.',
    checks: [readingAround(loadedMessageId), storedNotRead(unloadedMessageId)],
    group: 'jumps',
    id: 'jump-race-later-wins',
    lookFor:
      'After releasing, you stay on the loaded message; the page around sim-011 shows up only as a stored window.',
    precondition: 'open',
    rule: 'Your last tap wins.',
    situation:
      'You tap a quoted message far from the head (it needs loading), then, before it loads, a message already on screen.',
    steps: [
      seed(3, 'pages'),
      slowServer,
      jump('Jump to sim-011 (not loaded: waits for the server)', unloadedMessageId),
      jump('Jump to sim-291, already loaded (lands at once)', loadedMessageId, {
        checks: [readingAround(loadedMessageId)],
        wait: true,
      }),
      releaseHeld(),
    ],
    title: 'Jump to an unloaded message, then to a loaded one',
  },
  {
    bugPrevented: 'Neither jump lands, or an error.',
    checks: [readingAround(unloadedMessageId)],
    group: 'jumps',
    id: 'jump-race-same-message',
    lookFor: 'One held request, not two; after releasing, you land on sim-011.',
    precondition: 'open',
    rule: 'The second tap is ignored; the first still lands.',
    situation: 'You tap the same unloaded message twice while it is loading.',
    steps: [
      seed(3, 'pages'),
      slowServer,
      jump('Jump to sim-011', unloadedMessageId),
      jump('Jump to sim-011 again', unloadedMessageId, { checks: [oneRequestWaiting] }),
      releaseHeld(),
    ],
    title: 'Double jump to the same unloaded message',
  },
  {
    bugPrevented: 'Unrelated messages glued onto the window you jumped to.',
    checks: [readingAround(unloadedMessageId), storedNotRead(latePageMessageId)],
    group: 'jumps',
    id: 'load-tailwards-held-during-jump',
    lookFor:
      'After releasing, you stay on the window around sim-011; the late page appears as a stored window (or joins the head window).',
    precondition: 'open',
    rule: 'The late page is stored, not attached to where you are now.',
    situation:
      'You scroll up from the head window (loading tailwards is slow) and jump to sim-011, far from the head, before the page arrives.',
    steps: [
      seed(3, 'pages'),
      {
        label:
          'Jump to sim-011, then back to the head (the window around sim-011 is kept)',
        run: async (context) => {
          const paginator = context.channel.messagePaginator;
          await paginator.jumpToMessage(unloadedMessageId(context) ?? '');
          await paginator.jumpToTheLatestMessage();
        },
      },
      slowServer,
      {
        label: 'Load more tailwards (its answer is held)',
        run: ({ channel }) => void channel.messagePaginator.toTail(),
      },
      jump('Jump to sim-011 (stored: lands at once)', unloadedMessageId, {
        checks: [readingAround(unloadedMessageId)],
        wait: true,
      }),
      releaseHeld(),
    ],
    title: 'Loading tailwards held while jumping',
  },
  {
    bugPrevented: 'The list moving because the sidebar refreshed.',
    checks: [readsHead, oneHeadWindow, noGapGluedShut],
    group: 'reconnect',
    id: 'gap-open-channel-list-refresh',
    lookFor:
      'After the channel-list refresh nothing moves; after the reload the list shows the newest messages.',
    precondition: 'open',
    rule: "A background refresh never moves you; the channel's own reconnect shows the newest messages.",
    situation:
      "You're reading an open channel; it misses messages while offline; on reconnect the channel list refreshes first, then the channel reloads.",
    steps: [
      seed(100),
      goOffline,
      gapArrives,
      reconnect('channel list', [stillReading, noNewWindow]),
      reconnect('reload'),
    ],
    title: 'Open channel, channel-list refresh',
  },
  {
    bugPrevented:
      'The missed messages hidden for good: the live message makes the reload look connected and glues the gap shut.',
    checks: [readsHead, noGapGluedShut, noDuplicates],
    group: 'reconnect',
    id: 'live-message-during-reload',
    lookFor:
      'After the reload the list shows the newest messages, the live one once; scrolling up loads the missed ones.',
    precondition: 'open',
    rule: "A message that arrived while the reload was in flight doesn't prove the windows connect: it is still a gap.",
    situation:
      "You're reading the head; while offline more than a page arrives; on reconnect the reload is slow, and a live message arrives before it answers.",
    steps: [
      seed(100),
      goOffline,
      gapArrives,
      reconnectWithSlowReload,
      liveMessageArrives,
      releaseHeld([readsHead, noGapGluedShut, noDuplicates]),
      scrollUpOnce,
    ],
    title: 'A live message arrives while the reconnect reload is in flight',
  },
  {
    bugPrevented:
      'Messages missed while offline hidden for good: your own message makes the reload look connected and glues the gap shut.',
    checks: [readsHead, noGapGluedShut, noDuplicates],
    group: 'own',
    id: 'queued-send-before-reload',
    lookFor:
      'After the reload the list shows the newest messages ending with your message, once; scrolling up loads the missed ones.',
    precondition: 'open',
    rule: "Your own message doesn't prove the windows connect: a reload after the queue replays is still a gap.",
    situation:
      "You're at the head; offline you send a message (it waits in the queue) and 110 messages arrive; on reconnect the queued message is sent first, then the channel reloads.",
    steps: [
      seed(100),
      goOffline,
      sendWhileOffline,
      gapArrives,
      queueReplaysOnReconnect,
      reconnect('reload'),
    ],
    title: 'Your message queued offline is sent before the reconnect reload',
  },
  ...rnScenarios(sharedParts),
  {
    bugPrevented:
      'Your loaded history dropped and the list jumping to the newest messages, though nothing was missed: the reload shares only your own messages with what is loaded.',
    checks: [stillReading, readsHead, noGapGluedShut, noDuplicates],
    group: 'reconnect',
    id: 'own-messages-only-overlap-after-reconnect',
    lookFor:
      'After the reload the list holds sim-036–sim-080 in one window: sim-036–sim-055 stay loaded and the 20 new messages follow your sim-051–sim-060.',
    pageSize: 25,
    precondition: 'open',
    rule: "A reload whose oldest message was already loaded joins the loaded window, whoever wrote it: older history stays and you aren't moved.",
    situation:
      'A 60-message channel opens at its newest 25 (sim-036–sim-060); you wrote the last 10. You go offline, others send 20, and you reconnect: the reload of 25 holds your sim-056–sim-060 and the 20 new ones.',
    steps: [
      {
        label: 'Seed 60 messages, the newest 10 from you, and load the channel',
        run: async ({ backend }) => {
          backend.setHoldAnswers(false);
          backend.setOnline(true);
          backend.seed(60, { yours: 10 });
          await backend.reopen();
        },
      },
      goOffline,
      {
        label:
          '20 messages from others arrive while you are offline (no events reach you)',
        run: ({ backend }) => backend.addMessages(20),
      },
      reconnect('reload', [stillReading, noGapGluedShut, noDuplicates]),
    ],
    title: 'Reconnect when the reload shares only your own messages',
  },
];

/** e.g. "2. Reconnect across a gap while reading the head" */
export const numberedTitle = (scenario: Scenario) =>
  `${scenarios.indexOf(scenario) + 1}. ${scenario.title}`;

// ---- running ---------------------------------------------------------------------------------

export type StepStatus = 'todo' | 'running' | 'yourTurn' | 'done' | 'failed';

export type ScenarioRunState = {
  /** Index of the step to run next; `steps.length` once all are done. */
  current: number;
  error?: string;
  /** Per step, its check results once it is done; the last entry also holds the scenario's. */
  results: CheckResult[][];
  statuses: StepStatus[];
};

/** Lets late answers land and throttled state publish before a step is judged. */
const CHECK_DELAY_MS = 300;
const POLL_MS = 250;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One pass through a scenario's steps. `step()` runs the current step; `runAll()` keeps going until
 * the end or a step that waits for you, and goes on once you have done it.
 */
export class ScenarioRun {
  readonly state: StateStore<ScenarioRunState>;
  private before: WindowsView;
  private busy = false;
  private keepGoing = false;
  private poll?: ReturnType<typeof setInterval>;

  constructor(
    readonly scenario: Scenario,
    private readonly context: ScenarioContext,
  ) {
    this.state = new StateStore<ScenarioRunState>({
      current: 0,
      results: [],
      statuses: scenario.steps.map(() => 'todo'),
    });
    this.before = windowsOf(context.channel);
  }

  get isFinished() {
    return this.state.getLatestValue().current >= this.scenario.steps.length;
  }

  step() {
    this.keepGoing = false;
    return this.runCurrent();
  }

  async runAll() {
    this.keepGoing = true;
    await this.goOn();
  }

  /** Also lets the server answer at once again, so a run left at a release step leaves nothing held. */
  dispose() {
    this.keepGoing = false;
    this.stopPolling();
    this.context.backend.setHoldAnswers(false);
  }

  private async goOn() {
    while (this.keepGoing && !this.isFinished && !this.waitsForYou()) {
      await this.runCurrent();
    }
  }

  private waitsForYou() {
    const step = this.scenario.steps[this.state.getLatestValue().current];
    return !!step?.youDo && !step.isDone?.(this.context);
  }

  /** A `youDo` step already done is only judged; otherwise Step does it for you if it can. */
  private async runCurrent() {
    if (this.busy || this.isFinished) return;
    const index = this.state.getLatestValue().current;
    const step = this.scenario.steps[index];
    this.busy = true;
    this.stopPolling();
    this.setStatus(index, 'running');
    this.context.log(
      `${numberedTitle(this.scenario)} — step ${index + 1}. ${step.label}`,
    );
    try {
      if (index === 0) this.applyPageSize();
      if (index === 0) await this.showTestChannelAsNeeded();
      try {
        if (!step.youDo || !step.isDone?.(this.context)) await step.run?.(this.context);
      } finally {
        await step.whenDone?.(this.context);
      }
      await this.judge(index);
    } catch (error) {
      this.keepGoing = false;
      this.setStatus(index, 'failed');
      this.state.partialNext({ error: `Step ${index + 1} failed: ${String(error)}` });
    } finally {
      this.busy = false;
    }
  }

  private async showTestChannelAsNeeded() {
    const { app } = this.context;
    await (this.scenario.precondition === 'closed' ? app.close() : app.open());
  }

  /** Every query of the run, from the first step's on, asks for the scenario's page size. */
  private applyPageSize() {
    const { backend, channel } = this.context;
    channel.messagePaginator.pageSize = this.scenario.pageSize ?? backend.defaultPageSize;
  }

  private async judge(index: number) {
    const { steps } = this.scenario;
    const isLast = index === steps.length - 1;
    const checks = [
      ...(steps[index].checks ?? []),
      ...(isLast ? this.scenario.checks : []),
    ];
    if (checks.length) await sleep(CHECK_DELAY_MS);
    const input = {
      ...this.context,
      before: this.before,
      now: windowsOf(this.context.channel),
    };
    this.context.log(`  windows after step ${index + 1}: ${describeWindows(input.now)}`);
    const results = [...this.state.getLatestValue().results];
    results[index] = checks.map((check) => check(input));
    this.state.partialNext({ current: index + 1, error: undefined, results });
    this.setStatus(index, 'done');
    this.enter(index + 1);
  }

  /** Notes the state the step starts from; a step waiting for you is watched until you are done. */
  private enter(index: number) {
    this.before = windowsOf(this.context.channel);
    const step = this.scenario.steps[index];
    if (!step?.youDo) return;
    this.setStatus(index, 'yourTurn');
    if (!step.isDone) return;
    this.poll = setInterval(() => {
      if (this.busy || !step.isDone?.(this.context)) return;
      void this.runCurrent().then(() => this.goOn());
    }, POLL_MS);
  }

  private stopPolling() {
    clearInterval(this.poll);
    this.poll = undefined;
  }

  private setStatus(index: number, status: StepStatus) {
    const statuses = [...this.state.getLatestValue().statuses];
    statuses[index] = status;
    this.state.partialNext({ statuses });
  }
}
