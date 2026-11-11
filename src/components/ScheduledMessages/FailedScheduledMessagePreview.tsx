import React, { useMemo } from 'react';

import { useTranslationContext } from '../../context';
import { QuotedMessagePreviewUI } from '../MessageComposer/QuotedMessagePreview';
import type { FailedScheduledMessagePreviewProps } from './types';
import { toStoredScheduledMessagePreview } from './utils';

export const FailedScheduledMessagePreview = ({
  onCancel,
  scheduledMessage,
}: FailedScheduledMessagePreviewProps) => {
  const { t } = useTranslationContext();

  const previewMessage = useMemo(
    () => toStoredScheduledMessagePreview(scheduledMessage),
    [scheduledMessage],
  );

  return (
    <QuotedMessagePreviewUI
      authorLabel={t('Schedule again')}
      onRemove={onCancel}
      quotedMessage={previewMessage}
    />
  );
};
