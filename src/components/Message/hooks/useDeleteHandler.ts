import { StreamMessage, useChannelContext } from '../../../context/ChannelContext';

import type { ReactEventHandler } from '../types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const useDeleteHandler = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
): ReactEventHandler => {
  const { client, updateMessage } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  return async (event) => {
    event.preventDefault();
    if (!message?.id || !client || !updateMessage) {
      return;
    }

    const data = await client.deleteMessage(message.id);
    updateMessage(data.message);
  };
};
