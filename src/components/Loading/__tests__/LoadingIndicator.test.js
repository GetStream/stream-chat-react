import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { LoadingIndicator } from '../LoadingIndicator';

afterEach(cleanup); // eslint-disable-line

describe('LoadingIndicator', () => {
  it('should render with default props', () => {
    const tree = renderer.create(<LoadingIndicator />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should update style based on props', () => {
    const size = 30;
    const color = '#000000';
    const { getByTestId } = render(<LoadingIndicator color={color} size={size} />);
    const wrapper = getByTestId('loading-indicator-wrapper');
    const circle = getByTestId('loading-indicator-circle');
    waitFor(() => {
      expect(wrapper).toHaveStyle({
        height: size,
        width: size,
      });
      expect(wrapper.firstChild).toHaveAttribute('width', size);
      expect(wrapper.firstChild).toHaveAttribute('height', size);
      expect(circle).toHaveAttribute('stop-color', color);
      expect(circle).toHaveStyle({
        stopColor: color,
      });
    });
  });
});
