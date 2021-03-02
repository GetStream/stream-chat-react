import { useChannelContext } from '../../../context/ChannelContext';

import type { MouseEvent } from 'react';
import type { MessageResponse } from 'stream-chat';

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

export type DeleteHandlerReturnType = (
  event: MouseEvent<HTMLElement>,
) => Promise<void>;

export const useDeleteHandler = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message?: MessageResponse<At, Ch, Co, Me, Re, Us>,
): DeleteHandlerReturnType => {
  const { client, updateMessage } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  return async (event) => {
    event.preventDefault();
    if (!message?.id || !client || !updateMessage) {
      return;
    }

    const data = await client.deleteMessage(message.id);
    updateMessage(data.message);
  };
};
