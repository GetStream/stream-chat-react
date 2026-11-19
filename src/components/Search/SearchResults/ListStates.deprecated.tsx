import React from 'react';

import { SearchSourceResultsFirstPageLoading } from './ListStates';

// The deprecated name renders its new one, read when it renders, so import order cannot leave it
// undefined.

/**
 * @deprecated Use `SearchSourceResultsFirstPageLoading`, which it renders. Removed in the next
 * major.
 */
export const SearchSourceResultsLoadingIndicator = () => (
  <SearchSourceResultsFirstPageLoading />
);
