import React, { useEffect, useState } from 'react';

import type { Event } from 'stream-chat';

import { CustomNotification } from './CustomNotification';
import { useChatContext, useTranslationContext } from '../../context';
import type { DefaultStreamChatGenerics } from '../../types/types';

const UnMemoizedConnectionStatus: React.FC = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { client } = useChatContext<StreamChatGenerics>('ConnectionStatus');
  const { t } = useTranslationContext('ConnectionStatus');

  const [online, setOnline] = useState(true);

  useEffect(() => {
    const connectionChanged = ({ online: onlineStatus = false }: Event<StreamChatGenerics>) => {
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

export const ConnectionStatus = React.memo(
  UnMemoizedConnectionStatus,
) as typeof UnMemoizedConnectionStatus;
