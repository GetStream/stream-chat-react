import React from 'react';
import { SCHEDULED_MESSAGE_STATUS } from 'stream-chat';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import type { ScheduledMessageItemStatusProps } from './types';
import { translateScheduledMessageFailureReason } from './utils';

export const ScheduledMessageItemStatus = ({
  scheduledMessage,
}: ScheduledMessageItemStatusProps) => {
  const { t } = useTranslationContext();
  const { IconExclamationTriangleFill, IconLoading } = useComponentContextIcons();

  const { failure_reason, status } = scheduledMessage;

  if (status === SCHEDULED_MESSAGE_STATUS.Failed) {
    return (
      <span className='str-chat__scheduled-message-item__status str-chat__scheduled-message-item__status--failed'>
        <IconExclamationTriangleFill className='str-chat__scheduled-message-item__status-icon' />
        {translateScheduledMessageFailureReason(t, failure_reason)}
      </span>
    );
  }

  if (status === SCHEDULED_MESSAGE_STATUS.Sending) {
    return (
      <span className='str-chat__scheduled-message-item__status'>
        <IconLoading className='str-chat__scheduled-message-item__status-icon' />
        {t('scheduledMessages.sending', 'Sending...')}
      </span>
    );
  }

  return null;
};
