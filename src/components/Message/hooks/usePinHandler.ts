import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';

import type { LocalMessage } from 'stream-chat';
import type { ReactEventHandler } from '../types';

export const usePinHandler = (message: LocalMessage) => {
  const { updateMessage } = useChannelActionContext('usePinHandler');
  const { channel, channelCapabilities = {} } = useChannelStateContext('usePinHandler');
  const { client } = useChatContext('usePinHandler');

  const canPin = !!channelCapabilities['pin-message'];

  // The stored message, which may be newer than the `message` this hook rendered with.
  const getLatestMessage = () =>
    channel.state.findMessage(message.id, message.parent_id) ?? message;

  // Restores only the pin fields from before the click, so updates that arrived while the request
  // was in flight (an edit, a reaction) are kept. Skipped when the pin state already changed
  // again, since that change is newer than the snapshot.
  const rollBackPin = (optimisticMessage: LocalMessage) => {
    const latestMessage = channel.state.findMessage(message.id, message.parent_id);
    if (!latestMessage || latestMessage.pinned !== optimisticMessage.pinned) return;

    updateMessage({
      ...latestMessage,
      pin_expires: message.pin_expires,
      pinned: message.pinned,
      pinned_at: message.pinned_at,
      pinned_by: message.pinned_by,
    });
  };

  const handlePin: ReactEventHandler = async (event) => {
    event.preventDefault();

    if (!message) return;

    if (!message.pinned) {
      const optimisticMessage: LocalMessage = {
        ...getLatestMessage(),
        pinned: true,
        pinned_at: new Date(),
        pinned_by: client.user,
      };

      try {
        updateMessage(optimisticMessage);

        await client.pinMessage(message);
      } catch (error) {
        rollBackPin(optimisticMessage);
        throw error;
      }
    } else {
      const optimisticMessage: LocalMessage = {
        ...getLatestMessage(),
        pin_expires: null,
        pinned: false,
        pinned_at: null,
        pinned_by: null,
      };

      try {
        updateMessage(optimisticMessage);

        await client.unpinMessage(message);
      } catch (error) {
        rollBackPin(optimisticMessage);
        throw error;
      }
    }
  };

  return { canPin, handlePin };
};
