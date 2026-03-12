import React from 'react';
import clsx from 'clsx';

import { TypingIndicatorDots } from './TypingIndicatorDots';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useTypingContext } from '../../context/TypingContext';
import { useThreadContext } from '../Threads';

import { useDebouncedTypingActive } from './hooks/useDebouncedTypingActive';

export type TypingIndicatorHeaderProps = {
  /** When true, show typing in the current thread only; when false, show typing in the channel. */
  threadList?: boolean;
};

/**
 * Inline typing indicator for ChannelHeader or ThreadHeader: text (1/2/3+ people) followed by animated dots.
 * Only shows other participants; respects channelConfig.typing_events.
 */
export const TypingIndicatorHeader = (props: TypingIndicatorHeaderProps) => {
  const { threadList = false } = props;

  const { t } = useTranslationContext();
  const { channelConfig, thread } = useChannelStateContext('TypingIndicatorHeader');
  const threadInstance = useThreadContext();
  const parentId = threadInstance?.id ?? thread?.id;
  const { client } = useChatContext('TypingIndicatorHeader');
  const { typing = {} } = useTypingContext('TypingIndicatorHeader');

  const typingInChannel = !threadList
    ? Object.values(typing).filter(
        ({ parent_id, user }) => user?.id !== client.user?.id && !parent_id,
      )
    : [];

  const typingInThread = threadList
    ? Object.values(typing).filter(
        ({ parent_id, user }) => user?.id !== client.user?.id && parent_id === parentId,
      )
    : [];

  const typingUsers = threadList ? typingInThread : typingInChannel;
  const { displayUsers } = useDebouncedTypingActive(typingUsers);

  if (channelConfig?.typing_events === false || displayUsers.length === 0) {
    return null;
  }

  const names = displayUsers.map(({ user }) => user?.name ?? '');
  let label: string;
  if (names.length === 1) {
    label = t('{{ typing }} is typing', { typing: names[0] });
  } else if (names.length === 2) {
    label = t('{{ typing }} are typing', {
      typing: `${names[0]} and ${names[1]}`,
    });
  } else {
    label = t('{{ count }} people are typing', { count: names.length });
  }

  return (
    <span
      className={clsx('str-chat__typing-indicator-header', {
        'str-chat__typing-indicator-header--thread': threadList,
      })}
      data-testid='typing-indicator-header'
    >
      <span className='str-chat__typing-indicator-header__text'>{label}</span>
      <span className='str-chat__typing-indicator__dots str-chat__typing-indicator-header__dots'>
        <TypingIndicatorDots />
      </span>
    </span>
  );
};
