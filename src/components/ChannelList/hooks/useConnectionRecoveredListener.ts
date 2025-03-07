import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

export const useConnectionRecoveredListener = (forceUpdate?: () => void) => {
  const { client } = useChatContext('useConnectionRecoveredListener');

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
  }, [client, forceUpdate]);
};
