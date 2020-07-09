// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

/**
 * @type {(
 *  customRetrySendMessage?: (message: import('stream-chat').Message) => Promise<void>
 * ) => (message: import('stream-chat').Message | undefined) => Promise<void>}
 */
export const useRetryHandler = (customRetrySendMessage) => {
  /**
   *@type {import('types').ChannelContextValue}
   */
  const { retrySendMessage: contextRetrySendMessage } = useContext(
    ChannelContext,
  );
  const retrySendMessage = customRetrySendMessage || contextRetrySendMessage;
  return async (message) => {
    if (retrySendMessage && message) {
      await retrySendMessage(message);
    }
  };
};
