// @ts-nocheck
import React from 'react';

import { cleanup, render } from '@testing-library/react';

import { LoadingChannel } from '../LoadingChannel';

afterEach(cleanup);

describe('LoadingChannel', () => {
  it('should render component with default props', () => {
    const { container } = render(<LoadingChannel />);
    expect(container).toMatchSnapshot();
  });
});
