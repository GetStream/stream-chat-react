import type { ReactElement } from 'react';

import {
  SearchSourceResultsFirstPageLoading,
  SearchSourceResultsLoadingIndicator,
} from '../SearchResults';

describe('deprecated 15.0 names of the search list states', () => {
  it('SearchSourceResultsLoadingIndicator renders SearchSourceResultsFirstPageLoading', () => {
    expect((SearchSourceResultsLoadingIndicator() as ReactElement).type).toBe(
      SearchSourceResultsFirstPageLoading,
    );
  });
});
