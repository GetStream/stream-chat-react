import React from 'react';
import {
  useComponentContext,
  useTranslationContext,
  useWorkspaceNavigation,
} from '../../../context';

export const ThreadListHeader = () => {
  const { t } = useTranslationContext();
  const { HeaderEndContent } = useComponentContext();
  // A thread is "active" when one is open in the workspace.
  const hasActiveThread = useWorkspaceNavigation().openThreads.length > 0;
  return (
    <div className='str-chat__thread-list__header'>
      <div className='str-chat__thread-list__header__title'>{t('Threads')}</div>
      {hasActiveThread && HeaderEndContent && <HeaderEndContent />}
    </div>
  );
};
