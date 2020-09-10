import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import EmptyStateIndicator from '../EmptyStateIndicator';

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

  it('should return null if listType is message', () => {
    const { container } = render(<EmptyStateIndicator listType="message" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should display correct text when listType is channel', () => {
    const { getByText } = render(<EmptyStateIndicator listType="channel" />);
    expect(getByText('You have no channels currently')).toBeInTheDocument();
  });

  it('should display correct text when no listType is provided', () => {
    jest.spyOn(console, 'error').mockImplementationOnce(() => null);
    const { getByText } = render(<EmptyStateIndicator />);
    expect(getByText('No items exist')).toBeInTheDocument();
  });
});
