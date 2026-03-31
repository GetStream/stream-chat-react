import React, { type ComponentType } from 'react';
import clsx from 'clsx';
import { useChatContext, useTranslationContext } from '../../../context';
import { IconSidebar } from '../../Icons';
import { useThreadsViewContext } from '../../ChatView';
import { ToggleSidebarButton } from '../../Button/ToggleSidebarButton';

export type ChannelListHeaderProps = {
  ToggleButtonIcon?: ComponentType;
};

export const ThreadListHeader = ({
  ToggleButtonIcon = IconSidebar,
}: ChannelListHeaderProps) => {
  const { t } = useTranslationContext();
  const { navOpen } = useChatContext();
  const { activeThread } = useThreadsViewContext();
  return (
    <div
      className={clsx('str-chat__thread-list__header', {
        'str-chat__thread-list__header--sidebar-collapsed': !navOpen,
      })}
    >
      <div className='str-chat__thread-list__header__title'>{t('Threads')}</div>
      <ToggleSidebarButton canCollapse={!!activeThread} mode={'collapse'}>
        <ToggleButtonIcon />
      </ToggleSidebarButton>
    </div>
  );
};
