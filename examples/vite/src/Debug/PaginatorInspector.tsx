import { useEffect, useReducer, useState } from 'react';
import type {
  Channel,
  ChannelStateData,
  LocalMessage,
  MessagePaginatorState,
} from 'stream-chat';
import { useStateStore } from 'stream-chat-react';

import { Flag } from './ComposerStateInspector';
import type { MessageWindow } from './paginatorWindows';
import { lastOf, rangeOf, readWindows, shortId, windowName } from './paginatorWindows';

/**
 * Live view of a channel's message paginator in plain words: its windows, which one is being read,
 * which ends of the channel each holds, and what each can still load. "Show raw state" prints the
 * fields the words are read from.
 *
 * The windows have no store of their own — a page stored next to the shown window changes no
 * published state — so besides subscribing to the paginator's stores the view re-reads them on a
 * short tick.
 */

const REFRESH_INTERVAL_MS = 300;

const paginatorSelector = (state: MessagePaginatorState) => ({
  cursor: state.cursor,
  hasMoreHead: state.hasMoreHead,
  hasMoreTail: state.hasMoreTail,
  isLoading: state.isLoading,
  items: state.items,
});

const anchoredHeadSelector = (views: { anchoredHead: LocalMessage[] }) => ({
  anchoredHead: views.anchoredHead,
});

const channelSelector = (state: ChannelStateData) => ({
  active: state.active,
  watchStatus: state.watchStatus,
});

/** Full ids, for the raw view. */
const rawRange = (ids: readonly string[]) =>
  ids.length ? `${ids[0]} … ${lastOf(ids)} (${ids.length})` : 'none';

const useTick = (intervalMs: number) => {
  const [, tick] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    const interval = setInterval(tick, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);
};

/** A message by its short label, the full id on hover. */
export const MessageId = ({ id }: { id: string | undefined }) => (
  <span className='app__paginator-inspector__id' title={id}>
    {shortId(id)}
  </span>
);

/** One indicator of what a window has loaded, and what that means in its current state. */
const EndFlag = ({
  label,
  off,
  on,
  value,
}: {
  label: string;
  off: string;
  on: string;
  value: boolean;
}) => (
  <div className='app__paginator-inspector__end'>
    <Flag label={label} on={value} />
    <span className='app__paginator-inspector__hint'>{value ? on : off}</span>
  </div>
);

/** Ordered tail to head, as the message list reads from top to bottom. */
const WindowCard = ({ messageWindow: w }: { messageWindow: MessageWindow }) => (
  <div
    className={`app__paginator-inspector__window${w.isRead ? ' app__paginator-inspector__window--read' : ''}`}
    title={`interval ${w.id}`}
  >
    <div className='app__paginator-inspector__window-name'>{windowName(w)}</div>
    <div>
      {w.messageIds.length} messages loaded: <MessageId id={w.messageIds[0]} /> →{' '}
      <MessageId id={lastOf(w.messageIds)} />
    </div>
    {!w.livePending && (
      <div className='app__paginator-inspector__ends'>
        <EndFlag
          label='tail loaded'
          off="no: not known to start at the channel's oldest message"
          on="yes: starts at the channel's oldest message"
          value={w.tailLoaded}
        />
        <EndFlag
          label='can load more tailwards'
          off='no: nothing older to load'
          on='yes: loading older may bring more'
          value={w.canLoadTailwards}
        />
        <EndFlag
          label='can load more headwards'
          off='no: nothing newer to load'
          on='yes: loading newer may bring more'
          value={w.canLoadHeadwards}
        />
        <EndFlag
          label='head loaded'
          off="no: not known to end at the channel's newest message"
          on="yes: ends at the channel's newest message"
          value={w.headLoaded}
        />
      </div>
    )}
  </div>
);

/**
 * The channel's loaded windows, live. Used by the inspector and by the open scenario card, so a
 * scenario shows the state its steps change.
 */
export const PaginatorWindows = ({ channel }: { channel: Channel }) => {
  useTick(REFRESH_INTERVAL_MS);
  const { windows } = readWindows(channel.messagePaginator);

  return (
    <div className='app__paginator-inspector__windows'>
      <div className='app__composer-inspector__empty'>
        Each window lists what it has loaded. Tail: the channel&apos;s oldest end, the top
        of the message list. Head: its newest end, the bottom.
      </div>
      {windows.map((w) => (
        <WindowCard key={w.id} messageWindow={w} />
      ))}
      {!windows.length && (
        <div className='app__composer-inspector__empty'>No windows loaded.</div>
      )}
    </div>
  );
};

export const PaginatorInspector = ({ channel }: { channel: Channel }) => {
  const paginator = channel.messagePaginator;
  const paginatorState = useStateStore(paginator.state, paginatorSelector);
  const { anchoredHead } = useStateStore(paginator.intervalViews, anchoredHeadSelector);
  const { active, watchStatus } = useStateStore(channel.state, channelSelector);
  const [showRaw, setShowRaw] = useState(false);
  useTick(REFRESH_INTERVAL_MS);

  const { windows } = readWindows(paginator);
  const { cursor, hasMoreHead, hasMoreTail, isLoading, items } = paginatorState;

  return (
    <div className='app__composer-inspector__body'>
      <div className='app__composer-inspector__flags'>
        <Flag label='channel open in the app' on={!!active} />
        <Flag label='loading' on={isLoading} />
        <span className='app__composer-inspector__flag'>watch: {watchStatus}</span>
      </div>
      <div>
        Shown in the list: {items ? `${items.length} messages, ` : 'not loaded'}
        {items && rangeOf(items.map((message) => message.id))}
      </div>
      <PaginatorWindows channel={channel} />
      <label>
        <input
          checked={showRaw}
          onChange={(event) => setShowRaw(event.target.checked)}
          type='checkbox'
        />{' '}
        show raw state
      </label>
      {showRaw && (
        <pre className='app__composer-inspector__json app__pagination-scenarios__wrap'>
          {JSON.stringify(
            {
              activeIntervalId: windows.find((w) => w.isRead)?.id,
              anchoredHead: rawRange(anchoredHead.map((message) => message.id)),
              cursor,
              hasMoreHead,
              hasMoreTail,
              intervals: windows.map(({ raw: { itemIds, ...flags } }) => ({
                ...flags,
                itemIds: rawRange(itemIds),
              })),
              isLoading,
              items: items && rawRange(items.map((message) => message.id)),
            },
            null,
            2,
          )}
        </pre>
      )}
    </div>
  );
};
