import React from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EmptyStateIndicator } from '../EmptyStateIndicator';

afterEach(cleanup);

describe('EmptyStateIndicator', () => {
  it('should render with default props', () => {
    jest.spyOn(console, 'error').mockImplementationOnce(() => null);
    const { container } = render(<EmptyStateIndicator />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          No items exist
        </p>
      </div>
    `);
  });

  it('should display correct text when listType is message', () => {
    render(<EmptyStateIndicator listType='message' />);
    expect(screen.queryByText('No chats here yet…')).toBeInTheDocument();
  });

  it('should display correct text when listType is channel', () => {
    render(<EmptyStateIndicator listType='channel' />);
    expect(screen.queryByText('You have no channels currently')).toBeInTheDocument();
  });

  it('should return null if listType is thread', () => {
    const { container } = render(<EmptyStateIndicator listType='thread' />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should display correct text when no listType is provided', () => {
    jest.spyOn(console, 'error').mockImplementationOnce(() => null);
    render(<EmptyStateIndicator />);
    expect(screen.getByText('No items exist')).toBeInTheDocument();
  });
});
