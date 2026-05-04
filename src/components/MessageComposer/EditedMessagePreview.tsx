import React from 'react';
import { QuotedMessagePreviewUI } from './QuotedMessagePreview';
import type { LocalMessage } from 'stream-chat';
import { useTranslationContext } from '../../context';

export type EditedMessagePreviewProps = {
  message: LocalMessage;
  onCancel: () => void;
};

export const EditedMessagePreview = ({
  message,
  onCancel,
}: EditedMessagePreviewProps) => {
  const { t } = useTranslationContext();

  return (
    <QuotedMessagePreviewUI
      authorLabel={t('Edit Message')}
      onRemove={onCancel}
      quotedMessage={message}
    />
  );
};
