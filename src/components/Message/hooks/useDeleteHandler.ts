import { isNetworkSendFailure } from '../utils';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChatContext } from '../../../context/ChatContext';

import type { DeleteMessageOptions, LocalMessage } from 'stream-chat';
import type { MessageContextValue } from '../../../context';

export const useDeleteHandler = (
  message?: LocalMessage,
): MessageContextValue['handleDelete'] => {
  const { deleteMessage, removeMessage, updateMessage } =
    useChannelActionContext('useDeleteHandler');
  const { client } = useChatContext('useDeleteHandler');

  return async (options?: DeleteMessageOptions) => {
    if (!message) {
      return;
    }

    if (message.type === 'error' || isNetworkSendFailure(message)) {
      removeMessage?.(message);
      return;
    }

    if (!message.id || !client || !updateMessage) {
      return;
    }

    const deletedMessage = await deleteMessage(message, options);
    updateMessage(deletedMessage);
  };
};
