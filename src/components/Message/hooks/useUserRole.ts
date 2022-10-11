import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useUserRole = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message: StreamMessage<StreamChatGenerics>,
  onlySenderCanEdit?: boolean,
  disableQuotedMessages?: boolean,
) => {
  const { channel, channelCapabilities = {} } = useChannelStateContext<StreamChatGenerics>(
    'useUserRole',
  );
  const { client } = useChatContext<StreamChatGenerics>('useUserRole');

  /**
   * @deprecated as it relies on `membership.role` check which is already deprecated and shouldn't be used anymore.
   * `isAdmin` will be removed in future release. See `channelCapabilities`.
   */
  const isAdmin = client.user?.role === 'admin' || channel.state.membership.role === 'admin';

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
    (!onlySenderCanEdit && channelCapabilities['update-any-message']) ||
    (isMyMessage && channelCapabilities['update-own-message']);

  const canDelete =
    channelCapabilities['delete-any-message'] ||
    (isMyMessage && channelCapabilities['delete-own-message']);

  const canFlag = !isMyMessage && channelCapabilities['flag-message'];
  const canMute = !isMyMessage && channelCapabilities['mute-channel'];
  const canQuote = !disableQuotedMessages && channelCapabilities['quote-message'];
  const canReact = channelCapabilities['send-reaction'];
  const canReply = channelCapabilities['send-reply'];

  return {
    canDelete,
    canEdit,
    canFlag,
    canMute,
    canQuote,
    canReact,
    canReply,
    isAdmin,
    isModerator,
    isMyMessage,
    isOwner,
  };
};
