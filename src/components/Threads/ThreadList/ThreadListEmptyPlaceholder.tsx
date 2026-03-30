import React from 'react';

import { useTranslationContext } from '../../../context';
import { IconMessageBubbles } from '../../Icons';

export const ThreadListEmptyPlaceholder = () => {
  const { t } = useTranslationContext('ThreadListEmptyPlaceholder');

  return (
    <div className='str-chat__thread-list-empty-placeholder'>
      <IconMessageBubbles />
      <p>{t('Reply to a message to start a thread')}</p>
    </div>
  );
};
