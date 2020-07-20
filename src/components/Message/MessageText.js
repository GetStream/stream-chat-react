// @ts-check
import React, { useMemo, useContext } from 'react';
import { isOnlyEmojis, renderText } from '../../utils';
import { TranslationContext } from '../../context';
import { useMentionsUIHandler } from './hooks';
import { messageHasAttachments } from './utils';
import { ErrorIcon } from './icons';

/**
 * @type { React.FC<import('types').MessageTextProps> }
 */
const MessageTextComponent = (props) => {
  const {
    onMentionsClickMessage: propOnMentionsClick,
    onMentionsHoverMessage: propOnMentionsHover,
    onRetryClick,
    customWrapperClass,
    customInnerClass,
    theme = 'simple',
    message,
    unsafeHTML,
    displayIconOnError = false,
  } = props;
  const { onMentionsClick, onMentionsHover } = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });
  const { t } = useContext(TranslationContext);
  const hasAttachment = messageHasAttachments(message);
  const messageText = useMemo(
    () => renderText(message?.text, message?.mentioned_users),
    [message?.text, message?.mentioned_users],
  );
  const wrapperClass = customWrapperClass || 'str-chat__message-text';
  const innerClass =
    customInnerClass ||
    `str-chat__message-text-inner str-chat__message-${theme}-text-inner`;

  if (!message?.text) {
    return null;
  }

  return (
    <div className={wrapperClass}>
      <div
        data-testid="message-text-inner-wrapper"
        className={`
          ${innerClass}
          ${
            hasAttachment
              ? ` str-chat__message-${theme}-text-inner--has-attachment`
              : ''
          }
          ${
            isOnlyEmojis(message.text)
              ? ` str-chat__message-${theme}-text-inner--is-emoji`
              : ''
          }
        `.trim()}
        onMouseOver={onMentionsHover}
        onClick={onMentionsClick}
      >
        {message.type === 'error' && (
          <div className={`str-chat__${theme}-message--error-message`}>
            {displayIconOnError && <ErrorIcon />}
            {t('Error · Unsent')}
          </div>
        )}
        {message.status === 'failed' && (
          <div
            data-testid="message-text-failed"
            className={`str-chat__${theme}-message--error-message`}
            onClick={onRetryClick}
          >
            {displayIconOnError && <ErrorIcon />}
            {t('Message Failed · Click to try again')}
          </div>
        )}

        {unsafeHTML ? (
          <div dangerouslySetInnerHTML={{ __html: message.html }} />
        ) : (
          messageText
        )}
      </div>
    </div>
  );
};

export default React.memo(MessageTextComponent);
