import React from 'react';
import { render } from '@testing-library/react';

import { ListEndReachedUI } from '..';

describe('ListEndReachedUI', () => {
  it.each(['top', 'bottom'] as const)('renders nothing at the %s edge', (reached) => {
    const { container } = render(<ListEndReachedUI hasEnded reached={reached} />);
    expect(container).toBeEmptyDOMElement();
  });
});
