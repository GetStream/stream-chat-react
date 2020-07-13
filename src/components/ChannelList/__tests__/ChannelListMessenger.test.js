/* eslint-disable sonarjs/no-unused-collection */
import React from 'react';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import { ChannelListMessenger } from '..';

// Wierd hack to avoid big warnings
// Maybe better to find a better solution for it.
console.warn = () => null;

const Component = ({ loading = false, error = false }) => (
  <ChannelListMessenger
    loading={loading}
    error={error}
    LoadingIndicator={() => <div>Loading Indicator</div>}
    LoadingErrorIndicator={() => <div>Loading Error Indicator</div>}
  >
    <div>children 1</div>
    <div>children 2</div>
  </ChannelListMessenger>
);

describe('ChannelListMessenger', () => {
  afterEach(cleanup);

  it('by default, children should be rendered', () => {
    const tree = renderer.create(<Component />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it('when `error` prop is true, `LoadingErrorIndicator` should be rendered', () => {
    const tree = renderer.create(<Component error={true} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it('when `loading` prop is true, `LoadingIndicator` should be rendered', () => {
    const tree = renderer.create(<Component loading={true} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
