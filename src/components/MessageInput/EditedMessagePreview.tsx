import React from 'react';
import { QuotedMessagePreviewUI } from './QuotedMessagePreview';
import type { LocalMessage } from 'stream-chat';

export type EditedMessagePreviewProps = {
  message: LocalMessage;
  onCancel: () => void;
};

export const EditedMessagePreview = ({
  message,
  onCancel,
}: EditedMessagePreviewProps) => (
  <QuotedMessagePreviewUI onRemove={onCancel} quotedMessage={message} />
);
