import React, { useState } from 'react';
import clsx from 'clsx';
import type { TooltipUsernameMapper } from './utils';
import { getReadByTooltipText, mapToUserNameOrId } from './utils';
import { PopperTooltip } from '../Tooltip';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';

import { useChatContext } from '../../context/ChatContext';
import { useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { IconCheckmark1Small, IconClock, IconDoubleCheckmark1Small } from '../Icons';

export type MessageStatusProps = {
  /* Custom component to render when message is considered delivered, not read. The default UI renders MessageDeliveredIcon and a tooltip with string 'Delivered'. */
  MessageDeliveredStatus?: React.ComponentType;
  /* Custom component to render when message is considered delivered and read. The default UI renders the last reader's Avatar and a tooltip with string readers' names. */
  MessageReadStatus?: React.ComponentType;
  /* Custom component to render when message is considered as being the in the process of delivery. The default UI renders a clock icon and a tooltip with string 'Sending...'. */
  MessageSendingStatus?: React.ComponentType;
  /* Custom component to render when message is considered created on the server, but not delivered. The default UI renders MessageSentIcon and a tooltip with string 'Sent'. */
  MessageSentStatus?: React.ComponentType;
  /* Message type string to be added to CSS class names. */
  messageType?: string;
  /* Allows to customize the username(s) that appear on the message status tooltip */
  tooltipUserNameMapper?: TooltipUsernameMapper;
};

const UnMemoizedMessageStatus = (props: MessageStatusProps) => {
  const {
    MessageDeliveredStatus,
    MessageReadStatus,
    MessageSendingStatus,
    MessageSentStatus,
    messageType = 'simple',
    tooltipUserNameMapper = mapToUserNameOrId,
  } = props;

  const { handleEnter, handleLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLSpanElement>();

  const { client } = useChatContext('MessageStatus');
  const {
    deliveredTo,
    isMyMessage,
    lastOwnMessage,
    message,
    readBy,
    returnAllReadData,
    threadList,
  } = useMessageContext('MessageStatus');
  const { t } = useTranslationContext('MessageStatus');
  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null);

  if (!isMyMessage() || message.type === 'error') return null;

  const justReadByMe = readBy?.length === 1 && readBy[0].id === client.user?.id;
  const deliveredOnlyToMe =
    deliveredTo?.length === 1 && deliveredTo[0].id === client.user?.id;
  const sending = message.status === 'sending';
  const read = !!(readBy?.length && !justReadByMe && !threadList);
  const delivered = !!(deliveredTo?.length && !deliveredOnlyToMe && !read && !threadList);
  const sent =
    (returnAllReadData || lastOwnMessage?.id === message.id) &&
    message.status === 'received' &&
    !delivered &&
    !read &&
    !threadList;

  const readersWithoutOwnUser = read
    ? readBy.filter((item) => item.id !== client.user?.id)
    : [];

  return (
    <span
      className={clsx(
        `str-chat__message-${messageType}-status str-chat__message-status`,
        {
          'str-chat__message-status-delivered': delivered,
          'str-chat__message-status-read-by': read,
          'str-chat__message-status-sending': sending,
          'str-chat__message-status-sent': sent,
        },
      )}
      data-testid={clsx({
        'message-status-delivered': delivered,
        'message-status-read-by': read,
        'message-status-sending': sending,
        'message-status-sent': sent,
      })}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      ref={setReferenceElement}
    >
      {sending &&
        (MessageSendingStatus ? (
          <MessageSendingStatus />
        ) : (
          <>
            <PopperTooltip
              offset={[0, 5]}
              referenceElement={referenceElement}
              visible={tooltipVisible}
            >
              {t('Sending...')}
            </PopperTooltip>
            <IconClock className='str-chat__message-status-sending' />
          </>
        ))}

      {sent &&
        (MessageSentStatus ? (
          <MessageSentStatus />
        ) : (
          <>
            <PopperTooltip
              offset={[0, 5]}
              referenceElement={referenceElement}
              visible={tooltipVisible}
            >
              {t('Sent')}
            </PopperTooltip>
            <IconCheckmark1Small className='str-chat__message-status-sent' />
          </>
        ))}

      {delivered &&
        (MessageDeliveredStatus ? (
          <MessageDeliveredStatus />
        ) : (
          <>
            <PopperTooltip
              offset={[0, 5]}
              referenceElement={referenceElement}
              visible={tooltipVisible}
            >
              {t('Delivered')}
            </PopperTooltip>
            <IconDoubleCheckmark1Small className='str-chat__message-status-delivered' />
          </>
        ))}

      {read &&
        (MessageReadStatus ? (
          <MessageReadStatus />
        ) : (
          <>
            <PopperTooltip
              offset={[0, 5]}
              referenceElement={referenceElement}
              visible={tooltipVisible}
            >
              {getReadByTooltipText(readBy, t, client, tooltipUserNameMapper)}
            </PopperTooltip>

            <IconDoubleCheckmark1Small className='str-chat__message-status-read' />

            {readersWithoutOwnUser.length > 1 && (
              <span
                className={`str-chat__message-${messageType}-status-number`}
                data-testid='message-status-read-by-many'
              >
                {readersWithoutOwnUser.length}
              </span>
            )}
          </>
        ))}
    </span>
  );
};

export const MessageStatus = React.memo(
  UnMemoizedMessageStatus,
) as typeof UnMemoizedMessageStatus;
