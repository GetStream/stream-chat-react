import React from 'react';
import clsx from 'clsx';

import { TypingIndicatorDots } from './TypingIndicatorDots';
import { useChannel } from '../../context';
import { useTranslationContext } from '../../context/TranslationContext';
import { useThreadContext } from '../Threads';

import { useDebouncedTypingActive } from './hooks/useDebouncedTypingActive';
import { useTypingUsers } from './hooks/useTypingUsers';
import { getTypingStatusMessage } from './utils/getTypingStatusMessage';

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
  const threadInstance = useThreadContext();
  const typingUsers = useTypingUsers(
    channel,
    threadList ? threadInstance?.id : undefined,
  );
  const { displayUsers } = useDebouncedTypingActive(typingUsers);
  const label = getTypingStatusMessage(displayUsers, t);

  if (displayUsers.length === 0) {
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
