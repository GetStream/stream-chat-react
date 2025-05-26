import React from 'react';
import { useTranslationContext } from '../../context';

export const UNREAD_MESSAGE_SEPARATOR_CLASS = 'str-chat__unread-messages-separator';

export type UnreadMessagesSeparatorProps = {
  /**
   * Configuration parameter to determine, whether the unread count is to be shown on the component. Disabled by default.
   */
  showCount?: boolean;
  /**
   * The count of unread messages to be displayed if enabled.
   */
  unreadCount?: number;
};

export const UnreadMessagesSeparator = ({
  showCount,
  unreadCount,
}: UnreadMessagesSeparatorProps) => {
  const { t } = useTranslationContext('UnreadMessagesSeparator');
  return (
    <div
      className={UNREAD_MESSAGE_SEPARATOR_CLASS}
      data-testid='unread-messages-separator'
    >
      {unreadCount && showCount
        ? t('unreadMessagesSeparatorText', { count: unreadCount })
        : t('Unread messages')}
    </div>
  );
};
