import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SearchController } from 'stream-chat';

import {
  ChannelSearchResultItem,
  MessageSearchResultItem,
  UserSearchResultItem,
} from '../SearchResults';
import { ChatView } from '../../../components/ChatView';
import { createLayoutController } from '../../../components/ChatView/layoutController/LayoutController';
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

const mockSetChannels = jest.fn().mockImplementation();
const directMessagingChannelType = 'X';

const renderComponent = async ({
  activeChannel,
  channelSearchData,
  chatContext,
  customClient,
  layoutController,
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
        ...chatContext,
      }}
    >
      <ChatView layoutController={layoutController}>
        <ChannelListContextProvider value={{ setChannels: mockSetChannels }}>
          <SearchContextProvider value={{ directMessagingChannelType }}>
            <SearchResultItemComponent item={item} />
          </SearchContextProvider>
        </ChannelListContextProvider>
      </ChatView>
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

    it('uses slot-bound active channel to set active state', async () => {
      const searchController = new SearchController();
      const message = generateMessage();
      const messageResponseData = generateChannel({ messages: [message] });
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      await initChannelFromData({
        channelData: messageResponseData,
        client,
      });

      const activeChannel = client.channel(
        messageResponseData.channel.type,
        messageResponseData.channel.id,
      );
      const layoutController = createLayoutController({
        initialState: { visibleSlots: ['slot1'] },
      });
      layoutController.openChannel(activeChannel);
      searchController._internalState.partialNext({
        focusedMessage: messageResponseData,
      });

      await renderComponent({
        chatContext: { searchController },
        customClient: client,
        layoutController,
        messageResponseData,
        SearchResultItemComponent,
      });

      expect(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID)).toHaveAttribute(
        'aria-selected',
        'true',
      );

      // keep channel from initClientWithChannels referenced for consistency with helper setup
      expect(channel).toBeDefined();
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
