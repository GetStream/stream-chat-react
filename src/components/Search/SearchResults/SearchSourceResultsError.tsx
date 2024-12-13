import React from 'react';
import { useTranslationContext } from '../../../context';

export type SearchSourceResultsErrorProps = {
  error: Error;
};

export const SearchSourceResultsError = ({ error }: SearchSourceResultsErrorProps) => {
  const { t } = useTranslationContext();
  return <div className='str-chat__search-source-results_error'>{t<string>(error.message)}</div>;
};
