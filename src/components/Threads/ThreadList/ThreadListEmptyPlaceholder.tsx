import React from 'react';

import { useComponentContext, useTranslationContext } from '../../../context';
import { IconMessageBubbles as DefaultIconMessageBubbles } from '../../Icons';

export const ThreadListEmptyPlaceholder = () => {
  const { icons: { IconMessageBubbles = DefaultIconMessageBubbles } = {} } =
    useComponentContext();

  const { t } = useTranslationContext('ThreadListEmptyPlaceholder');

  return (
    <div className='str-chat__thread-list-empty-placeholder'>
      <IconMessageBubbles />
      <p>{t('Reply to a message to start a thread')}</p>
    </div>
  );
};
