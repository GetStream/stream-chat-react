import { useEffect, useState } from 'react';
import type { Event, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../context';

const isClientOnline = ({ wsConnection }: StreamChat) =>
  wsConnection?.isHealthy !== false;

export const useIsConnectionOnline = () => {
  const { client } = useChatContext('useIsConnectionOnline');
  const [isOnline, setIsOnline] = useState(() => isClientOnline(client));

  useEffect(() => {
    setIsOnline(isClientOnline(client));

    const { unsubscribe } = client.on('connection.changed', ({ online }: Event) =>
      setIsOnline(!!online),
    );

    return unsubscribe;
  }, [client]);

  return isOnline;
};
