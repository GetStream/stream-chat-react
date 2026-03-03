import React from 'react';
import type { MessageContextValue } from '../../context/MessageContext';
import { useMessageContext } from '../../context/MessageContext';
import { QuotedMessagePreviewUI } from '../MessageInput';
import { useMessagePaginator } from '../../hooks';

export type QuotedMessageProps = Pick<MessageContextValue, 'renderText'>;

export const QuotedMessage = ({ renderText: propsRenderText }: QuotedMessageProps) => {
  const { message, renderText: contextRenderText } = useMessageContext('QuotedMessage');
  const messagePaginator = useMessagePaginator();

  const renderText = propsRenderText ?? contextRenderText;

  const { quoted_message } = message;

  return quoted_message ? (
    <QuotedMessagePreviewUI
      onClick={(e) => {
        if (!quoted_message) return;
        e.stopPropagation();
        e.preventDefault();
        messagePaginator.jumpToMessage(quoted_message.id);
      }}
      quotedMessage={quoted_message}
      renderText={renderText}
    />
  ) : null;
};
