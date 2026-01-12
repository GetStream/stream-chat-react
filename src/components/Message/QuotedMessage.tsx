import React, { useMemo } from 'react';
import clsx from 'clsx';
import type { TranslationLanguages } from 'stream-chat';

import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { Poll } from '../Poll';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import type { MessageContextValue } from '../../context/MessageContext';
import { useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { renderText as defaultRenderText } from './renderText';
import { useActionHandler } from './';
import { useMessagePaginator } from '../../hooks';

export type QuotedMessageProps = Pick<MessageContextValue, 'renderText'>;

export const QuotedMessage = ({ renderText: propsRenderText }: QuotedMessageProps) => {
  const { Attachment = DefaultAttachment, Avatar: ContextAvatar } =
    useComponentContext('QuotedMessage');
  const { client } = useChatContext();
  const {
    isMyMessage,
    message,
    renderText: contextRenderText,
  } = useMessageContext('QuotedMessage');
  const { t, userLanguage } = useTranslationContext('QuotedMessage');
  const actionHandler = useActionHandler(message);
  const messagePaginator = useMessagePaginator();
  const renderText = propsRenderText ?? contextRenderText ?? defaultRenderText;

  const Avatar = ContextAvatar || DefaultAvatar;

  const { quoted_message } = message;

  const poll = quoted_message?.poll_id && client.polls.fromState(quoted_message.poll_id);
  const quotedMessageDeleted =
    quoted_message?.deleted_at || quoted_message?.type === 'deleted';

  const quotedMessageText = quotedMessageDeleted
    ? t('This message was deleted...')
    : quoted_message?.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
      quoted_message?.text;

  const quotedMessageAttachment =
    quoted_message?.attachments?.length && !quotedMessageDeleted
      ? quoted_message.attachments[0]
      : null;

  const renderedText = useMemo(
    () => renderText(quotedMessageText, quoted_message?.mentioned_users),
    [quotedMessageText, quoted_message?.mentioned_users, renderText],
  );

  if (!quoted_message) return null;
  if (!quoted_message.poll && !quotedMessageText && !quotedMessageAttachment) return null;

  return (
    <>
      <div
        className={clsx('str-chat__quoted-message-preview', { mine: isMyMessage() })}
        data-testid='quoted-message'
        onClickCapture={(e) => {
          e.stopPropagation();
          e.preventDefault();
          messagePaginator.jumpToMessage(quoted_message.id);
        }}
      >
        {quoted_message.user && (
          <Avatar
            className='str-chat__avatar--quoted-message-sender'
            image={quoted_message.user.image}
            name={quoted_message.user.name || quoted_message.user.id}
            user={quoted_message.user}
          />
        )}
        <div
          className='str-chat__quoted-message-bubble'
          data-testid='quoted-message-contents'
        >
          {poll ? (
            <Poll isQuoted poll={poll} />
          ) : (
            <>
              {quotedMessageAttachment && (
                <Attachment attachments={[quotedMessageAttachment]} isQuoted />
              )}
              <div
                className='str-chat__quoted-message-bubble__text'
                data-testid='quoted-message-text'
              >
                {renderedText}
              </div>
            </>
          )}
        </div>
      </div>
      {message.attachments?.length ? (
        <Attachment actionHandler={actionHandler} attachments={message.attachments} />
      ) : null}
    </>
  );
};
