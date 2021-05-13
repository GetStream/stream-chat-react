import React from 'react';

import { Avatar } from '../Avatar';

import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { TranslationLanguages } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export const QuotedMessage = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>() => {
  const { Attachment } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { isMyMessage, message } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { userLanguage } = useTranslationContext();

  const { quoted_message } = message;
  if (!quoted_message) return null;

  const quotedMessageText =
    // @ts-expect-error
    quoted_message.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    quoted_message.text;

  // @ts-expect-error
  const quotedMessageAttachment = quoted_message.attachments.length
    ? // @ts-expect-error
      quoted_message.attachments[0]
    : null;

  if (!quotedMessageText && !quotedMessageAttachment) return null;

  return (
    <div className={`${isMyMessage() ? 'quoted-message mine' : 'quoted-message'}`}>
      {/*  @ts-expect-error */}
      <Avatar image={quoted_message?.user?.image} size={20} />
      <div className='quoted-message-inner'>
        {quotedMessageAttachment && <Attachment attachments={[quotedMessageAttachment]} />}
        <div>{quotedMessageText}</div>
      </div>
    </div>
  );
};
