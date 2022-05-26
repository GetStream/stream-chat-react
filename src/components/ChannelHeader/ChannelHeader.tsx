import React from 'react';

import { MenuIcon as DefaultMenuIcon } from './icons';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type ChannelHeaderProps = {
  /** UI component to display a user's avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps>;
  /** Manually set the image to render, defaults to the Channel image */
  image?: string;
  /** Show a little indicator that the Channel is live right now */
  live?: boolean;
  /** UI component to display menu icon, defaults to [MenuIcon](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelHeader/ChannelHeader.tsx)*/
  MenuIcon?: React.ComponentType;
  /** Set title manually */
  title?: string;
};

const UnMemoizedChannelHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ChannelHeaderProps,
) => {
  const {
    Avatar = DefaultAvatar,
    MenuIcon = DefaultMenuIcon,
    image: propImage,
    live,
    title,
  } = props;

  const { channel, watcher_count } = useChannelStateContext<StreamChatGenerics>('ChannelHeader');
  const { openMobileNav } = useChatContext<StreamChatGenerics>('ChannelHeader');
  const { t } = useTranslationContext('ChannelHeader');

  const { image: channelImage, member_count, name, subtitle } = channel?.data || {};

  const image = propImage || channelImage;

  return (
    <div className='str-chat__header-livestream'>
      <button aria-label='Menu' className='str-chat__header-hamburger' onClick={openMobileNav}>
        <MenuIcon />
      </button>
      {image && (
        <Avatar image={image} shape='rounded' size={channel?.type === 'commerce' ? 60 : 40} />
      )}
      <div className='str-chat__header-livestream-left'>
        <p className='str-chat__header-livestream-left--title'>
          {title || name}{' '}
          {live && (
            <span className='str-chat__header-livestream-left--livelabel'>{t<string>('live')}</span>
          )}
        </p>
        {subtitle && <p className='str-chat__header-livestream-left--subtitle'>{subtitle}</p>}
        <p className='str-chat__header-livestream-left--members'>
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

/**
 * The ChannelHeader component renders some basic information about a Channel.
 */
export const ChannelHeader = React.memo(UnMemoizedChannelHeader) as typeof UnMemoizedChannelHeader;
