// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';
import type { Message } from 'stream-chat';

export const useRetryHandler = (
  customRetrySendMessage: Message,
): ((message: Message | undefined) => Promise<void>) => {
  const { retrySendMessage: contextRetrySendMessage } = useContext(
    ChannelContext,
  );

  const retrySendMessage = customRetrySendMessage || contextRetrySendMessage;

  return async (message) => {
    if (retrySendMessage && message) {
      // @ts-expect-error
      await retrySendMessage(message);
    }
  };
};
