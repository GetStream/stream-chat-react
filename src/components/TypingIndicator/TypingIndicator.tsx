import React from 'react';
import clsx from 'clsx';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTypingContext } from '../../context/TypingContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type TypingIndicatorProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** Custom UI component to display user avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps<StreamChatGenerics>>;
  /** Avatar size in pixels, @default 32px */
  avatarSize?: number;
  /** Whether or not the typing indicator is in a thread */
  threadList?: boolean;
};

/**
 * TypingIndicator lists users currently typing, it needs to be a child of Channel component
 */
const UnMemoizedTypingIndicator = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: TypingIndicatorProps<StreamChatGenerics>,
) => {
  const { Avatar: PropAvatar, avatarSize = 32, threadList } = props;

  const { channelConfig, thread } = useChannelStateContext<StreamChatGenerics>('TypingIndicator');
  const { client, themeVersion } = useChatContext<StreamChatGenerics>('TypingIndicator');
  const { Avatar: ContextAvatar } = useComponentContext<StreamChatGenerics>('TypingIndicator');
  const { typing = {} } = useTypingContext<StreamChatGenerics>('TypingIndicator');

  const Avatar = PropAvatar || ContextAvatar || DefaultAvatar;

  // TODO: add translations for "and", "is/are typing"
  const generateTypingString = (names: string[]) => {
    const [name, ...rest] = names;

    if (names.length === 1) return `${name} is typing...`;

    return `${rest.join(', ').trim()} and ${name} are typing...`;
  };

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

  const typingUserList = (threadList ? typingInThread : typingInChannel)
    .map(({ user }) => user?.name || user?.id)
    .filter(Boolean) as string[];

  const isTypingActive =
    (threadList && typingInThread.length) || (!threadList && typingInChannel.length);

  if (themeVersion === '2') {
    if (!isTypingActive) return null;
    return (
      <div
        className={clsx('str-chat__typing-indicator', {
          'str-chat__typing-indicator--typing': isTypingActive,
        })}
        data-testid='typing-indicator'
      >
        <div className='str-chat__typing-indicator__dots'>
          <span className='str-chat__typing-indicator__dot'></span>
          <span className='str-chat__typing-indicator__dot'></span>
          <span className='str-chat__typing-indicator__dot'></span>
        </div>
        <div className='str-chat__typing-indicator__users' data-testid='typing-users'>
          {generateTypingString(typingUserList)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx('str-chat__typing-indicator', {
        'str-chat__typing-indicator--typing': isTypingActive,
      })}
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
