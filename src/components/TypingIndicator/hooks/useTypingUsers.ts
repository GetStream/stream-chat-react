import { useMemo } from 'react';
import type { Channel, ChannelConfig, ChannelStateData, EventPayload } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useStateStore } from '../../../store';

export type TypingEntry = EventPayload<'typing.start' | 'typing.stop'>;

// Shared by every empty result, so "nobody is typing" keeps one reference and the memos and effects
// that depend on it do not re-run.
const NO_TYPING_USERS: readonly TypingEntry[] = [];

const typingEventsStateSelector = ({ typingEvents }: ChannelConfig) => ({
  typingEventsEnabled: typingEvents.enabled,
});

const channelTypingSelector = ({ typing }: ChannelStateData) => ({ typing });

/**
 * The other users typing in `channel`: in its main list, or, with `parentId`, in the replies of that
 * thread. Empty while the channel's `typingEvents.enabled` is false, and then it does not subscribe to
 * the channel's typing state.
 */
export const useTypingUsers = (
  channel: Channel,
  parentId?: string,
): readonly TypingEntry[] => {
  const { client } = useChatContext();
  const ownUserId = client.user?.id;
  const { typingEventsEnabled } = useStateStore(
    channel.configState,
    typingEventsStateSelector,
  );
  const typingState = useStateStore(
    typingEventsEnabled === false ? undefined : channel.state,
    channelTypingSelector,
  );
  const typing = typingState?.typing;

  return useMemo(() => {
    if (!typing) return NO_TYPING_USERS;
    const isInList = ({ parent_id }: TypingEntry) =>
      parentId ? parent_id === parentId : !parent_id;
    const typingUsers = (Object.values(typing) as TypingEntry[]).filter(
      (entry) => entry.user?.id !== ownUserId && isInList(entry),
    );
    return typingUsers.length > 0 ? typingUsers : NO_TYPING_USERS;
  }, [ownUserId, parentId, typing]);
};
