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
  const { userLanguage } = useTranslationContext('QuotedMessage');
  const { jumpToMessage } = useChannelActionContext('QuotedMessage');

  const Avatar = ContextAvatar || DefaultAvatar;

  const { quoted_message } = message;
  if (!quoted_message) return null;

  const quotedMessageText =
    quoted_message.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    quoted_message.text;

  // @ts-expect-error
  const quotedMessageAttachment = quoted_message.attachments.length
    ? // @ts-expect-error
      quoted_message.attachments[0]
    : null;

  if (!quotedMessageText && !quotedMessageAttachment) return null;

  return (
    <>
      <div
        className={clsx('str-chat__quoted-message-preview quoted-message', { mine: isMyMessage() })}
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
        <div className='quoted-message-inner str-chat__quoted-message-bubble'>
          {quotedMessageAttachment && <Attachment attachments={[quotedMessageAttachment]} />}
          <div>{quotedMessageText}</div>
        </div>
      </div>
      {message.attachments?.length && message.quoted_message ? (
        <Attachment attachments={message.attachments} />
      ) : null}
    </>
  );
};
