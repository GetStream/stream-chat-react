import React from 'react';

import { Avatar } from '../Avatar';

import { useChannelActionContext } from '../../context/ChannelActionContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { TranslationLanguages } from 'stream-chat';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

const QuotedMessagePreviewHeader = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>() => {
  const { setQuotedMessage } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>(
    'QuotedMessagePreview',
  );
  const { t } = useTranslationContext('QuotedMessagePreview');

  return (
    <div className='quoted-message-preview-header'>
      <div>{t('Reply to Message')}</div>
      <button className='str-chat__square-button' onClick={() => setQuotedMessage(undefined)}>
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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  quotedMessage: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
};

export const QuotedMessagePreview = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: QuotedMessagePreviewProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { quotedMessage } = props;

  const { Attachment } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>('QuotedMessagePreview');
  const { userLanguage } = useTranslationContext('QuotedMessagePreview');

  const quotedMessageText =
    quotedMessage.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    quotedMessage.text;

  // @ts-expect-error
  const quotedMessageAttachment = quotedMessage.attachments.length
    ? // @ts-expect-error
      quotedMessage.attachments[0]
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
