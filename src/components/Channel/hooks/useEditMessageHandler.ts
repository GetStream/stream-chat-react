import { useChatContext } from '../../../context/ChatContext';

import type { StreamChat, UpdatedMessage } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

type UpdateHandler<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = (
  cid: string,
  updatedMessage: UpdatedMessage<At, Ch, Co, Me, Re, Us>,
) => ReturnType<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>;

export const useEditMessageHandler = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  doUpdateMessageRequest?: UpdateHandler<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel, client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('useEditMessageHandler');

  return (updatedMessage: UpdatedMessage<At, Ch, Co, Me, Re, Us>) => {
    if (doUpdateMessageRequest && channel) {
      return Promise.resolve(doUpdateMessageRequest(channel.cid, updatedMessage));
    }
    return client.updateMessage(updatedMessage);
  };
};
