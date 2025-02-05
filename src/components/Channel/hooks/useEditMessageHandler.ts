import { useChatContext } from '../../../context/ChatContext';

import type { StreamChat, UpdatedMessage } from 'stream-chat';

import type { UpdateMessageOptions } from '../../../types/types';

type UpdateHandler = (
  cid: string,
  updatedMessage: UpdatedMessage,
  options?: UpdateMessageOptions,
) => ReturnType<StreamChat['updateMessage']>;

export const useEditMessageHandler = (doUpdateMessageRequest?: UpdateHandler) => {
  const { channel, client } = useChatContext('useEditMessageHandler');

  return (updatedMessage: UpdatedMessage, options?: UpdateMessageOptions) => {
    if (doUpdateMessageRequest && channel) {
      return Promise.resolve(
        doUpdateMessageRequest(channel.cid, updatedMessage, options),
      );
    }
    return client.updateMessage(updatedMessage, undefined, options);
  };
};
