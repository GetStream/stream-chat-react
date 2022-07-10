import React, { useMemo } from 'react';
import type { TranslationLanguages } from 'stream-chat';

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
    <div className='quoted-message-preview-header str-chat__quoted-message-preview-header'>
      <div className='str-chat__quoted-message-reply-to-message'>
        {t<string>('Reply to Message')}
      </div>
      <button
        aria-label='Cancel Reply'
        className='str-chat__square-button str-chat__quoted-message-remove'
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
  PreviewHeader?: React.ComponentType<Record<never, never>> | null;
};

export const QuotedMessagePreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  PreviewHeader = QuotedMessagePreviewHeader,
  quotedMessage,
}: QuotedMessagePreviewProps<StreamChatGenerics>) => {
  const { Attachment, Avatar = DefaultAvatar } = useComponentContext<StreamChatGenerics>(
    'QuotedMessagePreview',
  );
  const { userLanguage } = useTranslationContext('QuotedMessagePreview');

  const quotedMessageText =
    quotedMessage.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    quotedMessage.text;

  const quotedMessageAttachment = useMemo(() => {
    const [attachment] = quotedMessage.attachments ?? [];
    return attachment ? [attachment] : [];
  }, [quotedMessage.attachments]);

  if (!quotedMessageText && !quotedMessageAttachment) return null;

  // remove div.quoted-message-preview-content when deprecating V1 theming
  // move str-chat__quoted-message-preview to main div

  return (
    <div className='quoted-message-preview'>
      {PreviewHeader && <PreviewHeader />}
      <div className='quoted-message-preview-content str-chat__quoted-message-preview'>
        {quotedMessage.user && (
          <Avatar
            image={quotedMessage.user.image}
            name={quotedMessage.user.name || quotedMessage.user.id}
            size={20}
            user={quotedMessage.user}
          />
        )}
        <div className='quoted-message-preview-content-inner str-chat__quoted-message-bubble'>
          {quotedMessageAttachment.length && <Attachment attachments={quotedMessageAttachment} />}
          <div className='str-chat__quoted-message-text' data-testid='quoted-message-text'>
            {quotedMessageText}
          </div>
        </div>
      </div>
    </div>
  );
};
