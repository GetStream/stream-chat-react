import React from 'react';

import { useUserRole } from './hooks/useUserRole';

import { useTranslationContext } from '../../context/TranslationContext';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type MessageDeletedProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  message: StreamMessage<StreamChatGenerics>;
};

export const MessageDeleted = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageDeletedProps<StreamChatGenerics>,
) => {
  const { message } = props;

  const { t } = useTranslationContext('MessageDeleted');

  const { isMyMessage } = useUserRole(message);

  const messageClasses = isMyMessage
    ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
    : 'str-chat__message str-chat__message-simple str-chat__message--other';

  return (
    <div
      className={`${messageClasses} str-chat__message--deleted ${message.type} `}
      data-testid={'message-deleted-component'}
      key={message.id}
    >
      <div className='str-chat__message--deleted-inner'>
        {t<string>('This message was deleted...')}
      </div>
    </div>
  );
};
