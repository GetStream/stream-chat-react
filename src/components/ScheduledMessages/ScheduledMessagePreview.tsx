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

/** Above the composer while a scheduled message is edited, or a failed one scheduled again. */
export const ScheduledMessagePreview = ({
  onCancel,
  scheduledMessage,
}: ScheduledMessagePreviewProps) => {
  const { t } = useTranslationContext();
  const previewMessage = useScheduledMessagePreview(scheduledMessage);
  return (
    <QuotedMessagePreviewUI
      authorLabel={
        isFailedScheduledMessage(scheduledMessage)
          ? t('scheduledMessages.scheduleAgain', 'Schedule again')
          : t('scheduledMessages.editScheduledMessage', 'Edit scheduled message')
      }
      onRemove={onCancel}
      quotedMessage={previewMessage}
    />
  );
};
