import React from 'react';
import clsx from 'clsx';
import type { TextComposerState, ThreadState } from 'stream-chat';

import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useThreadContext } from '../Threads/ThreadContext';
import { useStateStore } from '../../store';
import { useChannelConfig } from '../Channel/hooks/useChannelConfig';
import { useMessageComposer } from '../MessageInput';

const threadParentMessageSelector = ({ parentMessage }: ThreadState) => ({
  parentMessage,
});

const textComposerTypingSelector = ({ typing }: TextComposerState) => ({ typing });

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
export const TypingIndicator = () => {
  const messageComposer = useMessageComposer();
  const channelConfig = useChannelConfig({ cid: messageComposer.channel.cid });
  const { client } = useChatContext('TypingIndicator');
  const { typing = {} } =
    useStateStore(messageComposer.textComposer?.state, textComposerTypingSelector) ?? {};
  const thread = useThreadContext();
  const isThreadList = !!thread;
  const { parentMessage } =
    useStateStore(thread?.state, threadParentMessageSelector) ?? {};

  const typingInChannel = !isThreadList
    ? Object.values(typing).filter(
        ({ parent_id, user }) => user?.id !== client.user?.id && !parent_id,
      )
    : [];

  const typingInThread = isThreadList
    ? Object.values(typing).filter(
        ({ parent_id, user }) =>
          user?.id !== client.user?.id && parent_id === parentMessage?.id,
      )
    : [];

  const typingUserList = (isThreadList ? typingInThread : typingInChannel)
    .map(({ user }) => user?.name || user?.id)
    .filter(Boolean) as string[];

  const joinedTypingUsers = useJoinTypingUsers(typingUserList);

  const isTypingActive =
    (isThreadList && typingInThread.length) || (!isThreadList && typingInChannel.length);

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
