import React from 'react';

import { Avatar as DefaultAvatar } from '../Avatar';

import { useChannelActionContext } from '../../context/ChannelActionContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { TranslationLanguages } from 'stream-chat';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const QuotedMessagePreviewHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { setQuotedMessage } = useChannelActionContext<StreamChatGenerics>('QuotedMessagePreview');
  const { t } = useTranslationContext('QuotedMessagePreview');

  return (
    <div className='quoted-message-preview-header'>
      <div>{t<string>('Reply to Message')}</div>
      <button
        aria-label='Cancel Reply'
        className='str-chat__square-button'
        onClick={() => setQuotedMessage(undefined)}
      >
        <svg height='10' width='10' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z'
            fillRule='evenodd'
          />
        </svg>
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
>(
  props: QuotedMessagePreviewProps<StreamChatGenerics>,
) => {
  const { quotedMessage } = props;

  const { Attachment, Avatar: ContextAvatar } = useComponentContext<StreamChatGenerics>(
    'QuotedMessagePreview',
  );
  const { userLanguage } = useTranslationContext('QuotedMessagePreview');

  const Avatar = ContextAvatar || DefaultAvatar;

  const quotedMessageText =
    quotedMessage.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    quotedMessage.text;

  const quotedMessageAttachment = quotedMessage.attachments?.length
    ? quotedMessage.attachments[0]
    : null;

  if (!quotedMessageText && !quotedMessageAttachment) return null;

  return (
    <div className='quoted-message-preview'>
      <QuotedMessagePreviewHeader />
      <div className='quoted-message-preview-content'>
        {quotedMessage.user && (
          <Avatar
            image={quotedMessage.user.image}
            name={quotedMessage.user.name || quotedMessage.user.id}
            size={20}
            user={quotedMessage.user}
          />
        )}
        <div className='quoted-message-preview-content-inner'>
          {quotedMessageAttachment && <Attachment attachments={[quotedMessageAttachment]} />}
          <div>{quotedMessageText}</div>
        </div>
      </div>
    </div>
  );
};
