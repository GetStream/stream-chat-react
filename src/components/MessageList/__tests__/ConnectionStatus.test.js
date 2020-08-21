import React from 'react';
import testRenderer from 'react-test-renderer';
import { cleanup, render, waitFor, act } from '@testing-library/react';
import { dispatchConnectionChangedEvent, getTestClient } from 'mock-builders';
import '@testing-library/jest-dom';

import ConnectionStatus from '../ConnectionStatus';
import { Chat } from '../../Chat';

const customNotificationId = 'custom-notification';
describe('<ChatContext /> component', () => {
  let chatClient;
  beforeEach(() => {
    chatClient = getTestClient();
  });

  afterEach(cleanup);

  it('should render nothing by default', () => {
    const tree = testRenderer.create(
      <Chat client={chatClient}>
        <ConnectionStatus />
      </Chat>,
    );

    expect(tree.toJSON()).toMatchInlineSnapshot(`null`);
  });

  it('should render and hide the status based on online state', async () => {
    const { queryByTestId } = render(
      <Chat client={chatClient}>
        <ConnectionStatus />
      </Chat>,
    );

    // default to online
    expect(queryByTestId(customNotificationId)).not.toBeInTheDocument();

    // offline
    act(() => dispatchConnectionChangedEvent(chatClient, false));
    await waitFor(() => {
      expect(queryByTestId(customNotificationId)).toBeInTheDocument();
    });

    // online again
    act(() => dispatchConnectionChangedEvent(chatClient, true));
    await waitFor(() => {
      expect(queryByTestId(customNotificationId)).not.toBeInTheDocument();
    });
  });

  it('should render a proper message when client is offline', async () => {
    const { queryByTestId } = render(
      <Chat client={chatClient}>
        <ConnectionStatus />
      </Chat>,
    );

    // offline
    act(() => dispatchConnectionChangedEvent(chatClient, false));
    await waitFor(() => {
      expect(queryByTestId(customNotificationId)).toBeInTheDocument();
      expect(queryByTestId(customNotificationId)).toHaveTextContent(
        'Connection failure, reconnecting now...',
      );
    });
  });
});
