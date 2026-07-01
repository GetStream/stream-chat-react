import React from 'react';

import { cleanup, render } from '@testing-library/react';

import { TokenizedSuggestionParts } from '../SuggestionList';

afterEach(cleanup);

describe('TokenizedSuggestionParts', () => {
  it('should replace boundary whitespace runs with single HTML spaces', () => {
    const repeatedTabs = '\t'.repeat(1000);
    const { container } = render(
      <TokenizedSuggestionParts
        tokenizedDisplayName={{
          parts: [`${repeatedTabs}Alice\tBob${repeatedTabs}`, repeatedTabs],
          token: '',
        }}
      />,
    );

    const parts = container.querySelectorAll('span');

    expect(parts[0]?.textContent).toBe('\u00A0Alice\tBob\u00A0');
    expect(parts[1]?.textContent).toBe('\u00A0');
  });
});
