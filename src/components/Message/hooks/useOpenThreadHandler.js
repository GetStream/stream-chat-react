// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

/**
 * @type {(message: import('stream-chat').MessageResponse | undefined) => (event: React.SyntheticEvent) => void}
 */
export const useOpenThreadHandler = (message) => {
  /**
   * @type{import('types').ChannelContextValue}
   */
  const { openThread } = useContext(ChannelContext);

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
