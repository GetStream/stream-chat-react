import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChannelSearch } from '../ChannelSearch';
import {
  generateChannel,
  generateUser,
  getTestClientWithUser,
  queryUsersApi,
  useMockedApis,
} from '../../../mock-builders';
import { ChatProvider } from '../../../context';

let chatClient;
const user = generateUser({ id: 'id', name: 'name' });
const channelResponseData = generateChannel();

const DEFAULT_DEBOUNCE_INTERVAL = 300;
const TEST_ID = {
  CHANNEL_SEARCH: 'channel-search',
  CHANNEL_SEARCH_RESULTS_HEADER: 'channel-search-results-header',
  CLEAR_INPUT_BUTTON: 'clear-input-button',
  SEARCH_IN_PROGRESS_INDICATOR: 'search-in-progress-indicator',
  SEARCH_INPUT: 'search-input',
};
const typedText = 'abc';

const renderSearch = async ({ client, props } = { props: {} }) => {
  chatClient = client || (await getTestClientWithUser(user));

  const renderResult = await act(() => {
    render(
      <ChatProvider value={{ client: chatClient }}>
        <ChannelSearch {...props} />
      </ChatProvider>,
    );
  });

  const channelSearch = await waitFor(() => screen.getByTestId(TEST_ID.CHANNEL_SEARCH));
  const searchInput = await waitFor(() => screen.getByTestId(TEST_ID.SEARCH_INPUT));

  const typeText = (text) => {
    fireEvent.change(searchInput, { target: { value: text } });
  };
  return { ...renderResult, channelSearch, chatClient, searchInput, typeText };
};

describe('ChannelSearch', () => {
  afterEach(cleanup);

  it('should render component without any props', async () => {
    const { channelSearch } = await renderSearch();

    expect(channelSearch).toMatchSnapshot();
  });

  it('displays custom placeholder', async () => {
    const placeholder = 'Custom placeholder';
    const { channelSearch } = await renderSearch({ props: { placeholder } });
    expect(channelSearch).toMatchSnapshot();
  });

  it('updates search query value upon each stroke', async () => {
    const { searchInput, typeText } = await renderSearch();
    await act(() => {
      typeText(typedText);
    });

    await waitFor(() => {
      expect(searchInput).toHaveValue(typedText);
    });
  });

  it('does not update input search query value when disabled', async () => {
    const { searchInput, typeText } = await renderSearch({ props: { disabled: true } });
    await act(() => {
      typeText(typedText);
    });

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('starts with "searching" flag disabled', async () => {
    await renderSearch();
    expect(
      screen.queryByTestId(TEST_ID.SEARCH_IN_PROGRESS_INDICATOR),
    ).not.toBeInTheDocument();
  });

  it('sets "searching" flag on first typing stroke', async () => {
    const { typeText } = await renderSearch();
    await act(() => {
      typeText(typedText);
    });
    expect(
      screen.queryByTestId(TEST_ID.SEARCH_IN_PROGRESS_INDICATOR),
    ).toBeInTheDocument();
  });

  it('removes "searching" flag upon deleting the last character', async () => {
    const { typeText } = await renderSearch();
    await act(() => {
      typeText(typedText);
    });
    expect(
      screen.queryByTestId(TEST_ID.SEARCH_IN_PROGRESS_INDICATOR),
    ).toBeInTheDocument();
    await act(() => {
      typeText('');
    });
    expect(
      screen.queryByTestId(TEST_ID.SEARCH_IN_PROGRESS_INDICATOR),
    ).not.toBeInTheDocument();
  });

  it('removes "searching" flag upon setting search results', async () => {
    jest.useFakeTimers();
    const client = await getTestClientWithUser(user);
    useMockedApis(client, [queryUsersApi([user])]);
    const { typeText } = await renderSearch({ client });
    await act(() => {
      typeText(typedText);
    });
    expect(
      screen.queryByTestId(TEST_ID.SEARCH_IN_PROGRESS_INDICATOR),
    ).toBeInTheDocument();

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId(TEST_ID.SEARCH_IN_PROGRESS_INDICATOR),
      ).not.toBeInTheDocument();
    });
    jest.useRealTimers();
  });

  it('search is performed by default on users and not channels', async () => {
    const limit = 8;
    const otherUsers = Array.from({ length: limit }, generateUser);
    jest.useFakeTimers('modern');
    const client = await getTestClientWithUser(user);
    jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [...otherUsers, user] });
    jest.spyOn(client, 'queryChannels').mockImplementation();
    const { typeText } = await renderSearch({ client });
    await act(() => {
      typeText(typedText);
    });

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(client.queryUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: [
          { id: { $autocomplete: typedText } },
          { name: { $autocomplete: typedText } },
        ],
      }),
      { id: 1 },
      { limit },
    );
    expect(client.queryUsers).toHaveBeenCalledTimes(1);
    expect(client.queryChannels).not.toHaveBeenCalled();
    otherUsers.forEach((user) => {
      expect(screen.queryByText(user.name)).toBeInTheDocument();
    });
    expect(screen.queryByText(user.name)).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('search is performed on users and channels if enabled', async () => {
    const limit = 8;
    const otherUsers = Array.from({ length: limit }, generateUser);
    jest.useFakeTimers('modern');
    const client = await getTestClientWithUser(user);
    jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [...otherUsers, user] });
    jest.spyOn(client, 'queryChannels').mockResolvedValue([channelResponseData]);

    const { typeText } = await renderSearch({
      client,
      props: { searchForChannels: true },
    });
    await act(() => {
      typeText(typedText);
    });

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(client.queryUsers).toHaveBeenCalledTimes(1);
    expect(client.queryChannels).toHaveBeenCalledTimes(1);
    otherUsers.forEach((user) => {
      expect(screen.queryByText(user.name)).toBeInTheDocument();
    });
    expect(screen.queryByText(user.name)).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('search is performed on channels only', async () => {
    const limit = 8;
    const otherUsers = Array.from({ length: limit }, generateUser);
    jest.useFakeTimers('modern');
    const client = await getTestClientWithUser(user);
    jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [...otherUsers, user] });
    jest.spyOn(client, 'queryChannels').mockResolvedValue([channelResponseData]);

    const { typeText } = await renderSearch({
      client,
      props: { searchForChannels: true, searchForUsers: false },
    });
    await act(() => {
      typeText(typedText);
    });

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(client.queryUsers).not.toHaveBeenCalled();
    expect(client.queryChannels).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('search is not performed on channels neither users', async () => {
    const limit = 8;
    const otherUsers = Array.from({ length: limit }, generateUser);
    jest.useFakeTimers('modern');
    const client = await getTestClientWithUser(user);
    jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [...otherUsers, user] });
    jest.spyOn(client, 'queryChannels').mockResolvedValue([channelResponseData]);

    const { typeText } = await renderSearch({
      client,
      props: { searchForChannels: false, searchForUsers: false },
    });
    await act(() => {
      typeText(typedText);
    });

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(client.queryUsers).not.toHaveBeenCalled();
    expect(client.queryChannels).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('does not perform search queries when the search is disabled', async () => {
    jest.useFakeTimers('modern');
    const client = await getTestClientWithUser(user);
    jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [user] });
    jest.spyOn(client, 'queryChannels').mockImplementation();
    const { typeText } = await renderSearch({ client, props: { disabled: true } });
    await act(() => {
      typeText(typedText);
    });

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(client.queryUsers).not.toHaveBeenCalled();
    expect(client.queryChannels).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('ignores the queries in progress upon clearing the input', async () => {
    jest.useFakeTimers('modern');
    const client = await getTestClientWithUser(user);
    jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [user] });

    const { typeText } = await renderSearch({ client });
    await act(() => {
      typeText(typedText);
    });

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_INTERVAL);
    });

    await act(() => {
      fireEvent.click(screen.getByTestId(TEST_ID.CLEAR_INPUT_BUTTON));
    });

    expect(client.queryUsers).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByTestId(TEST_ID.CHANNEL_SEARCH_RESULTS_HEADER),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(TEST_ID.SEARCH_IN_PROGRESS_INDICATOR),
    ).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('ignores the queries in progress upon deleting the last character', async () => {
    jest.useFakeTimers('modern');
    const client = await getTestClientWithUser(user);
    jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [user] });

    const { typeText } = await renderSearch({ client });
    await act(() => {
      typeText(typedText);
    });

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_INTERVAL);
    });

    await act(() => {
      typeText('');
    });

    expect(client.queryUsers).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByTestId(TEST_ID.CHANNEL_SEARCH_RESULTS_HEADER),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(TEST_ID.SEARCH_IN_PROGRESS_INDICATOR),
    ).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('debounces the queries upon typing', async () => {
    jest.useFakeTimers('modern');
    const textToQuery = 'x';
    const client = await getTestClientWithUser(user);
    jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [user] });

    const { typeText } = await renderSearch({ client });
    await act(() => {
      typeText(typedText);
    });

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_INTERVAL - 1);
    });

    expect(client.queryUsers).not.toHaveBeenCalled();

    await act(() => {
      typeText(textToQuery);
    });

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_INTERVAL);
    });

    expect(client.queryUsers).toHaveBeenCalledTimes(1);
    expect(client.queryUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: [
          { id: { $autocomplete: textToQuery } },
          { name: { $autocomplete: textToQuery } },
        ],
      }),
      { id: 1 },
      { limit: 8 },
    );
    jest.useRealTimers();
  });

  it('allows to configure the search query debounce interval', async () => {
    jest.useFakeTimers('modern');
    const textToQuery = 'x';
    const newDebounceInterval = DEFAULT_DEBOUNCE_INTERVAL - 100;
    const client = await getTestClientWithUser(user);
    jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [user] });

    const { typeText } = await renderSearch({
      client,
      props: { searchDebounceIntervalMs: newDebounceInterval },
    });
    await act(() => {
      typeText(typedText);
    });

    await act(() => {
      jest.advanceTimersByTime(newDebounceInterval - 1);
    });

    expect(client.queryUsers).not.toHaveBeenCalled();

    await act(() => {
      typeText(textToQuery);
    });

    await act(() => {
      jest.advanceTimersByTime(newDebounceInterval);
    });

    expect(client.queryUsers).toHaveBeenCalledTimes(1);
    expect(client.queryUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: [
          { id: { $autocomplete: textToQuery } },
          { name: { $autocomplete: textToQuery } },
        ],
      }),
      { id: 1 },
      { limit: 8 },
    );
    jest.useRealTimers();
  });

  it('calls custom search function instead of the default', async () => {
    jest.useFakeTimers('modern');
    const searchFunction = jest.fn();
    const client = await getTestClientWithUser(user);
    jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [user] });
    const { typeText } = await renderSearch({ client, props: { searchFunction } });
    await act(() => {
      typeText(typedText);
    });

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_INTERVAL);
    });

    expect(client.queryUsers).not.toHaveBeenCalled();
    expect(searchFunction).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('calls custom onSearch callback', async () => {
    jest.useFakeTimers('modern');
    const onSearch = jest.fn();
    const client = await getTestClientWithUser(user);
    jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [user] });
    const { typeText } = await renderSearch({ client, props: { onSearch } });
    await act(() => {
      typeText(typedText);
    });

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_INTERVAL);
    });

    expect(client.queryUsers).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
