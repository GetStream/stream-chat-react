import React from 'react';

import { useTranslationContext } from '../../../context';
import { IconMessageBubbles } from '../../Icons';

export const ThreadListEmptyPlaceholder = () => {
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__thread-list-empty-placeholder'>
      <IconMessageBubbles />
      <p>{t('threadList.empty.text', 'Reply to a message to start a thread')}</p>
    </div>
  );
};
