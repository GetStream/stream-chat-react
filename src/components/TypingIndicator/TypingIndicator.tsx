import React from 'react';
import clsx from 'clsx';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useTypingContext } from '../../context/TypingContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

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
const UnMemoizedTypingIndicator = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: TypingIndicatorProps,
) => {
  const { threadList } = props;

  const { channelConfig, thread } = useChannelStateContext<StreamChatGenerics>('TypingIndicator');
  const { client } = useChatContext<StreamChatGenerics>('TypingIndicator');
  const { typing = {} } = useTypingContext<StreamChatGenerics>('TypingIndicator');

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
