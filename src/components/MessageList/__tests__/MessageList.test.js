import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  useMockedApis,
  getOrCreateChannelApi,
  generateChannel,
  generateMessage,
  generateMember,
  generateUser,
  dispatchMessageNewEvent,
  getTestClientWithUser,
} from '../../../mock-builders';

import { Chat } from '../../Chat';
import MessageList from '../MessageList';
import { Channel } from '../../Channel';

jest.mock('axios');

describe('MessageList', () => {
  afterEach(cleanup);

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

    chatClientVishal = await getTestClientWithUser({ id: 'vishal' });
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
      expect(getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
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
