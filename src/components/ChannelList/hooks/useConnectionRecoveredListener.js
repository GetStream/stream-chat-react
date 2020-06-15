import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

export const useConnectionRecoveredListener = (forceUpdate) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    const handleEvent = () => {
      forceUpdate();
    };

    client.on('connection.recovered', () => {
      handleEvent();
    });

    return () => {
      client.off('connection.recovered');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
