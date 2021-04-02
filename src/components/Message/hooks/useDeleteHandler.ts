import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChatContext } from '../../../context/ChatContext';

import type { MouseEventHandler } from '../types';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../../types/types';

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
): MouseEventHandler => {
  const { updateMessage } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>(); // TODO - fix breaking tests that result from pulling client from ChatContext

  return async (event) => {
    event.preventDefault();
    if (!message?.id || !client || !updateMessage) {
      return;
    }

    const data = await client.deleteMessage(message.id);
    updateMessage(data.message);
  };
};
