import { useMemo } from 'react';
import type { Channel, ChannelConfig, ChannelStateData } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useStateStore } from '../../../store';
import type { TypingEntry } from './useDebouncedTypingActive';

const typingEventsStateSelector = ({ typingEvents }: ChannelConfig) => ({
  typingEventsEnabled: typingEvents.enabled,
});

const channelTypingSelector = ({ typing }: ChannelStateData) => ({ typing });

/**
 * The other users typing in `channel`: in its main list, or, with `parentId`, in the replies of that
 * thread. Empty while the channel's `typingEvents.enabled` is false.
 */
export const useTypingUsers = (channel: Channel, parentId?: string): TypingEntry[] => {
  const { client } = useChatContext();
  const ownUserId = client.user?.id;
  const { typingEventsEnabled } = useStateStore(
    channel.configState,
    typingEventsStateSelector,
  );
  const { typing } = useStateStore(channel.state, channelTypingSelector);

  return useMemo(() => {
    if (typingEventsEnabled === false) return [];
    const isInList = ({ parent_id }: TypingEntry) =>
      parentId ? parent_id === parentId : !parent_id;
    return (Object.values(typing) as TypingEntry[]).filter(
      (entry) => entry.user?.id !== ownUserId && isInList(entry),
    );
  }, [ownUserId, parentId, typing, typingEventsEnabled]);
};
