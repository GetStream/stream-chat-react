import React from 'react';
import clsx from 'clsx';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';
import type { Event } from 'stream-chat';

export type TypingIndicatorProps = {
  /** Whether the typing indicator is in a thread */
  threadList?: boolean;
};

const useJoinTypingUsers = (names: string[]) => {
  const { t } = useTranslationContext();

  if (!names.length) return null;

  const [name, ...rest] = names;

  if (names.length === 1)
    return t('{{ user }} is typing...', {
      user: name,
    });

  const MAX_JOINED_USERS = 3;

  if (names.length > MAX_JOINED_USERS)
    return t('{{ users }} and more are typing...', {
      users: names.slice(0, MAX_JOINED_USERS).join(', ').trim(),
    });

  return t('{{ users }} and {{ user }} are typing...', {
    user: name,
    users: rest.join(', ').trim(),
  });
};

/**
 * TypingIndicator lists users currently typing, it needs to be a child of Channel component
 */
const UnMemoizedTypingIndicator = (props: TypingIndicatorProps) => {
  const { threadList } = props;

  const { channelConfig } = useChannelStateContext('TypingIndicator');
  // const { client } = useChatContext('TypingIndicator');
  // const { typing = {} } = useTypingContext('TypingIndicator');

  const typingInChannel: Event[] = [];
  // !threadList
  //   ? Object.values(typing).filter(
  //       ({ parent_id, user }) => user?.id !== client.user?.id && !parent_id,
  //     )
  //   : [];

  const typingInThread: Event[] = [];
  // threadList
  //   ? Object.values(typing).filter(
  //       ({ parent_id, user }) => user?.id !== client.user?.id && parent_id === thread?.id,
  //     )
  //   : [];

  const typingUserList = (threadList ? typingInThread : typingInChannel)
    .map(({ user }) => user?.name || user?.id)
    .filter(Boolean) as string[];

  const joinedTypingUsers = useJoinTypingUsers(typingUserList);

  const isTypingActive =
    (threadList && typingInThread.length) || (!threadList && typingInChannel.length);

  if (channelConfig?.typing_events === false) {
    return null;
  }

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
        {joinedTypingUsers}
      </div>
    </div>
  );
};

export const TypingIndicator = React.memo(
  UnMemoizedTypingIndicator,
) as typeof UnMemoizedTypingIndicator;
