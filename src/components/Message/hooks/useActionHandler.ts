import { BaseSyntheticEvent, useContext } from 'react';
import { ChannelContext } from '../../../context';
import type { MessageResponse } from 'stream-chat';

export type ActionHandlerReturnType = (
  dataOrName: string | Record<string, string>,
  value?: string,
  event?: BaseSyntheticEvent,
) => Promise<void>;

export const handleActionWarning = `Action handler was called, but it is missing one of its required arguments.
      Make sure the ChannelContext was properly set and that this hook was initialized with a valid message.`;

export function useActionHandler(
  message: MessageResponse | undefined,
): ActionHandlerReturnType {
  const { channel, removeMessage, updateMessage } = useContext(ChannelContext);
  return async (dataOrName, value, event) => {
    if (event) event.preventDefault();
    if (!message || !updateMessage || !removeMessage || !channel) {
      console.warn(handleActionWarning);
      return;
    }
    const messageID = message.id;

    let formData: Record<string, string> = {};

    // deprecated: value&name should be removed in favor of data obj
    if (typeof dataOrName === 'string') {
      formData[dataOrName] = value as string;
    } else formData = { ...dataOrName };

    if (messageID) {
      const data = await channel.sendAction(messageID, formData);

      if (data?.message) {
        updateMessage(data.message);
      } else {
        removeMessage(message);
      }
    }
  };
}
