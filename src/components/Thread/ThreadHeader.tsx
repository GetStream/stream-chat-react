import React from 'react';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useStateStore } from '../../store';
import { useChannelPreviewInfo } from '../ChannelListItem/hooks/useChannelPreviewInfo';
import { TypingIndicatorHeader } from '../TypingIndicator/TypingIndicatorHeader';
import { useThreadContext } from '../Threads';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTypingContext } from '../../context/TypingContext';

import type { LocalMessage } from 'stream-chat';
import type { ThreadState } from 'stream-chat';
import { Button } from '../Button';
import { IconXmark } from '../Icons';
import { useChatViewContext } from '../ChatView';

const threadStateSelector = ({ replyCount }: ThreadState) => ({ replyCount });

/** Fallback when channel has no display title: parent message author (name only). */
const displayNameFromParentMessage = (message: LocalMessage): string | undefined =>
  message.user?.name ?? undefined;

/** Subtitle: replyCount, threadDisplayName, defaultSubtitle (name · reply count), and when typing also TypingIndicatorHeader. */
const ThreadHeaderSubtitle = ({
  replyCount,
  threadDisplayName,
  threadList,
}: {
  replyCount: number | undefined;
  threadDisplayName: string | undefined;
  threadList: boolean;
}) => {
  const { t } = useTranslationContext();
  const { channelConfig, thread } = useChannelStateContext('ThreadHeaderSubtitle');
  const threadInstance = useThreadContext();
  const parentId = threadInstance?.id ?? thread?.id;
  const { client } = useChatContext('ThreadHeaderSubtitle');
  const { typing = {} } = useTypingContext('ThreadHeaderSubtitle');
  const typingInThread = Object.values(typing).filter(
    ({ parent_id, user }) => user?.id !== client.user?.id && parent_id === parentId,
  );
  const hasTyping = channelConfig?.typing_events !== false && typingInThread.length > 0;
  const replyCountText = t('replyCount', { count: replyCount ?? 0 });
  const defaultSubtitle = threadDisplayName
    ? `${threadDisplayName} · ${replyCountText}`
    : replyCountText;
  return (
    <div className='str-chat__thread-header-subtitle'>
      <span
        className='str-chat__subtitle-content-transition'
        key={hasTyping ? 'typing' : 'default'}
      >
        {hasTyping ? (
          <TypingIndicatorHeader threadList={threadList} />
        ) : (
          <>{defaultSubtitle}</>
        )}
      </span>
    </div>
  );
};

export type ThreadHeaderProps = {
  /** Callback for closing the thread */
  closeThread: (event?: React.BaseSyntheticEvent) => void;
  /** The thread parent message */
  thread: LocalMessage;
  /** Override the thread display title */
  overrideTitle?: string;
};

export const ThreadHeader = (props: ThreadHeaderProps) => {
  const { closeThread, overrideTitle, thread } = props;

  const { t } = useTranslationContext();
  const { channel } = useChannelStateContext();
  const { HeaderStartContent } = useComponentContext();
  const { activeChatView } = useChatViewContext();
  const { displayTitle: channelDisplayTitle } = useChannelPreviewInfo({ channel });

  const threadInstance = useThreadContext();
  const { replyCount: replyCountThreadInstance } =
    useStateStore(threadInstance?.state, threadStateSelector) ?? {};

  const replyCount = threadInstance
    ? replyCountThreadInstance
    : thread
      ? (thread.reply_count ?? 0)
      : 0;

  // Subtitle: channel display title (from parent or hook), with override and fallback to parent message author
  const threadDisplayName =
    overrideTitle ??
    channelDisplayTitle ??
    displayNameFromParentMessage(thread) ??
    undefined;

  return (
    <div className='str-chat__thread-header'>
      <div className='str-chat__thread-header__start'>
        {activeChatView === 'threads' && HeaderStartContent && <HeaderStartContent />}
      </div>
      <div className='str-chat__thread-header-details'>
        <div className='str-chat__thread-header-title'>{t('Thread')}</div>
        <ThreadHeaderSubtitle
          replyCount={replyCount}
          threadDisplayName={threadDisplayName}
          threadList
        />
      </div>
      <div className='str-chat__thread-header__end'>
        {!threadInstance && (
          <Button
            appearance='ghost'
            aria-label={t('aria/Close thread')}
            circular
            className='str-chat__close-thread-button'
            data-testid='close-thread-button'
            onClick={closeThread}
            size='md'
            variant='secondary'
          >
            <IconXmark />
          </Button>
        )}
      </div>
    </div>
  );
};
