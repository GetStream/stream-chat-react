import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../../context';

export const ThreadListEmptyPlaceholder = () => {
  const { IconMessageBubbles } = useComponentContextIcons();

  const { t } = useTranslationContext('ThreadListEmptyPlaceholder');

  return (
    <div className='str-chat__thread-list-empty-placeholder'>
      <IconMessageBubbles />
      <p>{t('Reply to a message to start a thread')}</p>
    </div>
  );
};
