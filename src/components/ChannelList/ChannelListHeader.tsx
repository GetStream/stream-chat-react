import React from 'react';
import clsx from 'clsx';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';

export const ChannelListHeader = () => {
  const { t } = useTranslationContext();
  const { channel, navOpen } = useChatContext();
  const { SidebarToggle } = useComponentContext();
  return (
    <div
      className={clsx('str-chat__channel-list__header', {
        'str-chat__channel-list__header--sidebar-collapsed': !navOpen,
      })}
    >
      <div className='str-chat__channel-list__header__title'>{t('Chats')}</div>
      {channel && SidebarToggle && <SidebarToggle />}
    </div>
  );
};
