import React, { useEffect, useState } from 'react';

import type { Event } from 'stream-chat';

import { CustomNotification } from './CustomNotification';
import { useChatContext, useTranslationContext } from '../../context';

const UnMemoizedConnectionStatus = () => {
  const { client } = useChatContext('ConnectionStatus');
  const { t } = useTranslationContext('ConnectionStatus');

  const [online, setOnline] = useState(true);

  useEffect(() => {
    const connectionChanged = ({ online: onlineStatus = false }: Event) => {
      if (online !== onlineStatus) {
        setOnline(onlineStatus);
      }
    };

    client.on('connection.changed', connectionChanged);
    return () => client.off('connection.changed', connectionChanged);
  }, [client, online]);

  return (
    <CustomNotification
      active={!online}
      className='str-chat__connection-status-notification'
      type='error'
    >
      {t('Connection failure, reconnecting now...')}
    </CustomNotification>
  );
};

export const ConnectionStatus = React.memo(UnMemoizedConnectionStatus);
