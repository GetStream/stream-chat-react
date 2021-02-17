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
  UnknownType,
} from '../../../types/types';

export type ChannelListTeamProps = {
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar?: React.ComponentType<AvatarProps>;
  /**
   * If channel list ran into error
   * When true, error indicator is shown - [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   */
  error?: boolean;
  /**
   * If channel list is in loading state
   * When true, loading indicator is shown - [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   */
  loading?: boolean;
  /**
   * Error indicator UI Component. It will be displayed if `error` prop is true
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator?: React.ComponentType<ChatDownProps>;
  /**
   * Loading indicator UI Component. It will be displayed if `loading` prop is true.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator?: React.ComponentType;
  /** When true, sidebar containing logo of the team is visible */
  showSidebar?: boolean;
  /** Url for sidebar logo image. */
  sidebarImage?: string;
};

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ../../docs/ChannelList.md
 */
export const ChannelListTeam = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
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
            <div className='str-chat__channel-list-team__header--title'>
              {name || id}
            </div>
            <div
              className={`str-chat__channel-list-team__header--status ${status}`}
            >
              {status}
            </div>
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
