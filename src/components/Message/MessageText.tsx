import React, { useMemo } from 'react';

import { useMobilePress } from './hooks';
import { QuotedMessage as DefaultQuotedMessage } from './QuotedMessage';
import { messageHasAttachments } from './utils';

import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { renderText as defaultRenderText, isOnlyEmojis } from '../../utils';

import type { TranslationLanguages } from 'stream-chat';

import type { StreamMessage } from '../../context/ChannelStateContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type MessageTextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  customInnerClass?: string;
  customWrapperClass?: string;
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  theme?: string;
};

const UnMemoizedMessageTextComponent = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageTextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    customInnerClass,
    customWrapperClass = '',
    message: propMessage,
    theme = 'simple',
  } = props;

  const { QuotedMessage = DefaultQuotedMessage } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>(
    'MessageText',
  );

  const {
    message: contextMessage,
    onMentionsClickMessage,
    onMentionsHoverMessage,
    renderText = defaultRenderText,
    unsafeHTML,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>('MessageText');

  const { t, userLanguage } = useTranslationContext('MessageText');

  const { handleMobilePress } = useMobilePress();

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
    <div className={wrapperClass}>
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
          <div className={`str-chat__${theme}-message--error-message`}>{t('Error · Unsent')}</div>
        )}
        {message.status === 'failed' && (
          <div className={`str-chat__${theme}-message--error-message`}>
            {message.errorStatusCode !== 403
              ? t('Message Failed · Click to try again')
              : t('Message Failed · Unauthorized')}
          </div>
        )}
        {unsafeHTML && message.html ? (
          <div dangerouslySetInnerHTML={{ __html: message.html }} />
        ) : (
          <div onClick={handleMobilePress}>{messageText}</div>
        )}
      </div>
    </div>
  );
};

export const MessageText = React.memo(
  UnMemoizedMessageTextComponent,
) as typeof UnMemoizedMessageTextComponent;
