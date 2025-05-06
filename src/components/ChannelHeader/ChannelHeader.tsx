import React from 'react';

import { MenuIcon as DefaultMenuIcon } from './icons';
import { Avatar as DefaultAvatar } from '../Avatar';
import { useChannelPreviewInfo } from '../ChannelPreview/hooks/useChannelPreviewInfo';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';
import type { ChannelAvatarProps } from '../Avatar';

export type ChannelHeaderProps = {
  /** UI component to display an avatar, defaults to [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) component and accepts the same props as: [ChannelAvatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/ChannelAvatar.tsx) */
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  /** Manually set the image to render, defaults to the Channel image */
  image?: string;
  /** Show a little indicator that the Channel is live right now */
  live?: boolean;
  /** UI component to display menu icon, defaults to [MenuIcon](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelHeader/ChannelHeader.tsx)*/
  MenuIcon?: React.ComponentType;
  /** Set title manually */
  title?: string;
};

/**
 * The ChannelHeader component renders some basic information about a Channel.
 */
export const ChannelHeader = (props: ChannelHeaderProps) => {
  const {
    Avatar = DefaultAvatar,
    image: overrideImage,
    live,
    MenuIcon = DefaultMenuIcon,
    title: overrideTitle,
  } = props;

  const { channel, watcher_count } = useChannelStateContext('ChannelHeader');
  const { openMobileNav } = useChatContext('ChannelHeader');
  const { t } = useTranslationContext('ChannelHeader');
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });

  const { member_count, subtitle } = channel?.data || {};

  return (
    <div className='str-chat__channel-header'>
      <button
        aria-label={t('aria/Menu')}
        className='str-chat__header-hamburger'
        onClick={openMobileNav}
      >
        <MenuIcon />
      </button>
      <Avatar
        className='str-chat__avatar--channel-header'
        groupChannelDisplayInfo={groupChannelDisplayInfo}
        image={displayImage}
        name={displayTitle}
      />
      <div className='str-chat__channel-header-end'>
        <p className='str-chat__channel-header-title'>
          {displayTitle}{' '}
          {live && (
            <span className='str-chat__header-livestream-livelabel'>
              {t<string>('live')}
            </span>
          )}
        </p>
        {subtitle && <p className='str-chat__channel-header-subtitle'>{subtitle}</p>}
        <p className='str-chat__channel-header-info'>
          {!live && !!member_count && member_count > 0 && (
            <>
              {t('{{ memberCount }} members', {
                memberCount: member_count,
              })}
              ,{' '}
            </>
          )}
          {t<string>('{{ watcherCount }} online', { watcherCount: watcher_count })}
        </p>
      </div>
    </div>
  );
};
