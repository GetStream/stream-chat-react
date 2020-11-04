// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

/**
 * @type {import('types').useDeleteHandler}
 */
export const useDeleteHandler = (message) => {
  const { updateMessage, client } = useContext(ChannelContext);
  return async (event) => {
    event.preventDefault();
    if (!message?.id || !client || !updateMessage) {
      return;
    }
    const data = await client.deleteMessage(message.id);
    updateMessage(data.message);
  };
};
