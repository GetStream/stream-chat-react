import { DefaultSearchSources, SearchSource } from '../SearchController';
import { useTranslationContext } from '../../../context';
import React from 'react';

export type PresearchSourceResultsProps<Sources extends SearchSource[]> = {
  searchSource: Sources[number]['type'];
};

export const PresearchSourceSearchResults = <
  Sources extends SearchSource[] = DefaultSearchSources
>({
  searchSource,
}: PresearchSourceResultsProps<Sources>) => {
  const { t } = useTranslationContext();
  return <div>{t<string>(`Start typing to search for ${searchSource}`)}</div>;
};
