import React, { useMemo } from 'react';
import type { TranslationLanguages } from 'stream-chat';

import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { CloseIcon } from './icons';

import { useChannelActionContext } from '../../context/ChannelActionContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { StreamMessage } from '../../context/ChannelStateContext';
import type { DefaultStreamChatGenerics } from '../../types/types';

export const QuotedMessagePreviewHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { setQuotedMessage } = useChannelActionContext<StreamChatGenerics>('QuotedMessagePreview');
  const { t } = useTranslationContext('QuotedMessagePreview');

  return (
    <div className='str-chat__quoted-message-preview-header'>
      <div className='str-chat__quoted-message-reply-to-message'>
        {t<string>('Reply to Message')}
      </div>
      <button
        aria-label={t('aria/Cancel Reply')}
        className='str-chat__quoted-message-remove'
        onClick={() => setQuotedMessage(undefined)}
      >
        <CloseIcon />
      </button>
    </div>
  );
};

export type QuotedMessagePreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  quotedMessage: StreamMessage<StreamChatGenerics>;
};

export const QuotedMessagePreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  quotedMessage,
}: QuotedMessagePreviewProps<StreamChatGenerics>) => {
  const {
    Attachment = DefaultAttachment,
    Avatar = DefaultAvatar,
  } = useComponentContext<StreamChatGenerics>('QuotedMessagePreview');
  const { userLanguage } = useTranslationContext('QuotedMessagePreview');

  const quotedMessageText =
    quotedMessage.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    quotedMessage.text;

  const quotedMessageAttachment = useMemo(() => {
    const [attachment] = quotedMessage.attachments ?? [];
    return attachment ? [attachment] : [];
  }, [quotedMessage.attachments]);

  if (!quotedMessageText && !quotedMessageAttachment) return null;

  return (
    <div className='str-chat__quoted-message-preview' data-testid='quoted-message-preview'>
      {quotedMessage.user && (
        <Avatar
          className='str-chat__avatar--quoted-message-sender'
          image={quotedMessage.user.image}
          name={quotedMessage.user.name || quotedMessage.user.id}
          user={quotedMessage.user}
        />
      )}
      <div className='str-chat__quoted-message-bubble'>
        {!!quotedMessageAttachment.length && (
          <Attachment attachments={quotedMessageAttachment} isQuoted />
        )}
        <div className='str-chat__quoted-message-text' data-testid='quoted-message-text'>
          <p>{quotedMessageText}</p>
        </div>
      </div>
    </div>
  );
};
