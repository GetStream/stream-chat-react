import {
  RetrySendMessage,
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

export const useRetryHandler = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  customRetrySendMessage?: RetrySendMessage<At, Ch, Co, Ev, Me, Re, Us>,
): RetrySendMessage<At, Ch, Co, Ev, Me, Re, Us> => {
  const { retrySendMessage: contextRetrySendMessage } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  const retrySendMessage = customRetrySendMessage || contextRetrySendMessage;

  return async (message) => {
    if (retrySendMessage && message) {
      await retrySendMessage(message);
    }
  };
};
