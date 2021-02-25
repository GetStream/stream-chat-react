// @ts-check
import React, { FC, useContext, useEffect, useState } from 'react';
import type { Event } from 'stream-chat';

import { ChatContext, TranslationContext } from '../../context';
import { CustomNotification } from './CustomNotification';

const UnmemoizedConnectionStatus: FC = () => {
  const { client } = useContext(ChatContext);
  const { t } = useContext(TranslationContext);
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
    <CustomNotification active={!online} type='error'>
      {t('Connection failure, reconnecting now...')}
    </CustomNotification>
  );
};

export const ConnectionStatus = React.memo(UnmemoizedConnectionStatus);
