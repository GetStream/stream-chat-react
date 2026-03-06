import React, { type ComponentType } from 'react';
import clsx from 'clsx';
import { useChatContext, useTranslationContext } from '../../context';
import { IconLayoutAlignLeft } from '../Icons';
import { ToggleSidebarButton } from '../Button/ToggleSidebarButton';

export type ChannelListHeaderProps = {
  ToggleButtonIcon?: ComponentType;
};

export const ChannelListHeader = ({
  ToggleButtonIcon = IconLayoutAlignLeft,
}: ChannelListHeaderProps) => {
  const { t } = useTranslationContext();
  const { channel, navOpen } = useChatContext();
  return (
    <div
      className={clsx('str-chat__channel-list__header', {
        'str-chat__channel-list__header--sidebar-collapsed': !navOpen,
      })}
    >
      <div className='str-chat__channel-list__header__title'>{t('Chats')}</div>
      <ToggleSidebarButton canCollapse={!!channel} mode={'collapse'}>
        <ToggleButtonIcon />
      </ToggleSidebarButton>
    </div>
  );
};
