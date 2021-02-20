// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

/**
 * @type {import('types').useRetryHandler}
 */
export const useRetryHandler = (customRetrySendMessage) => {
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
