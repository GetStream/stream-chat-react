import React from 'react';
import { useTranslationContext } from '../../context';

export const UNREAD_MESSAGE_SEPARATOR_CLASS = 'str-chat__unread-messages-separator';

export type UnreadMessagesSeparatorProps = {
  unreadCount: number;
};

export const UnreadMessagesSeparator = ({ unreadCount }: UnreadMessagesSeparatorProps) => {
  const { t } = useTranslationContext('UnreadMessagesSeparator');
  return (
    <div className={UNREAD_MESSAGE_SEPARATOR_CLASS}>
      {t<string>('unreadMessagesSeparatorText', { count: unreadCount })}
    </div>
  );
};
