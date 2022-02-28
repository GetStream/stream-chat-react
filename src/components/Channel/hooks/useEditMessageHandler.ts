import { useChatContext } from '../../../context/ChatContext';

import type { StreamChat, UpdatedMessage } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

type UpdateHandler<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = (
  cid: string,
  updatedMessage: UpdatedMessage<StreamChatGenerics>,
) => ReturnType<StreamChat<StreamChatGenerics>['updateMessage']>;

export const useEditMessageHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  doUpdateMessageRequest?: UpdateHandler<StreamChatGenerics>,
) => {
  const { channel, client } = useChatContext<StreamChatGenerics>('useEditMessageHandler');

  return (updatedMessage: UpdatedMessage<StreamChatGenerics>) => {
    if (doUpdateMessageRequest && channel) {
      return Promise.resolve(doUpdateMessageRequest(channel.cid, updatedMessage));
    }
    return client.updateMessage(updatedMessage);
  };
};
