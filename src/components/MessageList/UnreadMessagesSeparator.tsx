import React from 'react';
import { useChannelActionContext, useTranslationContext } from '../../context';
import { Button } from '../Button';
import clsx from 'clsx';
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
        className={clsx(
          'str-chat__button--secondary',
          'str-chat__button--ghost',
          'str-chat__button--circular',
          'str-chat__button--size-sm',
        )}
        onClick={() => markRead()}
      >
        <IconCrossMedium />
      </Button>
    </div>
  );
};
