import React from 'react';
import {
  useChannel,
  useChatContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';
import { useMessagePaginator } from '../../hooks';

export const UNREAD_MESSAGE_SEPARATOR_CLASS = 'str-chat__unread-messages-separator';

export type UnreadMessagesSeparatorProps = {
  /** Whether to show the unread count. Defaults to `true`. */
  showCount?: boolean;
  /** Unread count shown when `showCount` is enabled. */
  unreadCount?: number;
};

export const UnreadMessagesSeparator = ({
  showCount = true,
  unreadCount,
}: UnreadMessagesSeparatorProps) => {
  const { IconXmark } = useComponentContextIcons();
  const { t } = useTranslationContext();
  const channel = useChannel();
  const { client } = useChatContext();
  const messagePaginator = useMessagePaginator();
  return (
    <div
      className={UNREAD_MESSAGE_SEPARATOR_CLASS}
      data-testid='unread-messages-separator'
    >
      <div className={'str-chat__unread-messages-separator__text'}>
        {unreadCount && showCount
          ? t('messageList.unreadMessagesNotification.unread.text', {
              count: unreadCount,
              defaultValue_one: '{{count}} unread',
              defaultValue_other: '{{count}} unread',
            })
          : t(
              'messageList.unreadMessagesNotification.unreadMessages.text',
              'Unread messages',
            )}
      </div>
      <Button
        appearance='ghost'
        aria-label={t(
          'messageList.unreadMessagesNotification.markMessagesRead.ariaLabel',
          'Mark messages as read',
        )}
        circular
        onClick={() => {
          client.messageDeliveryReporter.throttledMarkRead(channel);
          messagePaginator.clearUnreadSnapshot();
        }}
        size='sm'
        variant='secondary'
      >
        <IconXmark />
      </Button>
    </div>
  );
};
