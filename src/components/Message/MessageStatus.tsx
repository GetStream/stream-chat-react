import React from 'react';

import { DeliveredCheckIcon } from './icons';
import { getReadByTooltipText } from './utils';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';
import { LoadingIndicator } from '../Loading';
import { Tooltip } from '../Tooltip';

import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type MessageStatusProps = {
  Avatar?: React.ComponentType<AvatarProps>;
  messageType?: string;
};

const UnMemoizedMessageStatus = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageStatusProps,
) => {
  const { Avatar: propAvatar, messageType = 'simple' } = props;

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('MessageStatus');
  const { Avatar: contextAvatar } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>(
    'MessageStatus',
  );
  const { isMyMessage, lastReceivedId, message, readBy, threadList } = useMessageContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >('MessageStatus');
  const { t } = useTranslationContext('MessageStatus');

  const Avatar = propAvatar || contextAvatar || DefaultAvatar;

  if (!isMyMessage() || message.type === 'error') {
    return null;
  }

  const justReadByMe = readBy?.length === 1 && readBy[0].id === client.user?.id;

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

  if (readBy?.length && !threadList && !justReadByMe) {
    const lastReadUser = readBy.filter((item) => item.id !== client.user?.id)[0];

    return (
      <span
        className={`str-chat__message-${messageType}-status`}
        data-testid='message-status-read-by'
      >
        <Tooltip>{getReadByTooltipText(readBy, t, client)}</Tooltip>
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
