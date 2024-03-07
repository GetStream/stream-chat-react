import React from 'react';
import clsx from 'clsx';

import { Avatar as DefaultAvatar } from '../Avatar';

import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useChannelActionContext } from '../../context/ChannelActionContext';

import type { TranslationLanguages } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

export const QuotedMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { Attachment, Avatar: ContextAvatar } = useComponentContext<StreamChatGenerics>(
    'QuotedMessage',
  );
  const { isMyMessage, message } = useMessageContext<StreamChatGenerics>('QuotedMessage');
  const { t, userLanguage } = useTranslationContext('QuotedMessage');
  const { jumpToMessage } = useChannelActionContext('QuotedMessage');

  const Avatar = ContextAvatar || DefaultAvatar;

  const { quoted_message } = message;
  if (!quoted_message) return null;

  const quotedMessageDeleted = quoted_message.deleted_at || quoted_message.type === 'deleted';

  const quotedMessageText = quotedMessageDeleted
    ? t('This message was deleted...')
    : quoted_message.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
      quoted_message.text;

  const quotedMessageAttachment =
    quoted_message.attachments?.length && !quotedMessageDeleted
      ? quoted_message.attachments[0]
      : null;

  if (!quotedMessageText && !quotedMessageAttachment) return null;

  return (
    <>
      <div
        className={clsx('str-chat__quoted-message-preview quoted-message', { mine: isMyMessage() })}
        data-testid='quoted-message'
        onClickCapture={(e) => {
          e.stopPropagation();
          e.preventDefault();
          jumpToMessage(quoted_message.id);
        }}
      >
        {quoted_message.user && (
          <Avatar
            image={quoted_message.user.image}
            name={quoted_message.user.name || quoted_message.user.id}
            size={20}
            user={quoted_message.user}
          />
        )}
        <div
          className='quoted-message-inner str-chat__quoted-message-bubble'
          data-testid='quoted-message-contents'
        >
          {quotedMessageAttachment && (
            <Attachment attachments={[quotedMessageAttachment]} isQuoted />
          )}
          <div data-testid='quoted-message-text'>{quotedMessageText}</div>
        </div>
      </div>
      {message.attachments?.length ? <Attachment attachments={message.attachments} /> : null}
    </>
  );
};
