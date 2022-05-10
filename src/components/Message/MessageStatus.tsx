import React, { useMemo } from 'react';

import { DeliveredCheckIcon } from './icons';
import { getReadByTooltipText } from './utils';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';
import { LoadingIndicator } from '../Loading';
import { Tooltip } from '../Tooltip';

import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type MessageStatusProps = {
  Avatar?: React.ComponentType<AvatarProps>;
  messageType?: string;
};

const UnMemoizedMessageStatus = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageStatusProps,
) => {
  const { Avatar: propAvatar, messageType = 'simple' } = props;

  const { client } = useChatContext<StreamChatGenerics>('MessageStatus');
  const { Avatar: contextAvatar } = useComponentContext<StreamChatGenerics>('MessageStatus');
  const {
    isMyMessage,
    lastReceivedId,
    message,
    readBy = [],
    threadList,
  } = useMessageContext<StreamChatGenerics>('MessageStatus');
  const { t } = useTranslationContext('MessageStatus');

  const filteredReadBy = useMemo(() => readBy.filter(Boolean), [readBy]);

  const Avatar = propAvatar || contextAvatar || DefaultAvatar;

  if (!isMyMessage() || message.type === 'error') {
    return null;
  }

  const justReadByMe = filteredReadBy.length === 1 && filteredReadBy[0].id === client.user?.id;

  if (message.status === 'sending') {
    return (
      <span
        className={`str-chat__message-${messageType}-status`}
        data-testid='message-status-sending'
      >
        <Tooltip>{t('Sending...')}</Tooltip>
        <LoadingIndicator />
      </span>
    );
  }

  if (filteredReadBy.length && !threadList && !justReadByMe) {
    const [lastReadUser] = filteredReadBy.filter((item) => item.id !== client.user?.id);

    return (
      <span
        className={`str-chat__message-${messageType}-status`}
        data-testid='message-status-read-by'
      >
        <Tooltip>{getReadByTooltipText(filteredReadBy, t, client)}</Tooltip>
        <Avatar
          image={lastReadUser.image}
          name={lastReadUser.name || lastReadUser.id}
          size={15}
          user={lastReadUser}
        />
        {readBy.length > 2 && (
          <span
            className={`str-chat__message-${messageType}-status-number`}
            data-testid='message-status-read-by-many'
          >
            {readBy.length - 1}
          </span>
        )}
      </span>
    );
  }

  if (message.status === 'received' && message.id === lastReceivedId && !threadList) {
    return (
      <span
        className={`str-chat__message-${messageType}-status`}
        data-testid='message-status-received'
      >
        <Tooltip>{t('Delivered')}</Tooltip>
        <DeliveredCheckIcon />
      </span>
    );
  }

  return null;
};

export const MessageStatus = React.memo(UnMemoizedMessageStatus) as typeof UnMemoizedMessageStatus;
