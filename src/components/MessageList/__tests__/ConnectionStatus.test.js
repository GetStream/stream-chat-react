import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { dispatchConnectionChangedEvent, getTestClient } from 'mock-builders';
import '@testing-library/jest-dom';

import { ConnectionStatus } from '../ConnectionStatus';
import { Chat } from '../../Chat';

const customNotificationId = 'custom-notification';
describe('<ChatContext /> component', () => {
  let chatClient;
  beforeEach(() => {
    chatClient = getTestClient();
  });

  afterEach(cleanup);

  it('should render nothing by default', async () => {
    let container;
    await act(() => {
      const result = render(
        <Chat client={chatClient}>
          <ConnectionStatus />
        </Chat>,
      );
      container = result.container;
    });

    expect(container.firstChild).toMatchInlineSnapshot(`null`);
  });

  it('should render and hide the status based on online state', async () => {
    act(() => {
      render(
        <Chat client={chatClient}>
          <ConnectionStatus />
        </Chat>,
      );
    });

    // default to online
    expect(screen.queryByTestId(customNotificationId)).not.toBeInTheDocument();

    // offline
    act(() => dispatchConnectionChangedEvent(chatClient, false));
    await waitFor(() => {
      expect(screen.queryByTestId(customNotificationId)).toBeInTheDocument();
    });

    // online again
    act(() => dispatchConnectionChangedEvent(chatClient, true));
    await waitFor(() => {
      expect(screen.queryByTestId(customNotificationId)).not.toBeInTheDocument();
    });
  });

  it('should render a proper message when client is offline', async () => {
    await act(() => {
      render(
        <Chat client={chatClient}>
          <ConnectionStatus />
        </Chat>,
      );
    });

    // offline
    act(() => {
      dispatchConnectionChangedEvent(chatClient, false);
    });
    await waitFor(() => {
      expect(screen.queryByTestId(customNotificationId)).toBeInTheDocument();
      expect(screen.queryByTestId(customNotificationId)).toHaveTextContent(
        'Connection failure, reconnecting now...',
      );
    });
  });
});
