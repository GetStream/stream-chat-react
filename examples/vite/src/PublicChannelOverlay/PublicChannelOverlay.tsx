import { useCallback, useState } from 'react';
import type { ChannelMemberResponse } from 'stream-chat';
import {
  Button,
  IconMessageBubbles,
  LoadingIndicator,
  useChannelMembersState,
  useChannelStateContext,
  useChatContext,
  useNotificationApi,
} from 'stream-chat-react';

import './PublicChannelOverlay.scss';

export const usePublicChannelState = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const members = useChannelMembersState(channel);
  const membership = members[client.userId!] as ChannelMemberResponse | undefined;

  const isMember = typeof membership?.channel_role === 'string';
  const canJoin = channel.data?.own_capabilities?.includes('join-channel');

  return { canJoin, channel, client, isMember };
};

export const PublicChannelOverlay = () => {
  const { canJoin, channel, client, isMember } = usePublicChannelState();
  const { addNotification } = useNotificationApi();
  const [joining, setJoining] = useState(false);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    try {
      await channel.addMembers([client.userId!]);
    } catch (error) {
      addNotification({
        emitter: 'PublicChannelOverlay',
        incident: {
          domain: 'api',
          entity: 'channel',
          operation: 'join',
        },
        message: 'Failed to join the group',
        severity: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    } finally {
      setJoining(false);
    }
  }, [addNotification, channel, client.userId]);

  if (isMember || !canJoin) return null;

  return (
    <div className='app-public-channel-overlay'>
      <div className='app-public-channel-overlay__content'>
        <IconMessageBubbles />
        <div className='app-public-channel-overlay__text'>
          <p className='app-public-channel-overlay__title'>
            You&apos;re previewing this group
          </p>
          <p className='app-public-channel-overlay__description'>
            Join to send messages and follow the conversation
          </p>
        </div>
        <Button
          appearance='solid'
          autoFocus
          className='app-public-channel-overlay__join-button'
          disabled={joining}
          onClick={handleJoin}
          size='md'
          variant='primary'
        >
          {joining ? <LoadingIndicator /> : 'Join Group'}
        </Button>
      </div>
    </div>
  );
};
