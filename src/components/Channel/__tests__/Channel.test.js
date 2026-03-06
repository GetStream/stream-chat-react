import React from 'react';
import { SearchController } from 'stream-chat';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Channel } from '../Channel';

import { ChatProvider, useChannel } from '../../../context';
import { WithComponents } from '../../../context/WithComponents';
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';
import { DEFAULT_HIGHLIGHT_DURATION } from '../../../constants/limits';

jest.mock('../../Loading', () => ({
  LoadingChannel: jest.fn(() => <div>Loading channel</div>),
  LoadingErrorIndicator: jest.fn(({ error }) => (
    <div data-testid='loading-error'>{error?.message || 'error'}</div>
  )),
  LoadingIndicator: jest.fn(() => <div data-testid='loading-indicator'>loading</div>),
}));

const LoadingIndicator = () => <div data-testid='loading-indicator'>loading</div>;
const LoadingErrorIndicator = ({ error }) => (
  <div data-testid='loading-error'>{error?.message || 'error'}</div>
);

const createChannelsQueryState = (overrides = {}) => ({
  error: null,
  queryInProgress: null,
  setError: jest.fn(),
  setQueryInProgress: jest.fn(),
  ...overrides,
});

const createChatContextValue = ({
  channelsQueryState,
  client,
  searchController,
} = {}) => {
  const resolvedClient = client;
  return {
    channelsQueryState: channelsQueryState || createChannelsQueryState(),
    client: resolvedClient,
    getAppSettings: () => null,
    latestMessageDatesByChannels: {},
    openMobileNav: jest.fn(),
    searchController:
      searchController || new SearchController({ client: resolvedClient }),
    theme: 'str-chat__theme-light',
    useImageFlagEmojisOnWindows: false,
  };
};

const renderChannel = ({
  channel,
  channelProps,
  chatContext,
  children,
  componentOverrides,
}) =>
  render(
    <WithComponents
      overrides={{
        LoadingErrorIndicator,
        LoadingIndicator,
        ...componentOverrides,
      }}
    >
      <ChatProvider value={chatContext}>
        <Channel channel={channel} {...channelProps}>
          {children}
        </Channel>
      </ChatProvider>
    </WithComponents>,
  );

const initClient = async ({
  channelId = 'channel-id',
  channelType = 'messaging',
  user,
}) => {
  const members = [generateMember({ user })];
  const mockedChannel = generateChannel({
    channel: {
      id: channelId,
      type: channelType,
    },
    members,
    messages: [generateMessage()],
  });

  const client = await getTestClientWithUser(user);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]);
  const channel = client.channel(channelType, mockedChannel.channel.id);

  return { channel, client };
};

describe('Channel', () => {
  const user = generateUser({ id: 'user-id' });

  it('renders EmptyPlaceholder when channel is not provided', async () => {
    const { client } = await initClient({ user });
    const chatContext = createChatContextValue({ client });

    renderChannel({
      channel: undefined,
      channelProps: {
        EmptyPlaceholder: <div data-testid='empty-placeholder'>No channel</div>,
      },
      chatContext,
    });

    expect(screen.getByTestId('empty-placeholder')).toBeInTheDocument();
  });

  it('renders loading indicator while channels query is in reload state', async () => {
    const { channel, client } = await initClient({ user });
    const chatContext = createChatContextValue({
      channelsQueryState: createChannelsQueryState({ queryInProgress: 'reload' }),
      client,
    });

    renderChannel({ channel, chatContext });

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('renders loading error indicator when channels query has error', async () => {
    const { channel, client } = await initClient({ user });
    const chatContext = createChatContextValue({
      channelsQueryState: createChannelsQueryState({
        error: new Error('channels query failed'),
      }),
      client,
    });

    renderChannel({ channel, chatContext });

    expect(screen.getByTestId('loading-error')).toHaveTextContent(
      'channels query failed',
    );
  });

  it('bootstraps an uninitialized channel and applies query options', async () => {
    const { channel, client } = await initClient({ user });
    const chatContext = createChatContextValue({ client });
    const watchPromise = new Promise(() => {});
    const watchSpy = jest.spyOn(channel, 'watch').mockReturnValue(watchPromise);

    renderChannel({
      channel,
      channelProps: {
        channelQueryOptions: { messages: { limit: 5 } },
      },
      chatContext,
    });

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    await waitFor(() =>
      expect(watchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ messages: { limit: 5 } }),
      ),
    );
  });

  it('shows bootstrap error indicator when channel initialization fails', async () => {
    const { channel, client } = await initClient({ user });
    const chatContext = createChatContextValue({ client });

    jest.spyOn(channel, 'watch').mockRejectedValueOnce(new Error('watch failed'));

    renderChannel({ channel, chatContext });

    await waitFor(() =>
      expect(screen.getByTestId('loading-error')).toHaveTextContent('watch failed'),
    );
  });

  it('does not initialize channel when initializeOnMount is false', async () => {
    const { channel, client } = await initClient({ user });
    channel.initialized = false;
    const chatContext = createChatContextValue({ client });
    const watchSpy = jest.spyOn(channel, 'watch');

    renderChannel({
      channel,
      channelProps: { initializeOnMount: false },
      chatContext,
      children: <div data-testid='channel-content'>content</div>,
    });

    expect(watchSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('channel-content')).toBeInTheDocument();
  });

  it('marks channel as read on mount when enabled and unread exists', async () => {
    const { channel, client } = await initClient({ user });
    channel.initialized = true;
    client.configsStore.next({
      configs: {
        [channel.cid]: { read_events: true },
      },
    });
    const chatContext = createChatContextValue({ client });

    jest.spyOn(channel, 'countUnread').mockReturnValue(1);
    const markReadSpy = jest.spyOn(channel, 'markRead').mockResolvedValue({
      event: { last_read_message_id: 'last-read-id' },
    });

    renderChannel({ channel, chatContext });

    await waitFor(() => expect(markReadSpy).toHaveBeenCalledTimes(1));
  });

  it('does not mark channel as read on mount when markReadOnMount is false', async () => {
    const { channel, client } = await initClient({ user });
    channel.initialized = true;
    client.configsStore.next({
      configs: {
        [channel.cid]: { read_events: true },
      },
    });
    const chatContext = createChatContextValue({ client });

    jest.spyOn(channel, 'countUnread').mockReturnValue(1);
    const markReadSpy = jest.spyOn(channel, 'markRead');

    renderChannel({
      channel,
      channelProps: { markReadOnMount: false },
      chatContext,
    });

    await waitFor(() => expect(markReadSpy).not.toHaveBeenCalled());
  });

  it('passes own read timestamp to countUnread on mount', async () => {
    const { channel, client } = await initClient({ user });
    channel.initialized = true;
    client.configsStore.next({
      configs: {
        [channel.cid]: { read_events: true },
      },
    });
    const chatContext = createChatContextValue({ client });
    const lastReadIso = '2026-03-01T10:20:30.000Z';
    channel.state.read[client.userID] = {
      ...channel.state.read[client.userID],
      last_read: lastReadIso,
      user,
    };
    const countUnreadSpy = jest.spyOn(channel, 'countUnread').mockReturnValue(0);

    renderChannel({ channel, chatContext });

    await waitFor(() => expect(countUnreadSpy).toHaveBeenCalledTimes(1));
    const passedLastReadAt = countUnreadSpy.mock.calls[0]?.[0];
    expect(passedLastReadAt).toEqual(new Date(lastReadIso));
  });

  it('registers and unregisters event listeners on mount/unmount', async () => {
    const { channel, client } = await initClient({ user });
    channel.initialized = true;
    const chatContext = createChatContextValue({ client });

    const clientOnSpy = jest.spyOn(client, 'on');
    const clientOffSpy = jest.spyOn(client, 'off');
    const channelOnSpy = jest.spyOn(channel, 'on');
    const channelOffSpy = jest.spyOn(channel, 'off');

    const view = renderChannel({ channel, chatContext });

    await waitFor(() => {
      expect(clientOnSpy).toHaveBeenCalledWith(
        'connection.changed',
        expect.any(Function),
      );
      expect(clientOnSpy).toHaveBeenCalledWith(
        'connection.recovered',
        expect.any(Function),
      );
      expect(clientOnSpy).toHaveBeenCalledWith('user.updated', expect.any(Function));
      expect(clientOnSpy).toHaveBeenCalledWith('user.deleted', expect.any(Function));
      expect(clientOnSpy).toHaveBeenCalledWith(
        'user.messages.deleted',
        expect.any(Function),
      );
      expect(channelOnSpy).toHaveBeenCalledWith(expect.any(Function));
    });

    view.unmount();

    expect(channelOffSpy).toHaveBeenCalledWith(expect.any(Function));
    expect(clientOffSpy).toHaveBeenCalledWith('connection.changed', expect.any(Function));
    expect(clientOffSpy).toHaveBeenCalledWith(
      'connection.recovered',
      expect.any(Function),
    );
    expect(clientOffSpy).toHaveBeenCalledWith('user.deleted', expect.any(Function));
  });

  it('uses channelQueryOptions prop when refetching on user.deleted event', async () => {
    const { channel, client } = await initClient({ user });
    channel.initialized = true;
    const chatContext = createChatContextValue({ client });
    const clientOnSpy = jest.spyOn(client, 'on');
    const querySpy = jest.spyOn(channel, 'query').mockResolvedValue({});
    const oldestId = channel.state.messages[0]?.id;
    const channelQueryOptions = {
      members: { limit: 15 },
      messages: { limit: 7 },
      state: true,
      watchers: { limit: 3 },
    };

    renderChannel({
      channel,
      channelProps: { channelQueryOptions },
      chatContext,
    });

    await waitFor(() =>
      expect(clientOnSpy).toHaveBeenCalledWith('user.deleted', expect.any(Function)),
    );
    const userDeletedHandler = clientOnSpy.mock.calls.find(
      (call) => call[0] === 'user.deleted',
    )?.[1];
    expect(userDeletedHandler).toEqual(expect.any(Function));

    await act(async () => {
      await userDeletedHandler({ type: 'user.deleted' });
    });

    expect(querySpy).toHaveBeenCalledWith({
      ...channelQueryOptions,
      messages: {
        ...channelQueryOptions.messages,
        id_lt: oldestId,
        limit: channelQueryOptions.messages.limit,
      },
      watchers: channelQueryOptions.watchers,
    });
  });

  it('jumps to focused message from search and clears the focus after ttl', async () => {
    jest.useFakeTimers();

    const { channel, client } = await initClient({ user });
    channel.initialized = true;
    const searchController = new SearchController({ client });
    const chatContext = createChatContextValue({ client, searchController });
    const jumpToMessageSpy = jest
      .spyOn(channel.messagePaginator, 'jumpToMessage')
      .mockResolvedValue(true);

    searchController._internalState.partialNext({
      focusedMessage: { id: 'focused-message-id' },
    });

    renderChannel({ channel, chatContext });

    await waitFor(() =>
      expect(jumpToMessageSpy).toHaveBeenCalledWith('focused-message-id', {
        focusReason: 'jump-to-message',
        focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(DEFAULT_HIGHLIGHT_DURATION);
    });

    expect(
      searchController._internalState.getLatestValue().focusedMessage,
    ).toBeUndefined();

    jest.useRealTimers();
  });

  it('renders Channel Missing when channel.watch is not available', async () => {
    const { channel, client } = await initClient({ user });
    channel.initialized = true;
    channel.watch = undefined;
    const chatContext = createChatContextValue({ client });

    renderChannel({ channel, chatContext });

    expect(screen.getByText('Channel Missing')).toBeInTheDocument();
  });

  it('provides channel instance via ChannelInstanceProvider', async () => {
    const { channel, client } = await initClient({ user });
    channel.initialized = true;
    const chatContext = createChatContextValue({ client });

    const TestChild = () => {
      const providedChannel = useChannel();
      return <div data-testid='provided-cid'>{providedChannel.cid}</div>;
    };

    renderChannel({ channel, chatContext, children: <TestChild /> });

    expect(screen.getByTestId('provided-cid')).toHaveTextContent(channel.cid);
  });

  it('registers custom request handlers through channel config state', async () => {
    const { channel, client } = await initClient({ user });
    channel.initialized = true;
    const chatContext = createChatContextValue({ client });

    const doDeleteMessageRequest = jest.fn();
    const doMarkReadRequest = jest.fn();
    const doSendMessageRequest = jest.fn();
    const doUpdateMessageRequest = jest.fn();

    renderChannel({
      channel,
      channelProps: {
        doDeleteMessageRequest,
        doMarkReadRequest,
        doSendMessageRequest,
        doUpdateMessageRequest,
      },
      chatContext,
    });

    await waitFor(() => {
      const requestHandlers = channel.configState.getLatestValue().requestHandlers;
      expect(requestHandlers.deleteMessageRequest).toEqual(expect.any(Function));
      expect(requestHandlers.markReadRequest).toEqual(expect.any(Function));
      expect(requestHandlers.retrySendMessageRequest).toEqual(expect.any(Function));
      expect(requestHandlers.sendMessageRequest).toEqual(expect.any(Function));
      expect(requestHandlers.updateMessageRequest).toEqual(expect.any(Function));
    });
  });
});
