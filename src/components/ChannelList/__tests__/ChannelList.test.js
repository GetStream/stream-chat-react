/**
 * STILL WORK IN PROGRESS
 */

/* eslint-disable sonarjs/no-unused-collection */
import React from 'react';
import { cleanup, render, wait, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { getTestClient, createUserToken } from '../../../__testUtils__/index';

import { Chat } from '../../Chat';
import ChannelList from '../ChannelList';
import {
  useMockedApis,
  queryChannels,
  sendMessage,
} from '../../../__testUtils__/api-mocks';
import { dispatchMessageNewEvent } from '../../../__testUtils__/event-mocks';
import axios from 'axios';

import * as mockedData from '../../../__testUtils__/mocked-data';

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
    useMockedApis(axios, [
      queryChannelsApi({
        withChannels: [mockedData.channel0, mockedData.channel1],
        withMembers: [mockedData.user0, mockedData.user1],
      }),
      sendMessageApi(),
    ]);

    chatClientVishal = await getTestClient(axios, 'vishal');

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

    const newMessage = {
      text: 'this is new message',
      user: mockedData.user0,
    };

    dispatchMessageNewEvent(chatClientVishal, newMessage);

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
});
