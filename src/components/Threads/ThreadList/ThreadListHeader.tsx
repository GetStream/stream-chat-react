import React from 'react';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useSlotThreads } from '../../ChatView';

export const ThreadListHeader = () => {
  const { t } = useTranslationContext();
  const { HeaderEndContent } = useComponentContext();
  // A thread is "active" when one is bound in a thread slot.
  const hasActiveThread = useSlotThreads().length > 0;
  return (
    <div className='str-chat__thread-list__header'>
      <div className='str-chat__thread-list__header__title'>{t('Threads')}</div>
      {hasActiveThread && HeaderEndContent && <HeaderEndContent />}
    </div>
  );
};
