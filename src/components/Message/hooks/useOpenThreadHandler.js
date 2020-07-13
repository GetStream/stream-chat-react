// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

/**
 * @type {(
 *   message: import('stream-chat').MessageResponse | undefined,
 *   customOpenThread?: (message: import('stream-chat').MessageResponse, event: React.SyntheticEvent) => void
 * ) => (event: React.SyntheticEvent) => void}
 */
export const useOpenThreadHandler = (message, customOpenThread) => {
  /**
   * @type{import('types').ChannelContextValue}
   */
  const { openThread: channelOpenThread } = useContext(ChannelContext);

  const openThread = customOpenThread || channelOpenThread;
  return (event) => {
    if (!openThread || !message) {
      console.warn(
        'Open thread handler was called but it is missing one of its parameters',
      );
      return;
    }
    openThread(message, event);
  };
};
