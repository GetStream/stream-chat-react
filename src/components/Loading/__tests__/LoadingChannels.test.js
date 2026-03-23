import React from 'react';

import { cleanup, render } from '@testing-library/react';

import { LoadingChannels } from '../LoadingChannels';

afterEach(cleanup);

describe('LoadingChannels', () => {
  it('should render component with default props', () => {
    const { container } = render(<LoadingChannels />);
    expect(container).toMatchSnapshot();
  });
});
