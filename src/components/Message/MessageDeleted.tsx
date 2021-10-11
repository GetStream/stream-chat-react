import React from 'react';

import { useUserRole } from './hooks/useUserRole';

import { useTranslationContext } from '../../context/TranslationContext';

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

export type MessageDeletedProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
};

export const MessageDeleted = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageDeletedProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { message } = props;

  const { t } = useTranslationContext('MessageDeleted');

  const { isMyMessage } = useUserRole(message);

  const messageClasses = isMyMessage
    ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
    : 'str-chat__message str-chat__message-simple';

  return (
    <div
      className={`${messageClasses} str-chat__message--deleted ${message.type} `}
      data-testid={'message-deleted-component'}
      key={message.id}
    >
      <div className='str-chat__message--deleted-inner'>{t('This message was deleted...')}</div>
    </div>
  );
};
