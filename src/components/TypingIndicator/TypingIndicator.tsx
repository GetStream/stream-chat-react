import React, { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { AvatarStack as DefaultAvatarStack } from '../Avatar';
import { extractDisplayInfo as defaultExtractDisplayInfo } from '../Avatar/utils';
import { TypingIndicatorDots } from './TypingIndicatorDots';
import { VisuallyHidden } from '../VisuallyHidden';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { useThreadContext } from '../Threads/ThreadContext';
import { useComponentContext, useTranslationContext } from '../../context';

import { useDebouncedTypingActive } from './hooks/useDebouncedTypingActive';
import { useTypingUsers } from './hooks/useTypingUsers';
import { getTypingStatusMessage } from './utils/getTypingStatusMessage';

export type TypingIndicatorProps = {
  /** Whether the message list is scrolled to the latest message. Defaults to `true`. */
  isMessageListScrolledToBottom?: boolean;
  /** Called when the indicator appears while the list is scrolled to the latest message. */
  scrollToBottom?: () => void;
};

const UnMemoizedTypingIndicator = (props: TypingIndicatorProps) => {
  const { isMessageListScrolledToBottom = true, scrollToBottom } = props;

  const {
    AvatarStack = DefaultAvatarStack,
    extractDisplayInfo = defaultExtractDisplayInfo,
  } = useComponentContext();
  const messageComposer = useMessageComposerController();
  const { t } = useTranslationContext();
  const thread = useThreadContext();
  const typingUsers = useTypingUsers(messageComposer.channel, thread?.id);
  const { displayUsers } = useDebouncedTypingActive(typingUsers);
  const showIndicator = displayUsers.length > 0;
  const typingAnnouncement = useMemo(
    () => getTypingStatusMessage(displayUsers, t),
    [displayUsers, t],
  );

  const displayInfo = useMemo(
    () => displayUsers.map(extractDisplayInfo),
    [displayUsers, extractDisplayInfo],
  );

  useEffect(() => {
    if (showIndicator && isMessageListScrolledToBottom) scrollToBottom?.();
  }, [scrollToBottom, isMessageListScrolledToBottom, showIndicator]);

  if (!showIndicator || !isMessageListScrolledToBottom) {
    return null;
  }

  return (
    <div
      className={clsx(
        'str-chat__typing-indicator',
        'str-chat__typing-indicator--with-transition',
        {
          'str-chat__typing-indicator--typing': showIndicator,
        },
      )}
      data-testid='typing-indicator'
    >
      {displayInfo.length > 0 && (
        <div aria-hidden='true'>
          <AvatarStack badgeSize='md' displayInfo={displayInfo} size='md' />
        </div>
      )}
      <div aria-hidden='true' className='str-chat__typing-indicator__bubble'>
        <div className='str-chat__typing-indicator__dots'>
          <TypingIndicatorDots />
        </div>
      </div>
      <VisuallyHidden>
        <span
          aria-atomic='true'
          aria-live='polite'
          data-testid='typing-indicator-status'
          role='status'
        >
          {typingAnnouncement}
        </span>
      </VisuallyHidden>
    </div>
  );
};

/**
 * Avatars and animated dots for the other users typing in the channel, or in the thread when one
 * is in context. Renders nothing when typing events are disabled or when
 * `isMessageListScrolledToBottom` is false. Must render inside a `Channel` or a `Thread`.
 */
export const TypingIndicator = React.memo(
  UnMemoizedTypingIndicator,
) as typeof UnMemoizedTypingIndicator;
