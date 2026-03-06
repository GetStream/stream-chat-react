import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';
import { useThreadContext } from '../Threads/ThreadContext';
import { useStateStore } from '../../store';
import type { ThreadState } from 'stream-chat';

const threadStartSelector = ({ parentMessage }: ThreadState) => ({
  parentMessage,
});

export const ThreadStart = () => {
  const thread = useThreadContext();
  const { t } = useTranslationContext('ThreadStart');
  const { parentMessage } = useStateStore(thread?.state, threadStartSelector) ?? {};

  if (!parentMessage?.reply_count) return null;

  return (
    <div className='str-chat__thread-start'>
      {t('replyCount', { count: parentMessage.reply_count })}
    </div>
  );
};
