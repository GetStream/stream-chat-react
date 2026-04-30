import { useCallback } from 'react';
import type { ChannelMemberResponse } from 'stream-chat';
import {
  Button,
  IconMessageBubbles,
  useChannelMembersState,
  useChannelStateContext,
  useChatContext,
} from 'stream-chat-react';

import './PublicChannelOverlay.scss';

export const PublicChannelOverlay = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const members = useChannelMembersState(channel);
  const membership = members[client.userID!] as ChannelMemberResponse | undefined;

  const isMember = typeof membership?.channel_role === 'string';

  const handleJoin = useCallback(() => {
    channel.addMembers([client.userID!]);
  }, [channel, client.userID]);

  if (isMember) return null;

  return (
    <div className='app-public-channel-overlay'>
      <div className='app-public-channel-overlay__content'>
        <IconMessageBubbles />
        <div className='app-public-channel-overlay__text'>
          <p className='app-public-channel-overlay__title'>
            You're previewing this group
          </p>
          <p className='app-public-channel-overlay__description'>
            Join to send messages and follow the conversation
          </p>
        </div>
        <Button
          appearance='solid'
          className='app-public-channel-overlay__join-button'
          onClick={handleJoin}
          size='md'
          variant='primary'
        >
          Join Group
        </Button>
      </div>
    </div>
  );
};
