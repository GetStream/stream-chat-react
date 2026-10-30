import React from 'react';
import type { TFunction } from 'i18next';
import { ScheduledMessageStatus } from 'stream-chat';

import { useTranslationContext } from '../../context';
import { Badge } from '../Badge';
import type { BadgeVariant } from '../Badge';
import type { ScheduledMessageStatusBadgeProps } from './types';

const translateScheduledMessageStatus = (
  t: TFunction,
  status: ScheduledMessageStatus,
) => {
  if (status === ScheduledMessageStatus.Failed) return t('Failed');

  if (status === ScheduledMessageStatus.Sending) return t('Sending...');

  return t('Scheduled');
};

const getStatusBadgeVariant = (status: ScheduledMessageStatus): BadgeVariant =>
  status === ScheduledMessageStatus.Failed ? 'error' : 'neutral';

export const ScheduledMessageStatusBadge = ({
  scheduledMessage,
}: ScheduledMessageStatusBadgeProps) => {
  const { t } = useTranslationContext();

  const { status } = scheduledMessage;

  return (
    <Badge
      className='str-chat__scheduled-message-status-badge'
      size='sm'
      variant={getStatusBadgeVariant(status)}
    >
      {translateScheduledMessageStatus(t, status)}
    </Badge>
  );
};
