import type {
  LocalMessage,
  MessageResponse,
  StreamChat,
  UpdateMessageOptions,
} from 'stream-chat';

import { useChannel } from '../../../context/useChannel';
import { useChatContext } from '../../../context/ChatContext';

type UpdateHandler = (
  cid: string,
  updatedMessage: LocalMessage | MessageResponse,
  options?: UpdateMessageOptions,
) => ReturnType<StreamChat['updateMessage']>;

export const useEditMessageHandler = (doUpdateMessageRequest?: UpdateHandler) => {
  const channel = useChannel();
  const { client } = useChatContext();

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
