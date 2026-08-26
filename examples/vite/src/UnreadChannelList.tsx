/**
 * A `ChannelList` for an "Unread" inbox (`filters: { has_unread: true }`). Use it exactly
 * like `ChannelList`.
 *
 * The list paginates with an offset derived from the number of channels it holds
 * (`usePaginatedChannels`: `const offset = channels.length`), which is only correct while
 * the queried result set is stable. `has_unread: true` is not: reading a channel takes it
 * out of the result set server side while the SDK keeps it in the list, so the list grows
 * while the result set shrinks and the difference is skipped on every following page - the
 * tab looks cleared while unread channels were never returned. They come back on the next
 * fresh query.
 *
 * Keeping the list to the channels the server would still return makes `channels.length`
 * describe the result set again, so the offset the SDK already computes is correct. That
 * needs no custom pagination, only `useUnreadInboxSync`. Its effects render nothing but do
 * need `setChannels` and the channel list context, so they live in the `List` - the one
 * component `ChannelList` always renders inside its provider. This component therefore
 * owns that prop; with a ChannelListUI of your own, call the hook in it and pass it to
 * `ChannelList` yourself (`List` is a `ChannelList` prop rather than a `ComponentContext`
 * entry, so `WithComponents` cannot layer one over the other).
 *
 * Notes:
 *
 * - Removal needs positive evidence: a read event, or a hydrated read state saying the
 *   channel has nothing unread. A channel whose read state we do not have stays -
 *   `countUnread()` reads as "nothing unread" both for a read channel and for one we know
 *   nothing about, and dropping the latter would skip it. Too small an offset only
 *   re-requests a channel; too large loses it. The evidence check is also what covers the
 *   channels `ChannelList` adds through `notification.added_to_channel` and
 *   `channel.visible`, for which no read event arrives. It does not fight the events
 *   either: `message.new` increments `read[userId].unread_messages`, so a channel that
 *   becomes unread again stops being evidence of anything.
 * - Which channels left is remembered rather than only acted on, and the removal re-runs
 *   after every change of the list: a query which was in flight while a channel was read
 *   rebuilds the list from its own stale snapshot (`usePaginatedChannels`:
 *   `uniqBy([...channels, ...response])`), so a one-shot `setChannels` is undone.
 * - Removal is unconditional, the open channel included. Exempting it would inflate
 *   `channels.length` by one and the next page would skip a channel again. Its row
 *   disappearing does not close the conversation: `Channel` renders the active channel,
 *   not the list.
 * - An emptied list has no rows for `Paginator` to attach a "load more" button to, so it
 *   loads the next page itself - otherwise the inbox looks cleared for a second reason.
 * - `setActiveChannelOnMount` defaults to `false`. `usePaginatedChannels` re-runs its
 *   active channel handler whenever the offset is 0, which an emptied list makes true
 *   again on every refill, so the active channel would keep jumping to the top of each new
 *   page (and `markReadOnMount` would mark it read).
 * - `notification.mark_unread` puts the channel back, which `ChannelList` does not do (it
 *   has no handler for it, while new messages go through its own). Marking unread leaves
 *   `last_message_at` alone, so the channel goes where that sorts it - and is left out when
 *   that is behind everything loaded, because the next page returns it and holding it here
 *   would make `channels.length` over-count the result set. The insertion assumes the
 *   `last_message_at: -1` ordering an unread inbox uses.
 * - `ChannelList` does not render `List` while channel search is active, which suspends
 *   these effects with it. Pass `additionalChannelSearchProps={{ popupResults: true }}`
 *   if the list has to stay mounted.
 *
 * There is no mirror of this for a "nothing unread" list: the API rejects
 * `has_unread: false` with 400 ("false is not allowed as a value for has_unread")
 */
import { useCallback, useEffect, useRef } from 'react';
import type { PropsWithChildren } from 'react';
import type { Channel, Event } from 'stream-chat';
import {
  ChannelList,
  ChannelListMessenger,
  getChannel,
  useChannelListContext,
  useChatContext,
} from 'stream-chat-react';
import type { ChannelListMessengerProps, ChannelListProps } from 'stream-chat-react';

/** Keeps the loaded channels in sync with the `has_unread: true` result set. */
export const useUnreadInboxSync = (
  setChannels: ChannelListMessengerProps['setChannels'],
) => {
  const { channelsQueryState, client } = useChatContext();
  const { channels, hasNextPage, loadNextPage } = useChannelListContext();
  // channels which left the result set since they were loaded
  const staleCids = useRef(new Set<string>());

  const dropStaleChannels = useCallback(() => {
    if (!setChannels) return;

    const doesNotBelong = (channel: Channel) => {
      if (staleCids.current.has(channel.cid)) return true;
      // what the channel's own read state says, if we have it - `message.read` zeroes it,
      // `message.new` counts up again, and a channel we never got read state for is left
      // alone rather than assumed read
      const readState = client.userID ? channel.state.read[client.userID] : undefined;
      return !!readState && readState.unread_messages === 0;
    };

    setChannels((current) =>
      current.some(doesNotBelong)
        ? current.filter((channel) => !doesNotBelong(channel))
        : current,
    );
  }, [client, setChannels]);

  /** Puts a channel which became unread again back where the sort order wants it. */
  const restoreChannel = useCallback(
    async (event: Event) => {
      const { channel_id: id, channel_type: type, cid } = event;
      if (!setChannels || !cid || !type) return;

      // it was in the list a moment ago, so it is normally still cached; `getChannel`
      // covers the rest and holds one query per cid if several events race
      const channel =
        client.activeChannels[cid] ?? (await getChannel({ client, id, type }));
      if (!channel) return;

      const lastMessageAt = (item: Channel) => item.state.last_message_at?.getTime() ?? 0;

      setChannels((current) => {
        if (current.some((loaded) => loaded.cid === cid)) return current;

        const index = current.findIndex(
          (loaded) => lastMessageAt(channel) > lastMessageAt(loaded),
        );

        // behind everything loaded: the next page returns it, and holding it here would
        // make `channels.length` over-count the result set
        if (index === -1) return hasNextPage ? current : [...current, channel];

        const next = [...current];
        next.splice(index, 0, channel);
        return next;
      });
    },
    [client, hasNextPage, setChannels],
  );

  useEffect(() => {
    const markRead = (event: Event) => {
      if (!event.cid) return;
      staleCids.current.add(event.cid);
      dropStaleChannels();
    };
    const markUnread = (event: Event) => {
      if (event.cid) staleCids.current.delete(event.cid);
    };

    const subscriptions = [
      // the user read a channel anywhere - unwatched ones and other tabs / devices too
      client.on('notification.mark_read', markRead),
      // the user read a channel they are watching, e.g. the open one
      client.on('message.read', (event) => {
        if (event.user?.id === client.userID) markRead(event);
      }),
      // ... and what puts a channel back into the result set
      client.on('notification.mark_unread', (event) => {
        markUnread(event);
        // unlike a new message, this one `ChannelList` does not put back
        restoreChannel(event).catch((error) => console.error(error));
      }),
      client.on('notification.message_new', markUnread),
      client.on('message.new', (event) => {
        if (event.user?.id !== client.userID) markUnread(event);
      }),
    ];

    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }, [client, dropStaleChannels, restoreChannel]);

  // a reload re-establishes the list from the server, so what left the result set before
  // it says nothing about what it returns now
  useEffect(() => {
    if (channelsQueryState.queryInProgress !== 'reload') return;
    staleCids.current = new Set();
  }, [channelsQueryState.queryInProgress]);

  // ... and again after every change of the list
  useEffect(dropStaleChannels, [channels, dropStaleChannels]);

  // refill a list which the removals have emptied
  useEffect(() => {
    if (channelsQueryState.queryInProgress || !hasNextPage || channels?.length) return;
    loadNextPage();
    // `loadNextPage` is a new function on every render, the state above is what decides
    // whether another page is needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels?.length, channelsQueryState.queryInProgress, hasNextPage]);
};

const UnreadInboxList = (props: PropsWithChildren<ChannelListMessengerProps>) => {
  useUnreadInboxSync(props.setChannels);

  return <ChannelListMessenger {...props} />;
};

export const UnreadChannelList = ({
  // a default rather than a fixed value, so it also applies to an explicit `undefined`
  setActiveChannelOnMount = false,
  ...props
}: ChannelListProps) => (
  <ChannelList
    {...props}
    List={UnreadInboxList}
    setActiveChannelOnMount={setActiveChannelOnMount}
  />
);
