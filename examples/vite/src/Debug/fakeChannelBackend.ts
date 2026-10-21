import { StateStore } from '@stream-io/state-store';
import type {
  Channel,
  ChannelResponse,
  ChannelStateResponse,
  Event,
  LocalMessage,
  MessagePaginationParams,
  MessageResponse,
  StreamResponse,
  UserResponse,
} from 'stream-chat';
import { ChannelWatchStatus, formatMessage, msToNs } from 'stream-chat';

import {
  DEFAULT_QUERY_LIMIT,
  fabricateMessage,
  selectPage,
  simulatedMessageId,
} from './fakeTimeline';

/**
 * A fake server for one channel, so the SDK's message pagination can be watched against gaps,
 * hard deletes and slow or reordered answers without touching the Stream API.
 *
 * Only the network answer is faked. `install()` replaces, on the channel instance, the method every
 * message query of the channel ends in — `getOrCreate`, behind `watch()`, `reload()`, `query()` and
 * the message paginator's own queries — and answers it from an in-memory timeline. Everything above
 * it (placing pages, claims, reconciling) is the real SDK code. `markRead` is silenced and the
 * channel is left out of delivery reports, so no request carries a simulated message id.
 *
 * One backend is installed at a time; installing another uninstalls the current one.
 */

/** Page size of the channel list's query (`DEFAULT_QUERY_CHANNELS_MESSAGE_LIST_PAGE_SIZE`). */
export const CHANNEL_LIST_MESSAGE_LIMIT = 25;

const SEED_SPACING_MS = 60_000;

export type PendingAnswer = { id: number; label: string };

/** A message query the backend received, e.g. "channel query id_lt sim-036, limit 25". */
export type ReceivedQuery = {
  label: string;
  /** How many messages the answer held; unset until it is answered. */
  answeredCount?: number;
};

export type FakeBackendState = {
  /** Wait this long before each answer. */
  delayMs: number;
  /** Queue every answer until it is released. */
  holdAnswers: boolean;
  installed: boolean;
  /** While offline, new timeline messages send no `message.new`. */
  online: boolean;
  pending: PendingAnswer[];
  /** The server's messages, oldest first. */
  timeline: MessageResponse[];
};

/** At most one; a set so `install()` can add itself without aliasing `this`. */
const installedBackends = new Set<FakeChannelBackend>();
const backends = new WeakMap<Channel, FakeChannelBackend>();

/** The backend of `channel`, created on first use and kept for the page's lifetime. */
export const getFakeBackend = (channel: Channel) => {
  let backend = backends.get(channel);
  if (!backend) {
    backend = new FakeChannelBackend(channel);
    backends.set(channel, backend);
  }
  return backend;
};

export class FakeChannelBackend {
  readonly state = new StateStore<FakeBackendState>({
    delayMs: 0,
    holdAnswers: false,
    installed: false,
    online: true,
    pending: [],
    timeline: [],
  });
  /** Every message query received, oldest first, so a check can count a step's requests. */
  readonly receivedQueries: ReceivedQuery[] = [];
  /** The message paginator's page size before any scenario changed it. */
  readonly defaultPageSize: number;
  private nextSequence = 1;
  private nextPendingId = 1;
  private releases = new Map<number, () => void>();
  private restoreOriginals?: () => void;
  /**
   * Your read position on the server, as a time (ns): messages created after it are unread. Unset
   * until the first {@link seed}; until then answers carry the read state the channel holds.
   */
  private yourLastReadAt?: number;

  constructor(readonly channel: Channel) {
    this.defaultPageSize = channel.messagePaginator.pageSize ?? DEFAULT_QUERY_LIMIT;
  }

  get timeline() {
    return this.state.getLatestValue().timeline;
  }

  get newestMessage(): MessageResponse | undefined {
    return this.timeline[this.timeline.length - 1];
  }

  // ---- install ----------------------------------------------------------------------------------

  /** Starts answering the channel's queries from the timeline, then reopens the channel on it. */
  async install() {
    if (this.restoreOriginals) return;
    for (const other of installedBackends) await other.uninstall();
    installedBackends.add(this);

    const { channel } = this;
    const reporter = channel.getClient().messageDeliveryReporter;
    const { getOrCreate, markRead } = channel;
    const { syncDeliveredCandidates } = reporter;

    channel.getOrCreate = ((request) =>
      this.answer('channel query', request?.messages, () =>
        this.channelStateResponse(
          request?.state === false ? [] : selectPage(this.timeline, request?.messages),
        ),
      )) as Channel['getOrCreate'];
    channel.markRead = (() => Promise.resolve(null)) as unknown as Channel['markRead'];
    reporter.syncDeliveredCandidates = (collections) =>
      syncDeliveredCandidates.call(
        reporter,
        collections.filter((collection) => collection !== channel),
      );

    this.restoreOriginals = () => {
      channel.getOrCreate = getOrCreate;
      channel.markRead = markRead;
      reporter.syncDeliveredCandidates = syncDeliveredCandidates;
    };
    this.state.partialNext({ installed: true });
    await this.reopen();
  }

  /** Restores the real methods and reopens the channel from the Stream API. */
  async uninstall() {
    if (!this.restoreOriginals) return;
    this.setHoldAnswers(false);
    this.restoreOriginals();
    this.restoreOriginals = undefined;
    installedBackends.delete(this);
    this.state.partialNext({ installed: false, online: true });
    await this.reopen();
  }

  /** Drops every loaded message and watches the channel again, as when it is first opened. */
  async reopen() {
    this.channel.messagePaginator.clearStateAndCache();
    await this.channel.watch();
  }

  // ---- answers ----------------------------------------------------------------------------------

  /**
   * Delivers the answer after the delay or, while answers are held, once released. A held answer is
   * computed when released, as a server that finishes the request then would: messages sent while
   * it was held are in it. Each query is noted in {@link receivedQueries} when it arrives.
   */
  private async answer<T extends { messages?: readonly unknown[] }>(
    kind: string,
    messages: MessagePaginationParams | undefined,
    produceAnswer: () => T,
  ): Promise<T> {
    const query: ReceivedQuery = { label: describeQuery(kind, messages) };
    this.receivedQueries.push(query);
    const produce = () => {
      const response = produceAnswer();
      query.answeredCount = response.messages?.length ?? 0;
      return response;
    };
    const { delayMs, holdAnswers } = this.state.getLatestValue();
    if (holdAnswers) {
      await new Promise<void>((release) => this.hold(query.label, release));
      return produce();
    }
    const response = produce();
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    return response;
  }

  private hold(label: string, release: () => void) {
    const id = this.nextPendingId++;
    this.releases.set(id, release);
    this.state.partialNext({
      pending: [...this.state.getLatestValue().pending, { id, label }],
    });
  }

  /** Delivers the held answer `id`, by default the oldest. */
  release(id = this.state.getLatestValue().pending[0]?.id) {
    if (id === undefined) return;
    this.releases.get(id)?.();
    this.releases.delete(id);
    this.state.partialNext({
      pending: this.state.getLatestValue().pending.filter((answer) => answer.id !== id),
    });
  }

  releaseAll() {
    for (const { id } of this.state.getLatestValue().pending) this.release(id);
  }

  /** Turning holding off delivers whatever is held. */
  setHoldAnswers(holdAnswers: boolean) {
    this.state.partialNext({ holdAnswers });
    if (!holdAnswers) this.releaseAll();
  }

  setDelayMs(delayMs: number) {
    this.state.partialNext({ delayMs: Math.max(0, delayMs) });
  }

  /** A channel query's response: the real channel's data, members and reads, and `page`. */
  private channelStateResponse(page: MessageResponse[]) {
    const { channel } = this;
    return {
      channel: {
        ...channel.data,
        cid: channel.cid,
        id: channel.id,
        last_message_at: this.newestMessage?.created_at,
        type: channel.type,
      } as ChannelResponse,
      duration: '0ms',
      members: Object.values(channel.state.members),
      messages: page,
      metadata: { client_request_id: 'fake', response_code: 200, response_headers: {} },
      pinned_messages: [],
      read: this.readStates(),
      threads: [],
    } as unknown as StreamResponse<ChannelStateResponse>;
  }

  /** The channel's read states, yours from {@link yourReadState} when a read position is set. */
  private readStates() {
    const reads = Object.values(this.channel.state.read).map(
      ({ last_read, last_read_message_id, unread_messages, user }) => ({
        last_read,
        last_read_message_id,
        unread_messages,
        user,
      }),
    );
    const yours = this.yourReadState();
    if (!yours) return reads;
    return [...reads.filter(({ user }) => user?.id !== yours.user.id), yours];
  }

  /** Your read state at {@link yourLastReadAt}; `undefined` while no read position is set. */
  private yourReadState() {
    const { user } = this.channel.getClient();
    const lastReadAt = this.yourLastReadAt;
    if (!user || lastReadAt === undefined) return undefined;
    const read = this.timeline.filter((message) => message.created_at <= lastReadAt);
    // your own messages never count as unread
    const unread = this.timeline.filter(
      (message) => message.created_at > lastReadAt && message.user?.id !== user.id,
    );
    return {
      last_read: lastReadAt,
      last_read_message_id: read[read.length - 1]?.id,
      unread_messages: unread.length,
      user: user as UserResponse,
    };
  }

  /**
   * Moves your read position on the server back: the newest `count` messages are unread, and so is
   * every message sent after this. Seeding marks everything read again.
   */
  markUnread(count: number) {
    const { timeline } = this;
    const lastRead = timeline[timeline.length - 1 - count];
    this.yourLastReadAt = lastRead
      ? lastRead.created_at
      : (timeline[0]?.created_at ?? msToNs(Date.now())) - 1;
  }

  /**
   * What a channel-list refresh (`client.queryChannelsAndHydrate`) does for this channel: notes the
   * loaded newest messages, queries, and hydrates the channel with the newest
   * {@link CHANNEL_LIST_MESSAGE_LIMIT} messages.
   */
  async refreshFromChannelList() {
    const { channel } = this;
    const headIds = new Set(
      channel.messagePaginator.anchoredHeadItems.map((message) => message.id),
    );
    const messages = { limit: CHANNEL_LIST_MESSAGE_LIMIT };
    const response = await this.answer('channel list query', messages, () =>
      this.channelStateResponse(selectPage(this.timeline, messages)),
    );
    channel
      .getClient()
      .hydrateChannels(
        [response],
        {},
        { message_limit: CHANNEL_LIST_MESSAGE_LIMIT },
        new Map([[channel.cid, headIds]]),
      );
  }

  // ---- connection -------------------------------------------------------------------------------

  /**
   * Going offline interrupts the channel's watch, as a dropped socket does
   * (`markChannelsWatchInterrupted`). Coming back sends nothing: the reload or channel-list refresh
   * that follows a reconnect is a separate step.
   */
  setOnline(online: boolean) {
    if (!online && this.channel.watchStatus === ChannelWatchStatus.Watching) {
      this.channel.watchStatus = ChannelWatchStatus.WasWatching;
    }
    this.state.partialNext({ online });
  }

  // ---- server-side timeline ---------------------------------------------------------------------

  /**
   * Replaces the timeline with `count` messages, one minute apart, the newest a minute ago. The
   * newest `yours` of them are from you, the connected user.
   */
  seed(count: number, { yours = 0 }: { yours?: number } = {}) {
    const start = Date.now() - (count + 1) * SEED_SPACING_MS;
    this.nextSequence = 1;
    const you = this.channel.getClient().user as UserResponse | undefined;
    const timeline = Array.from({ length: count }, (_, index) =>
      this.fabricate(
        start + index * SEED_SPACING_MS,
        index >= count - yours ? you : undefined,
      ),
    );
    this.state.partialNext({ timeline });
    // you have read everything seeded; what arrives later is unread
    this.yourLastReadAt = this.newestMessage?.created_at ?? msToNs(start);
  }

  /** Sends `count` new messages; while online each also arrives as a `message.new` event. */
  addMessages(count: number) {
    // a millisecond apart, the last one now, so anything the device sends next is newer
    const newestMs = nsToMs(this.newestMessage?.created_at ?? 0);
    const firstMs = Math.max(Date.now() - count, newestMs + 1);
    const added = Array.from({ length: count }, (_, index) =>
      this.fabricate(firstMs + index),
    );
    this.state.partialNext({ timeline: [...this.timeline, ...added] });
    if (this.state.getLatestValue().online) added.forEach(this.dispatchMessageNew);
  }

  /**
   * The server accepts a message the user sent while offline, as the offline queue replays it on
   * reconnect: it gets the server's time, so it is the newest message, and while online it also
   * arrives as a `message.new` event, which confirms the user's unsent copy.
   */
  acceptQueuedMessage(queued: LocalMessage) {
    const newestMs = nsToMs(this.newestMessage?.created_at ?? 0);
    const message = fabricateMessage({
      cid: this.channel.cid,
      createdAtMs: Math.max(Date.now(), newestMs + 1),
      id: queued.id,
      text: queued.text ?? '',
      user: queued.user as UserResponse,
    });
    this.state.partialNext({ timeline: [...this.timeline, message] });
    if (this.state.getLatestValue().online) this.dispatchMessageNew(message);
  }

  /** Removes a message, by default the newest, with no event: a hard delete an offline client missed. */
  hardDelete(id = this.newestMessage?.id) {
    this.state.partialNext({
      timeline: this.timeline.filter((message) => message.id !== id),
    });
  }

  /** Empties the timeline, with no event. */
  truncate() {
    this.state.partialNext({ timeline: [] });
  }

  /**
   * Back to an empty channel: held answers delivered, online, and no messages on the server or in
   * the message list.
   */
  async clear() {
    this.setHoldAnswers(false);
    this.setOnline(true);
    this.seed(0);
    await this.reopen();
  }

  /** A simulated message; from the simulated user unless `user` is given. */
  private fabricate(createdAtMs: number, user?: UserResponse) {
    const sequence = this.nextSequence++;
    return fabricateMessage({
      cid: this.channel.cid,
      createdAtMs,
      id: simulatedMessageId(sequence),
      text: `Simulated message #${sequence}`,
      user,
    });
  }

  private dispatchMessageNew = (message: MessageResponse) => {
    const { channel } = this;
    channel.getClient().dispatchEvent({
      channel_id: channel.id,
      channel_type: channel.type,
      cid: channel.cid,
      created_at: message.created_at,
      message,
      type: 'message.new',
      user: message.user,
    } as Event);
  };
}

const nsToMs = (ns: number) => Math.floor(ns / 1_000_000);

/** e.g. "channel query id_lt sim-040, limit 25" */
const describeQuery = (kind: string, messages?: MessagePaginationParams) => {
  const cursor = (['id_around', 'created_at_around', 'id_lt', 'id_gt'] as const).find(
    (key) => messages?.[key],
  );
  const position = cursor ? `${cursor} ${String(messages?.[cursor])}` : 'newest';
  return `${kind} ${position}, limit ${messages?.limit ?? 'default'}`;
};

/** Keeps unsent messages created in the same millisecond apart. */
let unsentCount = 0;

/**
 * Adds a message of the current user that never reached the server to the channel's message list:
 * `failed`, a send that got an error, or `sending`, one still in flight. It carries the device's
 * clock, as a real unsent message does. Client-side only; the timeline never holds it.
 */
export const ingestUnsentMessage = (channel: Channel, status: 'failed' | 'sending') => {
  const client = channel.getClient();
  const createdAtMs = Date.now();
  const message = formatMessage({
    ...fabricateMessage({
      cid: channel.cid,
      createdAtMs,
      id: `local-${createdAtMs}-${++unsentCount}`,
      text: `Unsent message (${status})`,
      user: client.user as UserResponse,
    }),
    status,
    ...(status === 'failed' && { error: new Error('Simulated failed send') }),
  } as LocalMessage);
  channel.messagePaginator.ingestItem(message);
  return message;
};
