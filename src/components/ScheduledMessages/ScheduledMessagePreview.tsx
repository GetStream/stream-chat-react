import React from 'react';
import type { ScheduledMessageResponse } from 'stream-chat';

import { useTranslationContext } from '../../context';
import { QuotedMessagePreviewUI } from '../MessageComposer/QuotedMessagePreview';
import { useScheduledMessagePreview } from './hooks/useScheduledMessagePreview';
import { isFailedScheduledMessage } from './utils';

export type ScheduledMessagePreviewProps = {
  onCancel: () => void;
  scheduledMessage: ScheduledMessageResponse;
};

export const ScheduledMessagePreview = ({
  onCancel,
  scheduledMessage,
}: ScheduledMessagePreviewProps) => {
  const { t } = useTranslationContext();

  const previewMessage = useScheduledMessagePreview(scheduledMessage);

  const isFailed = isFailedScheduledMessage(scheduledMessage);
  const authorLabel = isFailed
    ? t('scheduledMessages.scheduleAgain', 'Schedule again')
    : t('scheduledMessages.editScheduledMessage', 'Edit scheduled message');
  const removeLabel = isFailed
    ? t('scheduledMessages.cancelSchedulingAgain.ariaLabel', 'Cancel scheduling again')
    : t('scheduledMessages.cancelEdit.ariaLabel', 'Cancel edit');

  return (
    <QuotedMessagePreviewUI
      authorLabel={authorLabel}
      onRemove={onCancel}
      quotedMessage={previewMessage}
      removeLabel={removeLabel}
    />
  );
};
