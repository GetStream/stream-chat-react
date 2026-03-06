import React from 'react';

import { useTranslationContext } from '../../../context';
import { IconBubbles } from '../../Icons';

export const ThreadListEmptyPlaceholder = () => {
  const { t } = useTranslationContext('ThreadListEmptyPlaceholder');

  return (
    <div className='str-chat__thread-list-empty-placeholder'>
      <IconBubbles />
      <p>{t('Reply to a message to start a thread')}</p>
    </div>
  );
};
