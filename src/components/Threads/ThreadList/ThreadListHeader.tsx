import React from 'react';
import { useTranslationContext } from '../../../context';

export type ThreadListHeaderProps = {
  /** Rendered at the end of the header, after the title. No default. */
  EndContent?: React.ComponentType;
  /** Rendered at the start of the header, before the title. No default. */
  StartContent?: React.ComponentType;
};

/** Header of the thread list: the "Threads" title, with optional start and end content. */
export const ThreadListHeader = ({ EndContent, StartContent }: ThreadListHeaderProps) => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__thread-list__header'>
      {StartContent && <StartContent />}
      <div className='str-chat__thread-list__header__title'>
        {t('common.threads.text', 'Threads')}
      </div>
      {EndContent && <EndContent />}
    </div>
  );
};
