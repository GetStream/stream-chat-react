import React, { useEffect } from 'react';
import clsx from 'clsx';

import { AvatarStack } from '../Avatar';
import { TypingIndicatorDots } from './TypingIndicatorDots';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useTypingContext } from '../../context/TypingContext';

const MAX_AVATARS = 3;

export type TypingIndicatorProps = {
  /** When false, the indicator is not rendered (e.g. when list is not scrolled to bottom). Omit or true to show when typing. */
  isMessageListScrolledToBottom?: boolean;
  scrollToBottom: () => void;
  /** Whether the typing indicator is in a thread */
  threadList?: boolean;
};

/**
 * TypingIndicator shows avatars of users currently typing and a bubble with animated dots.
 * Renders only for other participants (never the current user), only when scrolled to latest message if isMessageListScrolledToBottom is provided.
 * It must be a child of Channel component.
 */
const UnMemoizedTypingIndicator = (props: TypingIndicatorProps) => {
  const { isMessageListScrolledToBottom = true, scrollToBottom, threadList } = props;

  const { channelConfig, thread } = useChannelStateContext('TypingIndicator');
  const { client } = useChatContext('TypingIndicator');
  const { typing = {} } = useTypingContext('TypingIndicator');

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

  const typingUsers = threadList ? typingInThread : typingInChannel;

  const isTypingActive = typingUsers.length > 0;
  const displayInfo = typingUsers.slice(0, MAX_AVATARS).map(({ user }) => ({
    id: user?.id,
    imageUrl: user?.image,
    userName: user?.name || user?.id || '',
  }));

  useEffect(() => {
    if (isTypingActive && isMessageListScrolledToBottom) scrollToBottom();
  }, [scrollToBottom, isMessageListScrolledToBottom, isTypingActive]);

  if (channelConfig?.typing_events === false) {
    return null;
  }

  if (!isTypingActive || !isMessageListScrolledToBottom) {
    return null;
  }

  const overflowCount =
    typingUsers.length > MAX_AVATARS ? typingUsers.length - MAX_AVATARS : 0;

  return (
    <div
      className={clsx('str-chat__typing-indicator', {
        'str-chat__typing-indicator--typing': isTypingActive,
      })}
      data-testid='typing-indicator'
    >
      {displayInfo.length > 0 && (
        <AvatarStack
          badgeSize='md'
          displayInfo={displayInfo}
          overflowCount={overflowCount > 0 ? overflowCount : undefined}
          size='md'
        />
      )}
      <div className='str-chat__typing-indicator__bubble'>
        <div className='str-chat__typing-indicator__dots'>
          <TypingIndicatorDots />
        </div>
      </div>
    </div>
  );
};

export const TypingIndicator = React.memo(
  UnMemoizedTypingIndicator,
) as typeof UnMemoizedTypingIndicator;
