import React from 'react';
import { DefaultSearchSources, SearchSource } from '../SearchController';
import { useTranslationContext } from '../../../context';
import type { DefaultStreamChatGenerics } from '../../../types';

export type SearchSourceResultsPresearchProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  searchSource: Sources[number];
};

export const SearchSourceResultsPresearch = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  searchSource,
}: SearchSourceResultsPresearchProps<StreamChatGenerics, Sources>) => {
  const { t } = useTranslationContext();
  return (
    <div>
      {t<string>(`Start typing to search for {{searchSourceType}}`, {
        searchSourceType: searchSource.type,
      })}
    </div>
  );
};
