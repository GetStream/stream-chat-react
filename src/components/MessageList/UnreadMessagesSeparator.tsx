import React from 'react';
import { useTranslationContext } from '../../context';

export type UnreadMessagesSeparatorProps = {
  unreadCount: number;
};

export const UnreadMessagesSeparator = ({ unreadCount }: UnreadMessagesSeparatorProps) => {
  const { t } = useTranslationContext('UnreadMessagesSeparator');
  return (
    <div className='str-chat__unread-messages-separator'>
      {t<string>('unreadMessagesSeparatorText', { count: unreadCount })}
    </div>
  );
};
