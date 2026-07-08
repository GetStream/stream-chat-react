import React from 'react';
import clsx from 'clsx';

import { TypingIndicatorDots } from './TypingIndicatorDots';
import { useChannel } from '../../context';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useChannelConfig } from '../Channel/hooks/useChannelConfig';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { useStateStore } from '../../store';
import { useThreadContext } from '../Threads';
import type { TextComposerState } from 'stream-chat';

import { useDebouncedTypingActive } from './hooks/useDebouncedTypingActive';
import { getTypingStatusMessage } from './utils/getTypingStatusMessage';

const textComposerTypingSelector = ({ typing }: TextComposerState) => ({ typing });

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
  const channel = useChannel();
  const channelConfig = useChannelConfig({ cid: channel.cid });
  const threadInstance = useThreadContext();
  const parentId = threadInstance?.id;
  const { client } = useChatContext('TypingIndicatorHeader');
  const messageComposer = useMessageComposerController();
  const { typing = {} } =
    useStateStore(messageComposer.textComposer?.state, textComposerTypingSelector) ?? {};

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
  const label = getTypingStatusMessage(displayUsers, t);

  if (channelConfig?.typing_events === false || displayUsers.length === 0) {
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
