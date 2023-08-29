import { useChatContext } from '../../../context/ChatContext';

import type { StreamChat, UpdatedMessage } from 'stream-chat';

import type { DefaultStreamChatGenerics, UpdateMessageOptions } from '../../../types/types';

type UpdateHandler<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = (
  cid: string,
  updatedMessage: UpdatedMessage<StreamChatGenerics>,
  options?: UpdateMessageOptions,
) => ReturnType<StreamChat<StreamChatGenerics>['updateMessage']>;

export const useEditMessageHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  doUpdateMessageRequest?: UpdateHandler<StreamChatGenerics>,
) => {
  const { channel, client } = useChatContext<StreamChatGenerics>('useEditMessageHandler');

  return (updatedMessage: UpdatedMessage<StreamChatGenerics>, options?: UpdateMessageOptions) => {
    if (doUpdateMessageRequest && channel) {
      return Promise.resolve(doUpdateMessageRequest(channel.cid, updatedMessage, options));
    }
    return client.updateMessage(updatedMessage, undefined, options);
  };
};
