import clsx from 'clsx';
import React, { useMemo } from 'react';

import { useTranslationContext } from '../../context';
import { ListItemLayout } from '../ListItemLayout';
import { SummarizedMessagePreview } from '../SummarizedMessagePreview';
import { ScheduledMessageActions } from './ScheduledMessageActions';
import { ScheduledMessageStatusBadge } from './ScheduledMessageStatusBadge';
import type { ScheduledMessageItemProps } from './types';
import {
  isFailedScheduledMessage,
  toStoredScheduledMessagePreview,
  translateScheduledMessageFailureReason,
} from './utils';

export const ScheduledMessageItem = ({
  onEdit,
  scheduledMessage,
}: ScheduledMessageItemProps) => {
  const { t } = useTranslationContext();

  const { failure_reason, scheduled_at } = scheduledMessage;

  const previewMessage = useMemo(
    () => toStoredScheduledMessagePreview(scheduledMessage),
    [scheduledMessage],
  );

  const TrailingSlot = useMemo(
    () =>
      function ScheduledMessageItemTrailingSlot() {
        return (
          <div className='str-chat__scheduled-message-item__trailing'>
            <ScheduledMessageStatusBadge scheduledMessage={scheduledMessage} />
            <ScheduledMessageActions
              onEdit={onEdit}
              scheduledMessage={scheduledMessage}
            />
          </div>
        );
      },
    [onEdit, scheduledMessage],
  );

  const isFailed = isFailedScheduledMessage(scheduledMessage);
  const failureMessage = isFailed
    ? translateScheduledMessageFailureReason(t, failure_reason)
    : undefined;
  const scheduledTime = t('timestamp/ScheduledMessage', {
    timestamp: new Date(scheduled_at),
  });

  return (
    <div
      className={clsx('str-chat__scheduled-message-item', {
        'str-chat__scheduled-message-item--failed': isFailed,
      })}
      data-testid='scheduled-message-item'
    >
      <ListItemLayout
        description={failureMessage}
        descriptionClassName='str-chat__scheduled-message-item__failure-reason'
        subtitle={<time dateTime={scheduled_at}>{scheduledTime}</time>}
        subtitleClassName='str-chat__scheduled-message-item__time'
        title={<SummarizedMessagePreview latestMessage={previewMessage} />}
        TrailingSlot={TrailingSlot}
      />
    </div>
  );
};
