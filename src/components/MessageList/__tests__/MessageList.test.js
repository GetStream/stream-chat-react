import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  dispatchMessageNewEvent,
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

import { Chat } from '../../Chat';
import { MessageList } from '../MessageList';
import { Channel } from '../../Channel';

describe('MessageList', () => {
  afterEach(cleanup);

  let chatClient;

  it('should add new message at bottom of the list', async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    const mockedChannel = generateChannel({
      members: [generateMember({ user: user1 }), generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 }), generateMessage({ user: user1 })],
    });

    chatClient = await getTestClientWithUser({ id: 'vishal' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByTestId, getByText } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>,
    );
    await waitFor(() => {
      expect(getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
    });

    const newMessage = generateMessage({ user: user2 });
    act(() => dispatchMessageNewEvent(chatClient, newMessage, mockedChannel.channel));

    await waitFor(() => {
      expect(getByText(newMessage.text)).toBeInTheDocument();
    });
  });

  it('Message UI components should render `Avatar` when the custom prop is provided', async () => {
    const user1 = generateUser();
    const user2 = generateUser();
    const mockedChannel = generateChannel({
      members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
      messages: [generateMessage({ user: user1 })],
    });

    chatClient = await getTestClientWithUser({ id: 'vishal' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <Channel Avatar={() => <div data-testid='custom-avatar'>Avatar</div>} channel={channel}>
          <MessageList />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
      expect(getByTestId('custom-avatar')).toBeInTheDocument();
    });
  });
});
