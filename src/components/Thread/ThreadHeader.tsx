import React from 'react';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useStateStore } from '../../store';
import { useChannelPreviewInfo } from '../ChannelPreview/hooks/useChannelPreviewInfo';
import { useThreadContext } from '../Threads';

import type { LocalMessage } from 'stream-chat';
import type { ThreadState } from 'stream-chat';
import { Button } from '../Button';
import { IconCrossMedium } from '../Icons';

const threadStateSelector = ({ displayName, replyCount }: ThreadState) => ({
  displayName,
  replyCount,
});

/** Fallback when no Thread instance: use parent message author (name only, not id). */
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
  const { displayTitle: channelDisplayTitle } = useChannelPreviewInfo({
    channel,
  });
  const threadInstance = useThreadContext();
  const { displayName, replyCount: replyCountThreadInstance } =
    useStateStore(threadInstance?.state, threadStateSelector) ?? {};

  const replyCount = threadInstance
    ? replyCountThreadInstance
    : thread
      ? (thread.reply_count ?? 0)
      : 0;

  const threadDisplayName =
    overrideTitle ??
    displayName ??
    (threadInstance == null ? channelDisplayTitle : undefined) ??
    displayNameFromParentMessage(thread) ??
    undefined;

  return (
    <div className='str-chat__thread-header'>
      <div className='str-chat__thread-header-details'>
        <div className='str-chat__thread-header-title'>{t('Thread')}</div>
        <div className='str-chat__thread-header-subtitle'>
          {threadDisplayName + ' · ' + t('replyCount', { count: replyCount })}
        </div>
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
