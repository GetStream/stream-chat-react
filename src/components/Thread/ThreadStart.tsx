import React from 'react';

import { useTranslationContext } from '../../context';

export const ThreadStart = () => {
  const { t } = useTranslationContext('Thread');

  return <div className='str-chat__thread-start'>{t<string>('Start of a new thread')}</div>;
};
