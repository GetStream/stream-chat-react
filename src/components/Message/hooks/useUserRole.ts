import {
  StreamMessage,
  useChannelContext,
} from '../../../context/ChannelContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../../types/types';

export const useUserRole = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel, client } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>(); // TODO - fix breaking tests that result from pulling client from ChatContext

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
    canDeleteMessage,
    canEditMessage,
    isAdmin,
    isModerator,
    isMyMessage,
    isOwner,
  };
};
