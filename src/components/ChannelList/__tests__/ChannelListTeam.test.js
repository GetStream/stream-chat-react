/* eslint-disable sonarjs/no-unused-collection */
import React from 'react';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import { ChannelListTeam } from '..';
import { getTestClientWithUser } from 'mock-builders';

// eslint-disable-next-line no-undef
afterEach(cleanup);

// Wierd hack to avoid big warnings
// Maybe better to find a better solution for it.
console.warn = () => null;

jest.mock('axios');

const Component = ({ client, loading = false, error = false }) => {
  return (
    <ChannelListTeam
      client={client}
      loading={loading}
      error={error}
      LoadingIndicator={() => <div>Loading Indicator</div>}
      LoadingErrorIndicator={() => <div>Loading Error Indicator</div>}
    >
      <div>children 1</div>
      <div>children 2</div>
    </ChannelListTeam>
  );
};

describe('ChannelListTeam', () => {
  let chatClientVishal;

  beforeEach(async () => {
    chatClientVishal = await getTestClientWithUser({ id: 'vishal' });
  });
  test('by default, should render sidebar, userbar and children', () => {
    const tree = renderer
      .create(<Component client={chatClientVishal} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test('when `error` prop is true, `LoadingErrorIndicator` should be rendered', () => {
    const tree = renderer
      .create(<Component client={chatClientVishal} error />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test('when `loading` prop is true, `LoadingIndicator` should be rendered', () => {
    const tree = renderer
      .create(<Component client={chatClientVishal} loading />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
