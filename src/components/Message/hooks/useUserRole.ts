import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const useUserRole = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  onlySenderCanEdit?: boolean,
  disableQuotedMessages?: boolean,
) => {
  const { channel, channelCapabilities = {}, channelConfig } = useChannelStateContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >('useUserRole');
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('useUserRole');

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
  const canQuote = !disableQuotedMessages;
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
