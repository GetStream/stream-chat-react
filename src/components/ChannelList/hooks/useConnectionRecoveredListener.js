// @ts-check

import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

/**
 * @param {() => void} [forceUpdate]
 */
export const useConnectionRecoveredListener = (forceUpdate) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    const handleEvent = () => {
      forceUpdate?.();
    };

    client.on('connection.recovered', handleEvent);

    return () => {
      client.off('connection.recovered', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
