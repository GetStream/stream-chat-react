import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  getTestClient,
  useMockedApis,
  queryChannelsApi,
  generateMessage,
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  dispatchMessageNewEvent,
  dispatchNotificationAddedToChannelEvent,
  getTestClientWithUser,
  erroredGetApi,
} from '../../../mock-builders';
import { Chat } from '../../Chat';
import ChannelList from '../ChannelList';

/**
 * We are gonna use following custom UI components for preview and list.
 * If we use ChannelPreviewMessanger or ChannelPreviewLastmessage here, then changes
 * to those components might endup breaking tests for ChannelList, which will be quite painful
 * to debug then.
 */
const ChannelPreviewComponent = ({ channel, latestMessage }) => (
  <div role="listitem" data-testid={channel.id}>
    <div>{channel.data.name}</div>
    <div>{latestMessage}</div>
  </div>
);

const ChannelListComponent = (props) => {
  const { error, loading } = props;
  if (error) {
    return <div data-testid="error-indicator" />;
  }

  if (loading) {
    return <div data-testid="loading-indicator" />;
  }

  return <div role="list">{props.children}</div>;
};

jest.mock('axios');

describe('ChannelList', () => {
  afterEach(cleanup);

  it('should render error indicator if queryChannels api fail', async () => {
    useMockedApis(axios, [erroredGetApi()]);
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const chatClientVishal = getTestClient();
    await chatClientVishal.setUser({ id: 'vishal' });

    const { getByTestId } = render(
      <Chat client={chatClientVishal}>
        <ChannelList
          filters={{}}
          Preview={ChannelPreviewComponent}
          List={ChannelListComponent}
          options={{ state: true, watch: true, presence: true }}
        />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByTestId('error-indicator')).toBeInTheDocument();
    });
  });

  it('should move the channel to top if new message is received', async () => {
    const channel1 = generateChannel();
    const channel2 = generateChannel();
    const channel3 = generateChannel();

    useMockedApis(axios, [queryChannelsApi([channel1, channel2, channel3])]);

    const chatClientVishal = getTestClient();
    await chatClientVishal.setUser({ id: 'vishal' });

    const { getByText, getByRole, getAllByRole } = render(
      <Chat client={chatClientVishal}>
        <ChannelList
          filters={{}}
          Preview={ChannelPreviewComponent}
          List={ChannelListComponent}
          options={{ state: true, watch: true, presence: true }}
        />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByRole('list')).toBeInTheDocument();
    });

    const newMessage = generateMessage({
      user: generateUser(),
    });

    dispatchMessageNewEvent(chatClientVishal, newMessage, channel3.channel);

    await waitFor(() => {
      expect(getByText(newMessage.text)).toBeInTheDocument();
    });

    const items = getAllByRole('listitem');

    // Get the closes listitem to the channel that received new message.
    const channelPreview = getByText(newMessage.text).closest(
      '[role="listitem"]',
    );
    expect(channelPreview.isEqualNode(items[0])).toBe(true);
  });

  it('should move the new channel to top of list if notification.added_to_channel is received', async () => {
    const channel1 = generateChannel();
    const channel2 = generateChannel();
    const channel3 = generateChannel();

    useMockedApis(axios, [
      queryChannelsApi([channel1, channel2]),
      getOrCreateChannelApi(channel3),
    ]);

    const chatClientVishal = await getTestClientWithUser({ id: 'vishal' });

    const { getByRole, getByTestId, getAllByRole } = render(
      <Chat client={chatClientVishal}>
        <ChannelList
          filters={{}}
          Preview={ChannelPreviewComponent}
          List={ChannelListComponent}
          options={{ state: true, watch: true, presence: true }}
        />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByRole('list')).toBeInTheDocument();
    });

    dispatchNotificationAddedToChannelEvent(chatClientVishal, channel3.channel);

    await waitFor(() => {
      expect(getByTestId(channel3.channel.id)).toBeInTheDocument();
    });

    const items = getAllByRole('listitem');

    // Get the closes listitem to the channel that received new message.
    const channelPreview = getByTestId(channel3.channel.id);
    expect(channelPreview.isEqualNode(items[0])).toBe(true);
  });
});
