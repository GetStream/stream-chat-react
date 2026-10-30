import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';

import type { LocalMessage } from 'stream-chat';
import type { ReactEventHandler } from '../types';

// `pinned_at` is a `Date` here, and a copy of the message from an event carries its own instance,
// so pins are compared by time rather than by reference.
const getPinnedAtTime = (pinnedAt: LocalMessage['pinned_at']) =>
  pinnedAt ? new Date(pinnedAt).getTime() : undefined;

export const usePinHandler = (message: LocalMessage) => {
  const { updateMessage } = useChannelActionContext('usePinHandler');
  const { channel, channelCapabilities = {} } = useChannelStateContext('usePinHandler');
  const { client } = useChatContext('usePinHandler');

  const canPin = !!channelCapabilities['pin-message'];

  // The stored message, which may be newer than the `message` this hook rendered with.
  const getLatestMessage = () =>
    channel.state.findMessage(message.id, message.parent_id) ?? message;

  // Restores only the pin fields from before the click, so updates that arrived while the request
  // was in flight (an edit, a reaction) are kept. Skipped unless the stored pin is still the
  // optimistic one: a pin or unpin that arrived meanwhile is newer than the snapshot, even when
  // `pinned` has the same value.
  const rollBackPin = (optimisticMessage: LocalMessage) => {
    const latestMessage = channel.state.findMessage(message.id, message.parent_id);
    if (!latestMessage) return;

    const isOptimisticPinStored =
      latestMessage.pinned === optimisticMessage.pinned &&
      getPinnedAtTime(latestMessage.pinned_at) ===
        getPinnedAtTime(optimisticMessage.pinned_at) &&
      latestMessage.pinned_by?.id === optimisticMessage.pinned_by?.id;
    if (!isOptimisticPinStored) return;

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
