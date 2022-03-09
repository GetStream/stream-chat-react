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
  const {
    channel,
    channelCapabilities = {},
    channelConfig,
  } = useChannelStateContext<StreamChatGenerics>('useUserRole');
  const { client } = useChatContext<StreamChatGenerics>('useUserRole');

  const isAdmin = client.user?.role === 'admin' || channel.state.membership.role === 'admin';
  const isMyMessage = client.userID === message.user?.id;
  const isOwner = channel.state.membership.role === 'owner';

  const isModerator =
    client.user?.role === 'channel_moderator' ||
    channel.state.membership.role === 'channel_moderator' ||
    channel.state.membership.role === 'moderator';

  const canEdit =
    (!onlySenderCanEdit && channelCapabilities['update-any-message']) ||
    (isMyMessage && channelCapabilities['update-own-message']);

  const canDelete =
    channelCapabilities['delete-any-message'] ||
    (isMyMessage && channelCapabilities['delete-own-message']);

  const canFlag = !isMyMessage;
  const canMute = !isMyMessage && channelConfig?.mutes;
  const canQuote = !disableQuotedMessages && channelCapabilities['quote-message'];
  const canReact = channelConfig?.reactions !== false && channelCapabilities['send-reaction'];
  const canReply = channelConfig?.replies !== false && channelCapabilities['send-reply'];

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
