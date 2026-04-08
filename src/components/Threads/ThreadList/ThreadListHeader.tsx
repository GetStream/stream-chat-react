import React from 'react';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useThreadsViewContext } from '../../ChatView';

export const ThreadListHeader = () => {
  const { t } = useTranslationContext();
  const { HeaderEndContent } = useComponentContext();
  const { activeThread } = useThreadsViewContext();
  return (
    <div className='str-chat__thread-list__header'>
      <div className='str-chat__thread-list__header__title'>{t('Threads')}</div>
      {activeThread && HeaderEndContent && <HeaderEndContent />}
    </div>
  );
};
