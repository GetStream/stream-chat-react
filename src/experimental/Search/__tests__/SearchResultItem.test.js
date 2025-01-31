import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SearchController } from 'stream-chat';

import {
  ChannelSearchResultItem,
  MessageSearchResultItem,
  UserSearchResultItem,
} from '../SearchResults';
import { SearchContextProvider } from '../SearchContext';
import { ChannelListContextProvider, ChatProvider } from '../../../context';
import {
  generateChannel,
  generateMessage,
  generateUser,
  initChannelFromData,
  initClientWithChannels,
} from '../../../mock-builders';

const CHANNEL_PREVIEW_BUTTON_TEST_ID = 'channel-preview-button';

const mockSetActiveChannel = jest.fn().mockImplementation();
const mockSetChannels = jest.fn().mockImplementation();
const directMessagingChannelType = 'X';

const renderComponent = async ({
  activeChannel,
  channelSearchData,
  chatContext,
  customClient,
  messageResponseData,
  SearchResultItemComponent,
  userData,
}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels();
  let item;
  if (channelSearchData) {
    item = await initChannelFromData({
      channelData: channelSearchData,
      client,
    });
  } else if (messageResponseData) {
    item = messageResponseData;
    await initChannelFromData({
      channelData: messageResponseData,
      client,
    });
  } else if (userData) {
    item = userData;
  }

  render(
    <ChatProvider
      value={{
        channel: activeChannel ?? channel,
        client: customClient ?? client,
        setActiveChannel: mockSetActiveChannel,
        ...chatContext,
      }}
    >
      <ChannelListContextProvider value={{ setChannels: mockSetChannels }}>
        <SearchContextProvider value={{ directMessagingChannelType }}>
          <SearchResultItemComponent item={item} />
        </SearchContextProvider>
      </ChannelListContextProvider>
    </ChatProvider>,
  );
};

describe('SearchResultItem Components', () => {
  describe('ChannelSearchResultItem', () => {
    const SearchResultItemComponent = ChannelSearchResultItem;

    afterEach(jest.clearAllMocks);

    it('renders channel preview', async () => {
      await renderComponent({
        channelSearchData: generateChannel(),
        SearchResultItemComponent,
      });

      expect(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID)).toBeInTheDocument();
    });

    it('handles channel selection', async () => {
      const channelSearchData = generateChannel();
      await renderComponent({ channelSearchData, SearchResultItemComponent });

      fireEvent.click(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID));

      expect(mockSetActiveChannel.mock.calls[0][0].id).toBe(channelSearchData.channel.id);
      expect(mockSetChannels).toHaveBeenCalledTimes(1);
    });
  });

  describe('MessageSearchResultItem', () => {
    const SearchResultItemComponent = MessageSearchResultItem;

    afterEach(jest.clearAllMocks);

    it('renders message preview', async () => {
      await renderComponent({
        messageResponseData: generateChannel(),
        SearchResultItemComponent,
      });

      expect(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID)).toBeInTheDocument();
    });

    it('handles message selection', async () => {
      const searchController = new SearchController();
      const message = generateMessage();
      const messageResponseData = generateChannel({ messages: [message] });
      await renderComponent({
        chatContext: { searchController },
        messageResponseData,
        SearchResultItemComponent,
      });

      await act(() => {
        fireEvent.click(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID));
      });

      expect(
        searchController._internalState.getLatestValue().focusedMessage,
      ).toStrictEqual(messageResponseData);
      expect(mockSetActiveChannel.mock.calls[0][0].id).toBe(
        messageResponseData.channel.id,
      );
      expect(mockSetChannels).toHaveBeenCalledTimes(1);
    });

    it('displays message text in preview', async () => {
      const message = generateMessage();
      const messageResponseData = {
        text: message.text,
        ...generateChannel({ messages: [message] }),
      };
      await renderComponent({
        messageResponseData,
        SearchResultItemComponent,
      });

      expect(screen.getByText(message.text)).toBeInTheDocument();
    });
  });

  describe('UserSearchResultItem', () => {
    const SearchResultItemComponent = UserSearchResultItem;
    const user = generateUser();

    afterEach(jest.clearAllMocks);

    it('renders user avatar and name', async () => {
      await renderComponent({ SearchResultItemComponent, userData: user });

      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(screen.getByText(user.name)).toBeInTheDocument();
    });

    it('handles user selection', async () => {
      await renderComponent({ SearchResultItemComponent, userData: user });

      await act(() => {
        fireEvent.click(screen.getByRole('option'));
      });
      expect(mockSetChannels).toHaveBeenCalledTimes(1);
    });

    it('uses user id when name is not available', async () => {
      const userWithoutName = {
        id: 'user-123',
        image: 'user-image.jpg',
      };

      await renderComponent({ SearchResultItemComponent, userData: userWithoutName });

      expect(screen.getByText(userWithoutName.id)).toBeInTheDocument();
    });

    it('has correct accessibility attributes', async () => {
      await renderComponent({ SearchResultItemComponent, userData: user });

      const button = screen.getByRole('option');
      expect(button).toHaveAttribute('aria-label', `Select User Channel: ${user.name}`);
    });
  });
});
