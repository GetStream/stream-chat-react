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
} from '../../../../types/types';

export const useUserRole = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>(); // TODO - fix breaking tests that result from pulling client from ChatContext

  const isMyMessage = !!message?.user && !!client?.user && client.user.id === message.user.id;

  const isAdmin = client?.user?.role === 'admin' || channel?.state?.membership?.role === 'admin';

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
