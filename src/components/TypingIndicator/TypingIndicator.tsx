import React from 'react';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

import { useChannelContext } from '../../context/ChannelContext';

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

export type TypingIndicatorProps = {
  /**
   * Custom UI component to display user avatar.
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx)
   * */
  Avatar?: React.ComponentType<AvatarProps>;
  /** Size in pixels and the default is 32px */
  avatarSize?: number;
  /** Boolean for it there is a threadlist */
  threadList?: boolean;
};

/**
 * TypingIndicator lists users currently typing, it needs to be a child of Channel component
 */
const UnMemoizedTypingIndicator = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: TypingIndicatorProps,
) => {
  const { Avatar = DefaultAvatar, avatarSize = 32, threadList } = props;

  const { channel, client, thread, typing } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  if (!typing || !client || channel?.getConfig()?.typing_events === false) {
    return null;
  }

  const typingInChannel = Object.values(typing).filter(
    ({ parent_id, user }) => user?.id !== client.user?.id && parent_id == null,
  );

  const typingInThread = Object.values(typing).some(
    (event) => event?.parent_id === thread?.id,
  );

  return (
    <div
      className={`str-chat__typing-indicator ${
        (threadList && typingInThread) ||
        (!threadList && typingInChannel.length)
          ? 'str-chat__typing-indicator--typing'
          : ''
      }`}
    >
      <div className='str-chat__typing-indicator__avatars'>
        {typingInChannel.map(({ user }, i) => (
          <Avatar
            image={user?.image}
            key={`${user?.id}-${i}`}
            name={user?.name || user?.id}
            size={avatarSize}
          />
        ))}
      </div>
      <div className='str-chat__typing-indicator__dots'>
        <span className='str-chat__typing-indicator__dot' />
        <span className='str-chat__typing-indicator__dot' />
        <span className='str-chat__typing-indicator__dot' />
      </div>
    </div>
  );
};

export const TypingIndicator = React.memo(
  UnMemoizedTypingIndicator,
) as typeof UnMemoizedTypingIndicator;
