import React from 'react';
import clsx from 'clsx';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../../context';
import { useThreadsViewContext } from '../../ChatView';

export const ThreadListHeader = () => {
  const { t } = useTranslationContext();
  const { navOpen } = useChatContext();
  const { SidebarToggle } = useComponentContext();
  const { activeThread } = useThreadsViewContext();
  return (
    <div
      className={clsx('str-chat__thread-list__header', {
        'str-chat__thread-list__header--sidebar-collapsed': !navOpen,
      })}
    >
      <div className='str-chat__thread-list__header__title'>{t('Threads')}</div>
      {activeThread && SidebarToggle && <SidebarToggle />}
    </div>
  );
};
