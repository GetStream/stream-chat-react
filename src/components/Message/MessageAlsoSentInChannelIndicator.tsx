import React from 'react';

import { IconArrowRightUp } from '../Icons';
import { useMessageContext, useTranslationContext } from '../../context';

/**
 * Indicator shown in thread message lists when the message was also sent to the main channel (show_in_channel === true).
 * Only visible inside Thread, not in the main channel list.
 */
export const MessageAlsoSentInChannelIndicator = () => {
  const { message, threadList } = useMessageContext('MessageAlsoSentInChannelIndicator');
  const { t } = useTranslationContext();

  if (!threadList || !message?.show_in_channel) return null;

  return (
    <div className='str-chat__message-also-sent-in-channel' role='status'>
      <IconArrowRightUp />
      <span>{t('Also sent in channel')}</span>
    </div>
  );
};
