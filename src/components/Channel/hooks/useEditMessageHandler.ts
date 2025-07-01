import type {
  LocalMessage,
  MessageResponse,
  StreamChat,
  UpdateMessageOptions,
} from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';

type UpdateHandler = (
  cid: string,
  updatedMessage: LocalMessage | MessageResponse,
  options?: UpdateMessageOptions,
) => ReturnType<StreamChat['updateMessage']>;

export const useEditMessageHandler = (doUpdateMessageRequest?: UpdateHandler) => {
  const { channel, client } = useChatContext('useEditMessageHandler');

  return (
    updatedMessage: LocalMessage | MessageResponse,
    options?: UpdateMessageOptions,
  ) => {
    if (doUpdateMessageRequest && channel) {
      return Promise.resolve(
        doUpdateMessageRequest(channel.cid, updatedMessage, options),
      );
    }
    return client.updateMessage(updatedMessage, undefined, options);
  };
};
