import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import { getTestClientWithUser } from 'mock-builders';
import { ChannelListTeam } from '..';
import { ChatContext } from '../../../context';

// Weird hack to avoid big warnings
// Maybe better to find a better solution for it.
console.warn = () => null;

const Component = ({ Avatar, client, error = false, loading = false }) => (
  <ChatContext.Provider value={{ client }}>
    <ChannelListTeam
      Avatar={Avatar}
      client={client}
      error={error}
      loading={loading}
      LoadingErrorIndicator={() => <div>Loading Error Indicator</div>}
      LoadingIndicator={() => <div>Loading Indicator</div>}
    >
      <div>children 1</div>
      <div>children 2</div>
    </ChannelListTeam>
  </ChatContext.Provider>
);

describe('ChannelListTeam', () => {
  afterEach(cleanup);

  let chatClientVishal;

  beforeEach(async () => {
    chatClientVishal = await getTestClientWithUser({ id: 'vishal' });
  });

  it('by default, should render sidebar, userbar and children', () => {
    const tree = renderer
      .create(<Component client={chatClientVishal} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('when `error` prop is true, `LoadingErrorIndicator` should be rendered', () => {
    const tree = renderer
      .create(<Component client={chatClientVishal} error />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('when `loading` prop is true, `LoadingIndicator` should be rendered', () => {
    const tree = renderer
      .create(<Component client={chatClientVishal} loading />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('when `Avatar` prop is provided, custom avatar component should render', async () => {
    const { getByTestId } = render(
      <Component
        Avatar={() => <div data-testid='custom-avatar'>Avatar</div>}
        client={chatClientVishal}
      />,
    );

    await waitFor(() => {
      expect(getByTestId('custom-avatar')).toBeInTheDocument();
    });
  });
});
