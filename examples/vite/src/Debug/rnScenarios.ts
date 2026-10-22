import type { Channel, MessageFocusReason } from 'stream-chat';

import type { FakeChannelBackend, ReceivedQuery } from './fakeChannelBackend';
import { sequenceOf, simulatedMessageId } from './fakeTimeline';
import type {
  Scenario,
  ScenarioCheck,
  ScenarioStep,
  SharedScenarioParts,
} from './paginationScenarios';
import type { WindowsView } from './paginatorWindows';
import { lastOf, rangeOf, windowWith } from './paginatorWindows';

/**
 * Scenarios adopted from the React Native team's test page for the paginator work. They run at the
 * page size React Native opens a channel with, 25, so their message ids read as on that page: a
 * 60-message channel opens at sim-036–sim-060. Each title ends with the page's id (RN S1, …).
 *
 * The expected results follow today's SDK rules, not the page's results, which were recorded on an
 * older build. Where a step of the page has no equivalent in this app (React Native re-watches a
 * channel when it is opened again; this app leaves that to the reconnect) the scenario says so in
 * its situation.
 *
 * Every step notes where the fake backend's query log stands before it runs, so a check can count
 * the requests the step sent. The steps run by themselves, so Run all goes through without you.
 *
 * Built from the shared steps and checks of `paginationScenarios.ts`, passed in rather than
 * imported: that file lists these scenarios, so importing it back would be a cycle.
 */

/** The page size React Native opens a channel with (`useChannelLifecycle`). */
export const RN_PAGE_SIZE = 25;

const sim = simulatedMessageId;

/** e.g. "sim-040 and sim-055" */
const listOf = (ids: string[]) =>
  ids.length > 1 ? `${ids.slice(0, -1).join(', ')} and ${lastOf(ids)}` : (ids[0] ?? '');

// ---- counting requests -----------------------------------------------------------------------

/** When the current step started, and how many queries the backend had received by then. */
type StepStart = { queryCount: number; startedAt: number };

const stepStarts = new WeakMap<FakeChannelBackend, StepStart>();

/** Notes when the step starts and where the query log stands, before it runs. */
const markingStepStart = (step: ScenarioStep): ScenarioStep => ({
  ...step,
  run: (context) => {
    stepStarts.set(context.backend, {
      queryCount: context.backend.receivedQueries.length,
      startedAt: Date.now(),
    });
    return step.run?.(context);
  },
});

const requestsDuringStep = (backend: FakeChannelBackend) =>
  backend.receivedQueries.slice(
    stepStarts.get(backend)?.queryCount ?? backend.receivedQueries.length,
  );

/** e.g. "channel query id_lt sim-036, limit 25 (25 messages)" */
const describeRequests = (queries: ReceivedQuery[]) =>
  queries
    .map(
      ({ answeredCount, label }) =>
        `${label} (${answeredCount === undefined ? 'not answered yet' : `${answeredCount} messages`})`,
    )
    .join('; ');

const isEmptyAnswer = (query: ReceivedQuery) => query.answeredCount === 0;

/** A scenario of the React Native page: its page size, and steps whose start is noted. */
const rnScenario = (scenario: Omit<Scenario, 'pageSize'>): Scenario => ({
  ...scenario,
  pageSize: RN_PAGE_SIZE,
  steps: scenario.steps.map(markingStepStart),
});

export const rnScenarios = ({
  goOffline,
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
  opensAtNewestPage,
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
}: SharedScenarioParts): Scenario[] => {
  /** The ids of the messages the server has, in the window you see. */
  const serverIdsShown = (channel: Channel, ids: string[] | undefined) =>
    (ids ?? []).filter((id) => !isUnsent(channel, id));

  // ---- checks --------------------------------------------------------------------------------

  /** The server's messages from `sim-first` to `sim-last`, in order. */
  const serverIdsBetween = (backend: FakeChannelBackend, first: number, last: number) =>
    backend.timeline
      .map((message) => message.id)
      .filter((id) => {
        const sequence = sequenceOf(id) ?? 0;
        return sequence >= first && sequence <= last;
      });

  /** The simulated messages (`sim-…`) in the window you see; your own messages are left out. */
  const simIdsShown = (view: WindowsView) =>
    (view.read?.messageIds ?? []).filter((id) => sequenceOf(id) !== undefined);

  const isSameRun = (ids: string[], expected: string[]) =>
    ids.length === expected.length && ids.every((id, index) => id === expected[index]);

  /**
   * The simulated messages (`sim-…`) in the window you see are exactly the server's from
   * `sim-first` to `sim-last`, each once and in order: none skipped, none the server deleted.
   * Your own messages are left out.
   */
  const reads =
    (first: number, last: number): ScenarioCheck =>
    ({ backend, now }) => {
      const expected = serverIdsBetween(backend, first, last);
      const shown = simIdsShown(now);
      const range = `${sim(first)}–${sim(last)}`;
      return verdict(
        isSameRun(shown, expected),
        `You see ${range} (${expected.length} messages)`,
        `You see ${rangeOf(shown)} (${shown.length} messages); expected the server's ${range} (${expected.length})`,
      );
    };

  /**
   * Like {@link reads}, but the window you see may also hold older messages: ones the list loaded
   * by itself (a reader near the top of a short window), or a window you jumped to that it joined,
   * which no reload brought up to date. From `sim-first` on it holds exactly the server's messages
   * up to `sim-last`; what is older is not judged.
   */
  const readsAtLeast =
    (first: number, last: number): ScenarioCheck =>
    ({ backend, now }) => {
      const expected = serverIdsBetween(backend, first, last);
      const shown = simIdsShown(now);
      const fromFirst = shown.filter((id) => (sequenceOf(id) ?? 0) >= first);
      const range = `${sim(first)}–${sim(last)}`;
      return verdict(
        isSameRun(fromFirst, expected),
        fromFirst.length < shown.length
          ? `You see ${rangeOf(shown)}: the server's ${range} (${expected.length} messages), after older ones`
          : `You see ${range} (${expected.length} messages)`,
        `You see ${rangeOf(shown)}; from ${sim(first)} on, ${rangeOf(fromFirst)} (${fromFirst.length} messages); expected the server's ${range} (${expected.length}), after any older ones`,
      );
    };

  const holdsMessages =
    (count: number): ScenarioCheck =>
    ({ channel, now }) => {
      const held = serverIdsShown(channel, now.read?.messageIds).length;
      return verdict(
        held === count,
        `The window you see holds ${count} of the server's messages`,
        `The window you see holds ${held} of the server's messages; expected ${count}`,
      );
    };

  /** The window you see knows it reaches the head: nothing newer is left to load. */
  const readsMarkedHead: ScenarioCheck = ({ now }) => {
    const range = rangeOf(now.read?.messageIds);
    return verdict(
      !!now.read?.headLoaded && !now.read.canLoadHeadwards,
      `The window you see (${range}) is marked as the head: nothing newer to load`,
      now.read?.canLoadHeadwards
        ? `The window you see (${range}) still offers to load newer: it is not marked as the head`
        : `The window you see (${range}) is not marked as the head`,
    );
  };

  const noRequest: ScenarioCheck = ({ backend }) => {
    const sent = requestsDuringStep(backend);
    return verdict(
      !sent.length,
      'No request was sent',
      `${sent.length} request(s) sent: ${describeRequests(sent)}`,
    );
  };

  const noEmptyRequest: ScenarioCheck = ({ backend }) => {
    const empty = requestsDuringStep(backend).filter(isEmptyAnswer);
    return verdict(
      !empty.length,
      'No request came back empty',
      `A request that was not needed came back empty: ${describeRequests(empty)}`,
    );
  };

  /**
   * One request, the reload of the newest messages, plus at most one asking for anything older,
   * which finds nothing.
   */
  const reloadWithAtMostOneEmptyProbe: ScenarioCheck = ({ backend }) => {
    const [reload, ...rest] = requestsDuringStep(backend);
    const isAnsweredReload =
      !!reload && reload.label.includes('newest') && !!reload.answeredCount;
    const isEmptyProbeForOlder = (query: ReceivedQuery) =>
      query.label.includes('id_lt') && isEmptyAnswer(query);
    return verdict(
      isAnsweredReload && rest.length <= 1 && rest.every(isEmptyProbeForOlder),
      rest.length
        ? 'The reload and one request for anything older, which found nothing'
        : 'Only the reload was sent',
      `Expected the reload and at most one empty request for anything older; sent: ${describeRequests(
        requestsDuringStep(backend),
      )}`,
    );
  };

  const deletedNotLoaded =
    (...sequences: number[]): ScenarioCheck =>
    ({ now }) => {
      const ids = sequences.map(sim);
      const loaded = ids.filter((id) => windowWith(now, id));
      return verdict(
        !loaded.length,
        `${listOf(ids)} ${ids.length > 1 ? 'are' : 'is'} not loaded`,
        `${listOf(loaded)} still loaded though the server deleted ${loaded.length > 1 ? 'them' : 'it'}`,
      );
    };

  /** The window that held `sim-sequence` before a reload replaced the windows is gone. */
  const oldWindowDropped =
    (sequence: number): ScenarioCheck =>
    ({ now }) => {
      const kept = windowWith(now, sim(sequence));
      return verdict(
        !kept,
        `The old window (with ${sim(sequence)}) is dropped`,
        `The old window is still loaded (${rangeOf(kept?.messageIds)})`,
      );
    };

  /** The jump in this step focused `sim-sequence`, for the reason given. */
  const focused =
    (sequence: number, reason: MessageFocusReason): ScenarioCheck =>
    ({ backend, channel }) => {
      const { signal } = channel.messagePaginator.messageFocusSignal.getLatestValue();
      const isThisStep =
        !!signal && signal.createdAt >= (stepStarts.get(backend)?.startedAt ?? 0);
      return verdict(
        isThisStep && signal.messageId === sim(sequence) && signal.reason === reason,
        `The jump landed on ${sim(sequence)}`,
        isThisStep
          ? `The jump landed on ${signal.messageId} (${signal.reason}); expected ${sim(sequence)}`
          : 'The jump landed on no message',
      );
    };

  // ---- steps ---------------------------------------------------------------------------------

  const seedWithUnread = (count: number, unread: number): ScenarioStep => ({
    checks: [opensAtNewestPage],
    label: `Seed ${count} messages on the server, the newest ${unread} unread for you, then open the channel: it loads its newest page`,
    run: async ({ backend }) => {
      backend.setHoldAnswers(false);
      backend.setOnline(true);
      backend.seed(count);
      backend.markUnread(unread);
      await backend.reopen();
    },
  });

  const loadOlder = (checks?: ScenarioCheck[]): ScenarioStep => ({
    checks,
    label: 'Load older: one page tailwards (you scroll up)',
    run: ({ channel }) => channel.messagePaginator.toTail(),
  });

  const loadNewer = (checks?: ScenarioCheck[]): ScenarioStep => ({
    checks,
    label: 'Load newer: one page headwards (you scroll down)',
    run: ({ channel }) => channel.messagePaginator.toHead(),
  });

  const scrollUpToTail = (checks?: ScenarioCheck[]): ScenarioStep => ({
    checks,
    label: 'Scroll up to the tail (load more tailwards until nothing more loads)',
    run: ({ channel }) => loadToTheEnd(channel, 'tail'),
  });

  const jumpTo = (sequence: number, checks?: ScenarioCheck[]): ScenarioStep =>
    jump(`Jump to ${sim(sequence)}`, () => sim(sequence), { checks, wait: true });

  const jumpToFirstUnread = (checks?: ScenarioCheck[]): ScenarioStep => ({
    checks,
    label: 'Jump to the first unread message',
    run: async ({ channel, log }) => {
      const landed = await channel.messagePaginator.jumpToTheFirstUnreadMessage();
      log(`jump to the first unread: ${landed ? 'landed' : 'did not land'}`);
    },
  });

  const missedWhileOffline = (count: number): ScenarioStep => ({
    label: `${count} messages arrive while you are offline (no events reach you)`,
    run: ({ backend }) => backend.addMessages(count),
  });

  const liveMessages = (count: number, checks?: ScenarioCheck[]): ScenarioStep => ({
    checks,
    label: `${count} live message${count > 1 ? 's' : ''} arrive${count > 1 ? '' : 's'} (online, with events)`,
    run: ({ backend }) => backend.addMessages(count),
  });

  /** Back online before any reload, and the first event is a new message. */
  const liveMessageBeforeReload = (checks?: ScenarioCheck[]): ScenarioStep => ({
    checks,
    label: 'Back online, a live message arrives before any reload',
    run: ({ backend }) => {
      backend.setOnline(true);
      backend.addMessages(1);
    },
  });

  const deletedWhileOffline = (...sequences: number[]): ScenarioStep => ({
    label: `The server hard-deletes ${listOf(sequences.map(sim))} (no event)`,
    run: ({ backend }) =>
      sequences.forEach((sequence) => backend.hardDelete(sim(sequence))),
  });

  const leaveChannel: ScenarioStep = {
    label: 'Leave the channel (it closes in the app)',
    run: ({ app }) => app.close(),
  };

  const openInApp = (checks?: ScenarioCheck[]): ScenarioStep => ({
    checks,
    label: 'Open the test channel in the app',
    run: ({ app }) => app.open(),
  });

  /** Releases the held answers; later requests are answered at once. */
  const heldAnswerArrives = (checks?: ScenarioCheck[]): ScenarioStep => ({
    checks,
    label: 'The held answer arrives (the server answers at once again)',
    run: ({ backend }) => backend.setHoldAnswers(false),
  });

  // ---- scenarios -----------------------------------------------------------------------------

  return [
    // basics
    rnScenario({
      bugPrevented:
        'Pages that do not join the window you read, endless loading at either end, or messages repeated.',
      checks: [noDuplicates, oneHeadWindow],
      group: 'basics',
      id: 'rn-s1-scroll-through-history',
      lookFor:
        'sim-036–sim-060, then sim-011–sim-060, then sim-001–sim-060 with "tail loaded"; loading newer adds nothing.',
      precondition: 'open',
      rule: 'Each older page joins the window you read; loading stops at the tail; with the head loaded, loading newer sends no request.',
      situation:
        'A 60-message channel opens at its newest page (sim-036–sim-060); you load older twice, reaching its first message, then load newer.',
      steps: [
        { ...seed(60), checks: [reads(36, 60)] },
        loadOlder([reads(11, 60)]),
        loadOlder([reads(1, 60), stopsAtTail]),
        loadNewer([noRequest, reads(1, 60)]),
      ],
      title: 'Scroll up through a 60-message channel, then back down (RN S1)',
    }),
    rnScenario({
      bugPrevented:
        'The old window glued to the newest page, hiding the missed messages for good, or history that stops short of the tail.',
      checks: [noGapGluedShut, noDuplicates],
      group: 'basics',
      id: 'rn-h5-w1-whole-channel-then-gap',
      lookFor:
        'After the reconnect sim-086–sim-110 only; scrolling up ends at sim-001–sim-110 in one window, "tail loaded".',
      precondition: 'open',
      rule: 'A reconnect across a gap shows the newest page and drops the old window; scrolling up loads every missed message back to the tail.',
      situation:
        'All 10 messages of a channel are loaded (head and tail); while you are offline 100 arrive; you reconnect and scroll up from the newest.',
      steps: [
        seed(10),
        goOffline,
        missedWhileOffline(100),
        reconnect('reload', [reads(86, 110), readsHead, oldWindowDropped(1)]),
        scrollUpToTail([reads(1, 110), stopsAtTail]),
      ],
      title:
        'A fully loaded 10-message channel misses 100, reconnects, scrolls up (RN H5-W1)',
    }),
    rnScenario({
      bugPrevented:
        'The live message going to a hidden window, or the missed messages skipped when the windows join.',
      checks: [noGapGluedShut, noDuplicates, oneHeadWindow],
      group: 'basics',
      id: 'rn-h5-w2-live-message-after-gap',
      lookFor:
        'sim-111 at the bottom right after it arrives; scrolling up ends at sim-001–sim-111 in one window.',
      precondition: 'open',
      rule: 'A live message after the reconnect joins the newest window at the bottom; scrolling up joins every missed message into the same window.',
      situation:
        'All 10 messages are loaded; while you are offline 100 arrive; you reconnect, a live message (sim-111) arrives, and you scroll up. (On the React Native page you loaded newer from the old window; today the reconnect drops that window.)',
      steps: [
        seed(10),
        goOffline,
        missedWhileOffline(100),
        reconnect('reload', [reads(86, 110)]),
        { ...liveMessageArrives, checks: [liveAtTheBottom] },
        scrollUpToTail([reads(1, 111), stopsAtTail]),
      ],
      title: 'Same, with a live message after the reconnect (RN H5-W2)',
    }),

    // reconnect & gaps
    rnScenario({
      bugPrevented:
        'Being left on the old window with the newest hidden, an unsent message lost, or messages repeated.',
      checks: [noDuplicates, noGapGluedShut, unsentKeptInHeadWindow(2)],
      group: 'reconnect',
      id: 'rn-s5-unsent-messages-across-gap',
      lookFor:
        'After the reconnect sim-094–sim-120 with your failed and your sending message; loading newer and jumping send nothing; loading older reaches sim-044, each message once.',
      precondition: 'open',
      rule: 'A reconnect across a gap shows the newest page, keeping your unsent messages; nothing repeats while you move around.',
      situation:
        "You're at the head of a 60-message channel (sim-036–sim-060). Offline, a message you send fails and another stays sending; 60 messages arrive; you reconnect, load newer, jump to the latest and load older twice.",
      steps: [
        seed(60),
        goOffline,
        yourSendFails,
        yourSendHangs,
        missedWhileOffline(60),
        reconnect('reload', [reads(94, 120), readsHead, unsentKeptInHeadWindow(2)]),
        loadNewer([noRequest]),
        jumpToLatest([sentNoRequest, readsHead]),
        loadOlder(),
        loadOlder([reads(44, 120)]),
      ],
      title: 'Reconnect after 60 missed, with a failed and a sending message (RN S5)',
    }),
    rnScenario({
      bugPrevented:
        'A connecting page shown as a separate window, being moved away, or the live message twice.',
      checks: [readsHead, noGapGluedShut, noDuplicates],
      group: 'reconnect',
      id: 'rn-g3-live-message-during-reload-no-gap',
      lookFor: 'After the answer one window sim-036–sim-071, the live message once.',
      precondition: 'open',
      rule: 'A newest page that connects to what you read merges into it, and you stay where you are.',
      situation:
        "You're at the head (sim-036–sim-060); offline, 10 messages arrive (less than a page: no gap); on reconnect the reload is slow, and a live message (sim-071) arrives before it answers.",
      steps: [
        seed(60),
        goOffline,
        missedWhileOffline(10),
        reconnectWithSlowReload,
        liveMessageArrives,
        heldAnswerArrives([stillReading, reads(36, 71)]),
      ],
      title: 'A live message during the reconnect reload, no gap (RN G3)',
    }),
    rnScenario({
      bugPrevented:
        'Staying on the old window after the reconnect, with the newest hidden.',
      checks: [noGapGluedShut, oneHeadWindow],
      group: 'reconnect',
      id: 'rn-s15-reopen-then-reconnect',
      lookFor:
        'After opening it again sim-036–sim-060; after the reconnect sim-066–sim-090.',
      precondition: 'open',
      rule: 'Opening a channel again shows what is loaded; the reconnect reload, which cannot connect to it, shows the newest page.',
      situation:
        'You leave a 60-message channel; the app goes to the background (offline) and 30 messages arrive; nothing refreshes the channel list; you open the channel again, then the app reconnects.',
      steps: [
        seed(60),
        leaveChannel,
        goOffline,
        missedWhileOffline(30),
        openInApp([reads(36, 60)]),
        // The list sits near the top of the short newest page and may load an older page itself.
        reconnect('reload', [readsAtLeast(66, 90), readsHead]),
      ],
      title: 'Leave, 30 missed in the background, open again, reconnect (RN S15)',
    }),

    // offline deletes
    rnScenario({
      bugPrevented: 'Ghost messages: shown here, gone everywhere else.',
      checks: [deletedNotLoaded(40, 55), readsHead],
      group: 'deletes',
      id: 'rn-d1-two-deleted-offline',
      lookFor: 'After the reload sim-036–sim-062 without sim-040 and sim-055.',
      precondition: 'open',
      rule: 'The reload removes the messages the server no longer has.',
      situation:
        "You're at the head (sim-036–sim-060); while you are offline the server hard-deletes sim-040 and sim-055 and 2 messages arrive; you reconnect.",
      steps: [
        seed(60),
        goOffline,
        deletedWhileOffline(40, 55),
        missedWhileOffline(2),
        reconnect('reload', [reads(36, 62)]),
      ],
      title: 'Two messages deleted while offline, 2 new, reconnect (RN D1)',
    }),
    rnScenario({
      bugPrevented: 'Ghost messages left in the part of the window the reload reaches.',
      checks: [deletedNotLoaded(20, 55), readsHead, noGapGluedShut],
      group: 'deletes',
      id: 'rn-d9-deleted-in-a-100-message-window',
      lookFor: 'After the reload one window sim-001–sim-110 with 108 messages.',
      precondition: 'open',
      rule: 'The reload asks for as many messages as the head window holds and removes every deleted one among them.',
      situation:
        'All 100 messages of a channel are loaded in one window; while you are offline the server hard-deletes sim-020 and sim-055 and 10 messages arrive; you reconnect.',
      steps: [
        seed(100),
        scrollUpToTail([reads(1, 100)]),
        goOffline,
        deletedWhileOffline(20, 55),
        missedWhileOffline(10),
        reconnect('reload', [reads(1, 110)]),
      ],
      title: '100 loaded, 2 deleted while offline, 10 new, reconnect (RN D9)',
    }),
    rnScenario({
      bugPrevented:
        'The deleted message kept in the old window and shown again when you scroll into it.',
      checks: [noGhosts, holdsMessages(119), stopsAtTail, noGapGluedShut],
      group: 'deletes',
      id: 'rn-d2-deleted-across-gap',
      lookFor:
        'sim-040 never shows; at the tail one window sim-001–sim-120 with 119 messages.',
      precondition: 'open',
      rule: 'A reconnect across a gap shows the newest page and drops the old window with the deleted message; scrolling back loads history from the server, without it.',
      situation:
        "You're at the head (sim-036–sim-060); while you are offline the server hard-deletes sim-040 and 60 messages arrive; you reconnect, load newer, jump to the latest, and scroll up to the tail.",
      steps: [
        seed(60),
        goOffline,
        deletedWhileOffline(40),
        missedWhileOffline(60),
        reconnect('reload', [readsHead, deletedNotLoaded(40)]),
        loadNewer([noRequest]),
        jumpToLatest([readsHead]),
        scrollUpToTail(),
      ],
      title:
        'Deleted while offline across a gap, then load newer, jump, scroll back (RN D2, D2b)',
    }),
    rnScenario({
      bugPrevented:
        'The 5 new messages missing after the jump, or the deleted sim-050 shown again.',
      checks: [deletedNotLoaded(50), oneHeadWindow, noGapGluedShut],
      group: 'deletes',
      id: 'rn-d3-deleted-in-stored-and-jumped-windows',
      lookFor:
        'After the jump sim-036–sim-065 without sim-050 (older messages may also show, if the list loaded them). Known limitation: sim-010 stays in the window you jumped to, as the reload refreshes only the newest messages.',
      precondition: 'open',
      rule: 'The reload brings the 5 new messages into the head window and removes sim-050 from it; you stay where you were until you jump.',
      situation:
        'You jumped to sim-005; the head window sim-036–sim-060 stays stored. While you are offline the server hard-deletes sim-050 (in the head window) and sim-010 (in the window you read), and 5 messages arrive; you reconnect, then jump to the latest.',
      steps: [
        seed(60),
        jumpTo(5),
        goOffline,
        deletedWhileOffline(50, 10),
        missedWhileOffline(5),
        reconnect('reload', [readingAround(() => sim(5))]),
        jumpToLatest([readsAtLeast(36, 65), readsHead]),
      ],
      title:
        'Deletes in the stored and the jumped-to window, 5 new, reconnect, jump (RN D3)',
    }),
    rnScenario({
      bugPrevented:
        'The deleted message kept in the old window and shown when you scroll into it.',
      checks: [noGhosts, holdsMessages(99), noGapGluedShut],
      group: 'deletes',
      id: 'rn-d6-closed-channel-deleted-across-gap',
      lookFor:
        'After the refresh the newest page sim-076–sim-100; scrolling up ends at sim-001–sim-100 with 99 messages, without sim-050.',
      precondition: 'closed',
      rule: 'A channel-list refresh of a channel nobody reads, across a gap, replaces its windows with the newest page.',
      situation:
        'The test channel is closed, with sim-036–sim-060 loaded; while you are offline the server hard-deletes sim-050 and 40 messages arrive; the channel list refreshes on reconnect; you open the channel and scroll up to the tail.',
      steps: [
        seed(60),
        goOffline,
        deletedWhileOffline(50),
        missedWhileOffline(40),
        reconnect('channel list', [reads(76, 100), deletedNotLoaded(50)]),
        openInApp(),
        scrollUpToTail([stopsAtTail]),
      ],
      title:
        'Closed channel: deleted across a gap, list refresh, open, scroll back (RN D6)',
    }),
    rnScenario({
      bugPrevented:
        'The deleted messages left in place, or loading older that never stops at the tail.',
      checks: [noGhosts, reads(4, 10), stopsAtTail],
      group: 'deletes',
      id: 'rn-d7-oldest-deleted-in-whole-channel',
      lookFor: 'sim-004–sim-010 with "tail loaded".',
      precondition: 'open',
      rule: 'The reload removes the deleted messages and the window still holds the tail; at most one request asks for anything older.',
      situation:
        'All 10 messages of a channel are loaded; while you are offline the server hard-deletes the 3 oldest (sim-001–sim-003); you reconnect.',
      steps: [
        seed(10),
        goOffline,
        deletedWhileOffline(1, 2, 3),
        reconnect('reload', [reloadWithAtMostOneEmptyProbe]),
      ],
      title: 'A fully loaded 10-message channel loses its 3 oldest, reconnect (RN D7)',
    }),

    // jumps & stale head
    rnScenario({
      bugPrevented:
        'A request for messages already loaded, or the list moving off the window that holds them.',
      checks: [readsHead, oneHeadWindow],
      group: 'jumps',
      id: 'rn-s2a-first-unread-loaded',
      lookFor: 'The list stays on sim-036–sim-060 throughout, with no request.',
      precondition: 'open',
      rule: 'A jump to a message in the loaded window needs no request.',
      situation:
        'The newest 10 messages are unread for you; the channel opens at sim-036–sim-060, which holds the first unread (sim-051). You jump to the first unread, then to the latest.',
      steps: [
        seedWithUnread(60, 10),
        jumpToFirstUnread([
          focused(51, 'jump-to-first-unread'),
          noRequest,
          reads(36, 60),
        ]),
        jumpToLatest([sentNoRequest, reads(36, 60)]),
      ],
      title: 'Open with 10 unread, the first unread loaded, jump to the latest (RN S2a)',
    }),
    rnScenario({
      bugPrevented:
        'An extra empty request on the jump, because the joined window was not marked as the head.',
      checks: [noGapGluedShut, noDuplicates, oneHeadWindow],
      group: 'jumps',
      id: 'rn-s2b-first-unread-not-loaded',
      lookFor:
        'The jump loads the page around sim-021; one load newer joins it to the head window, marked as the head; the jump to the latest sends nothing.',
      precondition: 'open',
      rule: 'A page that joins the head window marks the joined window as the head, so jumping to the latest needs no request.',
      situation:
        'The newest 40 messages are unread for you: the first unread (sim-021) is older than the opened page (sim-036–sim-060). You jump to the first unread, load newer once, then jump to the latest.',
      steps: [
        seedWithUnread(60, 40),
        jumpToFirstUnread([
          focused(21, 'jump-to-first-unread'),
          readingAround(() => sim(21)),
        ]),
        loadNewer([readsMarkedHead, noEmptyRequest]),
        jumpToLatest([sentNoRequest, readsHead]),
      ],
      title:
        'Open with 40 unread, the first unread not loaded, jump, load newer (RN S2b)',
    }),
    rnScenario({
      bugPrevented:
        'An extra empty request to learn that the joined window reaches the head.',
      checks: [readsHead, oneHeadWindow, noDuplicates],
      group: 'jumps',
      id: 'rn-s3-jump-old-then-join',
      lookFor:
        'After one load newer one window sim-001–sim-060, marked as the head; the jump to the latest sends nothing.',
      precondition: 'open',
      rule: 'The page that joins the head window marks the joined window as the head at once: one request joins, and the jump needs none.',
      situation:
        'You jump to sim-005 in a 60-message channel (the head window sim-036–sim-060 stays stored), load newer until the windows join, then jump to the latest.',
      steps: [
        seed(60),
        jumpTo(5, [readingAround(() => sim(5))]),
        loadNewer([readsMarkedHead, reads(1, 60), noEmptyRequest]),
        jumpToLatest([sentNoRequest, reads(1, 60)]),
      ],
      title:
        'Jump to an old message, load newer until joined, jump to the latest (RN S3, H5-W3)',
    }),
    rnScenario({
      bugPrevented:
        'Live messages attached to the window you jumped to, or missing from the head window.',
      checks: [oneHeadWindow, noGapGluedShut],
      group: 'jumps',
      id: 'rn-s8-live-while-jumped',
      lookFor:
        'You stay on the window around sim-005 while the 2 arrive; the jump shows sim-036–sim-062 (older messages may also show, if the list loaded them) with no request.',
      precondition: 'open',
      rule: 'Live messages go to the head window, stored while you read elsewhere; jumping to the latest shows it.',
      situation:
        'You jump to sim-005 in a 60-message channel; 2 live messages arrive; you jump to the latest.',
      steps: [
        seed(60),
        jumpTo(5),
        liveMessages(2, [readingAround(() => sim(5))]),
        jumpToLatest([readsAtLeast(36, 62), readsHead, sentNoRequest]),
      ],
      title: 'Live messages while jumped away, then jump to the latest (RN S8)',
    }),
    rnScenario({
      bugPrevented: 'The 10 missed messages never loaded, or the gap glued shut.',
      checks: [noGapGluedShut, noDuplicates, oneHeadWindow],
      group: 'jumps',
      id: 'rn-s13-socket-drop-load-older-jump',
      lookFor:
        'Loading older gives sim-011–sim-060; the jump stays there with no request; after the reconnect one window sim-011–sim-070 at the head.',
      precondition: 'open',
      rule: 'While the socket is down the loaded head window keeps its mark, as the reconnect will refresh it; the reconnect reload connects to it and brings the missed messages.',
      situation:
        "You're at the head (sim-036–sim-060) when the socket drops; 10 messages arrive unseen; you load older, jump to the latest, then the app reconnects.",
      steps: [
        seed(60),
        goOffline,
        missedWhileOffline(10),
        loadOlder([reads(11, 60)]),
        jumpToLatest([sentNoRequest, reads(11, 60)]),
        reconnect('reload', [reads(11, 70), readsHead]),
      ],
      title: 'Socket drops, 10 new, load older, jump to the latest, reconnect (RN S13)',
    }),
    rnScenario({
      bugPrevented: 'The missed messages never loaded, or the gap glued shut.',
      checks: [noGapGluedShut, noDuplicates, oneHeadWindow],
      group: 'jumps',
      id: 'rn-s13b-socket-drop-40-missed',
      lookFor:
        'Loading older gives sim-011–sim-060; loading newer and the jump send nothing while the socket is down; after the reconnect one window sim-011–sim-100 at the head.',
      precondition: 'open',
      rule: 'While the socket is down the loaded head window keeps its mark, as the reconnect will refresh it; the reconnect reload asks for as many messages as the head window holds, so with 40 missed it still connects and brings them all.',
      situation:
        "You're at the head (sim-036–sim-060) when the socket drops; 40 messages arrive unseen; you load older, load newer, jump to the latest, then the app reconnects.",
      steps: [
        seed(60),
        goOffline,
        missedWhileOffline(40),
        loadOlder([reads(11, 60)]),
        loadNewer([noRequest]),
        jumpToLatest([sentNoRequest, reads(11, 60)]),
        reconnect('reload', [reads(11, 100), readsHead]),
      ],
      title: 'Socket drops, 40 new, load older and newer, jump, reconnect (RN S13b)',
    }),
    rnScenario({
      bugPrevented:
        'The live message glued to sim-060, hiding the 10 missed messages behind a seamless join.',
      checks: [noGapGluedShut, noDuplicates],
      group: 'jumps',
      id: 'rn-s13c-live-message-after-socket-drop',
      lookFor:
        'After the live message nothing skips sim-061–sim-070; the jump shows sim-071 at the head; scrolling up to the tail shows sim-001–sim-071, each once.',
      precondition: 'open',
      rule: 'A live message after missed ones is not joined to the loaded window across them: the missed messages stay reachable.',
      situation:
        "You're at the head (sim-036–sim-060) when the socket drops; 10 messages arrive unseen; you load older; back online, a live message (sim-071) arrives before any reload; you jump to the latest and scroll up to the tail.",
      steps: [
        seed(60),
        goOffline,
        missedWhileOffline(10),
        loadOlder([reads(11, 60)]),
        liveMessageBeforeReload([noGapGluedShut]),
        jumpToLatest([readsHead]),
        scrollUpToTail([reads(1, 71), stopsAtTail]),
      ],
      title: 'Socket drops, 10 new, load older, then a live message (RN S13c)',
    }),
    rnScenario({
      bugPrevented:
        'Live messages lost while the channel was closed, or the jump landing short.',
      checks: [oneHeadWindow],
      group: 'jumps',
      id: 'rn-s14-leave-while-jumped',
      lookFor:
        'Opening it again shows the window around sim-005; the jump shows sim-036–sim-063 with no request.',
      precondition: 'open',
      rule: 'Live messages reach a closed channel that is still watched; its head window holds them for the jump.',
      situation:
        'You jump to sim-005 in a 60-message channel and leave it; 3 live messages arrive; you open it again and jump to the latest.',
      steps: [
        seed(60),
        jumpTo(5),
        leaveChannel,
        liveMessages(3),
        openInApp([readingAround(() => sim(5))]),
        jumpToLatest([reads(36, 63), readsHead, sentNoRequest]),
      ],
      title: 'Leave while jumped, 3 live messages, open again, jump (RN S14)',
    }),
    rnScenario({
      bugPrevented:
        'Being pulled off the window you jumped to by the reconnect, or the jump landing on the stale sim-036–sim-060.',
      checks: [oneHeadWindow, noGapGluedShut],
      group: 'jumps',
      id: 'rn-s14b-leave-while-jumped-then-gap',
      lookFor:
        'After the reconnect you still see the window around sim-005; the newest sim-066–sim-090 are stored as the head window in place of the old one. The list may load newer messages from your window by itself until it joins them. The jump shows the head window and sends nothing.',
      precondition: 'open',
      rule: 'A reconnect reload that connects to nothing loaded stores the newest page as the head window in place of the old one; you stay on the window you jumped to until you jump to the latest.',
      situation:
        'You jump to sim-005 in a 60-message channel and leave it; the app goes to the background (offline) and 30 messages arrive; you open the channel again, the app reconnects, and you jump to the latest. (React Native watches the channel again when it opens; this app leaves that to the reconnect.)',
      steps: [
        seed(60),
        jumpTo(5),
        leaveChannel,
        goOffline,
        missedWhileOffline(30),
        openInApp(),
        reconnect('reload', [readingAround(() => sim(5)), oneHeadWindow, noGapGluedShut]),
        // the list may have loaded newer messages from your window until it joined the head window
        jumpToLatest([sentNoRequest, readsAtLeast(66, 90), readsHead]),
      ],
      title:
        'Leave while jumped, 30 missed in the background, open again, reconnect (RN S14b)',
    }),

    // own messages & empty channel
    rnScenario({
      bugPrevented: 'A "load older" that stays on and sends a request returning nothing.',
      checks: [readsHead],
      group: 'own',
      id: 'rn-s9-empty-channel-gets-live-messages',
      lookFor: 'sim-001–sim-002 with "tail loaded"; no request after the channel opened.',
      precondition: 'open',
      rule: 'An empty first page means the tail is loaded: live messages join it, and loading older sends no request.',
      situation:
        'A channel with no messages is opened (an empty page); 2 live messages arrive; you load older.',
      steps: [
        seed(0),
        liveMessages(2, [noRequest, reads(1, 2)]),
        loadOlder([noRequest, stopsAtTail]),
      ],
      title: 'A new empty channel gets 2 live messages, you scroll up (RN S9)',
    }),
    rnScenario({
      bugPrevented:
        'Your message landing in a window you cannot see, so it looks unsent.',
      checks: [oneHeadWindow, noDuplicates],
      group: 'own',
      id: 'rn-of7-send-while-reading-older-window',
      lookFor:
        'Right after you send, the list shows sim-036–sim-060 with your message at the bottom; it stays there once confirmed.',
      precondition: 'open',
      rule: 'Every message you send shows the newest window, with your message at the bottom.',
      situation:
        'You jumped to sim-005 in a 60-message channel and read there; you send a message, then the server confirms it.',
      steps: [
        seed(60),
        jumpTo(5),
        youSendAMessage([yourMessageAtTheBottom]),
        serverConfirmsYourMessage([yourMessageAtTheBottom, readsHead]),
      ],
      title: 'You send a message while reading an older window (RN OF7, OF8)',
    }),
  ];
};
