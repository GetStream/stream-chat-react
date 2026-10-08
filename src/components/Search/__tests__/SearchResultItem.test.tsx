import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { fromPartial } from '@total-typescript/shoehorn';
import { ChannelWatchStatus } from 'stream-chat';
import type { StreamChat } from 'stream-chat';
import type { MockInstance } from 'vitest';

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
import { mockT } from '../../../mock-builders/translator';

const CHANNEL_PREVIEW_BUTTON_TEST_ID = 'channel-list-item-button';

const mockOpenChannel = vi.fn();
// the real channel manager of the rendered client, with its ingestion observed
let mockIngestChannel: MockInstance<StreamChat['channelManager']['ingestChannel']>;
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

const mockTranslation = mockT;

const renderComponent = async ({
  activeChannel,
  beforeRender,
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
  beforeRender?.(client);
  const renderedClient = customClient ?? client;
  mockIngestChannel = vi.spyOn(renderedClient.channelManager, 'ingestChannel');

  render(
    <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
      <ChatProvider
        value={{
          channel: activeChannel ?? channel,
          channelManager: renderedClient.channelManager,
          client: renderedClient,
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

  return { client };
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
      // The click event is forwarded so overrides can honor ⌘/ctrl-click.
      expect(mockOpenChannel.mock.calls[0][1]).toEqual(
        expect.objectContaining({ event: expect.anything() }),
      );
      expect(mockIngestChannel).toHaveBeenCalledTimes(1);
    });

    it('watches the opened channel when the search did not', async () => {
      const channelSearchData = generateChannel();
      const { client } = await renderComponent({
        channelSearchData,
        SearchResultItemComponent,
      });
      const channel = client.channelManager.get(channelSearchData.channel.cid);
      if (!channel) throw new Error('the result channel is not stored');
      channel.watchStatus = ChannelWatchStatus.NotWatching;
      const watch = vi.spyOn(channel, 'watch').mockResolvedValue(undefined as never);

      fireEvent.click(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID));

      expect(watch).toHaveBeenCalledTimes(1);
    });

    it('does not watch an opened channel that is already watched', async () => {
      const channelSearchData = generateChannel();
      const { client } = await renderComponent({
        channelSearchData,
        SearchResultItemComponent,
      });
      const channel = client.channelManager.get(channelSearchData.channel.cid);
      if (!channel) throw new Error('the result channel is not stored');
      channel.watchStatus = ChannelWatchStatus.Watching;
      const watch = vi.spyOn(channel, 'watch');

      fireEvent.click(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID));

      expect(watch).not.toHaveBeenCalled();
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
      const message = generateMessage();
      // A message search hit is the message itself, carrying the channel it was found in.
      const messageResponseData = {
        id: message.id,
        ...generateChannel({ messages: [message] }),
      };
      const { client } = await renderComponent({
        messageResponseData,
        SearchResultItemComponent,
      });
      const { id, type } = messageResponseData.channel;
      const jumpToMessage = vi
        .spyOn(
          client.channelManager.ensure({ id, type }).messagePaginator,
          'jumpToMessage',
        )
        .mockResolvedValue(true);

      await act(() => {
        fireEvent.click(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID));
      });

      // Selecting a result jumps its channel's own paginator — no separate focus state to keep in
      // step with the highlight the jump leaves behind — and watches the channel if it isn't yet.
      expect(jumpToMessage).toHaveBeenCalledWith(message.id, { watchChannel: true });
      expect(mockOpenChannel.mock.calls[0][0].id).toBe(messageResponseData.channel.id);
      expect(mockIngestChannel).toHaveBeenCalledTimes(1);
    });

    it('renders its stored channel without a connected user', async () => {
      const message = generateMessage();
      const messageResponseData = {
        id: message.id,
        ...generateChannel({ messages: [message] }),
      };
      await renderComponent({
        // creating a channel needs a connected user; looking a stored one up doesn't
        beforeRender: (client: StreamChat) =>
          vi.spyOn(client, 'userId', 'get').mockReturnValue(undefined),
        messageResponseData,
        SearchResultItemComponent,
      });

      expect(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID)).toBeInTheDocument();
    });

    it('renders nothing for a message whose channel is not stored', async () => {
      const { client } = await renderComponent({
        messageResponseData: { id: 'orphan', text: 'orphan' },
        SearchResultItemComponent,
      });
      const ensure = vi.spyOn(client.channelManager, 'ensure');

      expect(
        screen.queryByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID),
      ).not.toBeInTheDocument();
      expect(ensure).not.toHaveBeenCalled();
      expect(client.channelManager.get('unknown:unknown')).toBeUndefined();
    });

    it('stops showing a result whose channel ends', async () => {
      const message = generateMessage();
      const messageResponseData = {
        id: message.id,
        ...generateChannel({ messages: [message] }),
      };
      const { client } = await renderComponent({
        messageResponseData,
        SearchResultItemComponent,
      });
      const { cid } = messageResponseData.channel;
      expect(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID)).toBeInTheDocument();

      act(() => {
        client.dispatchEvent({ cid, type: 'channel.deleted' } as never);
      });

      expect(client.channelManager.get(cid)).toBeUndefined();
      expect(
        screen.queryByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID),
      ).not.toBeInTheDocument();
    });

    it('does nothing when its channel is gone by the time it is clicked', async () => {
      const message = generateMessage();
      const messageResponseData = {
        id: message.id,
        ...generateChannel({ messages: [message] }),
      };
      const { client } = await renderComponent({
        messageResponseData,
        SearchResultItemComponent,
      });
      const channel = client.channelManager.get(messageResponseData.channel.cid);
      if (!channel) throw new Error('the result channel is not stored');
      const jumpToMessage = vi.spyOn(channel.messagePaginator, 'jumpToMessage');
      // removed from the store without a render of this row in between
      vi.spyOn(client.channelManager, 'get').mockReturnValue(undefined);

      fireEvent.click(screen.getByTestId(CHANNEL_PREVIEW_BUTTON_TEST_ID));

      expect(mockOpenChannel).not.toHaveBeenCalled();
      expect(mockIngestChannel).not.toHaveBeenCalled();
      expect(jumpToMessage).not.toHaveBeenCalled();
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
      // `generateUser` always sets a name, but `UserResponse.name` is optional in v10 types
      expect(screen.getByText(String(user.name))).toBeInTheDocument();
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
