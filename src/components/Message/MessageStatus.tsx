import React, { useState } from 'react';
import clsx from 'clsx';
import type { TooltipUsernameMapper } from './utils';
import { getReadByTooltipText, mapToUserNameOrId } from './utils';
import { PopperTooltip } from '../Tooltip';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';

import { useChatContext } from '../../context/ChatContext';
import { useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useThreadContext } from '../Threads';
import { useComponentContextIcons } from '../../context';

export type MessageStatusProps = {
  /** Replaces the delivered (not read) status: a double check with a 'Delivered' tooltip. */
  MessageDeliveredStatus?: React.ComponentType;
  /**
   * Replaces the read status: a double check with a tooltip listing the readers, plus the reader
   * count when more than one other member has read the message.
   */
  MessageReadStatus?: React.ComponentType;
  /** Replaces the sending status: a clock icon with a 'Sending...' tooltip. */
  MessageSendingStatus?: React.ComponentType;
  /** Replaces the sent (on the server, not delivered) status: a check with a 'Sent' tooltip. */
  MessageSentStatus?: React.ComponentType;
  /** Used in the `str-chat__message-${messageType}-status` class names. Defaults to 'simple'. */
  messageType?: string;
  /** Maps users to the names shown in the read-by tooltip. Defaults to user name or ID. */
  tooltipUserNameMapper?: TooltipUsernameMapper;
};

const UnMemoizedMessageStatus = (props: MessageStatusProps) => {
  const { IconCheckmark1Small, IconChecks, IconClock } = useComponentContextIcons();
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

  const { client } = useChatContext();
  const threadInstance = useThreadContext();
  const { deliveredTo, isMyMessage, lastOwnMessage, message, readBy, returnAllReadData } =
    useMessageContext();
  const { t } = useTranslationContext();
  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null);

  if (!isMyMessage() || message.type === 'error') return null;

  const justReadByMe = readBy?.length === 1 && readBy[0].id === client.user?.id;
  const deliveredOnlyToMe =
    deliveredTo?.length === 1 && deliveredTo[0].id === client.user?.id;
  const sending = message.status === 'sending';
  // Delivery and read state come from other members' cursors, which can be past a failed
  // message's locally stamped `created_at`, so the `failed` guard keeps it from showing as
  // delivered or read.
  const failed = message.status === 'failed';
  const read = !failed && !!(readBy?.length && !justReadByMe && !threadInstance);
  const delivered =
    !failed && !!(deliveredTo?.length && !deliveredOnlyToMe && !read && !threadInstance);
  const sent =
    (returnAllReadData || lastOwnMessage?.id === message.id) &&
    message.status === 'received' &&
    !delivered &&
    !read &&
    !threadInstance;

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
              {t('message.status.sending.text', 'Sending...')}
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
              {t('message.status.sent.text', 'Sent')}
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
              {t('message.status.delivered.text', 'Delivered')}
            </PopperTooltip>
            <IconChecks className='str-chat__message-status-delivered' />
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

            <IconChecks className='str-chat__message-status-read' />

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
