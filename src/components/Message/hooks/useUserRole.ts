import { useChannel, useChatContext } from '../../../context';
import { useChannelCapabilities } from '../../Channel/hooks/useChannelCapabilities';
import type { LocalMessage } from 'stream-chat';

export const useUserRole = (message: LocalMessage, disableQuotedMessages?: boolean) => {
  const channel = useChannel();
  const { client } = useChatContext();
  const channelCapabilities = useChannelCapabilities({ cid: channel.cid });

  /** @deprecated Relies on the deprecated `membership.role`. Use `channelCapabilities` instead. */
  const isAdmin =
    client.user?.role === 'admin' || channel.state.membership.role === 'admin';

  /** @deprecated Relies on the deprecated `membership.role`. Use `channelCapabilities` instead. */
  const isOwner = channel.state.membership.role === 'owner';

  /** @deprecated Relies on the deprecated `membership.role`. Use `channelCapabilities` instead. */
  const isModerator =
    client.user?.role === 'channel_moderator' ||
    channel.state.membership.role === 'channel_moderator' ||
    channel.state.membership.role === 'moderator' ||
    channel.state.membership.is_moderator === true ||
    channel.state.membership.channel_role === 'channel_moderator';

  const isMyMessage = client.userID === message.user?.id;

  const canEdit =
    !message.poll &&
    message.command !== 'giphy' &&
    (channelCapabilities.has('update-any-message') ||
      (isMyMessage && channelCapabilities.has('update-own-message')));

  const canDelete =
    channelCapabilities.has('delete-any-message') ||
    (isMyMessage && channelCapabilities.has('delete-own-message'));
  const canPin = channelCapabilities.has('pin-message');
  const canFlag = !isMyMessage && channelCapabilities.has('flag-message');
  const canMute = !isMyMessage && channelCapabilities.has('mute-channel');
  const canBlockUser = !isMyMessage;
  const canMarkUnread = !isMyMessage && channelCapabilities.has('read-events');
  const canQuote = !disableQuotedMessages && channelCapabilities.has('quote-message');
  const canReact = channelCapabilities.has('send-reaction');
  const canReply = channelCapabilities.has('send-reply');
  const canSendMessage = channelCapabilities.has('send-message');

  return {
    canBlockUser,
    canDelete,
    canEdit,
    canFlag,
    canMarkUnread,
    canMute,
    canPin,
    canQuote,
    canReact,
    canReply,
    canSendMessage,
    isAdmin,
    isModerator,
    isMyMessage,
    isOwner,
  };
};
