import React, { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import type { EventPayload, TextComposerState, ThreadState } from 'stream-chat';

import { AvatarStack as DefaultAvatarStack } from '../Avatar';
import { extractDisplayInfo as defaultExtractDisplayInfo } from '../Avatar/utils';
import { TypingIndicatorDots } from './TypingIndicatorDots';
import { VisuallyHidden } from '../VisuallyHidden';
import { useChannelConfig } from '../Channel/hooks/useChannelConfig';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { useThreadContext } from '../Threads/ThreadContext';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';

import { useDebouncedTypingActive } from './hooks/useDebouncedTypingActive';
import { getTypingStatusMessage } from './utils/getTypingStatusMessage';

const textComposerTypingSelector = ({ typing }: TextComposerState) => ({ typing });

const threadParentMessageSelector = ({ parentMessage }: ThreadState) => ({
  parentMessage,
});

export type TypingIndicatorProps = {
  /** When false, the indicator is not rendered (e.g. when list is not scrolled to bottom). Omit or true to show when typing. */
  isMessageListScrolledToBottom?: boolean;
  /** Scrolls the message list to the latest message; invoked when a typing indicator appears. */
  scrollToBottom?: () => void;
};

/**
 * TypingIndicator shows avatars of users currently typing and a bubble with animated dots.
 * Renders only for other participants (never the current user), only when scrolled to the latest
 * message if `isMessageListScrolledToBottom` is provided. It must be a child of Channel component.
 */
const UnMemoizedTypingIndicator = (props: TypingIndicatorProps) => {
  const { isMessageListScrolledToBottom = true, scrollToBottom } = props;

  const {
    AvatarStack = DefaultAvatarStack,
    extractDisplayInfo = defaultExtractDisplayInfo,
  } = useComponentContext();
  const messageComposer = useMessageComposerController();
  const channelConfig = useChannelConfig({ cid: messageComposer.channel.cid });
  const { client } = useChatContext('TypingIndicator');
  const { t } = useTranslationContext();
  const { typing = {} } =
    useStateStore(messageComposer.textComposer?.state, textComposerTypingSelector) ?? {};
  const thread = useThreadContext();
  const isThreadList = !!thread;
  const { parentMessage } =
    useStateStore(thread?.state, threadParentMessageSelector) ?? {};

  const typingEntries = Object.values(typing) as EventPayload<
    'typing.start' | 'typing.stop'
  >[];

  const typingInChannel = !isThreadList
    ? typingEntries.filter(
        ({ parent_id, user }) => user?.id !== client.user?.id && !parent_id,
      )
    : [];

  const typingInThread = isThreadList
    ? typingEntries.filter(
        ({ parent_id, user }) =>
          user?.id !== client.user?.id && parent_id === parentMessage?.id,
      )
    : [];

  const typingUsers = isThreadList ? typingInThread : typingInChannel;
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

  if (channelConfig?.typing_events === false) {
    return null;
  }

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

export const TypingIndicator = React.memo(
  UnMemoizedTypingIndicator,
) as typeof UnMemoizedTypingIndicator;
