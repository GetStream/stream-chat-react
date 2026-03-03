import clsx from 'clsx';
import React, { useMemo } from 'react';
import { messageHasAttachments, messageTextHasEmojisOnly } from './utils';

import type { MessageContextValue } from '../../context';
import { useMessageContext, useTranslationContext } from '../../context';
import { renderText as defaultRenderText } from './renderText';
import { MessageErrorText } from './MessageErrorText';

import type { LocalMessage } from 'stream-chat';
import { getTranslatedMessageText } from '../../context/MessageTranslationViewContext';

export type MessageTextProps = {
  /* Replaces the CSS class name placed on the component's inner `div` container */
  customInnerClass?: string;
  /* Adds a CSS class name to the component's outer `div` container */
  customWrapperClass?: string;
  /* The `StreamChat` message object, which provides necessary data to the underlying UI components (overrides the value stored in `MessageContext`) */
  message?: LocalMessage;
} & Pick<MessageContextValue, 'renderText'>;

const UnMemoizedMessageTextComponent = (props: MessageTextProps) => {
  const {
    customInnerClass,
    customWrapperClass = '',
    message: propMessage,
    renderText: propsRenderText,
  } = props;

  const {
    message: contextMessage,
    onMentionsClickMessage,
    onMentionsHoverMessage,
    renderText: contextRenderText,
    translationView = 'translated',
    unsafeHTML,
  } = useMessageContext('MessageText');

  const renderText = propsRenderText ?? contextRenderText ?? defaultRenderText;

  const { userLanguage } = useTranslationContext('MessageText');
  const message = propMessage || contextMessage;
  const hasAttachment = messageHasAttachments(message);

  const messageTextToRender =
    translationView === 'original'
      ? message.text
      : getTranslatedMessageText({ language: userLanguage, message }) || message.text;

  const messageText = useMemo(
    () => renderText(messageTextToRender, message.mentioned_users),
    [message.mentioned_users, messageTextToRender, renderText],
  );

  const wrapperClass = customWrapperClass || 'str-chat__message-text';
  const innerClass = customInnerClass;

  if (!messageTextToRender) return null;

  return (
    <div className={wrapperClass} tabIndex={0}>
      <div
        className={clsx(innerClass, {
          [` str-chat__message-text-inner--is-emoji`]:
            messageTextHasEmojisOnly(message) && !message.quoted_message,
          [`str-chat__message-text-inner--has-attachment`]: hasAttachment,
        })}
        data-testid='message-text-inner-wrapper'
        onClick={onMentionsClickMessage}
        onMouseOver={onMentionsHoverMessage}
      >
        <MessageErrorText message={message} />
        {unsafeHTML && message.html ? (
          <div dangerouslySetInnerHTML={{ __html: message.html }} />
        ) : (
          <div>{messageText}</div>
        )}
      </div>
    </div>
  );
};

export const MessageText = React.memo(
  UnMemoizedMessageTextComponent,
) as typeof UnMemoizedMessageTextComponent;
