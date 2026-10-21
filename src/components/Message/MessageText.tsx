import clsx from 'clsx';
import React, { useMemo } from 'react';
import { messageHasAttachments, messageTextHasEmojisOnly } from './utils';
import { useStableId } from '../UtilityComponents/useStableId';

import type { MessageContextValue } from '../../context';
import { useMessageContext, useTranslationContext } from '../../context';
import { VisuallyHidden } from '../VisuallyHidden';
import { renderText as defaultRenderText } from './renderText';
import { getRenderTextMentionEntities } from './renderText/rehypePlugins';

import type { LocalMessage } from 'stream-chat';
import { getTranslatedMessageText } from '../../context/MessageTranslationViewContext';

export type MessageTextProps = {
  /** Class name for the inner `div`. */
  customInnerClass?: string;
  /** Replaces the default `str-chat__message-text` class on the outer `div`. */
  customWrapperClass?: string;
  /** Message to render; overrides the one from `MessageContext`. */
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
  } = useMessageContext();

  const renderText = propsRenderText ?? contextRenderText ?? defaultRenderText;

  const { t, userLanguage } = useTranslationContext();
  const message = propMessage || contextMessage;
  const hasAttachment = messageHasAttachments(message);
  const messageContextId = useStableId();
  const messageTextId = useStableId();

  const messageTextToRender =
    translationView === 'original'
      ? message.text
      : getTranslatedMessageText({ language: userLanguage, message }) || message.text;
  const renderTextMentionEntities = useMemo(
    () =>
      getRenderTextMentionEntities({
        mentioned_channel: message.mentioned_channel,
        mentioned_groups: message.mentioned_groups,
        mentioned_here: message.mentioned_here,
        mentioned_roles: message.mentioned_roles,
        mentioned_users: message.mentioned_users,
      }),
    [
      message.mentioned_channel,
      message.mentioned_groups,
      message.mentioned_here,
      message.mentioned_roles,
      message.mentioned_users,
    ],
  );

  const messageText = useMemo(
    () =>
      renderText(messageTextToRender, message.mentioned_users, {
        messageMentionEntities: renderTextMentionEntities,
      }),
    [message.mentioned_users, messageTextToRender, renderText, renderTextMentionEntities],
  );

  const wrapperClass = customWrapperClass || 'str-chat__message-text';
  const innerClass = customInnerClass;
  const hasMentions = Boolean(renderTextMentionEntities.length);
  const isMentionsInteractionEnabled =
    hasMentions && typeof onMentionsClickMessage === 'function';
  const senderName = message.user?.name;
  const messageContext = senderName
    ? t('message.text.message.withUser.ariaLabel', 'Message from {{ user }},', {
        user: senderName,
      })
    : t('message.text.message.ariaLabel', 'Message,');
  // `aria-labelledby` takes space-separated IDs: the hidden message context and the rendered
  // text, so screen readers announce both.
  const messageLabelledBy = `${messageContextId} ${messageTextId}`;

  const handleMentionsKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isMentionsInteractionEnabled || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }

    event.preventDefault();
    onMentionsClickMessage(event);
  };

  if (!messageTextToRender) return null;

  // Two mutually exclusive focus models. Without interactive mentions the outer wrapper is the
  // only focus stop. With them the inner element takes focus, because its onClick, onKeyDown and
  // hover handlers live there, and the outer one is not focusable so it adds no dead focus stop.
  return (
    <div
      aria-labelledby={isMentionsInteractionEnabled ? undefined : messageLabelledBy}
      className={wrapperClass}
      tabIndex={isMentionsInteractionEnabled ? undefined : 0}
    >
      <VisuallyHidden id={messageContextId}>{messageContext}</VisuallyHidden>
      <div
        aria-labelledby={isMentionsInteractionEnabled ? messageLabelledBy : undefined}
        className={clsx(innerClass, {
          [` str-chat__message-text-inner--is-emoji`]:
            messageTextHasEmojisOnly(message) && !message.quoted_message,
          [`str-chat__message-text-inner--has-attachment`]: hasAttachment,
        })}
        data-testid='message-text-inner-wrapper'
        onClick={onMentionsClickMessage}
        onKeyDown={isMentionsInteractionEnabled ? handleMentionsKeyDown : undefined}
        onMouseOver={onMentionsHoverMessage}
        tabIndex={isMentionsInteractionEnabled ? 0 : undefined}
      >
        {unsafeHTML && message.html ? (
          <div dangerouslySetInnerHTML={{ __html: message.html }} id={messageTextId} />
        ) : (
          <div id={messageTextId}>{messageText}</div>
        )}
      </div>
    </div>
  );
};

export const MessageText = React.memo(
  UnMemoizedMessageTextComponent,
) as typeof UnMemoizedMessageTextComponent;
