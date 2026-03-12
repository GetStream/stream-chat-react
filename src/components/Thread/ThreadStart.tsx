import React from 'react';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useThreadContext } from '../Threads';
import { useStateStore } from '../../store';
import type { ThreadState } from 'stream-chat';

const threadStateSelector = ({ replyCount }: ThreadState) => ({
  replyCount,
});

export const ThreadStart = () => {
  const { thread } = useChannelStateContext('ThreadStart');
  const { t } = useTranslationContext('ThreadStart');
  const threadInstance = useThreadContext();
  const { replyCount: replyCountThreadInstance } =
    useStateStore(threadInstance?.state, threadStateSelector) ?? {};

  const replyCount = threadInstance
    ? replyCountThreadInstance
    : thread
      ? (thread.reply_count ?? 0)
      : 0;

  if (!replyCount) return null;

  return (
    <div className='str-chat__thread-start'>{t('replyCount', { count: replyCount })}</div>
  );
};
