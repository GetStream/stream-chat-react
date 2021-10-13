import { RetrySendMessage, useChannelActionContext } from '../../../context/ChannelActionContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const useRetryHandler = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  customRetrySendMessage?: RetrySendMessage<At, Ch, Co, Ev, Me, Re, Us>,
): RetrySendMessage<At, Ch, Co, Ev, Me, Re, Us> => {
  const { retrySendMessage: contextRetrySendMessage } = useChannelActionContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >('useRetryHandler');

  const retrySendMessage = customRetrySendMessage || contextRetrySendMessage;

  return async (message) => {
    if (message) {
      await retrySendMessage(message);
    }
  };
};
