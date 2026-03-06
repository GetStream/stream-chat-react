import { useChannel, useChatContext } from '../../../context';
import { useChannelCapabilities } from '../../Channel/hooks/useChannelCapabilities';
import type { LocalMessage } from 'stream-chat';

export const useUserRole = (
  message: LocalMessage,
  onlySenderCanEdit?: boolean,
  disableQuotedMessages?: boolean,
) => {
  const channel = useChannel();
  const { client } = useChatContext('useUserRole');
  const channelCapabilities = useChannelCapabilities({ cid: channel.cid });

  /**
   * @deprecated as it relies on `membership.role` check which is already deprecated and shouldn't be used anymore.
   * `isAdmin` will be removed in future release. See `channelCapabilities`.
   */
  const isAdmin =
    client.user?.role === 'admin' || channel.state.membership.role === 'admin';

  /**
   * @deprecated as it relies on `membership.role` check which is already deprecated and shouldn't be used anymore.
   * `isOwner` will be removed in future release. See `channelCapabilities`.
   */
  const isOwner = channel.state.membership.role === 'owner';

  /**
   * @deprecated as it relies on `membership.role` check which is already deprecated and shouldn't be used anymore.
   * `isModerator` will be removed in future release. See `channelCapabilities`.
   */
  const isModerator =
    client.user?.role === 'channel_moderator' ||
    channel.state.membership.role === 'channel_moderator' ||
    channel.state.membership.role === 'moderator' ||
    channel.state.membership.is_moderator === true ||
    channel.state.membership.channel_role === 'channel_moderator';

  const isMyMessage = client.userID === message.user?.id;

  const canEdit =
    !message.poll &&
    ((!onlySenderCanEdit && channelCapabilities.has('update-any-message')) ||
      (isMyMessage && channelCapabilities.has('update-own-message')));

  const canDelete =
    channelCapabilities.has('delete-any-message') ||
    (isMyMessage && channelCapabilities.has('delete-own-message'));
  const canPin = channelCapabilities.has('pin-message');
  const canFlag = !isMyMessage && channelCapabilities.has('flag-message');
  const canMute = !isMyMessage && channelCapabilities.has('mute-channel');
  const canBlockUser = !isMyMessage;
  const canMarkUnread = channelCapabilities.has('read-events');
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
