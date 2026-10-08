import { useCallback } from 'react';
import type { MembersState } from 'stream-chat';
import {
  ChannelAvatar,
  type ChannelAvatarProps,
  ChannelListItemUI,
  type ChannelListItemUIProps,
  useChannelListItemContext,
  useChatContext,
  useStateStore,
  WithComponents,
} from 'stream-chat-react';

// The row's avatar with a presence badge for a direct-message channel: whether its other member is
// connected (`user.online`). Subscribes to the row's own channel, so a presence change re-renders
// that row only. Reads the row's channel from its context, so it may only render inside a row.
const PresenceAvatar = (props: ChannelAvatarProps) => {
  const { channel } = useChannelListItemContext();
  const { client } = useChatContext();
  const ownUserId = client.userId;
  const selector = useCallback(
    ({ members }: MembersState) => {
      const memberList = Object.values(members);
      if (memberList.length !== 2) return { isOnline: undefined };
      const other = memberList.find((member) => member.user?.id !== ownUserId);
      return { isOnline: !!other?.user?.online };
    },
    [ownUserId],
  );
  const { isOnline } = useStateStore(channel.state, selector);

  return <ChannelAvatar {...props} isOnline={isOnline} />;
};

// The default row, with the presence avatar. Overriding `Avatar` here rather than for the whole
// navigation keeps it inside rows: search results use the same `Avatar` slot outside any row.
export const ChannelListItemUIWithPresence = (props: ChannelListItemUIProps) => (
  <WithComponents overrides={{ Avatar: PresenceAvatar }}>
    <ChannelListItemUI {...props} />
  </WithComponents>
);
