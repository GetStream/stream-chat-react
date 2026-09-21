import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../../context';

export const ThreadListEmptyPlaceholder = () => {
  const { IconMessageBubbles } = useComponentContextIcons();
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__thread-list-empty-placeholder'>
      <IconMessageBubbles />
      <p>{t('threadList.empty.text', 'Reply to a message to start a thread')}</p>
    </div>
  );
};
