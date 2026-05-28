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

  const { t, userLanguage } = useTranslationContext('MessageText');
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
        mentioned_group_ids: message.mentioned_group_ids,
        mentioned_here: message.mentioned_here,
        mentioned_roles: message.mentioned_roles,
        mentioned_users: message.mentioned_users,
      }),
    [
      message.mentioned_channel,
      message.mentioned_group_ids,
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
  const hasMentionedUsers = Boolean(message.mentioned_users?.length);
  const isMentionsInteractionEnabled =
    hasMentionedUsers && typeof onMentionsClickMessage === 'function';
  const senderName = message.user?.name;
  const messageContext = senderName
    ? t('aria/Message from {{ user }},', { user: senderName })
    : t('aria/Message,');
  // `aria-labelledby` accepts a space-separated list of element ids. We point to the
  // hidden message context and the rendered message text so screen readers announce both.
  const messageLabelledBy = `${messageContextId} ${messageTextId}`;

  const handleMentionsKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isMentionsInteractionEnabled || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }

    event.preventDefault();
    onMentionsClickMessage(event);
  };

  if (!messageTextToRender) return null;

  /**
   * The component has two mutually exclusive focus models. The reason is this bit of behavior:
   *
   * if mentions are not interactive:
   *  - the whole message text block is just a readable focus stop
   *  - outer wrapper gets tabIndex={0}
   *  - inner wrapper is not focusable
   * if mentions are interactive:
   *  - keyboard interaction needs to land on the inner element, because that’s where onClick, onKeyDown, and mention hover/click behavior live
   *  - inner wrapper gets tabIndex={0}
   *  - outer wrapper must stop being focusable, otherwise you create an extra dead focus stop before the actual interactive target
   */
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
