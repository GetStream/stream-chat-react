// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

/**
 * @type {() => (message: import('stream-chat').Message | undefined) => Promise<void>}
 */
export const useRetryHandler = () => {
  /**
   *@type {import('types').ChannelContextValue}
   */
  const { retrySendMessage } = useContext(ChannelContext);
  return async (message) => {
    if (retrySendMessage && message) {
      await retrySendMessage(message);
    }
  };
};
