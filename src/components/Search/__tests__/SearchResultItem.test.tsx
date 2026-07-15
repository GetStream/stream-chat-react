import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { SearchController } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import {
  ChannelSearchResultItem,
  MessageSearchResultItem,
  UserSearchResultItem,
} from '../SearchResults';
import { SearchContextProvider } from '../SearchContext';
import type { SearchContextValue } from '../SearchContext';
import {
  ChatProvider,
  DialogManagerProvider,
  TranslationProvider,
} from '../../../context';
import {
  generateChannel,
  generateMessage,
  generateUser,
  initChannelFromData,
  initClientWithChannels,
  mockTranslationContextValue,
} from '../../../mock-builders';

const CHANNEL_PREVIEW_BUTTON_TEST_ID = 'channel-list-item-button';

const mockOpenChannel = vi.fn();
const mockIngestChannel = vi.fn();
const mockOrchestrator = { ingestChannel: mockIngestChannel };
const directMessagingChannelType = 'X';

// Selection opens the channel in the workspace (one navigation model); the item's
// "active" highlight comes from isChannelActive (stubbed inactive here).
vi.mock('../../../context', async (importOriginal) => ({
  ...((await importOriginal()) as object),
  useWorkspaceNavigation: () => ({
    isChannelActive: () => false,
    openChannel: mockOpenChannel,
  }),
}));

const mockTranslation = (key: string, options?: Record<string, unknown>) => {
  const interpolated = Object.entries(options || {}).reduce(
    (value, [name, arg]) => value.replace(`{{ ${name} }}`, String(arg)),
    key,
  );

  return interpolated.startsWith('aria/')
    ? interpolated.replace('aria/', '')
    : interpolated;
};

const renderComponent = async ({
  activeChannel,
  channelSearchData,
  chatContext,
  customClient,
  itemProps,
  messageResponseData,
  SearchResultItemComponent,
  userData,
}: any) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels();
  let item: any;
  if (channelSearchData) {
    item = await initChannelFromData(
      fromPartial<Parameters<typeof initChannelFromData>[0]>({
        channelData: channelSearchData,
        client,
      }),
    );
  } else if (messageResponseData) {
    item = messageResponseData;
    await initChannelFromData(
      fromPartial<Parameters<typeof initChannelFromData>[0]>({
        channelData: messageResponseData,
        client,
      }),
    );
  } else if (userData) {
    item = userData;
  }

  render(
    <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
      <ChatProvider
        value={{
          channel: activeChannel ?? channel,
          channelPaginatorsOrchestrator: mockOrchestrator,
          client: customClient ?? client,
          ...chatContext,
        }}
      >
        <DialogManagerProvider>
          <SearchContextProvider
            value={fromPartial<SearchContextValue>({ directMessagingChannelType })}
          >
            <SearchResultItemComponent item={item} {...itemProps} />
          </SearchContextProvider>
        </DialogManagerProvider>
      </ChatProvider>
    </TranslationProvider>,
  );
};

describe('SearchResultItem Components', () => {
  describe('ChannelSearchResultItem', () => {
    const SearchResultItemComponent = ChannelSearchResultItem;

    afterEach(vi.clearAllMocks);

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

      expect(mockOpenChannel).toHaveBeenCalledTimes(1);
      expect(mockOpenChannel.mock.calls[0][0].id).toBe(channelSearchData.channel.id);
      expect(mockIngestChannel).toHaveBeenCalledTimes(1);
    });

    it('runs a custom onSelect instead of the default open', async () => {
      const channelSearchData = generateChannel();
      const onSelect = vi.fn();
      await renderComponent({
        channelSearchData,
        itemProps: { onSelect },
        SearchResultItemComponent,
      });

      fireEvent.click(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID));

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(mockOpenChannel).not.toHaveBeenCalled();
    });
  });

  describe('MessageSearchResultItem', () => {
    const SearchResultItemComponent = MessageSearchResultItem;

    afterEach(vi.clearAllMocks);

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
      expect(mockOpenChannel.mock.calls[0][0].id).toBe(messageResponseData.channel.id);
      expect(mockIngestChannel).toHaveBeenCalledTimes(1);
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

    afterEach(vi.clearAllMocks);

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
      expect(mockOpenChannel).toHaveBeenCalledTimes(1);
      expect(mockIngestChannel).toHaveBeenCalledTimes(1);
    });

    it('runs a custom onSelect instead of the default DM open', async () => {
      const onSelect = vi.fn();
      await renderComponent({
        itemProps: { onSelect },
        SearchResultItemComponent,
        userData: user,
      });

      await act(() => {
        fireEvent.click(screen.getByRole('option'));
      });
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(mockOpenChannel).not.toHaveBeenCalled();
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
