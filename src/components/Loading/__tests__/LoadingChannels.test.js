import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import { LoadingChannels } from '../LoadingChannels';

afterEach(cleanup); // eslint-disable-line

describe('LoadingChannels', () => {
  it('should render component with default props', () => {
    const tree = renderer.create(<LoadingChannels />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
