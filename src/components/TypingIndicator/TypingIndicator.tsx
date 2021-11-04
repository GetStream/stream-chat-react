import React from 'react';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTypingContext } from '../../context/TypingContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type TypingIndicatorProps<Us extends DefaultUserType<Us> = DefaultUserType> = {
  /** Custom UI component to display user avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps<Us>>;
  /** Avatar size in pixels, @default 32px */
  avatarSize?: number;
  /** Whether or not the typing indicator is in a thread */
  threadList?: boolean;
};

/**
 * TypingIndicator lists users currently typing, it needs to be a child of Channel component
 */
const UnMemoizedTypingIndicator = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: TypingIndicatorProps<Us>,
) => {
  const { Avatar: PropAvatar, avatarSize = 32, threadList } = props;

  const { channelConfig, thread } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>(
    'TypingIndicator',
  );
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('TypingIndicator');
  const { Avatar: ContextAvatar } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>(
    'TypingIndicator',
  );
  const { typing = {} } = useTypingContext<At, Ch, Co, Ev, Me, Re, Us>('TypingIndicator');

  const Avatar = PropAvatar || ContextAvatar || DefaultAvatar;

  if (channelConfig?.typing_events === false) {
    return null;
  }

  const typingInChannel = !threadList
    ? Object.values(typing).filter(
        ({ parent_id, user }) => user?.id !== client.user?.id && !parent_id,
      )
    : [];

  const typingInThread = threadList
    ? Object.values(typing).filter(
        ({ parent_id, user }) => user?.id !== client.user?.id && parent_id === thread?.id,
      )
    : [];

  return (
    <div
      className={`str-chat__typing-indicator ${
        (threadList && typingInThread.length) || (!threadList && typingInChannel.length)
          ? 'str-chat__typing-indicator--typing'
          : ''
      }`}
    >
      <div className='str-chat__typing-indicator__avatars'>
        {(threadList ? typingInThread : typingInChannel).map(({ user }, i) => (
          <Avatar
            image={user?.image}
            key={`${user?.id}-${i}`}
            name={user?.name || user?.id}
            size={avatarSize}
            user={user}
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
