// @ts-check
import React, { useContext, useState, useEffect } from 'react';

import { ChatContext, TranslationContext } from '../../context';
import CustomNotification from './CustomNotification';

/**
 * ConnectionStatus - Indicator that there is a connection failure
 * @type {React.FC<{}>}
 */
const ConnectionStatus = () => {
  const { client } = useContext(ChatContext);
  const { t } = useContext(TranslationContext);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    /** @param {import('stream-chat').Event<string>} e */
    const connectionChanged = (e) => {
      if (e.online !== online) setOnline(/** @type {boolean} */ (e.online));
    };

    client.on('connection.changed', connectionChanged);
    return () => client.off('connection.changed', connectionChanged);
  }, [client, online]);

  return (
    <CustomNotification active={!online} type="error">
      {t('Connection failure, reconnecting now...')}
    </CustomNotification>
  );
};

export default React.memo(ConnectionStatus);
