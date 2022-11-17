import React, { useMemo } from 'react';

import { QuotedMessage as DefaultQuotedMessage } from './QuotedMessage';
import { messageHasAttachments } from './utils';

import { useComponentContext, useMessageContext, useTranslationContext } from '../../context';
import { renderText as defaultRenderText, isOnlyEmojis } from '../../utils';

import type { TranslationLanguages } from 'stream-chat';
import type { MessageContextValue, StreamMessage } from '../../context';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type MessageTextProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /* Replaces the CSS class name placed on the component's inner `div` container */
  customInnerClass?: string;
  /* Adds a CSS class name to the component's outer `div` container */
  customWrapperClass?: string;
  /* The `StreamChat` message object, which provides necessary data to the underlying UI components (overrides the value stored in `MessageContext`) */
  message?: StreamMessage<StreamChatGenerics>;
  /* Theme string to be added to CSS class names */
  theme?: string;
} & Pick<MessageContextValue<StreamChatGenerics>, 'renderText'>;

const UnMemoizedMessageTextComponent = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageTextProps<StreamChatGenerics>,
) => {
  const {
    customInnerClass,
    customWrapperClass = '',
    message: propMessage,
    renderText: propsRenderText,
    theme = 'simple',
  } = props;

  const { QuotedMessage = DefaultQuotedMessage } = useComponentContext<StreamChatGenerics>(
    'MessageText',
  );

  const {
    message: contextMessage,
    onMentionsClickMessage,
    onMentionsHoverMessage,
    renderText: contextRenderText,
    unsafeHTML,
  } = useMessageContext<StreamChatGenerics>('MessageText');

  const renderText = propsRenderText ?? contextRenderText ?? defaultRenderText;

  const { t, userLanguage } = useTranslationContext('MessageText');
  const message = propMessage || contextMessage;
  const hasAttachment = messageHasAttachments(message);

  const messageTextToRender =
    message.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] || message.text;

  const messageText = useMemo(() => renderText(messageTextToRender, message.mentioned_users), [
    message.mentioned_users,
    messageTextToRender,
  ]);

  const wrapperClass = customWrapperClass || 'str-chat__message-text';
  const innerClass =
    customInnerClass || `str-chat__message-text-inner str-chat__message-${theme}-text-inner`;

  if (!messageTextToRender && !message.quoted_message) return null;

  return (
    <div className={wrapperClass} tabIndex={0}>
      <div
        className={`
          ${innerClass}
          ${hasAttachment ? ` str-chat__message-${theme}-text-inner--has-attachment` : ''}
          ${
            isOnlyEmojis(message.text) && !message.quoted_message
              ? ` str-chat__message-${theme}-text-inner--is-emoji`
              : ''
          }
        `.trim()}
        data-testid='message-text-inner-wrapper'
        onClick={onMentionsClickMessage}
        onMouseOver={onMentionsHoverMessage}
      >
        {message.quoted_message && <QuotedMessage />}
        {message.type === 'error' && (
          <div
            className={`str-chat__${theme}-message--error-message str-chat__message--error-message`}
          >
            {t<string>('Error · Unsent')}
          </div>
        )}
        {message.status === 'failed' && (
          <div
            className={`str-chat__${theme}-message--error-message str-chat__message--error-message`}
          >
            {message.errorStatusCode !== 403
              ? t<string>('Message Failed · Click to try again')
              : t<string>('Message Failed · Unauthorized')}
          </div>
        )}
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
