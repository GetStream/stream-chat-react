import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useConnectionRecoveredListener = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  forceUpdate?: () => void,
) => {
  const { client } = useChatContext<StreamChatGenerics>('useConnectionRecoveredListener');

  useEffect(() => {
    const handleEvent = () => {
      if (forceUpdate) {
        forceUpdate();
      }
    };

    client.on('connection.recovered', handleEvent);

    return () => {
      client.off('connection.recovered', handleEvent);
    };
  }, []);
};
