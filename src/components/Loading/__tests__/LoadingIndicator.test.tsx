// @ts-nocheck
import React from 'react';

import { cleanup, render } from '@testing-library/react';

import { LoadingIndicator } from '../LoadingIndicator';

afterEach(cleanup);

describe('LoadingIndicator', () => {
  it('should render with default props', () => {
    const { container } = render(<LoadingIndicator />);
    expect(container).toMatchSnapshot();
  });

  it('should render an svg with the loading indicator class', () => {
    const { container } = render(<LoadingIndicator />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('str-chat__loading-indicator');
    expect(svg).toHaveClass('str-chat__icon');
  });

  it('should pass through additional SVG props', () => {
    const { container } = render(<LoadingIndicator data-custom='test-value' />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-custom', 'test-value');
  });
});
