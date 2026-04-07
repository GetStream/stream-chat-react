import { useChannelStateContext } from '../../../context';

import type { LocalMessage } from 'stream-chat';
import type { ReactEventHandler } from '../types';

export const useMarkUnreadHandler = (message?: LocalMessage): ReactEventHandler => {
  const { channel } = useChannelStateContext('useMarkUnreadHandler');

  return async (event) => {
    event.preventDefault();
    if (!message?.id) {
      console.warn('Mark unread handler does not have access to message id');
      return;
    }

    await channel.markUnread({ message_id: message.id });
  };
};
