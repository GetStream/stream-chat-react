import React, { useEffect, useState } from 'react';

import { CustomNotification } from './CustomNotification';

import { useChatContext, useTranslationContext } from '../../context';

import type { Event } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

const UnMemoizedConnectionStatus: React.FC = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const [online, setOnline] = useState(true);

  useEffect(() => {
    const connectionChanged = ({
      online: onlineStatus = false,
    }: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
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

export const ConnectionStatus = React.memo(UnMemoizedConnectionStatus);
