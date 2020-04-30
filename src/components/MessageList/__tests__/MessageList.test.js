/* eslint-disable sonarjs/no-unused-collection */
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  getTestClient,
  useMockedApis,
  getOrCreateChannelApi,
  generateChannel,
  generateMessage,
  generateMember,
  generateUser,
  dispatchMessageNewEvent,
} from '../../../__mocks__';

import { Chat } from '../../Chat';
import MessageList from '../MessageList';
import { Channel } from '../../Channel';
import axios from 'axios';

// eslint-disable-next-line no-undef
afterEach(cleanup);

jest.mock('axios');

describe('MessageList', () => {
  let chatClientVishal;

  it('should add new message at bottom of the list', async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    const mockedChannel = generateChannel({
      messages: [
        generateMessage({ user: user1 }),
        generateMessage({ user: user1 }),
      ],
      members: [
        generateMember({ user: user1 }),
        generateMember({ user: user1 }),
      ],
    });

    useMockedApis(axios, [getOrCreateChannelApi(mockedChannel)]);

    chatClientVishal = await getTestClient({ id: 'vishal' });
    const channel = chatClientVishal.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByTestId, getByText } = render(
      <Chat client={chatClientVishal}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>,
    );
    await waitFor(() => {
      expect(getByTestId('message-list')).toBeInTheDocument();
    });

    const newMessage = generateMessage({ user: user2 });
    dispatchMessageNewEvent(
      chatClientVishal,
      newMessage,
      mockedChannel.channel,
    );

    await waitFor(() => {
      expect(getByText(newMessage.text)).toBeInTheDocument();
    });
  });
});
