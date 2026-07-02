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

import './ChannelPreviewOverlay.scss';

export const useChannelMembershipState = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const members = useChannelMembersState(channel);
  const membership = members[client.userID!] as ChannelMemberResponse | undefined;

  const isMember = typeof membership?.channel_role === 'string';
  const canJoin = channel.data?.own_capabilities?.includes('join-channel');

  return { canJoin, channel, client, isMember };
};

export const ChannelPreviewOverlay = () => {
  const { canJoin, channel, client, isMember } = useChannelMembershipState();
  const { addNotification } = useNotificationApi();
  const [joining, setJoining] = useState(false);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    try {
      await channel.addMembers([client.userID!]);
    } catch (error) {
      addNotification({
        emitter: 'ChannelPreviewOverlay',
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
  }, [addNotification, channel, client.userID]);

  if (isMember) return null;

  return (
    <div className='app-channel-preview-overlay'>
      <div className='app-channel-preview-overlay__content'>
        <IconMessageBubbles />
        <div className='app-channel-preview-overlay__text'>
          <p className='app-channel-preview-overlay__title'>
            {canJoin ? "You're previewing this group" : 'This is a private group'}
          </p>
          <p className='app-channel-preview-overlay__description'>
            {canJoin
              ? 'Join to send messages and follow the conversation'
              : 'It is not possible to join this group'}
          </p>
        </div>
        {canJoin && (
          <Button
            appearance='solid'
            autoFocus
            className='app-channel-preview-overlay__join-button'
            disabled={joining}
            onClick={handleJoin}
            size='md'
            variant='primary'
          >
            {joining ? <LoadingIndicator /> : 'Join Group'}
          </Button>
        )}
      </div>
    </div>
  );
};
