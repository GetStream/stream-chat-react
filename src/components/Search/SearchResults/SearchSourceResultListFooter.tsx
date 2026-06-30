import React, { useEffect, useRef } from 'react';
import type { SearchSourceState } from 'stream-chat';

import { SearchSourceResultsLoadingIndicator as DefaultSearchSourceResultsLoadingIndicator } from './SearchSourceResultsLoadingIndicator';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { useInteractionAnnouncements } from '../../Accessibility';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchSourceStateSelector = (value: SearchSourceState) => ({
  hasNext: value.hasNext,
  isLoading: value.isLoading,
});

export const SearchSourceResultListFooter = () => {
  const { t } = useTranslationContext();
  const { announceInteraction } = useInteractionAnnouncements();
  const {
    SearchSourceResultsLoadingIndicator = DefaultSearchSourceResultsLoadingIndicator,
  } = useComponentContext();
  const { searchSource } = useSearchSourceResultsContext();
  const { hasNext, isLoading } = useStateStore(
    searchSource.state,
    searchSourceStateSelector,
  );

  // Announce "all results loaded" when a fetch completes (loading true → false) and there is no next
  // page — i.e. the user has reached the end. Tracking the loading transition keeps it to the moment
  // pagination/initial load exhausts, instead of re-announcing on every render while at the end.
  const wasLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && !hasNext) {
      announceInteraction('search.allResultsLoaded');
    }
    wasLoadingRef.current = isLoading;
  }, [announceInteraction, hasNext, isLoading]);

  return (
    <div
      className='str-chat__search-source-result-list__footer'
      data-testid='search-footer'
    >
      {isLoading ? (
        <SearchSourceResultsLoadingIndicator />
      ) : !hasNext ? (
        // Visual only: the same status is announced via the `search.allResultsLoaded` live-region
        // interaction (above), so hide the text from assistive tech to avoid it being read as a
        // navigable result while moving through the list.
        <div aria-hidden='true' className='str-chat__search-source-results---empty'>
          {t('All results loaded')}
        </div>
      ) : null}
    </div>
  );
};
