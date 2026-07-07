import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';

import type { LocalMessage, UserResponse } from 'stream-chat';
import type { ReactEventHandler } from '../types';

export const usePinHandler = (message: LocalMessage) => {
  const { updateMessage } = useChannelActionContext('usePinHandler');
  const { channelCapabilities = {} } = useChannelStateContext('usePinHandler');
  const { client } = useChatContext('usePinHandler');

  const canPin = !!channelCapabilities['pin-message'];

  const handlePin: ReactEventHandler = async (event) => {
    event.preventDefault();

    if (!message) return;

    if (!message.pinned) {
      try {
        const optimisticMessage: LocalMessage = {
          ...message,
          pinned: true,
          pinned_at: new Date(),
          pinned_by: client.user as UserResponse | undefined,
        };

        updateMessage(optimisticMessage);

        await client.pinMessage(message);
      } catch (e) {
        updateMessage(message);
      }
    } else {
      try {
        const optimisticMessage = {
          ...message,
          pin_expires: undefined,
          pinned: false,
          pinned_at: undefined,
          pinned_by: undefined,
        };

        updateMessage(optimisticMessage);

        await client.unpinMessage(message);
      } catch (e) {
        updateMessage(message);
      }
    }
  };

  return { canPin, handlePin };
};
