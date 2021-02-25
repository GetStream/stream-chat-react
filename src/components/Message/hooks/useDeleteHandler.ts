// @ts-check
import { MouseEvent, useContext } from 'react';
import { ChannelContext } from '../../../context';
import type { MessageResponse } from 'stream-chat';

export const useDeleteHandler = (
  message: MessageResponse | undefined,
): ((event: MouseEvent<HTMLElement>) => Promise<void>) => {
  const { client, updateMessage } = useContext(ChannelContext);
  return async (event) => {
    event.preventDefault();
    if (!message?.id || !client || !updateMessage) {
      return;
    }
    const data = await client.deleteMessage(message.id);
    updateMessage(data.message);
  };
};
