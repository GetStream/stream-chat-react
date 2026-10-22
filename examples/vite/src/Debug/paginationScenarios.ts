import { StateStore } from '@stream-io/state-store';
import type { Channel } from 'stream-chat';

import type { FakeChannelBackend } from './fakeChannelBackend';
import { ingestSendResponse, ingestUnsentMessage } from './fakeChannelBackend';
import { simulatedMessageId as sim } from './fakeTimeline';
import type { MessageOffset } from './messageListOnScreen';
import {
  distanceFromBottom,
  offsetOfMessage,
  readMessageListOverlay,
  scrollListBy,
  SETTLE_TIMEOUT_MS,
  settledMessageList,
  topmostVisibleMessage,
} from './messageListOnScreen';
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

/** Most checks read the state at once; one that reads the screen waits for the list to settle. */
export type ScenarioCheck = (input: CheckInput) => CheckResult | Promise<CheckResult>;

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
  { id: 'screen', title: 'On screen: the message list' },
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

/** All `count` of your unsent messages are in the head window, where "jump to latest" shows them. */
const unsentKeptInHeadWindow =
  (count: number): ScenarioCheck =>
  (input) => {
    const unsent = unsentIds(input);
    const inHeadWindow = unsent.filter((id) => windowWith(input.now, id)?.headLoaded);
    return verdict(
      inHeadWindow.length === count,
      `Your ${count === 1 ? 'unsent message is' : `${count} unsent messages are`} still there, in the head window`,
      `Of your ${count} unsent messages ${unsent.length} are left, ${inHeadWindow.length} in the head window`,
    );
  };

/** You see the head window, and your newest message is at its bottom. */
const yourMessageAtTheBottom: ScenarioCheck = ({ channel, now }) => {
  const range = rangeOf(now.read?.messageIds);
  const bottomId = lastOf(now.read?.messageIds);
  const isYours =
    !!bottomId &&
    channel.messagePaginator.getItem(bottomId)?.user?.id === channel.getClient().userID;
  return verdict(
    isYours && !!now.read?.headLoaded,
    `You see the head window (${range}) with your message at the bottom`,
    isYours
      ? `Your message is at the bottom of ${range}, which is not the head window`
      : `You see ${range}, without your message at the bottom`,
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

/**
 * The newest messages are stored as the head window while you read another one, which can load
 * newer messages up to it.
 */
const headStoredNotRead: ScenarioCheck = (input) => {
  const head = input.now.windows.find((window) => window.headLoaded);
  const headId = headIdOf(input);
  const range = rangeOf(head?.messageIds);
  const isStored = !!head && !head.isRead && lastOf(head.messageIds) === headId;
  return verdict(
    isStored && !!input.now.read?.canLoadHeadwards,
    `The newest messages are stored as the head window (${range}); the window you read can load newer up to it`,
    !head
      ? `No head window ending at ${shortId(headId)} is stored`
      : head.isRead
        ? `The head window (${range}) is shown: you were moved off your window`
        : isStored
          ? 'The window you read cannot load newer messages'
          : `The head window (${range}) does not end at the head ${shortId(headId)}`,
  );
};

const notLoaded =
  (messageId: (context: ScenarioContext) => string): ScenarioCheck =>
  (input) => {
    const id = messageId(input);
    const home = windowWith(input.now, id);
    return verdict(
      !home,
      `${shortId(id)} is not loaded`,
      `${shortId(id)} is still loaded (${rangeOf(home?.messageIds)})`,
    );
  };

/**
 * The window you read is a window of its own, apart from the head window: the setup a reconnect
 * across a gap is meant to find. Fails when the list has joined the two before the reconnect.
 */
const readsWindowApartFromHead: ScenarioCheck = ({ now }) => {
  const head = now.windows.find((window) => window.headLoaded);
  const isApart = !!now.read && !!head && !now.read.headLoaded && now.read.id !== head.id;
  return verdict(
    isApart,
    `You read ${rangeOf(now.read?.messageIds)}, a window apart from the head window (${rangeOf(head?.messageIds)})`,
    now.read?.headLoaded
      ? `The window you read (${rangeOf(now.read.messageIds)}) is the head window: the setup needs a separate one`
      : `No head window is loaded beside the window you read (${rangeOf(now.read?.messageIds)})`,
  );
};

const windowCount =
  (count: number): ScenarioCheck =>
  ({ now }) =>
    verdict(
      now.windows.length === count,
      `${count} window${count === 1 ? '' : 's'} loaded`,
      `${now.windows.length} windows loaded (${now.windows.map((window) => rangeOf(window.messageIds)).join(', ')}); expected ${count}`,
    );

/**
 * How many queries the last jump to the latest sent, counted when it landed: loads the message
 * list runs by itself once it shows the landed window are not the jump's.
 */
const queriesSentByJump = new WeakMap<FakeChannelBackend, number>();

const sentNoRequest: ScenarioCheck = ({ backend }) => {
  const sent = queriesSentByJump.get(backend);
  if (sent === undefined) return verdict(false, '', 'The step noted no request count');
  return verdict(!sent, 'The jump sent no request', `The jump sent ${sent} request(s)`);
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

// ---- checks of the message list on screen ----------------------------------------------------

/** Within this many px two positions on screen count as the same: layout rounds to sub-pixels. */
const SCREEN_TOLERANCE_PX = 2;

/** Says what a check wanted to read, so two checks of one step never fail with the same text. */
const notOnScreen = (what: string) => `${what}: the message list is not on screen`;

/** Added to a failure seen while the list was still moving. */
const stillMovingNote = (settled: boolean) =>
  settled ? '' : ` (the list was still moving after ${SETTLE_TIMEOUT_MS / 1000} s)`;

/** Your unread count as the channel's read state holds it, which the scroll-to-latest button shows. */
const yourUnreadCountInChannel = (channel: Channel) => {
  const userId = channel.getClient().userID;
  return userId ? channel.state.read[userId]?.unread_messages : undefined;
};

/** Once the list has settled, it is scrolled up from its bottom: the newest messages are out of sight. */
const listScrolledUp: ScenarioCheck = async () => {
  const { list, settled } = await settledMessageList();
  if (!list) return verdict(false, '', notOnScreen('Scrolling up'));
  const distance = Math.round(distanceFromBottom(list));
  return verdict(
    settled && distance > SCREEN_TOLERANCE_PX,
    `The list is ${distance} px above its bottom`,
    settled
      ? `The list is ${distance} px above its bottom: it did not scroll up`
      : `The list is ${distance} px above its bottom${stillMovingNote(settled)}`,
  );
};

/** Once the list has settled, it rests at its bottom, on the newest messages. */
const listRestsAtBottom: ScenarioCheck = async () => {
  const { list, settled } = await settledMessageList();
  if (!list) return verdict(false, '', notOnScreen('Where the list rests'));
  const distance = Math.round(distanceFromBottom(list));
  const position = `scrollTop ${Math.round(list.scrollTop)} of ${list.scrollHeight - list.clientHeight}`;
  return verdict(
    settled && distance <= SCREEN_TOLERANCE_PX,
    'The list rests at the bottom, on the newest messages',
    settled
      ? `The list rests ${distance} px above the bottom (${position})`
      : `The list is ${distance} px above the bottom (${position})${stillMovingNote(settled)}`,
  );
};

/** The scroll-to-latest button shows your unread count in the channel, and the server agrees. */
const scrollToLatestShowsUnreadCount: ScenarioCheck = async ({ backend, channel }) => {
  const { list, settled } = await settledMessageList();
  if (!list) return verdict(false, '', notOnScreen('The scroll-to-latest button'));
  const { scrollToLatestCount: shown, scrollToLatestShown } =
    readMessageListOverlay(list);
  const inChannel = yourUnreadCountInChannel(channel);
  const onServer = backend.yourUnreadCount;
  return verdict(
    settled &&
      scrollToLatestShown &&
      typeof inChannel === 'number' &&
      shown === inChannel &&
      inChannel === onServer,
    `The scroll-to-latest button shows ${shown}, your unread count in the channel and on the server`,
    scrollToLatestShown
      ? `The scroll-to-latest button shows ${shown ?? 'no number'}; your unread count is ${inChannel ?? 'unknown'} in the channel, ${onServer ?? 'unknown'} on the server${stillMovingNote(settled)}`
      : `The scroll-to-latest button is not shown${stillMovingNote(settled)}`,
  );
};

/** The "New Messages!" pill counts your unread messages in the channel, as the button does. */
const newMessagesPillShowsUnreadCount: ScenarioCheck = async ({ channel }) => {
  const { list, settled } = await settledMessageList();
  if (!list) return verdict(false, '', notOnScreen('The "New Messages!" pill'));
  const { newMessagesPill, newMessagesPillCount } = readMessageListOverlay(list);
  const inChannel = yourUnreadCountInChannel(channel);
  return verdict(
    settled &&
      !!newMessagesPill &&
      typeof inChannel === 'number' &&
      newMessagesPillCount === inChannel,
    `The "New Messages!" pill says "${newMessagesPill}", your unread count in the channel`,
    newMessagesPill
      ? `The "New Messages!" pill says "${newMessagesPill}"; your unread count in the channel is ${inChannel ?? 'unknown'}${stillMovingNote(settled)}`
      : `The "New Messages!" pill is not shown${stillMovingNote(settled)}`,
  );
};

/** What scrolling up until older messages load saw, for the checks of that step. */
type OlderLoadSeen = {
  /**
   * The topmost message you could see while the older page loaded, and where it was then: the
   * loading indicator above the messages is already shown.
   */
  anchor?: MessageOffset;
  /** Where that message is once the older page landed and the list settled. */
  anchorOffsetAfter?: number;
  /** Why nothing could be measured. */
  problem?: string;
  /** Unset when loading had started before the first scroll. */
  scrollTopAtLoad?: number;
  settled?: boolean;
};

const olderLoadsSeen = new WeakMap<FakeChannelBackend, OlderLoadSeen>();

/**
 * The list asked for older messages before you reached its top. Also reports why the step could
 * not measure, which the other checks of the step then leave out.
 */
const olderLoadStartedBeforeTop: ScenarioCheck = ({ backend }) => {
  const seen = olderLoadsSeen.get(backend);
  if (!seen) return verdict(false, '', 'The step noted nothing');
  if (seen.problem) return verdict(false, '', seen.problem);
  if (seen.scrollTopAtLoad === undefined) {
    return verdict(false, '', 'Older messages were already loading before you scrolled');
  }
  const scrollTop = Math.round(seen.scrollTopAtLoad);
  return verdict(
    scrollTop > 0,
    `Older messages started loading ${scrollTop} px before the top of the list`,
    'Older messages started loading only once you reached the top of the list (scrollTop 0)',
  );
};

/** e.g. "37 px above the top of the list" */
const describeOffset = (offset: number) => {
  const px = Math.round(offset);
  return px < 0
    ? `${-px} px above the top of the list`
    : `${px} px below the top of the list`;
};

/** The message you were looking at stays where it was on screen when the older page lands above it. */
const placeKeptAcrossOlderLoad: ScenarioCheck = ({ backend }) => {
  const seen = olderLoadsSeen.get(backend);
  const anchor = seen?.anchor;
  if (!seen || seen.problem || !anchor) {
    return verdict(false, '', 'Where you were looking could not be measured');
  }
  const { anchorOffsetAfter, settled = false } = seen;
  if (anchorOffsetAfter === undefined) {
    return verdict(
      false,
      '',
      `${anchor.id}, the topmost message you saw, is no longer shown`,
    );
  }
  const moved = Math.round(anchorOffsetAfter - anchor.offset);
  return verdict(
    settled && Math.abs(moved) <= SCREEN_TOLERANCE_PX,
    `${anchor.id}, the topmost message you saw, stayed in place (its top ${describeOffset(anchor.offset)})`,
    `${anchor.id}, the topmost message you saw, moved ${moved} px: its top went from ${describeOffset(anchor.offset)} to ${describeOffset(anchorOffsetAfter)}${stillMovingNote(settled)}`,
  );
};

// ---- steps -----------------------------------------------------------------------------------

/**
 * Seeds `count` messages (or `count` pages) on the server and opens the channel on them, online,
 * nothing held: the channel loads its newest page only.
 */
const seed = (count: number, unit: 'messages' | 'pages' = 'messages'): ScenarioStep => ({
  checks: [opensAtNewestPage],
  label:
    unit === 'pages'
      ? `Seed ${count} pages of messages on the server (${count * 100} at the default page size), then open the channel: it loads its newest page`
      : `Seed ${count} messages on the server, then open the channel: it loads its newest page`,
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
 * Opening a seeded channel loads only its newest page: one window, the server's newest `pageSize`
 * messages (all of them in a channel that fits one page). At a page size below the default, the
 * message list may load older pages to fill the screen, so more is accepted there.
 */
const opensAtNewestPage: ScenarioCheck = ({ backend, channel, now }) => {
  const serverIds = backend.timeline.map((message) => message.id);
  const loadedIds = now.windows.flatMap((window) => window.messageIds);
  if (!serverIds.length) {
    return verdict(
      !loadedIds.length,
      'The channel opened empty',
      `The empty channel shows ${rangeOf(loadedIds)}`,
    );
  }
  const newestPage = serverIds.slice(-pageSizeOf(channel));
  const shown = now.windows.length === 1 ? now.windows[0].messageIds : [];
  const isNewestRun =
    shown.length > 0 &&
    shown.every((id, index) => id === serverIds[serverIds.length - shown.length + index]);
  const mayFillScreen = pageSizeOf(channel) < backend.defaultPageSize;
  const holdsNewestPage = isNewestRun && shown.length === newestPage.length;
  const holdsMore = isNewestRun && shown.length > newestPage.length;
  return verdict(
    holdsNewestPage || (holdsMore && mayFillScreen),
    holdsNewestPage
      ? `The channel opened at its newest page: ${rangeOf(shown)} (${shown.length} of ${serverIds.length} messages)`
      : `The channel opened at its newest page (${rangeOf(newestPage)}); the list loaded older messages to fill the screen (${rangeOf(shown)})`,
    now.windows.length !== 1
      ? `${now.windows.length} windows loaded (${now.windows.map((window) => rangeOf(window.messageIds)).join(', ')}); expected one, the newest page ${rangeOf(newestPage)}`
      : holdsMore
        ? `${rangeOf(shown)} loaded (${shown.length} of ${serverIds.length} messages), more than the newest page (${rangeOf(newestPage)}): the list loaded older pages by itself`
        : `${rangeOf(shown)} loaded; expected the newest page ${rangeOf(newestPage)}`,
  );
};

/** Scrolling the list down would load newer messages until the window you read joins the head. */
const DONT_SCROLL_BEFORE_RECONNECT =
  " Don't scroll the list before the reconnect: scrolling down loads newer messages until your window joins the head window.";

/** Going offline, after checking the jumped-to windows are still apart (`count` windows loaded). */
const goOfflineWindowsApart = (count: number): ScenarioStep => ({
  ...goOffline,
  checks: [readsWindowApartFromHead, windowCount(count)],
});

/**
 * More messages than a reload asks for — it asks for as many as the head window holds, at least a
 * page — so the reload's page at the head cannot reach the loaded messages. Your unsent messages in
 * the head window (a few at most here) are left out of the count, so a full page still makes 110.
 */
const gapArrives: ScenarioStep = {
  label: '110 messages arrive while you are offline (no events reach you)',
  run: ({ backend, channel, log }) => {
    const serverMessagesInHeadWindow = channel.messagePaginator.anchoredHeadItems.filter(
      (message) => !isUnsent(channel, message.id),
    ).length;
    const gap = Math.max(serverMessagesInHeadWindow, pageSizeOf(channel)) + 10;
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

const scrollToHead = (checks: ScenarioCheck[] = []): ScenarioStep => ({
  checks,
  isDone: ({ channel }) => !!windowsOf(channel).read?.headLoaded,
  label: 'Scroll down to the head (load more headwards until nothing more loads)',
  run: ({ channel }) => loadToTheEnd(channel, 'head'),
  youDo: 'Scroll the message list down until nothing more loads.',
});

/** Counts the requests the jump sends until it lands, so `sentNoRequest` can judge them. */
const jumpToLatest = (checks?: ScenarioCheck[]): ScenarioStep => ({
  checks,
  label: 'Jump to the latest message',
  run: async ({ backend, channel, log }) => {
    queriesSentByJump.delete(backend);
    const before = backend.receivedQueries.length;
    const landed = await channel.messagePaginator.jumpToTheLatestMessage();
    queriesSentByJump.set(backend, backend.receivedQueries.length - before);
    log(`jump to the latest: ${landed ? 'landed' : 'did not land'}`);
  },
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

/** More messages than a page, sent while offline: they all wait in the queue. */
const QUEUED_SENDS = 30;

const sendManyWhileOffline: ScenarioStep = {
  label: `You send ${QUEUED_SENDS} messages while offline: they wait in the queue (sending)`,
  run: ({ channel, log }) => {
    for (let index = 0; index < QUEUED_SENDS; index++)
      ingestUnsentMessage(channel, 'sending');
    log(`queued ${QUEUED_SENDS} sends`);
  },
};

/** More messages from others than the reload asks for (the 55 the head window then holds), while offline. */
const manyArriveFromOthers: ScenarioStep = {
  label: '120 messages from others arrive while you are offline (no events reach you)',
  run: ({ backend }) => backend.addMessages(120),
};

const queuedSends = (channel: Channel) =>
  (channel.messagePaginator.items ?? []).filter(
    (message) => message.status === 'sending',
  );

/**
 * The queue replays every send, in order, before anything else: the server stores them after the
 * messages you missed. With `events`, each confirmation also arrives as `message.new`, which
 * restores the channel's interrupted watch (its newest page holds only your sends); without, only
 * the send responses confirm them, as when the socket is not back yet.
 */
const queueReplaysAll = (events: boolean, checks?: ScenarioCheck[]): ScenarioStep => ({
  checks,
  label: events
    ? 'Reconnect: the queue sends them all first (each confirmation also arrives as an event)'
    : 'The queue sends them all first, before the socket is back (only the send responses confirm them)',
  run: ({ backend, channel }) => {
    backend.setOnline(events);
    for (const queued of queuedSends(channel)) {
      const stored = backend.acceptQueuedMessage(queued);
      if (!events) ingestSendResponse(channel, stored);
    }
  },
});

const openChannel: ScenarioStep = {
  isDone: ({ channel }) => channel.active,
  label: 'Open the test channel in the app',
  run: ({ app }) => app.open(),
  youDo: 'Open the test channel in the app and look at what it shows.',
};

const yourSendFails: ScenarioStep = {
  label: 'A message you send fails',
  run: ({ channel }) => ingestUnsentMessage(channel, 'failed'),
};

const yourSendHangs: ScenarioStep = {
  label: 'Another message you send stays sending (its request hangs)',
  run: ({ channel }) => ingestUnsentMessage(channel, 'sending'),
};

/** A send as the device makes it: your message shows at once, as sending. */
const youSendAMessage = (checks?: ScenarioCheck[]): ScenarioStep => ({
  checks,
  label: 'You send a message (it shows as sending)',
  run: ({ channel }) => ingestUnsentMessage(channel, 'sending'),
});

const serverConfirmsYourMessage = (checks?: ScenarioCheck[]): ScenarioStep => ({
  checks,
  label: 'The server confirms it (its message.new arrives)',
  run: ({ backend, channel }) => {
    const sending = channel.messagePaginator.items?.find(
      (message) => message.status === 'sending',
    );
    if (sending) backend.acceptQueuedMessage(sending);
  },
});

/**
 * A jump to sim-011, which opens a window of its own apart from the head window; needs a channel
 * of at least 300 messages.
 */
const jumpToUnloadedWindow = jump(
  'Jump to sim-011 (not loaded: it opens a window of its own)',
  unloadedMessageId,
  {
    checks: [readingAround(unloadedMessageId), readsWindowApartFromHead, windowCount(2)],
    wait: true,
  },
);

/**
 * A reconnect across a gap while you read the sim-011 window: you stay on it, the old head window
 * (sim-201–sim-300) is dropped and the newest page is stored as the head window.
 */
const reconnectKeepsJumpedWindow = reconnect('reload', [
  readingAround(unloadedMessageId),
  headStoredNotRead,
  windowCount(2),
  notLoaded(() => sim(250)),
  oneHeadWindow,
  noGapGluedShut,
]);

/** Far enough from the bottom that the list counts as scrolled up, near enough to load nothing. */
const SCROLL_UP_A_BIT_PX = 400;

const scrollUpABit = (label: string): ScenarioStep => ({
  checks: [listScrolledUp],
  label: `${label} (${SCROLL_UP_A_BIT_PX} px), off the newest messages`,
  run: async () => {
    const { list } = await settledMessageList();
    if (!list) throw new Error(notOnScreen('Scrolling up'));
    scrollListBy(list, -SCROLL_UP_A_BIT_PX);
  },
});

/** One scroll of a wheel, and the pause before the next. */
const SCROLL_STEP_PX = 150;
const SCROLL_STEP_MS = 100;
/** How long, at the top of the list, to wait for a load to start before calling it missing. */
const LOAD_AT_TOP_GRACE_MS = 1000;

/**
 * Scrolls up as you would, a step at a time, until the list asks for older messages. Their answer
 * is held while the list shows the loading indicator, and the place you look at is noted then, so
 * the check compares it with the place once the page has landed.
 */
const scrollUpUntilOlderLoad = (checks: ScenarioCheck[]): ScenarioStep => ({
  checks,
  label: `Scroll up ${SCROLL_STEP_PX} px at a time, as you would, until older messages load`,
  run: async ({ backend }) => {
    const seen: OlderLoadSeen = {};
    olderLoadsSeen.set(backend, seen);
    const { list } = await settledMessageList();
    if (!list) {
      seen.problem = notOnScreen('Scrolling up');
      return;
    }
    backend.setHoldAnswers(true);
    const isLoading = () => backend.state.getLatestValue().pending.length > 0;
    let lastScroll: { scrollTop: number } | undefined;
    while (!isLoading() && list.scrollTop > 0) {
      scrollListBy(list, -SCROLL_STEP_PX);
      // noted before anything the scroll starts can render
      lastScroll = { scrollTop: list.scrollTop };
      await sleep(SCROLL_STEP_MS);
    }
    for (
      let waited = 0;
      !isLoading() && waited < LOAD_AT_TOP_GRACE_MS;
      waited += SCROLL_STEP_MS
    )
      await sleep(SCROLL_STEP_MS);
    if (!isLoading()) {
      seen.problem =
        'Nothing loaded: you reached the top of the list and no older messages were asked for';
      return;
    }
    seen.scrollTopAtLoad = lastScroll?.scrollTop;
    // while the page loads: the loading indicator above the messages is what you see now
    const loading = await settledMessageList();
    seen.anchor = loading.list ? topmostVisibleMessage(loading.list) : undefined;
    backend.setHoldAnswers(false);
    const after = await settledMessageList();
    seen.settled = after.settled;
    seen.anchorOffsetAfter =
      seen.anchor && after.list ? offsetOfMessage(after.list, seen.anchor.id) : undefined;
  },
  whenDone: ({ backend }) => backend.setHoldAnswers(false),
});

/** The steps, checks and helpers the scenarios of other files are built from (`rnScenarios.ts`). */
const sharedParts = {
  goOffline,
  opensAtNewestPage,
  isUnsent,
  jump,
  jumpToLatest,
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
  sentNoRequest,
  serverConfirmsYourMessage,
  stillReading,
  stopsAtTail,
  unsentKeptInHeadWindow,
  verdict,
  youSendAMessage,
  yourMessageAtTheBottom,
  yourSendFails,
  yourSendHangs,
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
      'Being pulled off the window you jumped to by a reconnect, the old head window kept beside the new one, or the gap glued shut.',
    checks: [readsHead, oneHeadWindow, noGapGluedShut],
    group: 'reconnect',
    id: 'gap-while-reading-away-from-head',
    lookFor:
      'After the jump two windows are loaded: the one around sim-011 (shown) and the head window sim-201–sim-300. After the reconnect you still see the sim-011 window; sim-201–sim-300 is gone and the newest messages (sim-311–sim-410) are stored as the head window; "jump to latest" then shows them without a request.' +
      DONT_SCROLL_BEFORE_RECONNECT,
    precondition: 'open',
    rule: 'A reconnect across a gap keeps you on the window you jumped to, drops the old head window and stores the newest page as the head window; "jump to latest" shows it.',
    situation:
      'You jump to sim-011, into a window of its own far from the head window (sim-201–sim-300); you go offline, 110 messages arrive, you reconnect, then jump to the latest.',
    steps: [
      seed(3, 'pages'),
      jumpToUnloadedWindow,
      goOfflineWindowsApart(2),
      gapArrives,
      reconnectKeepsJumpedWindow,
      jumpToLatest([sentNoRequest, readsHead]),
    ],
    title: 'Jumped into another window, then a reconnect brings a new head',
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
        checks: [opensAtNewestPage],
        label:
          'Seed 60 messages on the server, the newest 10 from you, then open the channel: it loads its newest page',
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
  {
    bugPrevented:
      'The 120 messages you missed hidden for good: the newest page after the queue replays holds only your sends, which were already loaded, so it looks connected and glues the gap shut.',
    checks: [readsHead, noGapGluedShut, noDuplicates],
    group: 'own',
    id: 'many-queued-sends-restored-watch',
    lookFor:
      'After the queue replays, the windows never join sim-060 to your sends; after the reload the newest messages end with your 30, each once, and scrolling up loads the missed ones.',
    pageSize: 25,
    precondition: 'open',
    rule: 'Messages the queue sent while you missed others prove nothing about what lies below them: a newest page made only of them is still past a gap.',
    situation: `You're at the head of a 60-message channel (sim-036–sim-060, page size 25). Offline you send ${QUEUED_SENDS} messages (queued) and others send 120. On reconnect the queue sends yours first; their events restore the channel's watch, whose newest page of 25 is only your sends; then the channel reloads.`,
    steps: [
      seed(60),
      goOffline,
      sendManyWhileOffline,
      manyArriveFromOthers,
      queueReplaysAll(true, [noGapGluedShut, noDuplicates]),
      reconnect('reload'),
    ],
    title:
      'More than a page queued offline while more than a page arrives (watch restored)',
  },
  {
    bugPrevented:
      'The 120 messages you missed hidden for good: the reload looks connected through your sends.',
    checks: [readsHead, noGapGluedShut, noDuplicates],
    group: 'own',
    id: 'many-queued-sends-reload',
    lookFor:
      'After the reload the newest messages end with your 30, each once; nothing joins sim-060 to them, and scrolling up loads the missed ones.',
    pageSize: 25,
    precondition: 'open',
    rule: 'Messages the queue sent while you missed others prove nothing about what lies below them; the reload, which asks for as many messages as the head window holds, still sees the gap.',
    situation: `As above, but the queue sends your ${QUEUED_SENDS} before the socket is back, so only the send responses confirm them; then the channel reloads.`,
    steps: [
      seed(60),
      goOffline,
      sendManyWhileOffline,
      manyArriveFromOthers,
      // Sends confirmed by their responses sit after sim-060 until a page shows what lies between.
      queueReplaysAll(false, [noDuplicates]),
      reconnect('reload'),
    ],
    title: 'More than a page queued offline while more than a page arrives (reload)',
  },
  {
    bugPrevented:
      'Being pulled off the window you read by a reconnect, the deleted sim-250 coming back, or the window you read glued to the newest page across the gap.',
    checks: [
      readsHead,
      oneHeadWindow,
      noGapGluedShut,
      noDuplicates,
      notLoaded(() => sim(250)),
    ],
    group: 'reconnect',
    id: 'gap-keeps-jumped-window-with-offline-delete',
    lookFor:
      'After the jump two windows are loaded: the one around sim-005 (shown) and the head window sim-201–sim-300. After the reconnect you still see the sim-005 window, sim-010 included: the window you read is not refreshed, so a message deleted while offline stays there until it is loaded again (accepted). sim-201–sim-300 is gone and the newest messages, up to sim-410, are stored as the head window. Scrolling down loads the messages after your window, without sim-250, until it joins them.' +
      DONT_SCROLL_BEFORE_RECONNECT,
    precondition: 'open',
    rule: 'A reconnect across a gap keeps you on the window you jumped to, as it was, and stores the newest page as the head window; the old head window is dropped. Loading newer from your window fetches what lies between, until it joins the head window.',
    situation:
      'You jump to sim-005, into a window of its own in a 300-message channel (the head window is sim-201–sim-300). While you are offline the server hard-deletes sim-010 (in the window you read) and sim-250 (in the head window), and 110 messages arrive; you reconnect, then scroll down to the head.',
    steps: [
      seed(3, 'pages'),
      jump('Jump to sim-005 (not loaded: it opens a window of its own)', () => sim(5), {
        checks: [readingAround(() => sim(5)), readsWindowApartFromHead, windowCount(2)],
        wait: true,
      }),
      goOfflineWindowsApart(2),
      {
        label: 'The server hard-deletes sim-010 and sim-250 (no event)',
        run: ({ backend }) => {
          backend.hardDelete(sim(10));
          backend.hardDelete(sim(250));
        },
      },
      gapArrives,
      reconnect('reload', [
        readingAround(() => sim(5)),
        headStoredNotRead,
        windowCount(2),
        notLoaded(() => sim(250)),
      ]),
      scrollToHead(),
    ],
    title:
      'Jumped into another window, offline delete and more than a page missed, reconnect, scroll down',
  },
  {
    bugPrevented:
      'A stale head window left on screen after a reconnect across a gap, the old head window kept beside the new one, or the gap glued shut.',
    checks: [readsHead, oneHeadWindow, noGapGluedShut, noDuplicates],
    group: 'reconnect',
    id: 'gap-after-jump-within-head',
    lookFor:
      'After the jump you still read the head window sim-201–sim-300, now around sim-250: one window. After the reconnect the list shows the newest messages (sim-311–sim-410) in place of it; sim-201–sim-300 is gone, and scrolling up loads the missed ones.',
    precondition: 'open',
    rule: 'A jump inside the head window keeps you on the head window, so a reconnect across a gap replaces it with the newest page and shows it.',
    situation:
      'You jump to sim-250, inside the loaded head window (sim-201–sim-300); you go offline, 110 messages arrive, and you reconnect.',
    steps: [
      seed(3, 'pages'),
      jump('Jump to sim-250 (already loaded, in the head window)', () => sim(250), {
        checks: [readingAround(() => sim(250)), readsHead, windowCount(1)],
        wait: true,
      }),
      goOffline,
      gapArrives,
      reconnect('reload', [readsHead, windowCount(1), notLoaded(() => sim(250))]),
      scrollToTail([noGapGluedShut, noDuplicates]),
    ],
    title: 'Jumped within the head window, then a reconnect brings a new head',
  },
  {
    bugPrevented:
      'Your message landing in the stored head window while you stay on the window you jumped to, so it looks as if it was never sent; or the window you jumped to dropped by the send.',
    checks: [oneHeadWindow, noGapGluedShut, noDuplicates],
    group: 'own',
    id: 'own-send-after-gap-on-kept-window',
    lookFor:
      'After the reconnect you still see the sim-011 window, with the newest messages (sim-311–sim-410) stored as the head window. Right after you send, the list shows sim-311–sim-410 with your message at the bottom; it stays there once confirmed, and the sim-011 window stays stored.' +
      DONT_SCROLL_BEFORE_RECONNECT,
    precondition: 'open',
    rule: 'Every message you send shows the head window, with your message at the bottom, also when a reconnect across a gap stored it while you read a window you jumped to; that window stays loaded.',
    situation:
      'You jump to sim-011, into a window of its own far from the head window; you go offline, 110 messages arrive and you reconnect, which keeps you on the sim-011 window. Then you send a message, and the server confirms it.',
    steps: [
      seed(3, 'pages'),
      jumpToUnloadedWindow,
      goOfflineWindowsApart(2),
      gapArrives,
      reconnectKeepsJumpedWindow,
      youSendAMessage([
        yourMessageAtTheBottom,
        storedNotRead(unloadedMessageId),
        windowCount(2),
      ]),
      serverConfirmsYourMessage([
        yourMessageAtTheBottom,
        readsHead,
        storedNotRead(unloadedMessageId),
        windowCount(2),
      ]),
    ],
    title: 'You send a message on the window a reconnect kept you on',
  },
  {
    bugPrevented:
      "The live message attached to the window you read, across the messages between it and the head; or you pulled off your window by someone else's message.",
    checks: [oneHeadWindow, noGapGluedShut, noDuplicates],
    group: 'reconnect',
    id: 'live-message-after-gap-on-kept-window',
    lookFor:
      'After the reconnect you still see the sim-011 window, with sim-311–sim-410 stored as the head window. When sim-411 arrives nothing moves: it joins the stored head window (sim-311–sim-411), and "jump to latest" would show it.' +
      DONT_SCROLL_BEFORE_RECONNECT,
    precondition: 'open',
    rule: "A live message goes to the head window, stored while you read a window you jumped to; someone else's message never moves you.",
    situation:
      'You jump to sim-011, into a window of its own far from the head window; you go offline, 110 messages arrive and you reconnect, which keeps you on the sim-011 window. Then a live message from someone else arrives.',
    steps: [
      seed(3, 'pages'),
      jumpToUnloadedWindow,
      goOfflineWindowsApart(2),
      gapArrives,
      reconnectKeepsJumpedWindow,
      {
        ...liveMessageArrives,
        checks: [
          stillReading,
          readingAround(unloadedMessageId),
          headStoredNotRead,
          windowCount(2),
        ],
      },
    ],
    title: 'A live message on the window a reconnect kept you on',
  },
  {
    bugPrevented:
      'Your unsent messages lost when the reconnect drops the old head window, or shown in the window you jumped to, among old messages.',
    checks: [unsentKeptInHeadWindow(2), noDuplicates],
    group: 'own',
    id: 'unsent-messages-while-on-kept-window',
    lookFor:
      'Your failed message joins the head window (sim-201–sim-300), not the sim-011 window you read: it carries the device clock, newer than every loaded message. Your sending message then shows the head window. Back on the sim-011 window, after the reconnect sim-201–sim-300 is gone and both your messages are in the newest messages stored as the head window.' +
      DONT_SCROLL_BEFORE_RECONNECT,
    precondition: 'open',
    rule: "An unsent message sorts by the device's clock, so it joins the head window, never a window you jumped to; a reconnect across a gap keeps it in the head window it stores.",
    situation:
      'You jump to sim-011, into a window of its own far from the head window. A message you send fails, and another stays sending (which shows the head window); you jump back to sim-011, go offline, more than a page of messages arrives, and you reconnect.',
    steps: [
      seed(3, 'pages'),
      jumpToUnloadedWindow,
      {
        ...yourSendFails,
        checks: [readingAround(unloadedMessageId), unsentKeptInHeadWindow(1)],
      },
      {
        ...yourSendHangs,
        checks: [
          yourMessageAtTheBottom,
          unsentKeptInHeadWindow(2),
          storedNotRead(unloadedMessageId),
        ],
      },
      jump('Jump back to sim-011 (stored: lands at once)', unloadedMessageId, {
        checks: [
          readingAround(unloadedMessageId),
          readsWindowApartFromHead,
          windowCount(2),
          unsentKeptInHeadWindow(2),
        ],
        wait: true,
      }),
      goOfflineWindowsApart(2),
      gapArrives,
      reconnectKeepsJumpedWindow,
    ],
    title: 'Unsent messages while you read a window you jumped to, then a gap',
  },
  {
    bugPrevented:
      'Being pulled off the window you read by a reconnect, or stale windows kept beside it: nothing brought them up to date, so a message deleted meanwhile would come back with them.',
    checks: [oneHeadWindow, noGapGluedShut, noDuplicates],
    group: 'reconnect',
    id: 'gap-with-three-windows',
    lookFor:
      'After the second jump three windows are loaded: around sim-011, around sim-350 (shown) and the head window sim-501–sim-600. After the reconnect only two are left: the sim-350 window, still shown, and the newest messages (sim-611–sim-710) stored as the head window. "Jump to latest" then shows them without a request.' +
      DONT_SCROLL_BEFORE_RECONNECT,
    precondition: 'open',
    rule: 'A reconnect across a gap keeps you on the window you read and stores the newest page as the head window; every other window is dropped.',
    situation:
      'In a 600-message channel you jump to sim-011, then to sim-350: each opens a window of its own, apart from the head window sim-501–sim-600. You go offline, 110 messages arrive, you reconnect, then jump to the latest.',
    steps: [
      seed(6, 'pages'),
      jumpToUnloadedWindow,
      jump(
        'Jump to sim-350 (not loaded either: it opens a third window)',
        () => sim(350),
        {
          checks: [
            readingAround(() => sim(350)),
            readsWindowApartFromHead,
            storedNotRead(unloadedMessageId),
            windowCount(3),
          ],
          wait: true,
        },
      ),
      goOfflineWindowsApart(3),
      gapArrives,
      reconnect('reload', [
        readingAround(() => sim(350)),
        headStoredNotRead,
        windowCount(2),
        notLoaded(() => sim(11)),
        notLoaded(() => sim(550)),
        oneHeadWindow,
        noGapGluedShut,
      ]),
      jumpToLatest([sentNoRequest, readsHead]),
    ],
    title: 'Three windows loaded, then a reconnect brings a new head',
  },
  {
    bugPrevented:
      'The button counting only the messages that arrived as events (3) while the pill counts all you missed (113); or the list left at the top of the newest page after the reconnect instead of at its bottom.',
    checks: [readsHead, noDuplicates],
    group: 'screen',
    id: 'screen-unread-count-after-gap',
    lookFor:
      'After the reconnect the list rests at the bottom of the newest messages (sim-111–sim-210). After you scroll up and 3 arrive, the scroll-to-latest button shows 113 and the pill says "113 new messages".',
    precondition: 'open',
    rule: 'After a reconnect across a gap the list rests at the bottom; the scroll-to-latest button shows your unread count in the channel (the missed messages and the live ones), and the "New Messages!" pill the same.',
    situation:
      'A 100-message channel, all read; you scroll up a bit, go offline, 110 messages arrive, and you reconnect. You scroll up a bit again and 3 live messages arrive. (The test channel never marks anything read, so resting at the bottom after the reconnect does not clear the count, as it would in a real channel.)',
    steps: [
      seed(100),
      scrollUpABit('Scroll the list up a bit'),
      goOffline,
      gapArrives,
      reconnect('reload', [readsHead, listRestsAtBottom]),
      scrollUpABit('Scroll up a bit again'),
      {
        ...liveMessagesArrive,
        checks: [scrollToLatestShowsUnreadCount, newMessagesPillShowsUnreadCount],
      },
    ],
    title: 'Unread count on the scroll-to-latest button after a gap',
  },
  {
    bugPrevented:
      'The list jumping to the top of the newly loaded page (and from there loading yet another), or loading only once you hit the very top, so scrolling stalls.',
    checks: [noDuplicates, noGapGluedShut],
    group: 'screen',
    id: 'screen-older-page-keeps-place',
    lookFor:
      'While you scroll up from the bottom of sim-201–sim-300, sim-101–sim-200 starts loading before the list reaches its top and the loading indicator shows above the messages; when the page lands, the message at the top of the list stays where it was while it loaded.',
    precondition: 'open',
    rule: 'Loading older messages starts before you reach the top of the list, and keeps the message you were looking at in place when the page lands above it.',
    situation:
      'A 300-message channel opens at its newest 100 (sim-201–sim-300); you scroll up step by step, as with a wheel, until older messages load.',
    steps: [
      seed(3, 'pages'),
      scrollUpUntilOlderLoad([
        olderLoadStartedBeforeTop,
        placeKeptAcrossOlderLoad,
        loadedOlderPage,
      ]),
    ],
    title: 'Scrolling up loads older messages and keeps your place',
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
    const judged = await Promise.all(checks.map((check) => check(input)));
    const results = [...this.state.getLatestValue().results];
    results[index] = judged;
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
