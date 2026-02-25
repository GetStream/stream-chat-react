import React from 'react';
import { useChannelActionContext, useTranslationContext } from '../../context';
import { Button } from '../Button';
import { IconCrossMedium } from '../Icons';

export const UNREAD_MESSAGE_SEPARATOR_CLASS = 'str-chat__unread-messages-separator';

export type UnreadMessagesSeparatorProps = {
  /**
   * Configuration parameter to determine, whether the unread count is to be shown on the component. Enabled by default.
   */
  showCount?: boolean;
  /**
   * The count of unread messages to be displayed if enabled.
   */
  unreadCount?: number;
};

export const UnreadMessagesSeparator = ({
  showCount = true,
  unreadCount,
}: UnreadMessagesSeparatorProps) => {
  const { t } = useTranslationContext('UnreadMessagesSeparator');
  const { markRead } = useChannelActionContext();
  return (
    <div
      className={UNREAD_MESSAGE_SEPARATOR_CLASS}
      data-testid='unread-messages-separator'
    >
      <div className={'str-chat__unread-messages-separator__text'}>
        {unreadCount && showCount
          ? t('{{count}} unread', { count: unreadCount })
          : t('Unread messages')}
      </div>
      <Button
        appearance='ghost'
        circular
        onClick={() => markRead()}
        size='sm'
        variant='secondary'
      >
        <IconCrossMedium />
      </Button>
    </div>
  );
};
