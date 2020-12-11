// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

/**
 * @type {import('types').useUserRole}
 */
export const useUserRole = (message) => {
  const { client, channel } = useContext(ChannelContext);

  const isMyMessage =
    !!message?.user && !!client?.user && client.user.id === message.user.id;

  const isAdmin =
    client?.user?.role === 'admin' ||
    channel?.state?.membership?.role === 'admin';
  const isOwner = channel?.state?.membership?.role === 'owner';
  const isModerator =
    client?.user?.role === 'channel_moderator' ||
    channel?.state?.membership?.role === 'channel_moderator' ||
    channel?.state?.membership?.role === 'moderator';
  const canEditMessage = isMyMessage || isModerator || isOwner || isAdmin;
  const canDeleteMessage = canEditMessage;

  return {
    isMyMessage,
    isAdmin,
    isOwner,
    isModerator,
    canEditMessage,
    canDeleteMessage,
  };
};
