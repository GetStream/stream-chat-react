import React from 'react';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useStateStore } from '../../store';
import { useChannelDisplayName } from '../ChannelPreview/hooks/useChannelDisplayName';
import { useThreadContext } from '../Threads';

import type { LocalMessage } from 'stream-chat';
import type { ThreadState } from 'stream-chat';
import { Button } from '../Button';
import { IconCrossMedium } from '../Icons';

const threadStateSelector = ({ replyCount }: ThreadState) => ({ replyCount });

/** Fallback when channel has no display title: parent message author (name only). */
const displayNameFromParentMessage = (message: LocalMessage): string | undefined =>
  message.user?.name ?? undefined;

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
  const { channel } = useChannelStateContext('ThreadHeader');
  const channelDisplayTitle = useChannelDisplayName(channel);

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
    overrideTitle ?? channelDisplayTitle ?? displayNameFromParentMessage(thread);
  const replyCountLabel = t('replyCount', { count: replyCount });
  const subtitle = threadDisplayName
    ? `${threadDisplayName} · ${replyCountLabel}`
    : replyCountLabel;

  return (
    <div className='str-chat__thread-header'>
      <div className='str-chat__thread-header-details'>
        <div className='str-chat__thread-header-title'>{t('Thread')}</div>
        <div className='str-chat__thread-header-subtitle'>{subtitle}</div>
      </div>
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
          <IconCrossMedium />
        </Button>
      )}
    </div>
  );
};
