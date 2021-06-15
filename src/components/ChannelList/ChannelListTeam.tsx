import React, { PropsWithChildren } from 'react';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';
import { ChatDown, ChatDownProps } from '../ChatDown/ChatDown';
import { LoadingChannels } from '../Loading/LoadingChannels';

import chevrondown from '../../assets/str-chat__icon-chevron-down.svg';
import { useChatContext } from '../../context/ChatContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type ChannelListTeamProps = {
  /** Custom UI component to display user avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps>;
  /** Whether or not the channel query request returned an errored response */
  error?: boolean;
  /** Whether or not channels are currently loading */
  loading?: boolean;
  /** Custom UI component to display a loading error, defaults to and accepts same props as: [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown/ChatDown.tsx) */
  LoadingErrorIndicator?: React.ComponentType<ChatDownProps>;
  /** Custom UI component to display a loading indicator, defaults to and accepts same props as: [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingChannels.tsx) */
  LoadingIndicator?: React.ComponentType;
  /** When true, sidebar containing logo of the team is visible */
  showSidebar?: boolean;
  /** Url for sidebar logo image. */
  sidebarImage?: string;
};

/**
 *  @deprecated - This UI component will be removed in the next major release.
 *
 * A preview list of channels, allowing you to select the channel you want to open
 */
export const ChannelListTeam = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: PropsWithChildren<ChannelListTeamProps>,
) => {
  const {
    Avatar = DefaultAvatar,
    children,
    error = false,
    loading,
    LoadingErrorIndicator = ChatDown,
    LoadingIndicator = LoadingChannels,
    showSidebar,
    sidebarImage,
  } = props;

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { id, image, name, status } = client.user || {};

  if (error) {
    return <LoadingErrorIndicator type='Connection Error' />;
  }

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className='str-chat__channel-list-team'>
      {showSidebar && (
        <div className='str-chat__channel-list-team__sidebar'>
          <div className='str-chat__channel-list-team__sidebar--top'>
            <Avatar image={sidebarImage} size={50} />
          </div>
        </div>
      )}
      <div className='str-chat__channel-list-team__main'>
        <div className='str-chat__channel-list-team__header'>
          <div className='str-chat__channel-list-team__header--left'>
            <Avatar image={image} name={name || id} size={40} />
          </div>
          <div className='str-chat__channel-list-team__header--middle'>
            <div className='str-chat__channel-list-team__header--title'>{name || id}</div>
            <div className={`str-chat__channel-list-team__header--status ${status}`}>{status}</div>
          </div>
          <div className='str-chat__channel-list-team__header--right'>
            <button className='str-chat__channel-list-team__header--button'>
              <img src={chevrondown} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
