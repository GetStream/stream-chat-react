import React from 'react';
import type { MessageContextValue } from '../../context/MessageContext';
import { useMessageContext } from '../../context/MessageContext';
import { useChannelActionContext } from '../../context/ChannelActionContext';
import { renderText as defaultRenderText } from './renderText';
import { QuotedMessagePreviewUI } from '../MessageInput';

export type QuotedMessageProps = Pick<MessageContextValue, 'renderText'>;

export const QuotedMessage = ({ renderText: propsRenderText }: QuotedMessageProps) => {
  const { message, renderText: contextRenderText } = useMessageContext('QuotedMessage');
  const { jumpToMessage } = useChannelActionContext('QuotedMessage');

  const renderText = propsRenderText ?? contextRenderText ?? defaultRenderText;

  const { quoted_message } = message;

  return quoted_message ? (
    <QuotedMessagePreviewUI
      onClick={(e) => {
        if (!quoted_message) return;
        e.stopPropagation();
        e.preventDefault();
        jumpToMessage(quoted_message.id);
      }}
      quotedMessage={quoted_message}
      renderText={renderText}
    />
  ) : null;
};
