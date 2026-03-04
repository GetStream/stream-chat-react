import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Window } from '../Window';

const renderComponent = () => render(<Window />);

describe('Window', () => {
  it('renders the base main panel class', () => {
    const { container } = renderComponent();
    expect(container.firstChild).toHaveClass('str-chat__main-panel');
  });
});
