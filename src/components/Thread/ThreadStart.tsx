import React from 'react';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';

export const ThreadStart = () => {
  const { thread } = useChannelStateContext('ThreadStart');
  const { t } = useTranslationContext('ThreadStart');

  if (!thread?.reply_count) return null;

  return (
    <div className='str-chat__thread-start'>
      {t<string>('replyCount', { count: thread.reply_count })}
    </div>
  );
};
