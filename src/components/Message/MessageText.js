// @ts-check
import React, { useMemo, useContext } from 'react';
import { isOnlyEmojis, renderText } from '../../utils';
import { TranslationContext } from '../../context';
import { useMentionsUIHandler } from './hooks';
import { messageHasAttachments } from './utils';
import { ErrorIcon } from './icons';

/**
 * @type { (theme: string, message: import('stream-chat').MessageResponse | undefined, customInnerClass: string | undefined) => string }
 */
function getMessageTextInnerClass(theme, message, customInnerClass) {
  const innerClass =
    customInnerClass ||
    `str-chat__message-text-inner str-chat__message-${theme}-text-inner`;
  const hasAttachment = messageHasAttachments(message);

  return `
          ${innerClass}
          ${
            hasAttachment
              ? ` str-chat__message-${theme}-text-inner--has-attachment`
              : ''
          }
          ${
            isOnlyEmojis(message?.text)
              ? ` str-chat__message-${theme}-text-inner--is-emoji`
              : ''
          }
        `.trim();
}

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
    inlineError = false,
  } = props;
  const { onMentionsClick, onMentionsHover } = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });
  const { t } = useContext(TranslationContext);
  const messageText = useMemo(
    () => renderText(message?.text, message?.mentioned_users),
    [message?.text, message?.mentioned_users],
  );
  const wrapperClass = customWrapperClass || 'str-chat__message-text';
  const innerClass = useMemo(
    () => getMessageTextInnerClass(theme, message, customInnerClass),
    [theme, message, customInnerClass],
  );
  if (!message?.text) {
    return null;
  }

  return (
    <div className={wrapperClass}>
      <div
        data-testid="message-text-inner-wrapper"
        className={innerClass}
        onMouseOver={onMentionsHover}
        onClick={onMentionsClick}
      >
        {message.type === 'error' && !inlineError && (
          <MessageTextError t={t} theme={theme} />
        )}
        {message.status === 'failed' && !inlineError && (
          <MessageTextRetry t={t} onRetryClick={onRetryClick} theme={theme} />
        )}
        {(message.type === 'error' ||
          (message.type === 'failed' && inlineError)) && <ErrorIcon />}
        {unsafeHTML ? (
          <div dangerouslySetInnerHTML={{ __html: message.html }} />
        ) : (
          { messageText }
        )}
      </div>
    </div>
  );
};

/**
 * @type { ({t, theme}: {t: import('i18next').TFunction, theme: string}) => JSX.Element }
 */
const MessageTextError = ({ t, theme }) => (
  <div className={`str-chat__${theme}-message--error-message`}>
    {t('Error · Unsent')}
  </div>
);

/**
 * @type { ({t, theme, onRetryClick}: {t: import('i18next').TFunction, theme: string, onRetryClick?: (event?: React.BaseSyntheticEvent)=> void}) => JSX.Element }
 */
const MessageTextRetry = ({ theme, onRetryClick, t }) => (
  <div
    data-testid="message-text-failed"
    className={`str-chat__${theme}-message--error-message`}
    onClick={onRetryClick}
  >
    {t('Message Failed · Click to try again')}
  </div>
);

export default React.memo(MessageTextComponent);
