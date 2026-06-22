import { useEffect, useState } from 'react';
import type { Channel } from 'stream-chat';

// stream-chat keeps channel.state.pinnedMessages current on these events (see
// channel.ts `_handleChannelEvent` -> add/removePinnedMessage), but mutating that
// array does not re-render React. Subscribing here re-reads the count so the view
// re-renders — and re-reads channel.state directly — on every pin/unpin, not only
// when the channel gains its first or loses its last pinned message.
const PINNED_MESSAGES_EVENTS = [
  'message.new',
  'message.updated',
  'message.deleted',
  'message.undeleted',
] as const;

const getPinnedMessagesCount = (channel: Channel) =>
  channel.state?.pinnedMessages?.length ?? 0;

/** Reactive count of the channel's pinned messages derived from channel state. */
export const usePinnedMessagesCount = (channel: Channel) => {
  const [pinnedMessagesCount, setPinnedMessagesCount] = useState(() =>
    getPinnedMessagesCount(channel),
  );

  useEffect(() => {
    const syncPinnedMessagesCount = () =>
      setPinnedMessagesCount(getPinnedMessagesCount(channel));

    syncPinnedMessagesCount();

    const subscriptions = PINNED_MESSAGES_EVENTS.map((event) =>
      channel.on(event, syncPinnedMessagesCount),
    );

    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }, [channel]);

  return pinnedMessagesCount;
};
