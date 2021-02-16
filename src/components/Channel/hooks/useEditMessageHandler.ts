import { useChatContext } from '../../../context';

import type { StreamChat, UpdatedMessage } from 'stream-chat';

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

type UpdateHandler<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = (
  cid: string,
  updatedMessage: UpdatedMessage<At, Ch, Co, Me, Re, Us>, // TODO - check if right message type
) => ReturnType<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>;

const useEditMessageHandler = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  doUpdateMessageRequest: UpdateHandler<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel, client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (updatedMessage: UpdatedMessage<At, Ch, Co, Me, Re, Us>) => {
    if (doUpdateMessageRequest && channel) {
      return Promise.resolve(
        doUpdateMessageRequest(channel.cid, updatedMessage),
      );
    }
    return client.updateMessage(updatedMessage);
  };
};

export default useEditMessageHandler;
