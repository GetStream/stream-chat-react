import React, { useEffect } from 'react';
import { nanoid } from 'nanoid';
import { SearchController } from 'stream-chat';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';

import {
  dispatchChannelDeletedEvent,
  dispatchChannelHiddenEvent,
  dispatchChannelTruncatedEvent,
  dispatchChannelUpdatedEvent,
  dispatchChannelVisibleEvent,
  dispatchConnectionRecoveredEvent,
  dispatchMessageNewEvent,
  dispatchNotificationAddedToChannelEvent,
  dispatchNotificationMessageNewEvent,
  dispatchNotificationRemovedFromChannel,
  erroredPostApi,
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  initClientWithChannels,
  mockTranslationContext,
  queryChannelsApi,
  queryUsersApi,
  useMockedApis,
} from '../../../mock-builders';

import { Chat } from '../../Chat';
import { ChannelList } from '../ChannelList';
import {
  ChannelPreviewCompact,
  ChannelPreviewLastMessage,
  ChannelPreviewMessenger,
} from '../../ChannelPreview';

import {
  ChatContext,
  TranslationContext,
  useChannelListContext,
  useChatContext,
  WithComponents,
} from '../../../context';
import { ChannelListMessenger } from '../ChannelListMessenger';

expect.extend(toHaveNoViolations);

const channelsQueryStateMock = {
  error: null,
  queryInProgress: null,
  setError: jest.fn(),
  setQueryInProgress: jest.fn(),
};

/**
 * We use the following custom UI components for preview and list.
 * If we use ChannelPreviewMessenger or ChannelPreviewLastMessage here, then changes
 * to those components might end up breaking tests for ChannelList, which will be quite painful
 * to debug then.
 */
const ChannelPreviewComponent = ({
  channel,
  channelUpdateCount,
  latestMessagePreview,
}) => (
  <div data-testid={channel.id} role='listitem'>
    <div data-testid='channelUpdateCount'>{channelUpdateCount}</div>
    <div>{channel.data.name}</div>
    <div>{latestMessagePreview}</div>
  </div>
);

const ChannelListComponent = (props) => {
  const { error, loading } = props;
  if (error) {
    return <div data-testid='error-indicator' />;
  }

  if (loading) {
    return <div data-testid='loading-indicator' />;
  }

  return <div role='list'>{props.children}</div>;
};
const ROLE_LIST_ITEM_SELECTOR = '[role="listitem"]';
const SEARCH_RESULT_LIST_SELECTOR = '.str-chat__channel-search-result-list';
const CHANNEL_LIST_SELECTOR = '.str-chat__channel-list-messenger';

describe('ChannelList', () => {
  let chatClient;
  let testChannel1;
  let testChannel2;
  let testChannel3;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser({ id: 'uthred' });
    testChannel1 = generateChannel();
    testChannel2 = generateChannel();
    testChannel3 = generateChannel();
  });

  afterEach(cleanup);

  describe('mobile navigation', () => {
    let closeMobileNav;
    let props;
    beforeEach(() => {
      closeMobileNav = jest.fn();
      props = {
        closeMobileNav,
        filters: {},
        List: ChannelListComponent,
        Preview: ChannelPreviewComponent,
      };
      useMockedApis(chatClient, [queryChannelsApi([])]);
    });
    it('should call `closeMobileNav` prop function, when clicked outside ChannelList', async () => {
      const { container, getByRole, getByTestId } = await render(
        <ChatContext.Provider
          value={{
            channelsQueryState: channelsQueryStateMock,
            client: chatClient,
            closeMobileNav,
            navOpen: true,
            searchController: new SearchController(),
          }}
        >
          <ChannelList {...props} />
          <div data-testid='outside-channellist' />
        </ChatContext.Provider>,
      );
      // Wait for list of channels to load in DOM.
      await waitFor(() => {
        expect(getByRole('list')).toBeInTheDocument();
      });

      await act(() => {
        fireEvent.click(getByTestId('outside-channellist'));
      });

      await waitFor(() => {
        expect(closeMobileNav).toHaveBeenCalledTimes(1);
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not call `closeMobileNav` prop function on click, if ChannelList is collapsed', async () => {
      const { container, getByRole, getByTestId } = await render(
        <ChatContext.Provider
          value={{
            channelsQueryState: channelsQueryStateMock,
            client: chatClient,
            closeMobileNav,
            navOpen: false,
            searchController: new SearchController(),
          }}
        >
          <ChannelList {...props} />
          <div data-testid='outside-channellist' />
        </ChatContext.Provider>,
      );

      // Wait for list of channels to load in DOM.
      await waitFor(() => {
        expect(getByRole('list')).toBeInTheDocument();
      });

      await act(() => {
        fireEvent.click(getByTestId('outside-channellist'));
      });
      await waitFor(() => {
        expect(closeMobileNav).toHaveBeenCalledTimes(0);
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  it('should re-query channels when filters change', async () => {
    const props = {
      filters: {},
      List: ChannelListComponent,
      options: { limit: 25, message_limit: 25 },
      Preview: ChannelPreviewComponent,
    };

    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { container, getByRole, getByTestId, rerender } = render(
      <Chat client={chatClient}>
        <ChannelList {...props} />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByRole('list')).toBeInTheDocument();
    });

    useMockedApis(chatClient, [queryChannelsApi([testChannel2])]);
    rerender(
      <Chat client={chatClient}>
        <ChannelList {...props} filters={{ dummyFilter: true }} />
      </Chat>,
    );
    await waitFor(() => {
      expect(getByTestId(testChannel2.channel.id)).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should use custom query channels function instead of default channels query', async () => {
    const { channels, client } = await initClientWithChannels({
      channelsData: [testChannel1],
    });
    const props = {
      customQueryChannels: jest
        .fn()
        .mockImplementationOnce(({ currentChannels, setChannels, setHasNextPage }) => {
          if (!currentChannels.length) setChannels([channels[0]]);
          setHasNextPage(true);
        }),
      filters: {},
    };
    const queryChannelsMock = jest
      .spyOn(client, 'queryChannels')
      .mockImplementationOnce();

    const { rerender } = render(
      <Chat client={client}>
        <ChannelList {...props} />
      </Chat>,
    );

    await waitFor(() => {
      expect(queryChannelsMock).toHaveBeenCalledTimes(0);
      expect(props.customQueryChannels).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(props.customQueryChannels).toHaveBeenCalledWith(
        expect.objectContaining({
          currentChannels: [],
          queryType: 'reload',
          setChannels: expect.any(Function),
          setHasNextPage: expect.any(Function),
        }),
      );
    });

    rerender(
      <Chat client={client}>
        <ChannelList {...props} />
      </Chat>,
    );

    act(() => {
      fireEvent.click(screen.getByTestId('load-more-button'));
    });

    await waitFor(() => {
      expect(queryChannelsMock).toHaveBeenCalledTimes(0);
      expect(props.customQueryChannels).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(props.customQueryChannels).toHaveBeenCalledWith(
        expect.objectContaining({
          currentChannels: [channels[0]],
          queryType: 'load-more',
          setChannels: expect.any(Function),
          setHasNextPage: expect.any(Function),
        }),
      );
    });

    queryChannelsMock.mockRestore();
  });

  it('should only show filtered channels when a filter function prop is provided', async () => {
    const filteredChannel = generateChannel({ channel: { type: 'filtered' } });

    const customFilterFunction = (channels) =>
      channels.filter((channel) => channel.type === 'filtered');

    const props = {
      channelRenderFilterFn: customFilterFunction,
      filters: {},
      List: ChannelListComponent,
      options: { limit: 25, message_limit: 25 },
      Preview: ChannelPreviewComponent,
    };

    useMockedApis(chatClient, [queryChannelsApi([filteredChannel, testChannel1])]);

    const { container, getByRole, queryAllByRole } = render(
      <Chat client={chatClient}>
        <ChannelList {...props} />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByRole('list')).toBeInTheDocument();

      expect(queryAllByRole('listitem')).toHaveLength(1);
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders Search component if searchController state indicates active search', async () => {
    const searchController = new SearchController();
    const searchTestId = 'search-test-id';
    const Search = () => <div data-testid={searchTestId} />;
    const client = await getTestClientWithUser({ id: 'userId' });

    render(
      <Chat client={client} searchController={searchController}>
        <WithComponents overrides={{ Search }}>
          <ChannelList showChannelSearch />
        </WithComponents>
      </Chat>,
    );
    await act(() => {
      searchController.activate();
    });
    expect(screen.getByTestId(searchTestId)).toBeInTheDocument();
  });

  it('should render `LoadingErrorIndicator` when queryChannels api throws error', async () => {
    useMockedApis(chatClient, [erroredPostApi()]);
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);

    const { container, getByTestId } = render(
      <Chat client={chatClient}>
        <ChannelList
          filters={{}}
          List={ChannelListComponent}
          options={{ presence: true, state: true, watch: true }}
          Preview={ChannelPreviewComponent}
        />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByTestId('error-indicator')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('provides the error object to LoadingErrorIndicator', async () => {
    useMockedApis(chatClient, [erroredPostApi()]);
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);

    const LoadingErrorIndicator = (props) => <div>{props.error.message}</div>;

    await act(async () => {
      await render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{}}
            LoadingErrorIndicator={LoadingErrorIndicator}
            options={{ presence: true, state: true, watch: true }}
            Preview={ChannelPreviewComponent}
          />
        </Chat>,
      );
    });

    expect(screen.getByText('StreamChat error HTTP code: 500')).toBeInTheDocument();
  });

  it('should render loading indicator before the first channel list load and on reload', async () => {
    const channelsQueryStatesHistory = [];
    const channelListMessengerLoadingHistory = [];
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const QueryStateInterceptor = ({ children }) => {
      const { channelsQueryState } = useChatContext();
      channelsQueryStatesHistory.push(channelsQueryState.queryInProgress);
      return children;
    };

    const ChannelListMessengerPropsInterceptor = (props) => {
      channelListMessengerLoadingHistory.push(props.loading);
      return <ChannelListMessenger {...props} />;
    };

    await render(
      <Chat client={chatClient}>
        <QueryStateInterceptor>
          <ChannelList List={ChannelListMessengerPropsInterceptor} />
        </QueryStateInterceptor>
      </Chat>,
    );

    await waitFor(() => {
      expect(channelsQueryStatesHistory).toHaveLength(3);
      expect(channelListMessengerLoadingHistory).toHaveLength(3);
      expect(channelsQueryStatesHistory[0]).toBe('uninitialized');
      expect(channelListMessengerLoadingHistory[0]).toBe(true);
      expect(channelsQueryStatesHistory[1]).toBe('reload');
      expect(channelListMessengerLoadingHistory[1]).toBe(true);
      expect(channelsQueryStatesHistory[2]).toBeNull();
      expect(channelListMessengerLoadingHistory[2]).toBe(false);
    });
  });

  it('ChannelPreview UI components should render `Avatar` when the custom prop is provided', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId, rerender } = render(
      <Chat client={chatClient}>
        <ChannelList
          Avatar={() => <div data-testid='custom-avatar-compact'>Avatar</div>}
          List={ChannelListComponent}
          Preview={ChannelPreviewCompact}
        />
      </Chat>,
    );
    await waitFor(() => {
      expect(getByTestId('custom-avatar-compact')).toBeInTheDocument();
    });

    rerender(
      <Chat client={chatClient}>
        <ChannelList
          Avatar={() => <div data-testid='custom-avatar-last'>Avatar</div>}
          List={ChannelListComponent}
          Preview={ChannelPreviewLastMessage}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('custom-avatar-last')).toBeInTheDocument();
    });

    rerender(
      <Chat client={chatClient}>
        <ChannelList
          Avatar={() => <div data-testid='custom-avatar-messenger'>Avatar</div>}
          List={ChannelListComponent}
          Preview={ChannelPreviewMessenger}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('custom-avatar-messenger')).toBeInTheDocument();
    });
  });

  it('when queryChannels api returns no channels, `EmptyStateIndicator` should be rendered', async () => {
    useMockedApis(chatClient, [queryChannelsApi([])]);

    const EmptyStateIndicator = () => (
      <div data-testid='empty-state-indicator' role='listitem' />
    );

    const { container, getByTestId } = render(
      <Chat client={chatClient}>
        <ChannelList
          EmptyStateIndicator={EmptyStateIndicator}
          filters={{}}
          List={ChannelListComponent}
          options={{ presence: true, state: true, watch: true }}
        />
      </Chat>,
    );
    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByTestId('empty-state-indicator')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show unique channels', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);
    const ChannelPreview = (props) => (
      <div data-testid={props.channel.id} role='listitem' />
    );
    render(
      <Chat client={chatClient}>
        <ChannelList filters={{}} options={{ limit: 2 }} Preview={ChannelPreview} />
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId(testChannel1.channel.id)).toBeInTheDocument();
      expect(screen.getByTestId(testChannel2.channel.id)).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel3])]);

    await act(() => {
      fireEvent.click(screen.getByTestId('load-more-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId(testChannel1.channel.id)).toBeInTheDocument();
      expect(screen.getByTestId(testChannel2.channel.id)).toBeInTheDocument();
      expect(screen.getByTestId(testChannel3.channel.id)).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });
  });

  it('allows to customize latest message preview generation', async () => {
    const previewText = 'custom preview text';
    const getLatestMessagePreview = () => previewText;

    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
    const { rerender } = render(
      <Chat client={chatClient}>
        <ChannelList filters={{}} options={{ limit: 2 }} />
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByText('Nothing yet...')).toBeInTheDocument();
    });

    rerender(
      <Chat client={chatClient}>
        <ChannelList
          filters={{}}
          getLatestMessagePreview={getLatestMessagePreview}
          options={{ limit: 2 }}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByText(previewText)).toBeInTheDocument();
    });
  });

  describe('Default and custom active channel', () => {
    let setActiveChannel;
    const watchersConfig = { limit: 20, offset: 0 };
    const testSetActiveChannelCall = (channelInstance) =>
      waitFor(() => {
        expect(setActiveChannel).toHaveBeenCalledTimes(1);
        expect(setActiveChannel).toHaveBeenCalledWith(channelInstance, watchersConfig);
        return true;
      });

    beforeEach(() => {
      setActiveChannel = jest.fn();
      useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);
    });

    it('should call `setActiveChannel` prop function with first channel as param', async () => {
      render(
        <ChatContext.Provider
          value={{
            channelsQueryState: channelsQueryStateMock,
            client: chatClient,
            searchController: new SearchController(),
            setActiveChannel,
          }}
        >
          <ChannelList
            filters={{}}
            List={ChannelListComponent}
            options={{
              presence: true,
              state: true,
              watch: true,
            }}
            setActiveChannelOnMount
            watchers={watchersConfig}
          />
        </ChatContext.Provider>,
      );

      const channelInstance = chatClient.channel(
        testChannel1.channel.type,
        testChannel1.channel.id,
      );

      expect(await testSetActiveChannelCall(channelInstance)).toBe(true);
    });

    it('should call `setActiveChannel` prop function with channel (which has `customActiveChannel` id)  as param', async () => {
      render(
        <ChatContext.Provider
          value={{
            channelsQueryState: channelsQueryStateMock,
            client: chatClient,
            searchController: new SearchController(),
            setActiveChannel,
          }}
        >
          <ChannelList
            customActiveChannel={testChannel2.channel.id}
            filters={{}}
            List={ChannelListComponent}
            options={{ presence: true, state: true, watch: true }}
            setActiveChannel={setActiveChannel}
            setActiveChannelOnMount
            watchers={watchersConfig}
          />
        </ChatContext.Provider>,
      );

      const channelInstance = chatClient.channel(
        testChannel2.channel.type,
        testChannel2.channel.id,
      );

      expect(await testSetActiveChannelCall(channelInstance)).toBe(true);
    });

    it('should render channel with id `customActiveChannel` at top of the list', async () => {
      const { container, getAllByRole, getByRole, getByTestId } = render(
        <ChatContext.Provider
          value={{
            channelsQueryState: channelsQueryStateMock,
            client: chatClient,
            searchController: new SearchController(),
            setActiveChannel,
          }}
        >
          <ChannelList
            customActiveChannel={testChannel2.channel.id}
            filters={{}}
            List={ChannelListComponent}
            options={{
              limit: 25,
              message_limit: 25,
              presence: true,
              state: true,
              watch: true,
            }}
            Preview={ChannelPreviewComponent}
            setActiveChannel={setActiveChannel}
            setActiveChannelOnMount
            watchers={watchersConfig}
          />
        </ChatContext.Provider>,
      );

      // Wait for list of channels to load in DOM.
      await waitFor(async () => {
        expect(getByRole('list')).toBeInTheDocument();
        const items = getAllByRole('listitem');

        // Get the closest listitem to the channel that received new message.
        const channelPreview = getByTestId(testChannel2.channel.id).closest(
          ROLE_LIST_ITEM_SELECTOR,
        );

        expect(channelPreview.isEqualNode(items[0])).toBe(true);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('channel search', () => {
      const defaultSearchDebounceInterval = 300;
      const inputText = 'xxxxxxxxxx';
      const user1 = generateUser();
      const user2 = generateUser();
      const mockedChannels = Array.from({ length: 3 }, (_, i) =>
        generateChannel({
          channel: { image: `image-xxx-${i}`, name: `channel-xxx-${i}` },
          members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
          messages: ' '
            .repeat(20)
            .split(' ')
            .map((v, i) => generateMessage({ user: i % 3 ? user1 : user2 })),
        }),
      );

      let client;
      let channel;
      beforeEach(async () => {
        client = await getTestClientWithUser({ id: user1.id });

        useMockedApis(client, [getOrCreateChannelApi(mockedChannels[0])]);
        channel = client.channel('messaging', mockedChannels[0].id);
        await channel.watch();
        useMockedApis(client, [
          queryChannelsApi(mockedChannels), // first API call goes to /channels endpoint
          queryUsersApi([user1, user2]), // onSearch starts searching users first
        ]);
      });

      const renderComponents = async (chatContext = {}, channeListProps) =>
        await act(
          async () =>
            await render(
              <ChatContext.Provider
                value={{
                  channelsQueryState: channelsQueryStateMock,
                  searchController: new SearchController(),
                  setActiveChannel,
                  ...chatContext,
                }}
              >
                <TranslationContext.Provider value={mockTranslationContext}>
                  <ChannelList
                    filters={{}}
                    options={{ presence: true, state: true }}
                    showChannelSearch
                    {...channeListProps}
                  />
                </TranslationContext.Provider>
              </ChatContext.Provider>,
            ),
        );

      it("should not render search results on input focus if user haven't started to type", async () => {
        const { container } = await renderComponents({ channel, client });
        const input = screen.queryByTestId('search-input');
        await act(async () => {
          await fireEvent.focus(input);
        });

        await waitFor(() => {
          expect(
            container.querySelector(SEARCH_RESULT_LIST_SELECTOR),
          ).not.toBeInTheDocument();
          expect(screen.queryByLabelText('Channel list')).toBeInTheDocument();
        });
      });
      it('should not render inline search results if popupResults is true', async () => {
        const { container } = await renderComponents(
          { channel, client },
          { additionalChannelSearchProps: { popupResults: true } },
        );
        const input = screen.queryByTestId('search-input');
        await act(async () => {
          await fireEvent.change(input, {
            target: {
              value: inputText,
            },
          });
        });
        await waitFor(() => {
          expect(
            container.querySelector(`${SEARCH_RESULT_LIST_SELECTOR}.popup`),
          ).toBeInTheDocument();
          expect(screen.queryByLabelText('Channel list')).toBeInTheDocument();
        });
      });
      it('should render inline search results if popupResults is false', async () => {
        const { container } = await renderComponents(
          { channel, client },
          { additionalChannelSearchProps: { popupResults: false } },
        );
        const input = screen.queryByTestId('search-input');
        await act(async () => {
          await fireEvent.change(input, {
            target: {
              value: inputText,
            },
          });
        });
        await waitFor(() => {
          expect(
            container.querySelector(`${SEARCH_RESULT_LIST_SELECTOR}.inline`),
          ).toBeInTheDocument();
          expect(screen.queryByLabelText('Channel list')).not.toBeInTheDocument();
        });
      });

      it.each([
        ['should not', false],
        ['should', true],
      ])(
        '%s unmount search results on result click, if configured',
        async (_, clearSearchOnClickOutside) => {
          jest.useFakeTimers('modern');
          jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [generateUser()] });
          const { container } = await renderComponents(
            { channel, client },
            { additionalChannelSearchProps: { clearSearchOnClickOutside } },
          );
          const input = screen.getByTestId('search-input');
          await act(async () => {
            await fireEvent.change(input, {
              target: {
                value: inputText,
              },
            });
          });
          await act(() => {
            jest.advanceTimersByTime(defaultSearchDebounceInterval + 1);
          });
          const searchResults = screen.queryAllByTestId('channel-search-result-user');
          useMockedApis(client, [getOrCreateChannelApi(generateChannel())]);
          await act(async () => {
            await fireEvent.click(searchResults[0]);
          });

          await waitFor(() => {
            if (clearSearchOnClickOutside) {
              expect(
                container.querySelector(SEARCH_RESULT_LIST_SELECTOR),
              ).not.toBeInTheDocument();
            } else {
              expect(
                container.querySelector(SEARCH_RESULT_LIST_SELECTOR),
              ).toBeInTheDocument();
            }
          });
          jest.useRealTimers();
        },
      );

      it('should unmount search results if user cleared the input', async () => {
        const { container } = await renderComponents({ channel, client });
        const input = screen.queryByTestId('search-input');
        await act(async () => {
          input.focus();
          await fireEvent.change(input, {
            target: {
              value: inputText,
            },
          });
        });

        await act(async () => {
          const clearButton = screen.queryByTestId('clear-input-button');
          await fireEvent.click(clearButton);
        });
        await waitFor(() => {
          expect(
            container.querySelector(SEARCH_RESULT_LIST_SELECTOR),
          ).not.toBeInTheDocument();
          expect(container.querySelector(CHANNEL_LIST_SELECTOR)).toBeInTheDocument();
          expect(input).toHaveValue('');
          expect(input).toHaveFocus();
          expect(screen.queryByTestId('return-icon')).toBeInTheDocument();
        });
      });

      it('should unmount search results if user clicked the return button', async () => {
        const { container } = await renderComponents({ channel, client });
        const input = screen.queryByTestId('search-input');

        await act(async () => {
          input.focus();
          await fireEvent.change(input, {
            target: {
              value: inputText,
            },
          });
        });

        const returnIcon = screen.queryByTestId('return-icon');
        await act(async () => {
          await fireEvent.click(returnIcon);
        });
        await waitFor(() => {
          expect(
            container.querySelector(SEARCH_RESULT_LIST_SELECTOR),
          ).not.toBeInTheDocument();
          expect(input).not.toHaveFocus();
          expect(input).toHaveValue('');
          expect(returnIcon).not.toBeInTheDocument();
        });
      });
      it('should add the selected result to the top of the channel list', async () => {
        jest.useFakeTimers('modern');
        jest.spyOn(client, 'queryUsers').mockResolvedValue({ users: [generateUser()] });
        await act(async () => {
          await render(
            <Chat client={client}>
              <ChannelList
                additionalChannelSearchProps={{ searchForChannels: true }}
                filters={{}}
                options={{ presence: true, state: true }}
                showChannelSearch
              />
            </Chat>,
          );
        });

        const channelNotInTheList = generateChannel({
          channel: { name: 'channel-not-loaded-yet' },
        });

        await waitFor(() => {
          expect(screen.queryAllByRole('option')).toHaveLength(3);
          expect(
            screen.queryByText(channelNotInTheList.channel.name),
          ).not.toBeInTheDocument();
        });

        useMockedApis(client, [
          queryChannelsApi([channelNotInTheList, ...mockedChannels]),
        ]);
        const input = screen.queryByTestId('search-input');
        await act(() => {
          input.focus();
          fireEvent.change(input, {
            target: {
              value: inputText,
            },
          });
        });
        await act(() => {
          jest.advanceTimersByTime(defaultSearchDebounceInterval + 1);
        });

        const targetChannelPreview = screen.getByText(channelNotInTheList.channel.name);
        expect(targetChannelPreview).toBeInTheDocument();
        await act(async () => {
          await fireEvent.click(targetChannelPreview);
        });

        await waitFor(() => {
          expect(
            screen.queryByText(channelNotInTheList.channel.name),
          ).toBeInTheDocument();
          expect(screen.queryByTestId('return-icon')).not.toBeInTheDocument();
        });
        jest.useRealTimers();
      });
    });
  });

  it('should call `renderChannels` function prop, if provided', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);
    const renderChannels = jest.fn();
    const channelListProps = {
      filters: {},
      List: ChannelListComponent,
      options: { limit: 25, message_limit: 25 },
      Preview: ChannelPreviewComponent,
      renderChannels,
    };
    const { container, getByRole } = await render(
      <Chat client={chatClient}>
        <ChannelList {...channelListProps} />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByRole('list')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(renderChannels).toHaveBeenCalledTimes(1);
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('Event handling', () => {
    describe('message.new', () => {
      const props = {
        filters: {},
        List: ChannelListComponent,
        options: { limit: 25, message_limit: 25 },
        Preview: ChannelPreviewComponent,
      };
      const sendNewMessageOnChannel3 = async () => {
        const newMessage = generateMessage({
          user: generateUser(),
        });

        await act(() => {
          dispatchMessageNewEvent(chatClient, newMessage, testChannel3.channel);
        });
        return newMessage;
      };

      beforeEach(() => {
        useMockedApis(chatClient, [
          queryChannelsApi([testChannel1, testChannel2, testChannel3]),
        ]);
      });

      it('should move channel to top of the list', async () => {
        const { container, getAllByRole, getByRole, getByText } = await render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const newMessage = await sendNewMessageOnChannel3();
        await waitFor(() => {
          expect(getByText(newMessage.text)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByText(newMessage.text).closest(
          ROLE_LIST_ITEM_SELECTOR,
        );
        expect(channelPreview.isEqualNode(items[0])).toBe(true);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should not alter order if `lockChannelOrder` prop is true', async () => {
        const { container, getAllByRole, getByRole, getByText } = await render(
          <Chat client={chatClient}>
            <ChannelList {...props} lockChannelOrder />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const newMessage = await sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(getByText(newMessage.text)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByText(newMessage.text).closest(
          ROLE_LIST_ITEM_SELECTOR,
        );
        expect(channelPreview.isEqualNode(items[2])).toBe(true);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should execute custom event handler', async () => {
        const onMessageNewEvent = jest.fn();
        render(
          <Chat client={chatClient}>
            <ChannelList {...props} onMessageNewHandler={onMessageNewEvent} />
          </Chat>,
        );
        const message = await sendNewMessageOnChannel3();
        await waitFor(() => {
          expect(onMessageNewEvent.mock.calls[0][0]).toStrictEqual(expect.any(Function));
          expect(onMessageNewEvent.mock.calls[0][1]).toStrictEqual(
            expect.objectContaining({
              channel: testChannel3.channel,
              cid: testChannel3.channel.cid,
              message,
              type: 'message.new',
              user: message.user,
            }),
          );
        });
      });
    });

    describe('notification.message_new', () => {
      it('should move channel to top of the list by default', async () => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);

        const { container, getAllByRole, getByRole, getByTestId } = await render(
          <Chat client={chatClient}>
            <ChannelList
              filters={{}}
              List={ChannelListComponent}
              options={{
                limit: 25,
                message_limit: 25,
                presence: true,
                state: true,
                watch: true,
              }}
              Preview={ChannelPreviewComponent}
            />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        useMockedApis(chatClient, [getOrCreateChannelApi(testChannel3)]);

        act(() => dispatchNotificationMessageNewEvent(chatClient, testChannel3.channel));

        await waitFor(() => {
          expect(getByTestId(testChannel3.channel.id)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByTestId(testChannel3.channel.id);
        expect(channelPreview.isEqualNode(items[0])).toBe(true);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should call `onMessageNew` function prop, if provided', async () => {
        const onMessageNew = jest.fn();

        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

        const { container, getByRole } = await render(
          <Chat client={chatClient}>
            <ChannelList
              filters={{}}
              List={ChannelListComponent}
              onMessageNew={onMessageNew}
              options={{
                limit: 25,
                message_limit: 25,
                presence: true,
                state: true,
                watch: true,
              }}
              Preview={ChannelPreviewComponent}
            />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        useMockedApis(chatClient, [getOrCreateChannelApi(testChannel2)]);

        act(() => dispatchNotificationMessageNewEvent(chatClient, testChannel2.channel));

        await waitFor(() => {
          expect(onMessageNew).toHaveBeenCalledTimes(1);
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('notification.added_to_channel', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        options: {
          limit: 25,
          message_limit: 25,
          presence: true,
          state: true,
          watch: true,
        },
        Preview: ChannelPreviewComponent,
      };

      beforeEach(async () => {
        chatClient = await getTestClientWithUser({ id: 'vishal' });
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should move channel to top of the list by default', async () => {
        const { container, getAllByRole, getByRole, getByTestId } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        useMockedApis(chatClient, [getOrCreateChannelApi(testChannel3)]);

        act(() =>
          dispatchNotificationAddedToChannelEvent(chatClient, testChannel3.channel),
        );

        await waitFor(() => {
          expect(getByTestId(testChannel3.channel.id)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByTestId(testChannel3.channel.id);
        expect(channelPreview.isEqualNode(items[0])).toBe(true);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should call `onAddedToChannel` function prop, if provided', async () => {
        const onAddedToChannel = jest.fn();
        const { container, getByRole } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} onAddedToChannel={onAddedToChannel} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() =>
          dispatchNotificationAddedToChannelEvent(chatClient, testChannel3.channel),
        );

        await waitFor(() => {
          expect(onAddedToChannel).toHaveBeenCalledTimes(1);
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('notification.removed_from_channel', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        options: { limit: 25, message_limit: 25 },
        Preview: ChannelPreviewComponent,
      };

      beforeEach(() => {
        useMockedApis(chatClient, [
          queryChannelsApi([testChannel1, testChannel2, testChannel3]),
        ]);
      });

      it('should remove the channel from list by default', async () => {
        const { container, getByRole, getByTestId } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );
        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });
        const nodeToBeRemoved = getByTestId(testChannel3.channel.id);

        act(() =>
          dispatchNotificationRemovedFromChannel(chatClient, testChannel3.channel),
        );

        await waitFor(() => {
          expect(nodeToBeRemoved).not.toBeInTheDocument();
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should call `onRemovedFromChannel` function prop, if provided', async () => {
        const onRemovedFromChannel = jest.fn();
        const { container, getByRole } = await render(
          <Chat client={chatClient}>
            <ChannelList
              {...channelListProps}
              onRemovedFromChannel={onRemovedFromChannel}
            />
          </Chat>,
        );
        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() =>
          dispatchNotificationRemovedFromChannel(chatClient, testChannel3.channel),
        );

        await waitFor(() => {
          expect(onRemovedFromChannel).toHaveBeenCalledTimes(1);
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('channel.updated', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        options: { limit: 25, message_limit: 25 },
        Preview: ChannelPreviewComponent,
      };

      beforeEach(() => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should update the channel in list, by default', async () => {
        const { container, getByRole, getByText } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const newChannelName = nanoid();
        act(() =>
          dispatchChannelUpdatedEvent(chatClient, {
            ...testChannel2.channel,
            name: newChannelName,
          }),
        );

        await waitFor(() => {
          expect(getByText(newChannelName)).toBeInTheDocument();
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should call `onChannelUpdated` function prop, if provided', async () => {
        const onChannelUpdated = jest.fn();
        const { container, getByRole } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} onChannelUpdated={onChannelUpdated} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const newChannelName = nanoid();

        act(() =>
          dispatchChannelUpdatedEvent(chatClient, {
            ...testChannel2.channel,
            name: newChannelName,
          }),
        );

        await waitFor(() => {
          expect(onChannelUpdated).toHaveBeenCalledTimes(1);
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('channel.deleted', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        options: { limit: 25, message_limit: 25 },
        Preview: ChannelPreviewComponent,
      };

      beforeEach(() => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should remove channel from list, by default', async () => {
        const { container, getByRole, getByTestId } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const nodeToBeRemoved = getByTestId(testChannel2.channel.id);
        act(() => dispatchChannelDeletedEvent(chatClient, testChannel2.channel));

        await waitFor(() => {
          expect(nodeToBeRemoved).not.toBeInTheDocument();
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should call `onChannelDeleted` function prop, if provided', async () => {
        const onChannelDeleted = jest.fn();
        const { container, getByRole } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} onChannelDeleted={onChannelDeleted} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchChannelDeletedEvent(chatClient, testChannel2.channel));

        await waitFor(() => {
          expect(onChannelDeleted).toHaveBeenCalledTimes(1);
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should unset activeChannel if it was deleted', async () => {
        const setActiveChannel = jest.fn();
        const { container, getByRole } = await render(
          <ChatContext.Provider
            value={{
              channelsQueryState: channelsQueryStateMock,
              client: chatClient,
              searchController: new SearchController(),
              setActiveChannel,
            }}
          >
            <ChannelList
              {...channelListProps}
              channel={{ cid: testChannel1.channel.cid }}
              setActiveChannel={setActiveChannel}
            />
          </ChatContext.Provider>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchChannelDeletedEvent(chatClient, testChannel1.channel));

        await waitFor(() => {
          expect(setActiveChannel).toHaveBeenCalledTimes(1);
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('channel.hidden', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        options: { limit: 25, message_limit: 25 },
        Preview: ChannelPreviewComponent,
      };

      beforeEach(() => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should remove channel from list, by default', async () => {
        const { container, getByRole, getByTestId } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const nodeToBeRemoved = getByTestId(testChannel2.channel.id);
        act(() => dispatchChannelHiddenEvent(chatClient, testChannel2.channel));

        await waitFor(() => {
          expect(nodeToBeRemoved).not.toBeInTheDocument();
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should unset activeChannel if it was hidden', async () => {
        const setActiveChannel = jest.fn();
        const { container, getByRole } = await render(
          <ChatContext.Provider
            value={{
              channelsQueryState: channelsQueryStateMock,
              client: chatClient,
              searchController: new SearchController(),
              setActiveChannel,
            }}
          >
            <ChannelList
              {...channelListProps}
              channel={{ cid: testChannel1.channel.cid }}
              setActiveChannel={setActiveChannel}
            />
          </ChatContext.Provider>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchChannelHiddenEvent(chatClient, testChannel1.channel));

        await waitFor(() => {
          expect(setActiveChannel).toHaveBeenCalledTimes(1);
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('channel.visible', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        options: {
          limit: 25,
          message_limit: 25,
          presence: true,
          state: true,
          watch: true,
        },
        Preview: ChannelPreviewComponent,
      };

      beforeEach(async () => {
        chatClient = await getTestClientWithUser({ id: 'jaap' });
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should move channel to top of the list by default', async () => {
        const { container, getAllByRole, getByRole, getByTestId } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        useMockedApis(chatClient, [getOrCreateChannelApi(testChannel3)]);

        act(() => dispatchChannelVisibleEvent(chatClient, testChannel3.channel));

        await waitFor(() => {
          expect(getByTestId(testChannel3.channel.id)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByTestId(testChannel3.channel.id);
        expect(channelPreview.isEqualNode(items[0])).toBe(true);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should call `onChannelVisible` function prop, if provided', async () => {
        const onChannelVisible = jest.fn();
        const { container, getByRole } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} onChannelVisible={onChannelVisible} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchChannelVisibleEvent(chatClient, testChannel3.channel));

        await waitFor(() => {
          expect(onChannelVisible).toHaveBeenCalledTimes(1);
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('connection.recovered', () => {
      it('should rerender the list', async () => {
        const channel1 = generateChannel();
        const channel2 = generateChannel();
        const channelListProps = {
          filters: {},
          List: ChannelListComponent,
          options: { limit: 25, message_limit: 25 },
          Preview: ChannelPreviewComponent,
        };

        useMockedApis(chatClient, [queryChannelsApi([channel1])]);

        const { container, getByRole, getByTestId } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const updateCount = parseInt(getByTestId('channelUpdateCount').textContent, 10);

        useMockedApis(chatClient, [queryChannelsApi([channel2])]);
        act(() => dispatchConnectionRecoveredEvent(chatClient));

        await waitFor(() => {
          expect(parseInt(getByTestId('channelUpdateCount').textContent, 10)).toBe(
            updateCount + 1,
          );
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('channel.truncated', () => {
      let channel1;
      let user1;
      let message1;
      let message2;

      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        options: { limit: 25, message_limit: 25 },
        Preview: ChannelPreviewComponent,
      };

      beforeEach(() => {
        user1 = generateUser();
        message1 = generateMessage({ user: user1 });
        message2 = generateMessage({ user: user1 });
        channel1 = generateChannel({ messages: [message1, message2] });

        useMockedApis(chatClient, [queryChannelsApi([channel1])]);
      });

      it('should call `onChannelTruncated` function prop, if provided', async () => {
        const onChannelTruncated = jest.fn();
        const { container, getByRole } = await render(
          <Chat client={chatClient}>
            <ChannelList {...channelListProps} onChannelTruncated={onChannelTruncated} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchChannelTruncatedEvent(chatClient, channel1.channel));

        await waitFor(() => {
          expect(onChannelTruncated).toHaveBeenCalledTimes(1);
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('on connection recovery', () => {
    const RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS = 5000;
    let queryChannelsMock;

    beforeEach(() => {
      chatClient.recoverStateOnReconnect = false;
      queryChannelsMock = jest.spyOn(chatClient, 'queryChannels');
    });

    afterEach(() => {
      queryChannelsMock.mockClear();
    });

    const renderUI = (client, channelListProps) =>
      render(
        <Chat client={client}>
          <ChannelList filters={{}} options={{ limit: 2 }} {...channelListProps} />
        </Chat>,
      );

    it('should not reload the channels on connection.recovered if client state recovery is enabled (default)', async () => {
      chatClient.recoverStateOnReconnect = true;
      renderUI(chatClient);

      expect(chatClient.queryChannels).toHaveBeenCalledTimes(1);
      await act(() => {
        chatClient.dispatchEvent({
          type: 'connection.recovered',
        });
      });

      await waitFor(() => {
        expect(chatClient.queryChannels).toHaveBeenCalledTimes(1);
      });
    });

    it('should reload the channels on connection.recovered', async () => {
      renderUI(chatClient);

      expect(chatClient.queryChannels).toHaveBeenCalledTimes(1);

      await act(() => {
        chatClient.dispatchEvent({
          type: 'connection.recovered',
        });
      });

      await waitFor(() => {
        expect(chatClient.queryChannels).toHaveBeenCalledTimes(2);
        expect(chatClient.queryChannels.mock.calls[1][2]).toStrictEqual(
          expect.objectContaining({ offset: 0 }),
        );
      });
    });

    it('should execute recovery queries outside throttle interval', async () => {
      renderUI(chatClient);
      expect(chatClient.queryChannels).toHaveBeenCalledTimes(1);

      const dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS + 1);

      await act(async () => {
        await chatClient.dispatchEvent({
          type: 'connection.recovered',
        });
      });

      await waitFor(() => {
        expect(chatClient.queryChannels).toHaveBeenCalledTimes(2);
        expect(chatClient.queryChannels.mock.calls[1][2]).toStrictEqual(
          expect.objectContaining({ offset: 0 }),
        );
      });

      await act(async () => {
        await chatClient.dispatchEvent({
          type: 'connection.recovered',
        });
      });

      await waitFor(() => {
        expect(chatClient.queryChannels).toHaveBeenCalledTimes(3);
        expect(chatClient.queryChannels.mock.calls[2][2]).toStrictEqual(
          expect.objectContaining({ offset: 0 }),
        );
      });

      dateNowSpy.mockRestore();
    });

    it('should circumvent the throttle interval if the last query failed', async () => {
      renderUI(chatClient);
      expect(chatClient.queryChannels).toHaveBeenCalledTimes(1);

      jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
      queryChannelsMock.mockRejectedValueOnce(new Error());
      const dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS);

      await act(() => {
        chatClient.dispatchEvent({
          type: 'connection.recovered',
        });
      });

      await waitFor(() => {
        expect(chatClient.queryChannels).toHaveBeenCalledTimes(2);
      });

      await act(() => {
        chatClient.dispatchEvent({
          type: 'connection.recovered',
        });
      });

      await waitFor(() => {
        expect(chatClient.queryChannels).toHaveBeenCalledTimes(3);
        expect(chatClient.queryChannels.mock.calls[2][2]).toStrictEqual(
          expect.objectContaining({ offset: 0 }),
        );
      });

      dateNowSpy.mockRestore();
    });
  });

  describe('context', () => {
    it('allows to set the new list of channels', async () => {
      let setChannelsFromOutside;
      const channelsToBeLoaded = Array.from({ length: 5 }, generateChannel);
      const channelsToBeSet = Array.from({ length: 5 }, generateChannel);
      const channelsToIdString = (channels) => channels.map(({ id }) => id).join();
      const channelsDataToIdString = (channels) =>
        channels.map(({ channel: { id } }) => id).join();

      const ChannelListCustom = () => {
        const { channels, setChannels } = useChannelListContext();
        useEffect(() => {
          setChannelsFromOutside = setChannels;
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);
        return <div>{channelsToIdString(channels)}</div>;
      };
      const props = {
        filters: {},
        List: ChannelListCustom,
        Preview: ChannelPreviewComponent,
      };

      useMockedApis(chatClient, [queryChannelsApi(channelsToBeLoaded)]);

      await render(
        <Chat client={chatClient}>
          <ChannelList {...props} />
        </Chat>,
      );

      await waitFor(() => {
        expect(
          screen.getByText(channelsDataToIdString(channelsToBeLoaded)),
        ).toBeInTheDocument();
      });

      await act(() => {
        setChannelsFromOutside(chatClient.hydrateActiveChannels(channelsToBeSet));
      });

      await waitFor(() => {
        expect(
          screen.queryByText(channelsDataToIdString(channelsToBeLoaded)),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText(channelsDataToIdString(channelsToBeSet)),
        ).toBeInTheDocument();
      });
    });
  });
});
