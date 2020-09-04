// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

export const handleMMLActionWarning = `Action handler was called, but it is missing one of its required arguments.
      Make sure the ChannelContext was properly set and that this hook was initialized with a valid message.`;
/**
 * @type {(message: import('stream-chat').MessageResponse | undefined) => (values: Array<{ name: string, value: string; }>) => Promise<void>}
 */
export const useActionHandlerMML = (message) => {
  const { channel, updateMessage, removeMessage } = useContext(ChannelContext);
  return async (values) => {
    if (!message || !updateMessage || !removeMessage || !channel) {
      console.warn(handleMMLActionWarning);
      return;
    }
    const messageID = message.id;

    const formData = {};
    for (let i = 0; i < values.length; i += 1) {
      const value =
        values[i].value instanceof Date
          ? values[i].value.toISOString()
          : values[i].value.toString();
      formData[values[i].name] = value;
    }

    const data = await channel.sendAction(messageID, formData);

    if (data && data.message) {
      updateMessage(data.message);
    } else {
      removeMessage(message);
    }
  };
};
