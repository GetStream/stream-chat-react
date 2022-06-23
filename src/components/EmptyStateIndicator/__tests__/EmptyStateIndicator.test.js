import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EmptyStateIndicator } from '../EmptyStateIndicator';

afterEach(cleanup); // eslint-disable-line

describe('EmptyStateIndicator', () => {
  it('should render with default props', () => {
    jest.spyOn(console, 'error').mockImplementationOnce(() => null);
    const tree = renderer.create(<EmptyStateIndicator />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <p>
        No items exist
      </p>
    `);
  });

  it('should display correct text when listType is message', () => {
    render(<EmptyStateIndicator listType='message' />);
    expect(screen.queryByText('No chats here yet…')).toBeInTheDocument();
  });

  it('should display correct text when listType is channel', () => {
    render(<EmptyStateIndicator listType='channel' />);
    // rendering the same text twice for backwards compatibility with css styling v1
    expect(screen.queryAllByText('You have no channels currently')).toHaveLength(2);
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
