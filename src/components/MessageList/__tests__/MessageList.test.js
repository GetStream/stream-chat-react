/**
 * STILL WORK IN PROGRESS
 */

/* eslint-disable sonarjs/no-unused-collection */
import React from 'react';
import { cleanup, render, wait, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { getTestClient, createUserToken } from '../../../__testUtils__/index';

import { Chat } from '../../Chat';
import MessageList from '../MessageList';
import { Channel } from '../../Channel';
import {
  useMockedApis,
  queryChannels,
  sendMessage,
  getOrCreateChannel,
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

describe('MessageList', () => {
  let chatClientVishal;

  it('should add new message at bottom of the list', async () => {
    useMockedApis(axios, [
      getOrCreateChannelApi({
        withUsers: [mockedData.user0, mockedData.user1],
      }),
    ]);

    chatClientVishal = await getTestClient(axios, 'vishal');
    const channel = chatClientVishal.channel('messaging', 'id');
    await channel.query();

    const { getByText, getByRole, getAllByRole } = render(
      <Chat client={chatClientVishal}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>,
    );
    await waitFor(() => {
      expect(getByRole('list')).toBeInTheDocument();
    });
  });
});
