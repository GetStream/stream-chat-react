import React from 'react';
import clsx from 'clsx';

import { TypingIndicatorDots } from './TypingIndicatorDots';
import { useChannel } from '../../context';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useStateStore } from '../../store';
import { useThreadContext } from '../Threads';
import type { ChannelStateData, EventPayload } from 'stream-chat';

import { useDebouncedTypingActive } from './hooks/useDebouncedTypingActive';
import { getTypingStatusMessage } from './utils/getTypingStatusMessage';
import type { ChannelConfig } from 'stream-chat';

const typingEventsStateSelector = ({ typingEvents }: ChannelConfig) => ({
  typingEventsEnabled: typingEvents.enabled,
});

const channelTypingSelector = ({ typing }: ChannelStateData) => ({ typing });

export type TypingIndicatorHeaderProps = {
  /** Whether to show typing in the current thread instead of the channel. Defaults to `false`. */
  threadList?: boolean;
};

/**
 * Inline typing text followed by animated dots, for channel and thread headers. Shows only other
 * users and renders nothing when the channel's `typingEvents.enabled` is false.
 */
export const TypingIndicatorHeader = (props: TypingIndicatorHeaderProps) => {
  const { threadList = false } = props;

  const { t } = useTranslationContext();
  const channel = useChannel();
  const { typingEventsEnabled } = useStateStore(
    channel.configState,
    typingEventsStateSelector,
  );
  const threadInstance = useThreadContext();
  const parentId = threadInstance?.id;
  const { client } = useChatContext();
  const { typing } = useStateStore(channel.state, channelTypingSelector);

  const typingEntries = Object.values(typing) as EventPayload<
    'typing.start' | 'typing.stop'
  >[];

  const typingInChannel = !threadList
    ? typingEntries.filter(
        ({ parent_id, user }) => user?.id !== client.user?.id && !parent_id,
      )
    : [];

  const typingInThread = threadList
    ? typingEntries.filter(
        ({ parent_id, user }) => user?.id !== client.user?.id && parent_id === parentId,
      )
    : [];

  const typingUsers = threadList ? typingInThread : typingInChannel;
  const { displayUsers } = useDebouncedTypingActive(typingUsers);
  const label = getTypingStatusMessage(displayUsers, t);

  if (typingEventsEnabled === false || displayUsers.length === 0) {
    return null;
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
