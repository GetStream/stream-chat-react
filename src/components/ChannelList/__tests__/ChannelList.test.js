/* eslint-disable sonarjs/no-unused-collection */
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Chat } from '../../Chat';
import ChannelList from '../ChannelList';
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
} from '../../../__mocks__';
import axios from 'axios';

// eslint-disable-next-line no-undef
afterEach(cleanup);

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
  const { error, loading, LoadingErrorIndicator, LoadingIndicator } = props;
  if (error) {
    return <LoadingErrorIndicator type="Connection Error" />;
  } else if (loading) {
    return <LoadingIndicator />;
  } else {
    return <div role="list">{props.children}</div>;
  }
};

jest.mock('axios');

describe('ChannelList', () => {
  let chatClientVishal;

  it('should move the channel to top if new message is received', async () => {
    const channel1 = generateChannel();
    const channel2 = generateChannel();
    const channel3 = generateChannel();

    useMockedApis(axios, [queryChannelsApi([channel1, channel2, channel3])]);

    chatClientVishal = await getTestClient({ id: 'vishal' });

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
    expect(channelPreview.isEqualNode(items[0])).toBeTruthy();
  });

  it('should move the new channel to top of list if notification.added_to_channel is received', async () => {
    const channel1 = generateChannel();
    const channel2 = generateChannel();
    const channel3 = generateChannel();

    useMockedApis(axios, [
      queryChannelsApi([channel1, channel2]),
      getOrCreateChannelApi(channel3),
    ]);

    chatClientVishal = await getTestClient({ id: 'vishal' });

    const { getByText, getByRole, getByTestId, getAllByRole } = render(
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

    dispatchNotificationAddedToChannelEvent(chatClientVishal, channel3.channel);

    await waitFor(() => {
      expect(getByTestId(channel3.channel.id)).toBeInTheDocument();
    });

    const items = getAllByRole('listitem');

    // Get the closes listitem to the channel that received new message.
    const channelPreview = getByTestId(channel3.channel.id);
    expect(channelPreview.isEqualNode(items[0])).toBeTruthy();
  });
});
