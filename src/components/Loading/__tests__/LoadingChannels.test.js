import React from 'react';

import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { LoadingChannels } from '../LoadingChannels';

afterEach(cleanup);

describe('LoadingChannels', () => {
  it('should render component with default props', () => {
    const { container } = render(<LoadingChannels />);
    expect(container).toMatchSnapshot();
  });
});
