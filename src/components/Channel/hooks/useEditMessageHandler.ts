import type {
  LocalMessage,
  MessageRequest,
  MessageResponse,
  StreamChat,
  UpdateMessageAPIResponse,
  UpdateMessageOptions,
} from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';

type UpdateHandler = (
  cid: string,
  updatedMessage: LocalMessage | MessageResponse,
  options?: UpdateMessageOptions,
) => ReturnType<StreamChat['updateMessage']>;

export const useEditMessageHandler = (
  doUpdateMessageRequest?: UpdateHandler,
): ((
  updatedMessage: LocalMessage | MessageResponse,
  options?: UpdateMessageOptions,
) => Promise<UpdateMessageAPIResponse>) => {
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
    return client.updateMessage({
      id: updatedMessage.id,
      message: updatedMessage as unknown as MessageRequest,
      ...options,
    });
  };
};
