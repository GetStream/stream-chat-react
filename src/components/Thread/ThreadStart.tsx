import React from 'react';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';

export const ThreadStart = () => {
  const { thread } = useChannelStateContext('ThreadStart');
  const { t } = useTranslationContext('ThreadStart');

  return (
    <div className='str-chat__thread-start'>
      {thread?.reply_count
        ? t<string>('replyCount', { count: thread.reply_count })
        : t<string>('Start of a new thread')}
    </div>
  );
};
