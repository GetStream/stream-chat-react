import React, { useMemo } from 'react';

import { useTranslationContext } from '../../context';
import { QuotedMessagePreviewUI } from '../MessageComposer/QuotedMessagePreview';
import type { EditedScheduledMessagePreviewProps } from './types';
import { toStoredScheduledMessagePreview } from './utils';

export const EditedScheduledMessagePreview = ({
  onCancel,
  scheduledMessage,
}: EditedScheduledMessagePreviewProps) => {
  const { t } = useTranslationContext();

  const previewMessage = useMemo(
    () => toStoredScheduledMessagePreview(scheduledMessage),
    [scheduledMessage],
  );

  return (
    <QuotedMessagePreviewUI
      authorLabel={t('Edit scheduled message')}
      onRemove={onCancel}
      quotedMessage={previewMessage}
    />
  );
};
