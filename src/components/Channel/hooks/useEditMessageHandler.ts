import type { MessageRequest, StreamChat, UpdateMessageOptions } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';

type UpdateHandler = (
  cid: string,
  updatedMessage: MessageRequest,
  options?: UpdateMessageOptions,
) => ReturnType<StreamChat['updateMessage']>;

export const useEditMessageHandler = (doUpdateMessageRequest?: UpdateHandler) => {
  const { channel, client } = useChatContext('useEditMessageHandler');

  return (updatedMessage: MessageRequest, options?: UpdateMessageOptions) => {
    if (doUpdateMessageRequest && channel) {
      return Promise.resolve(
        doUpdateMessageRequest(channel.cid, updatedMessage, options),
      );
    }
    return client.updateMessage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: updatedMessage.id!,
      message: updatedMessage,
      ...options,
    });
  };
};
