import React from 'react';

import { DeliveredCheckIcon, MessageDeliveredIcon } from './icons';
import { getReadByTooltipText, mapToUserNameOrId, TooltipUsernameMapper } from './utils';

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
  tooltipUserNameMapper?: TooltipUsernameMapper;
};

// TODO: remove after fully deprecating V1 theming
const TooltipContainer = ({ children }: React.PropsWithChildren<Record<never, never>>) => {
  const { themeVersion } = useChatContext('TooltipContainer');
  return themeVersion === '2' ? (
    <div className='str-chat__message-status-tooltip-container'>{children}</div>
  ) : (
    <>{children}</>
  );
};

const UnMemoizedMessageStatus = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageStatusProps,
) => {
  const {
    Avatar: propAvatar,
    messageType = 'simple',
    tooltipUserNameMapper = mapToUserNameOrId,
  } = props;

  const { client } = useChatContext<StreamChatGenerics>('MessageStatus');
  const { Avatar: contextAvatar } = useComponentContext<StreamChatGenerics>('MessageStatus');
  const {
    isMyMessage,
    lastReceivedId,
    message,
    readBy,
    threadList,
  } = useMessageContext<StreamChatGenerics>('MessageStatus');
  const { t } = useTranslationContext('MessageStatus');
  const { themeVersion } = useChatContext('MessageStatus');

  const Avatar = propAvatar || contextAvatar || DefaultAvatar;

  if (!isMyMessage() || message.type === 'error') {
    return null;
  }

  const justReadByMe = readBy?.length === 1 && readBy[0].id === client.user?.id;
  const rootClassName = `str-chat__message-${messageType}-status str-chat__message-status`;

  if (message.status === 'sending') {
    return (
      <span className={rootClassName} data-testid='message-status-sending'>
        <Tooltip>{t<string>('Sending...')}</Tooltip>
        <LoadingIndicator />
      </span>
    );
  }

  if (readBy?.length && !threadList && !justReadByMe) {
    const [lastReadUser] = readBy.filter((item) => item.id !== client.user?.id);

    return (
      <span className={rootClassName} data-testid='message-status-read-by'>
        <TooltipContainer>
          <Tooltip>{getReadByTooltipText(readBy, t, client, tooltipUserNameMapper)}</Tooltip>
          <Avatar
            image={lastReadUser.image}
            name={lastReadUser.name || lastReadUser.id}
            size={15}
            user={lastReadUser}
          />
        </TooltipContainer>
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
      <span className={rootClassName} data-testid='message-status-received'>
        <Tooltip>{t<string>('Delivered')}</Tooltip>
        {themeVersion === '2' ? <MessageDeliveredIcon /> : <DeliveredCheckIcon />}
      </span>
    );
  }

  return null;
};

export const MessageStatus = React.memo(UnMemoizedMessageStatus) as typeof UnMemoizedMessageStatus;
