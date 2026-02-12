import { nanoid } from 'nanoid';
import React, { useEffect } from 'react';
import { SearchController } from 'stream-chat';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Channel } from '../Channel';
import { Chat } from '../../Chat';
import { LoadingErrorIndicator } from '../../Loading';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { ChatProvider, useChatContext } from '../../../context/ChatContext';
import { useComponentContext } from '../../../context/ComponentContext';
import {
  dispatchChannelTruncatedEvent,
  generateChannel,
  generateFileAttachment,
  generateMember,
  generateMessage,
  generateScrapedDataAttachment,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  initClientWithChannels,
  sendMessageApi,
  threadRepliesApi,
  useMockedApis,
} from '../../../mock-builders';
import { MessageList } from '../../MessageList';
import { Thread } from '../../Thread';
import { MessageProvider } from '../../../context';
import { MessageActionsBox } from '../../MessageActions';
import { DEFAULT_THREAD_PAGE_SIZE } from '../../../constants/limits';

jest.mock('../../Loading', () => ({
  LoadingErrorIndicator: jest.fn(() => <div />),
  LoadingIndicator: jest.fn(() => <div>loading</div>),
}));

const queryChannelWithNewMessages = (newMessages, channel) =>
  // generate new channel mock from existing channel with new messages added
  getOrCreateChannelApi(
    generateChannel({
      channel: {
        config: channel.getConfig(),
        id: channel.id,
        type: channel.type,
      },
      messages: newMessages,
    }),
  );

const MockAvatar = ({ name }) => (
  <div className='avatar' data-testid='custom-avatar'>
    {name}
  </div>
);

// This component is used for performing effects in a component that consumes the contexts from Channel,
// i.e. making use of the callbacks & values provided by the Channel component.
// the effect is called every time channelContext changes
const CallbackEffectWithChannelContexts = ({ callback }) => {
  const channelStateContext = useChannelStateContext();
  const channelActionContext = useChannelActionContext();
  const componentContext = useComponentContext();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const channelContext = {
    ...channelStateContext,
    ...channelActionContext,
    ...componentContext,
  };

  useEffect(() => {
    callback(channelContext);
  }, [callback, channelContext]);

  return null;
};

// In order for ChannelInner to be rendered, we need to set the active channel first.
const ActiveChannelSetter = ({ activeChannel }) => {
  const { setActiveChannel } = useChatContext();
  useEffect(() => {
    setActiveChannel(activeChannel);
  }, [activeChannel]); // eslint-disable-line
  return null;
};

const user = generateUser({ custom: 'custom-value', id: 'id', name: 'name' });

// create a full message state so that we can properly test `loadMore`
const messages = Array.from({ length: 25 }, (_, i) =>
  generateMessage({ created_at: new Date((i + 1) * 1000000), user }),
);

const pinnedMessages = [generateMessage({ pinned: true, user })];

const renderComponent = async (props = {}, callback = () => {}) => {
  const {
    channel: channelFromProps,
    chatClient: chatClientFromProps,
    ...channelProps
  } = props;
  let result;
  await act(() => {
    result = render(
      <Chat client={chatClientFromProps}>
        <ActiveChannelSetter activeChannel={channelFromProps} />
        <Channel {...channelProps}>
          {channelProps.children}
          <CallbackEffectWithChannelContexts callback={callback} />
        </Channel>
      </Chat>,
    );
  });
  return result;
};

const initClient = async () => {
  const members = [generateMember({ user })];
  const mockedChannel = generateChannel({
    members,
    messages,
    pinnedMessages,
  });
  const chatClient = await getTestClientWithUser(user);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
  const channel = chatClient.channel('messaging', mockedChannel.channel.id);

  jest.spyOn(channel, 'getConfig').mockImplementation(() => mockedChannel.channel.config);
  return { channel, chatClient };
};
describe('Channel', () => {
  const MockMessageList = () => {
    const { messages: channelMessages } = useChannelStateContext();

    return channelMessages.map(
      ({ id, status, text }) =>
        status !== 'failed' && <div key={id || nanoid()}>{text}</div>,
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the EmptyPlaceholder prop if the channel is not provided by the ChatContext', async () => {
    // get rid of console warnings as they are expected - Channel reaches to ChatContext
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    render(
      <ChatProvider
        value={{
          channelsQueryState: {
            error: null,
            queryInProgress: null,
            setError: jest.fn(),
            setQueryInProgress: jest.fn(),
          },
        }}
      >
        <Channel EmptyPlaceholder={<div>empty</div>} />
      </ChatProvider>,
    );

    await waitFor(() => expect(screen.getByText('empty')).toBeInTheDocument());
  });

  it('should render channel content if channels query loads more channels', async () => {
    const { channel, chatClient } = await initClient();
    const childrenContent = 'Channel children';
    await channel.watch();
    render(
      <ChatProvider
        value={{
          channelsQueryState: {
            error: null,
            queryInProgress: 'load-more',
            setError: jest.fn(),
            setQueryInProgress: jest.fn(),
          },
          client: chatClient,
          searchController: new SearchController(),
        }}
      >
        <Channel channel={channel}>{childrenContent}</Channel>
      </ChatProvider>,
    );
    await waitFor(() => expect(screen.getByText(childrenContent)).toBeInTheDocument());
  });

  it('should render default loading indicator if channels query is in progress', async () => {
    const childrenContent = 'Channel children';
    const { asFragment } = render(
      <ChatProvider
        value={{
          channelsQueryState: {
            error: null,
            queryInProgress: 'reload',
            setError: jest.fn(),
            setQueryInProgress: jest.fn(),
          },
        }}
      >
        <Channel>{childrenContent}</Channel>
      </ChatProvider>,
    );
    await waitFor(() => expect(asFragment()).toMatchSnapshot());
  });

  it('should render empty channel container if channel does not have cid', async () => {
    const { channel } = await initClient();
    const childrenContent = 'Channel children';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cid, ...channelWithoutCID } = channel;
    const { asFragment } = render(
      <ChatProvider
        value={{
          channel: channelWithoutCID,
          channelsQueryState: {
            error: null,
            queryInProgress: null,
            setError: jest.fn(),
            setQueryInProgress: jest.fn(),
          },
        }}
      >
        <Channel>{childrenContent}</Channel>
      </ChatProvider>,
    );
    await waitFor(() => expect(asFragment()).toMatchSnapshot());
  });

  it('should render empty channel container if channels query failed', async () => {
    const childrenContent = 'Channel children';
    const { asFragment } = render(
      <ChatProvider
        value={{
          channelsQueryState: {
            error: new Error(),
            queryInProgress: null,
            setError: jest.fn(),
            setQueryInProgress: jest.fn(),
          },
        }}
      >
        <Channel>{childrenContent}</Channel>
      </ChatProvider>,
    );
    await waitFor(() => expect(asFragment()).toMatchSnapshot());
  });

  it('should render provided loading indicator if channels query is in progress', async () => {
    const childrenContent = 'Channel children';
    const loadingText = 'Loading channels';
    render(
      <ChatProvider
        value={{
          channelsQueryState: {
            error: null,
            queryInProgress: 'reload',
            setError: jest.fn(),
            setQueryInProgress: jest.fn(),
          },
        }}
      >
        <Channel LoadingIndicator={() => <div>{loadingText}</div>}>
          {childrenContent}
        </Channel>
      </ChatProvider>,
    );
    await waitFor(() => expect(screen.getByText(loadingText)).toBeInTheDocument());
  });

  it('should render provided error indicator if channels query failed', async () => {
    const childrenContent = 'Channel children';
    const errMsg = 'Channels query failed';
    render(
      <ChatProvider
        value={{
          channelsQueryState: {
            error: new Error(errMsg),
            queryInProgress: null,
            setError: jest.fn(),
            setQueryInProgress: jest.fn(),
          },
        }}
      >
        <Channel LoadingErrorIndicator={({ error }) => <div>{error.message}</div>}>
          {childrenContent}
        </Channel>
      </ChatProvider>,
    );
    await waitFor(() => expect(screen.getByText(errMsg)).toBeInTheDocument());
  });

  it('should watch the current channel on mount', async () => {
    const { channel, chatClient } = await initClient();
    const watchSpy = jest.spyOn(channel, 'watch');

    await renderComponent({
      channel,
      channelQueryOptions: { messages: { limit: 25 } },
      chatClient,
    });

    await waitFor(() => {
      expect(watchSpy).toHaveBeenCalledTimes(1);
      expect(watchSpy).toHaveBeenCalledWith({ messages: { limit: 25 } });
    });
  });

  it('should apply channelQueryOptions to channel watch call', async () => {
    const { channel, chatClient } = await initClient();
    const watchSpy = jest.spyOn(channel, 'watch');
    const channelQueryOptions = {
      messages: { limit: 20 },
    };
    await renderComponent({ channel, channelQueryOptions, chatClient });

    await waitFor(() => {
      expect(watchSpy).toHaveBeenCalledTimes(1);
      expect(watchSpy).toHaveBeenCalledWith(channelQueryOptions);
    });
  });

  it('should set hasMore state to false if the initial channel query returns less messages than the default initial page size', async () => {
    const { channel, chatClient } = await initClient();
    useMockedApis(chatClient, [
      queryChannelWithNewMessages([generateMessage()], channel),
    ]);
    let hasMore;
    await renderComponent({ channel, chatClient }, ({ hasMore: contextHasMore }) => {
      hasMore = contextHasMore;
    });

    await waitFor(() => {
      expect(hasMore).toBe(false);
    });
  });

  // this will only happen if we:
  // load with channel A
  // switch to channel B and paginate (loadMore - older)
  // switch back to channel A (reset hasMore)
  // switch back to channel B - messages are already cached and there's more than page size amount
  it('should set hasMore state to true if the initial channel query returns more messages than the default initial page size', async () => {
    const { channel, chatClient } = await initClient();
    useMockedApis(chatClient, [
      queryChannelWithNewMessages(Array.from({ length: 26 }, generateMessage), channel),
    ]);
    let hasMore;
    await act(() => {
      renderComponent(
        { channel, channelQueryOptions: { messages: { limit: 25 } }, chatClient },
        ({ hasMore: contextHasMore }) => {
          hasMore = contextHasMore;
        },
      );
    });

    await waitFor(() => {
      expect(hasMore).toBe(true);
    });
  });

  it('should set hasMore state to true if the initial channel query returns count of messages equal to the default initial page size', async () => {
    const { channel, chatClient } = await initClient();
    useMockedApis(chatClient, [
      queryChannelWithNewMessages(Array.from({ length: 25 }, generateMessage), channel),
    ]);
    let hasMore;
    await renderComponent(
      { channel, channelQueryOptions: { messages: { limit: 25 } }, chatClient },
      ({ hasMore: contextHasMore }) => {
        hasMore = contextHasMore;
      },
    );

    await waitFor(() => {
      expect(hasMore).toBe(true);
    });
  });

  it('should set hasMore state to false if the initial channel query returns less messages than the custom query channels options message limit', async () => {
    const { channel, chatClient } = await initClient();
    useMockedApis(chatClient, [
      queryChannelWithNewMessages([generateMessage()], channel),
    ]);
    let hasMore;
    const channelQueryOptions = {
      messages: { limit: 10 },
    };
    await renderComponent(
      { channel, channelQueryOptions, chatClient },
      ({ hasMore: contextHasMore }) => {
        hasMore = contextHasMore;
      },
    );

    await waitFor(() => {
      expect(hasMore).toBe(false);
    });
  });

  it('should set hasMore state to true if the initial channel query returns count of messages equal custom query channels options message limit', async () => {
    const { channel, chatClient } = await initClient();
    const equalCount = 10;
    useMockedApis(chatClient, [
      queryChannelWithNewMessages(
        Array.from({ length: equalCount }, generateMessage),
        channel,
      ),
    ]);
    let hasMore;
    const channelQueryOptions = {
      messages: { limit: equalCount },
    };
    await renderComponent(
      { channel, channelQueryOptions, chatClient },
      ({ hasMore: contextHasMore }) => {
        hasMore = contextHasMore;
      },
    );

    await waitFor(() => {
      expect(hasMore).toBe(true);
    });
  });

  it('should not call watch the current channel on mount if channel is initialized', async () => {
    const { channel, chatClient } = await initClient();
    const watchSpy = jest.spyOn(channel, 'watch');
    channel.initialized = true;
    await renderComponent({ channel, chatClient });
    await waitFor(() => expect(watchSpy).not.toHaveBeenCalled());
  });

  it('should set an error if watching the channel goes wrong, and render a LoadingErrorIndicator', async () => {
    const { channel, chatClient } = await initClient();
    const watchError = new Error('watching went wrong');
    jest.spyOn(channel, 'watch').mockImplementationOnce(() => Promise.reject(watchError));

    await renderComponent({ channel, chatClient });

    await waitFor(() =>
      expect(LoadingErrorIndicator).toHaveBeenCalledWith(
        expect.objectContaining({
          error: watchError,
        }),
        undefined,
      ),
    );
  });

  it('should render a LoadingIndicator if it is loading', async () => {
    const { channel, chatClient } = await initClient();
    const watchPromise = new Promise(() => {});
    jest.spyOn(channel, 'watch').mockImplementationOnce(() => watchPromise);
    const result = await renderComponent({ channel, chatClient });

    await waitFor(() => expect(result.asFragment()).toMatchSnapshot());
  });

  it('should provide context and render children if channel is set and the component is not loading or errored', async () => {
    const { channel, chatClient } = await initClient();
    const { findByText } = await renderComponent({
      channel,
      chatClient,
      children: <div>children</div>,
    });

    expect(await findByText('children')).toBeInTheDocument();
  });

  it('should store pinned messages as an array in the channel context', async () => {
    const { channel, chatClient } = await initClient();
    let ctxPins;

    const { getByText } = await renderComponent(
      {
        channel,
        chatClient,
        children: <div>children</div>,
      },
      (ctx) => {
        ctxPins = ctx.pinnedMessages;
      },
    );

    await waitFor(() => {
      expect(getByText('children')).toBeInTheDocument();
      expect(Array.isArray(ctxPins)).toBe(true);
    });
  });

  // should these 'on' tests actually test if the handler works?
  it('should add a connection recovery handler on the client on mount', async () => {
    const { channel, chatClient } = await initClient();
    const clientOnSpy = jest.spyOn(chatClient, 'on');

    await renderComponent({ channel, chatClient });

    await waitFor(() =>
      expect(clientOnSpy).toHaveBeenCalledWith(
        'connection.recovered',
        expect.any(Function),
      ),
    );
  });

  it('should add an `on` handler to the channel on mount', async () => {
    const { channel, chatClient } = await initClient();
    const channelOnSpy = jest.spyOn(channel, 'on');
    await renderComponent({ channel, chatClient });

    await waitFor(() => expect(channelOnSpy).toHaveBeenCalledWith(expect.any(Function)));
  });

  it('should mark the channel as read when the channel is mounted', async () => {
    const { channel, chatClient } = await initClient();
    jest.spyOn(channel, 'countUnread').mockImplementationOnce(() => 1);
    const markReadSpy = jest.spyOn(channel, 'markRead');

    await renderComponent({ channel, chatClient });

    await waitFor(() => expect(markReadSpy).toHaveBeenCalledWith());
  });

  it('should not mark the channel as read if the count of unread messages is higher than 0 on mount and the feature is disabled', async () => {
    const { channel, chatClient } = await initClient();
    jest.spyOn(channel, 'countUnread').mockImplementationOnce(() => 1);
    const markReadSpy = jest.spyOn(channel, 'markRead');

    await renderComponent({ channel, chatClient, markReadOnMount: false });

    await waitFor(() => expect(markReadSpy).not.toHaveBeenCalledWith());
  });

  it('should use the doMarkReadRequest prop to mark channel as read, if that is defined', async () => {
    const { channel, chatClient } = await initClient();
    jest.spyOn(channel, 'countUnread').mockImplementationOnce(() => 1);
    const doMarkReadRequest = jest.fn();

    await renderComponent({
      channel,
      chatClient,
      doMarkReadRequest,
      markReadOnMount: true,
    });

    await waitFor(() => expect(doMarkReadRequest).toHaveBeenCalledTimes(1));
  });

  it('should not query the channel from the backend when initializeOnMount is disabled', async () => {
    const { channel, chatClient } = await initClient();
    const watchSpy = jest.spyOn(channel, 'watch').mockImplementationOnce();
    await renderComponent({
      channel,
      chatClient,
      initializeOnMount: false,
    });
    await waitFor(() => expect(watchSpy).not.toHaveBeenCalled());
  });

  it('should query the channel from the backend when initializeOnMount is enabled (the default)', async () => {
    const { channel, chatClient } = await initClient();
    const watchSpy = jest.spyOn(channel, 'watch').mockImplementationOnce();
    await renderComponent({ channel, chatClient });
    await waitFor(() => expect(watchSpy).toHaveBeenCalledTimes(1));
  });

  describe('Children that consume the contexts set in Channel', () => {
    it('should be able to open threads', async () => {
      const { channel, chatClient } = await initClient();
      const threadMessage = messages[0];
      const hasThread = jest.fn();

      // this renders Channel, calls openThread from a child context consumer with a message,
      // and then calls hasThread with the thread id if it was set.
      await renderComponent({ channel, chatClient }, ({ openThread, thread }) => {
        if (!thread) {
          openThread(threadMessage, { preventDefault: () => null });
        } else {
          hasThread(thread.id);
        }
      });

      await waitFor(() => expect(hasThread).toHaveBeenCalledWith(threadMessage.id));
    });

    it('should be able to load more messages in a thread until reaching the end', async () => {
      const { channel, chatClient } = await initClient();
      const getRepliesSpy = jest.spyOn(channel, 'getReplies');
      const threadMessage = messages[0];
      const timestamp = new Date('2024-01-01T00:00:00.000Z').getTime();
      const replies = Array.from({ length: DEFAULT_THREAD_PAGE_SIZE }, (_, index) =>
        generateMessage({
          created_at: new Date(timestamp + index * 1000),
          parent_id: threadMessage.id,
        }),
      );

      useMockedApis(chatClient, [threadRepliesApi(replies)]);

      const hasThreadMessages = jest.fn();

      let callback = ({ loadMoreThread, openThread, thread, threadMessages }) => {
        if (!thread) {
          // first, open a thread
          openThread(threadMessage, { preventDefault: () => null });
        } else if (!threadMessages.length) {
          // then, load more messages in the thread
          loadMoreThread();
        } else {
          // then, call our mock fn so we can verify what was passed as threadMessages
          hasThreadMessages(threadMessages);
        }
      };
      const { rerender } = await render(
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <CallbackEffectWithChannelContexts callback={callback} />
          </Channel>
        </Chat>,
      );

      await waitFor(() => {
        expect(getRepliesSpy).toHaveBeenCalledTimes(1);
        expect(getRepliesSpy).toHaveBeenCalledWith(threadMessage.id, expect.any(Object));
        expect(hasThreadMessages).toHaveBeenCalledWith(replies);
      });

      useMockedApis(chatClient, [threadRepliesApi([])]);
      callback = ({ loadMoreThread }) => {
        loadMoreThread();
      };
      await act(() => {
        rerender(
          <Chat client={chatClient}>
            <Channel channel={channel}>
              <CallbackEffectWithChannelContexts callback={callback} />
            </Channel>
          </Chat>,
        );
      });
      expect(getRepliesSpy).toHaveBeenCalledTimes(2);
      await act(() => {
        rerender(
          <Chat client={chatClient}>
            <Channel channel={channel}>
              <CallbackEffectWithChannelContexts callback={callback} />
            </Channel>
          </Chat>,
        );
      });
      expect(getRepliesSpy).toHaveBeenCalledTimes(2);
    });

    it('should allow closing a thread after it has been opened', async () => {
      const { channel, chatClient } = await initClient();
      let threadHasClosed = false;
      const threadMessage = messages[0];

      let threadHasAlreadyBeenOpened = false;
      await renderComponent(
        { channel, chatClient },
        ({ closeThread, openThread, thread }) => {
          if (!thread) {
            // if there is no open thread
            if (!threadHasAlreadyBeenOpened) {
              // and we haven't opened one before, open a thread
              openThread(threadMessage, { preventDefault: () => null });
              threadHasAlreadyBeenOpened = true;
            } else {
              // if we opened it ourselves before, it means the thread was successfully closed
              threadHasClosed = true;
            }
          } else {
            // if a thread is open, close it.
            closeThread({ preventDefault: () => null });
          }
        },
      );

      await waitFor(() => expect(threadHasClosed).toBe(true));
    });

    it('should call the onMentionsHover/onMentionsClick prop if a child component calls onMentionsHover with the right event', async () => {
      const { channel, chatClient } = await initClient();
      const onMentionsHoverMock = jest.fn();
      const onMentionsClickMock = jest.fn();
      const username = 'Mentioned User';
      const mentionedUserMock = {
        name: username,
      };

      const MentionedUserComponent = () => {
        const { onMentionsHover } = useChannelActionContext();
        return (
          <span
            onClick={(e) => onMentionsHover(e, [mentionedUserMock])}
            onMouseOver={(e) => onMentionsHover(e, [mentionedUserMock])}
          >
            <strong>@{username}</strong> this is a message
          </span>
        );
      };

      const { findByText } = await renderComponent({
        channel,
        chatClient,
        children: <MentionedUserComponent />,
        onMentionsClick: onMentionsClickMock,
        onMentionsHover: onMentionsHoverMock,
      });

      const usernameText = await findByText(`@${username}`);

      act(() => {
        fireEvent.mouseOver(usernameText);
        fireEvent.click(usernameText);
      });

      await waitFor(() =>
        expect(onMentionsHoverMock).toHaveBeenCalledWith(
          expect.any(Object), // event
          mentionedUserMock,
        ),
      );
      await waitFor(() =>
        expect(onMentionsClickMock).toHaveBeenCalledWith(
          expect.any(Object), // event
          mentionedUserMock,
        ),
      );
    });

    describe('loading more messages', () => {
      const limit = 10;
      it("should initiate the hasMore flag with the current message set's pagination hasPrev value", async () => {
        const { channel, chatClient } = await initClient();
        let hasMore;
        await renderComponent(
          { channel, channelQueryOptions: { messages: { limit: 25 } }, chatClient },
          ({ hasMore: hasMoreCtx }) => {
            hasMore = hasMoreCtx;
          },
        );
        expect(hasMore).toBe(true);

        channel.state.messageSets[0].pagination.hasPrev = false;
        await renderComponent(
          { channel, channelQueryOptions: { messages: { limit: 25 } }, chatClient },
          ({ hasMore: hasMoreCtx }) => {
            hasMore = hasMoreCtx;
          },
        );
        expect(hasMore).toBe(false);
      });
      it('should be able to load more messages', async () => {
        const { channel, chatClient } = await initClient();
        const channelQuerySpy = jest.spyOn(channel, 'query');
        let newMessageAdded = false;

        const newMessages = [generateMessage()];

        await renderComponent(
          { channel, channelQueryOptions: { messages: { limit: 25 } }, chatClient },
          ({ loadMore, messages: contextMessages }) => {
            if (!contextMessages.find((message) => message.id === newMessages[0].id)) {
              // Our new message is not yet passed as part of channel context. Call loadMore and mock API response to include it.
              useMockedApis(chatClient, [
                queryChannelWithNewMessages(newMessages, channel),
              ]);
              loadMore(limit);
            } else {
              // If message has been added, update checker so we can verify it happened.
              newMessageAdded = true;
            }
          },
        );

        await waitFor(() =>
          expect(channelQuerySpy).toHaveBeenCalledWith({
            messages: {
              id_lt: messages[0].id,
              limit,
            },
            watchers: {
              limit,
            },
          }),
        );

        await waitFor(() => expect(newMessageAdded).toBe(true));
      });

      it('should set hasMore to false if querying channel returns less messages than the limit', async () => {
        const { channel, chatClient } = await initClient();
        let channelHasMore = false;
        const newMessages = [generateMessage({ created_at: new Date(1000) })];
        await renderComponent(
          { channel, chatClient },
          ({ hasMore, loadMore, messages: contextMessages }) => {
            if (!contextMessages.find((message) => message.id === newMessages[0].id)) {
              // Our new message is not yet passed as part of channel context. Call loadMore and mock API response to include it.
              useMockedApis(chatClient, [
                queryChannelWithNewMessages(newMessages, channel),
              ]);
              loadMore(limit);
            } else {
              // If message has been added, set our checker variable, so we can verify if hasMore is false.
              channelHasMore = hasMore;
            }
          },
        );

        await waitFor(() => expect(channelHasMore).toBe(false));
      });

      it('should set hasMore to true if querying channel returns an amount of messages that equals the limit', async () => {
        const { channel, chatClient } = await initClient();
        let channelHasMore = false;
        const newMessages = Array(limit)
          .fill(null)
          .map(() => generateMessage());
        await renderComponent(
          { channel, channelQueryOptions: { messages: { limit: 25 } }, chatClient },
          ({ hasMore, loadMore, messages: contextMessages }) => {
            if (!contextMessages.some((message) => message.id === newMessages[0].id)) {
              // Our new messages are not yet passed as part of channel context. Call loadMore and mock API response to include it.
              useMockedApis(chatClient, [
                queryChannelWithNewMessages(newMessages, channel),
              ]);
              loadMore(limit);
            } else {
              // If message has been added, set our checker variable so we can verify if hasMore is true.
              channelHasMore = hasMore;
            }
          },
        );

        await waitFor(() => expect(channelHasMore).toBe(true));
      });

      it('should set loadingMore to true while loading more', async () => {
        const { channel, chatClient } = await initClient();
        const queryPromise = new Promise(() => {});
        let isLoadingMore = false;

        await renderComponent(
          { channel, channelQueryOptions: { messages: { limit: 25 } }, chatClient },
          ({ loadingMore, loadMore }) => {
            // return a promise that hasn't resolved yet, so loadMore will be stuck in the 'await' part of the function
            jest.spyOn(channel, 'query').mockImplementationOnce(() => queryPromise);
            loadMore();
            isLoadingMore = loadingMore;
          },
        );
        await waitFor(() => expect(isLoadingMore).toBe(true));
      });

      it('should not load the second page, if the previous query has returned less then default limit messages', async () => {
        const { channel, chatClient } = await initClient();
        const firstPageOfMessages = [generateMessage()];
        useMockedApis(chatClient, [
          queryChannelWithNewMessages(firstPageOfMessages, channel),
        ]);
        let queryNextPageSpy;
        let contextMessageCount;
        await renderComponent(
          { channel, chatClient },
          ({ loadMore, messages: contextMessages }) => {
            queryNextPageSpy = jest.spyOn(channel, 'query');
            contextMessageCount = contextMessages.length;
            loadMore();
          },
        );

        await waitFor(() => {
          expect(queryNextPageSpy).not.toHaveBeenCalled();
          expect(chatClient.axiosInstance.post).toHaveBeenCalledTimes(1);
          expect(chatClient.axiosInstance.post.mock.calls[0][1]).toMatchObject(
            expect.objectContaining({
              data: {},
              presence: false,
              state: true,
              watch: false,
            }),
          );
          expect(contextMessageCount).toBe(firstPageOfMessages.length);
        });
      });

      it('should load the second page, if the previous query has returned message count equal default messages limit', async () => {
        const { channel, chatClient } = await initClient();
        const firstPageMessages = Array.from({ length: 25 }, (_, i) =>
          generateMessage({ created_at: new Date((i + 16) * 100000) }),
        );
        const secondPageMessages = Array.from({ length: 15 }, (_, i) =>
          generateMessage({ created_at: new Date((i + 1) * 100000) }),
        );
        useMockedApis(chatClient, [
          queryChannelWithNewMessages(firstPageMessages, channel),
        ]);
        let queryNextPageSpy;
        let contextMessageCount;
        await renderComponent(
          { channel, channelQueryOptions: { messages: { limit: 25 } }, chatClient },
          ({ loadMore, messages: contextMessages }) => {
            queryNextPageSpy = jest.spyOn(channel, 'query');
            contextMessageCount = contextMessages.length;
            useMockedApis(chatClient, [
              queryChannelWithNewMessages(secondPageMessages, channel),
            ]);
            loadMore();
          },
        );

        await waitFor(() => {
          expect(queryNextPageSpy).toHaveBeenCalledTimes(1);
          expect(chatClient.axiosInstance.post).toHaveBeenCalledTimes(2);
          expect(chatClient.axiosInstance.post.mock.calls[0][1]).toMatchObject({
            data: {},
            presence: false,
            state: true,
            watch: false,
          });
          expect(chatClient.axiosInstance.post.mock.calls[1][1]).toMatchObject(
            expect.objectContaining({
              data: {},
              messages: { id_lt: firstPageMessages[0].id, limit: 25 },
              state: true,
              watchers: { limit: 25 },
            }),
          );
          expect(contextMessageCount).toBe(
            firstPageMessages.length + secondPageMessages.length,
          );
        });
      });
      it('should not load the second page, if the previous query has returned less then custom limit messages', async () => {
        const { channel, chatClient } = await initClient();
        const channelQueryOptions = {
          messages: { limit: 10 },
        };
        const firstPageOfMessages = [generateMessage()];
        useMockedApis(chatClient, [
          queryChannelWithNewMessages(firstPageOfMessages, channel),
        ]);
        let queryNextPageSpy;
        let contextMessageCount;
        await renderComponent(
          { channel, channelQueryOptions, chatClient },
          ({ loadMore, messages: contextMessages }) => {
            queryNextPageSpy = jest.spyOn(channel, 'query');
            contextMessageCount = contextMessages.length;
            loadMore(channelQueryOptions.messages.limit);
          },
        );

        await waitFor(() => {
          expect(queryNextPageSpy).not.toHaveBeenCalled();
          expect(chatClient.axiosInstance.post).toHaveBeenCalledTimes(1);
          expect(chatClient.axiosInstance.post.mock.calls[0][1]).toMatchObject({
            data: {},
            messages: {
              limit: channelQueryOptions.messages.limit,
            },
            presence: false,
            state: true,
            watch: false,
          });
          expect(contextMessageCount).toBe(firstPageOfMessages.length);
        });
      });
      it('should load the second page, if the previous query has returned message count equal custom messages limit', async () => {
        const { channel, chatClient } = await initClient();
        const equalCount = 10;
        const channelQueryOptions = {
          messages: { limit: equalCount },
        };
        const firstPageMessages = Array.from({ length: equalCount }, (_, i) =>
          generateMessage({ created_at: new Date((i + 1 + equalCount) * 100000) }),
        );
        const secondPageMessages = Array.from({ length: equalCount - 1 }, (_, i) =>
          generateMessage({ created_at: new Date((i + 1) * 100000) }),
        );
        useMockedApis(chatClient, [
          queryChannelWithNewMessages(firstPageMessages, channel),
        ]);
        let queryNextPageSpy;
        let contextMessageCount;

        await renderComponent(
          { channel, channelQueryOptions, chatClient },
          ({ loadMore, messages: contextMessages }) => {
            queryNextPageSpy = jest.spyOn(channel, 'query');
            contextMessageCount = contextMessages.length;
            useMockedApis(chatClient, [
              queryChannelWithNewMessages(secondPageMessages, channel),
            ]);
            loadMore(channelQueryOptions.messages.limit);
          },
        );

        await waitFor(() => {
          expect(queryNextPageSpy).toHaveBeenCalledTimes(1);
          expect(chatClient.axiosInstance.post).toHaveBeenCalledTimes(2);
          expect(chatClient.axiosInstance.post.mock.calls[0][1]).toMatchObject({
            data: {},
            messages: {
              limit: channelQueryOptions.messages.limit,
            },
            presence: false,
            state: true,
            watch: false,
          });
          expect(chatClient.axiosInstance.post.mock.calls[1][1]).toMatchObject(
            expect.objectContaining({
              data: {},
              messages: {
                id_lt: firstPageMessages[0].id,
                limit: channelQueryOptions.messages.limit,
              },
              state: true,
              watchers: { limit: channelQueryOptions.messages.limit },
            }),
          );
          expect(contextMessageCount).toBe(
            firstPageMessages.length + secondPageMessages.length,
          );
        });
      });
    });

    describe('jump to first unread message', () => {
      const user = generateUser();
      const last_read = new Date(1000);
      const last_read_message_id = 'X';
      const first_unread_message_id = 'Y';
      const lastReadMessage = generateMessage({
        created_at: last_read,
        id: last_read_message_id,
      });
      const firstUnreadMessage = generateMessage({ id: first_unread_message_id });
      const currentMessageSetLastReadLoadedFirstUnreadNotLoaded = [
        generateMessage({ created_at: new Date(100) }),
        lastReadMessage,
      ];
      const currentMessageSetLastReadFirstUnreadLoaded = [
        lastReadMessage,
        firstUnreadMessage,
      ];
      const currentMessageSetLastReadNotLoadedFirstUnreadLoaded = [
        firstUnreadMessage,
        generateMessage(),
      ];
      const currentMessageSetFirstUnreadLastReadNotLoaded = [
        generateMessage(),
        generateMessage(),
      ];
      const errorNotificationText = 'Failed to jump to the first unread message';
      const ownReadStateBase = {
        last_read,
        unread_messages: 1,
        user,
      };
      const ownReadStateLastReadMsgIdKnown = {
        last_read,
        last_read_message_id,
        unread_messages: 1,
        user,
      };
      const ownReadStateFirstUnreadMsgIdKnown = {
        first_unread_message_id,
        last_read,
        last_read_message_id,
        unread_messages: 1,
        user,
      };

      afterEach(jest.resetAllMocks);
      /**
       * {channelUnreadUiState: {first_unread_message_id: 'Y', last_read: new Date(1), last_read_message_id: 'X', unread_messages: 9, }, messages: Array.from({length: 10})} // marked channel unread
       * {channelUnreadUiState: {first_unread_message_id: undefined, last_read: new Date(1), last_read_message_id: 'X', unread_messages: 9, }, messages: Array.from({length: 10})} // incoming new messages while being scrolled up / open an already read channel with unread messages
       * {channelUnreadUiState: {first_unread_message_id: undefined, last_read: new Date(0), last_read_message_id: undefined, unread_messages: 10, }, messages: Array.from({length: 10})} // open a new channel with existing messages
       * {channelUnreadUiState: {first_unread_message_id: undefined, last_read: new Date(10), last_read_message_id: 'Z', unread_messages: 0, }, messages: Array.from({length: 10})} // open a fully read channel
       * {channelUnreadUiState: {first_unread_message_id: undefined, last_read: new Date(0), last_read_message_id: undefined, unread_messages: 0, }, messages: Array.from({length: 0})} // open an empty unread channel
       * {channelUnreadUiState: {first_unread_message_id: undefined, last_read: new Date(1), last_read_message_id: undefined, unread_messages: 0, }, messages: Array.from({length: 0})} // open an empty read channel
       */
      it('should exit early if the unread count is falsy', async () => {
        const {
          channels: [channel],
          client: chatClient,
        } = await initClientWithChannels({
          channelsData: [
            {
              messages: [generateMessage()],
              read: [
                {
                  first_unread_message_id: 'Y',
                  last_read: new Date().toISOString(),
                  last_read_message_id: 'X',
                  unread_messages: 0,
                  user,
                },
              ],
            },
          ],
          customUser: user,
        });
        const loadMessageIntoState = jest
          .spyOn(channel.state, 'loadMessageIntoState')
          .mockImplementation();

        const channelQuerySpy = jest.spyOn(channel, 'query').mockImplementation();

        let hasJumped;
        let highlightedMessageId;
        await renderComponent(
          { channel, chatClient },
          ({
            highlightedMessageId: highlightedMessageIdContext,
            jumpToFirstUnreadMessage,
          }) => {
            if (hasJumped) {
              highlightedMessageId = highlightedMessageIdContext;
              return;
            }
            jumpToFirstUnreadMessage();
            hasJumped = true;
          },
        );

        await waitFor(() => {
          expect(loadMessageIntoState).not.toHaveBeenCalled();
          expect(channelQuerySpy).not.toHaveBeenCalled();
          expect(highlightedMessageId).toBeUndefined();
        });
      });

      const runTest = async ({
        channelQueryResolvedValue,
        currentMsgSet,
        loadScenario,
        ownReadState,
      }) => {
        const {
          channels: [channel],
          client: chatClient,
        } = await initClientWithChannels({
          channelsData: [
            {
              messages: currentMsgSet,
              read: [ownReadState],
            },
          ],
          customUser: user,
        });
        let loadMessageIntoState;
        let channelQuerySpy;
        if (['already loaded', 'query fails'].includes(loadScenario)) {
          channelQuerySpy = jest.spyOn(channel, 'query').mockImplementation();
        } else {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useMockedApis(chatClient, [
            queryChannelWithNewMessages(channelQueryResolvedValue, channel),
          ]);
        }
        if (!loadScenario.startsWith('query by')) {
          loadMessageIntoState = jest
            .spyOn(channel.state, 'loadMessageIntoState')
            .mockImplementation();

          if (loadScenario === 'query fails') {
            loadMessageIntoState.mockRejectedValue('Query failed');
          }
        }

        let hasJumped;
        let notifications;
        let highlightedMessageId;
        let channelUnreadUiStateAfterJump;
        await act(async () => {
          await renderComponent(
            { channel, chatClient },
            ({
              channelUnreadUiState,
              highlightedMessageId: highlightedMessageIdContext,
              jumpToFirstUnreadMessage,
              notifications: contextNotifications,
              setChannelUnreadUiState,
            }) => {
              if (!channelUnreadUiState) return;
              if (
                ownReadState.first_unread_message_id &&
                !channelUnreadUiState.first_unread_message_id
              ) {
                setChannelUnreadUiState(ownReadState); // needed as the first_unread_message_id is not available on channels load
                return;
              }
              if (hasJumped) {
                notifications = contextNotifications;
                highlightedMessageId = highlightedMessageIdContext;
                channelUnreadUiStateAfterJump = channelUnreadUiState;
                return;
              }
              jumpToFirstUnreadMessage();
              hasJumped = true;
            },
          );
        });

        await waitFor(() => {
          if (loadScenario === 'already loaded') {
            expect(loadMessageIntoState).not.toHaveBeenCalled();
            expect(channelQuerySpy).not.toHaveBeenCalled();
          }

          if (loadScenario.match('query fails')) {
            expect(notifications).toHaveLength(1);
            expect(notifications[0].text).toBe(errorNotificationText);
            expect(highlightedMessageId).toBeUndefined();
          } else {
            expect(notifications).toHaveLength(0);
            expect(highlightedMessageId).toBe(first_unread_message_id);
            if (!ownReadState.first_unread_message_id) {
              expect(channelUnreadUiStateAfterJump.first_unread_message_id).toBe(
                first_unread_message_id,
              );
            }
          }
        });
      };

      it('should not query messages around the first unread message if it is already loaded in state', async () => {
        await runTest({
          currentMsgSet: currentMessageSetLastReadNotLoadedFirstUnreadLoaded,
          loadScenario: 'already loaded',
          ownReadState: ownReadStateFirstUnreadMsgIdKnown,
        });
      });

      it('should query messages around the first unread message if it is not loaded in state', async () => {
        await runTest({
          channelQueryResolvedValue: currentMessageSetLastReadFirstUnreadLoaded,
          currentMsgSet: currentMessageSetFirstUnreadLastReadNotLoaded,
          loadScenario: 'query by id',
          ownReadState: ownReadStateFirstUnreadMsgIdKnown,
        });
      });

      it('should handle query error if the first unread message is not found after channel query by message id', async () => {
        await runTest({
          currentMsgSet: currentMessageSetFirstUnreadLastReadNotLoaded,
          loadScenario: 'query fails',
          ownReadState: ownReadStateFirstUnreadMsgIdKnown,
        });
      });

      it('should not query messages around the last read message if it is already loaded in state', async () => {
        await runTest({
          currentMsgSet: currentMessageSetLastReadFirstUnreadLoaded,
          loadScenario: 'already loaded',
          ownReadState: ownReadStateLastReadMsgIdKnown,
        });
      });

      it('should query messages around the last read message if it is not loaded in state', async () => {
        await runTest({
          channelQueryResolvedValue: currentMessageSetLastReadFirstUnreadLoaded,
          currentMsgSet: currentMessageSetLastReadNotLoadedFirstUnreadLoaded,
          loadScenario: 'query by id',
          ownReadState: ownReadStateLastReadMsgIdKnown,
        });
      });

      it('should handle the query error if the last read message is not found after channel query by message id', async () => {
        await runTest({
          currentMsgSet: currentMessageSetLastReadNotLoadedFirstUnreadLoaded,
          loadScenario: 'query fails',
          ownReadState: ownReadStateLastReadMsgIdKnown,
        });
      });

      it('should not query messages by the last read date if the first unread message found in local state by last read date', async () => {
        await runTest({
          currentMsgSet: currentMessageSetLastReadFirstUnreadLoaded,
          loadScenario: 'already loaded',
          ownReadState: ownReadStateBase,
        });
      });

      it('should try to load messages into state and fail as first unread id is unknown and last read message is already in state', async () => {
        await runTest({
          currentMsgSet: currentMessageSetLastReadLoadedFirstUnreadNotLoaded,
          loadScenario: 'query fails',
          ownReadState: ownReadStateBase,
        });
      });

      it.each([
        ['is returned in query', currentMessageSetLastReadFirstUnreadLoaded],
        ['is not returned in query', currentMessageSetLastReadNotLoadedFirstUnreadLoaded],
      ])(
        'should query messages by last read date if the last read & first unread message not found in the local message list state and both ids are unknown and last read message %s',
        async (queryScenario, channelQueryResolvedValue) => {
          await runTest({
            channelQueryResolvedValue,
            currentMsgSet: currentMessageSetFirstUnreadLastReadNotLoaded,
            loadScenario: 'query by date',
            ownReadState: ownReadStateBase,
          });
        },
      );

      it('should handle query messages by last read date query error', async () => {
        await runTest({
          currentMsgSet: currentMessageSetFirstUnreadLastReadNotLoaded,
          loadScenario: 'query by date query fails',
          ownReadState: ownReadStateBase,
        });
      });

      // const timestamp = new Date('2024-01-01T00:00:00.000Z').getTime();
      it.each([
        [
          false,
          'last page',
          'first unread message',
          [
            generateMessage({ created_at: new Date('2024-01-01T00:00:00.000Z') }),
            generateMessage({
              created_at: new Date('2024-01-01T00:00:00.001Z'),
              id: last_read_message_id,
            }),
            generateMessage({
              created_at: new Date('2024-01-01T00:00:00.002Z'),
              id: first_unread_message_id,
            }),
            generateMessage({ created_at: new Date('2024-01-01T00:00:00.003Z') }),
          ],
          first_unread_message_id,
        ],
        [
          true,
          'other than last page',
          'first unread message',
          [
            generateMessage({ created_at: new Date('2024-01-01T00:00:00.000Z') }),
            generateMessage({ created_at: new Date('2024-01-01T00:00:00.001Z') }),
            generateMessage({
              created_at: new Date('2024-01-01T00:00:00.002Z'),
              id: last_read_message_id,
            }),
            generateMessage({
              created_at: new Date('2024-01-01T00:00:00.003Z'),
              id: first_unread_message_id,
            }),
          ],
          first_unread_message_id,
        ],
        [
          true,
          'other than last page',
          'last read message',
          [
            generateMessage({ created_at: new Date('2024-01-01T00:00:00.000Z') }),
            generateMessage({ created_at: new Date('2024-01-01T00:00:00.001Z') }),
            generateMessage({ created_at: new Date('2024-01-01T00:00:00.002Z') }),
            generateMessage({
              created_at: new Date('2024-01-01T00:00:00.003Z'),
              id: last_read_message_id,
            }),
          ],
          undefined,
        ],
      ])(
        'should set pagination flag hasMore to %s when messages query returns %s and chooses jump-to message id from %s',
        async (expectedHasMore, _, __, jumpToPage, expectedJumpToId) => {
          const {
            channels: [channel],
            client: chatClient,
          } = await initClientWithChannels({
            channelsData: [
              {
                messages: [generateMessage()],
                read: [
                  {
                    last_read: new Date().toISOString(),
                    last_read_message_id,
                    unread_messages: 1,
                    user,
                  },
                ],
              },
            ],
            customUser: user,
          });
          let hasJumped;
          let hasMoreMessages;
          let highlightedMessageId;
          let notifications;
          await renderComponent(
            { channel, chatClient },
            ({
              channelUnreadUiState,
              hasMore,
              highlightedMessageId: contextHighlightedMessageId,
              jumpToFirstUnreadMessage,
              notifications: contextNotifications,
            }) => {
              if (hasJumped) {
                hasMoreMessages = hasMore;
                highlightedMessageId = contextHighlightedMessageId;
                notifications = contextNotifications;
                return;
              }
              if (!channelUnreadUiState) return;
              useMockedApis(chatClient, [
                queryChannelWithNewMessages(jumpToPage, channel),
              ]);
              jumpToFirstUnreadMessage(jumpToPage.length);
              hasJumped = true;
            },
          );

          await waitFor(() => {
            expect(hasMoreMessages).toBe(expectedHasMore);
            expect(highlightedMessageId).toBe(expectedJumpToId);
            expect(notifications).toHaveLength(!expectedJumpToId ? 1 : 0);
          });
        },
      );
    });

    describe('Sending/removing/updating messages', () => {
      it('should remove error messages from channel state when sending a new message', async () => {
        const { channel, chatClient } = await initClient();
        const filterErrorMessagesSpy = jest.spyOn(channel.state, 'filterErrorMessages');
        // flag to prevent infinite loop
        let hasSent = false;

        await renderComponent({ channel, chatClient }, ({ sendMessage }) => {
          if (!hasSent) sendMessage({ text: 'message' });
          hasSent = true;
        });

        await waitFor(() => expect(filterErrorMessagesSpy).toHaveBeenCalledWith());
      });

      it('should add a preview for messages that are sent to the channel state, so that they are rendered even without API response', async () => {
        const { channel, chatClient } = await initClient();
        // flag to prevent infinite loop
        let hasSent = false;
        const messageText = 'bla bla';

        const { findByText } = await renderComponent(
          {
            channel,
            chatClient,
            children: <MockMessageList />,
          },
          ({ sendMessage }) => {
            jest
              .spyOn(channel, 'sendMessage')
              .mockImplementationOnce(() => new Promise(() => {}));
            if (!hasSent) sendMessage({ text: messageText });
            hasSent = true;
          },
        );

        expect(await findByText(messageText)).toBeInTheDocument();
      });

      it('should mark message as received when the backend reports duplicated message id', async () => {
        const { channel, chatClient } = await initClient();
        // flag to prevent infinite loop
        let hasSent = false;
        const messageText = 'hello world';
        const messageId = '123456';

        let originalMessageStatus = null;

        const { findByText } = await renderComponent(
          {
            channel,
            chatClient,
            children: <MockMessageList />,
          },
          ({ sendMessage }) => {
            jest.spyOn(channel, 'sendMessage').mockImplementation((message) => {
              originalMessageStatus = message.status;
              throw new chatClient.errorFromResponse({
                data: {
                  code: 4,
                  message: `SendMessage failed with error: "a message with ID ${message.id} already exists"`,
                },
                status: 400,
              });
            });
            if (!hasSent) {
              sendMessage({ text: messageText }, { id: messageId, status: 'sending' });
            }
            hasSent = true;
          },
        );
        expect(await findByText(messageText)).toBeInTheDocument();
        expect(originalMessageStatus).toBe('sending');

        const msg = channel.state.findMessage(messageId);
        expect(msg).toBeDefined();
        expect(msg.status).toBe('received');
      });

      it('should use the doSendMessageRequest prop to send messages if that is defined', async () => {
        const { channel, chatClient } = await initClient();
        // flag to prevent infinite loop
        let hasSent = false;
        const doSendMessageRequest = jest.fn(() => new Promise(() => {}));
        const message = { text: 'message' };
        await renderComponent(
          {
            channel,
            chatClient,
            doSendMessageRequest,
          },
          ({ sendMessage }) => {
            if (!hasSent) sendMessage(message);
            hasSent = true;
          },
        );

        await waitFor(() =>
          expect(doSendMessageRequest).toHaveBeenCalledWith(
            channel,
            expect.objectContaining(message),
            undefined,
          ),
        );
      });

      it('should eventually pass the result of the sendMessage API as part of ChannelActionContext', async () => {
        const { channel, chatClient } = await initClient();
        const sentMessage = { text: 'message' };
        const messageResponse = { text: 'different message' };
        let hasSent = false;

        const { findByText } = await renderComponent(
          {
            channel,
            chatClient,
            children: <MockMessageList />,
          },
          ({ sendMessage }) => {
            useMockedApis(chatClient, [sendMessageApi(generateMessage(messageResponse))]);
            if (!hasSent) sendMessage(sentMessage);
            hasSent = true;
          },
        );

        expect(await findByText(messageResponse.text)).toBeInTheDocument();
      });
      describe('delete message', () => {
        it('should throw error instead of calling default client.deleteMessage() function', async () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...message } = generateMessage();
          const { channel, chatClient } = await initClient();
          const clientDeleteMessageSpy = jest.spyOn(chatClient, 'deleteMessage');
          let deleteMessageHandler;
          await renderComponent({ channel, chatClient }, ({ deleteMessage }) => {
            deleteMessageHandler = deleteMessage;
          });

          await expect(() => deleteMessageHandler(message)).rejects.toThrow(
            'Cannot delete a message - missing message ID.',
          );
          expect(clientDeleteMessageSpy).not.toHaveBeenCalled();
        });

        it('should call the default client.deleteMessage() function', async () => {
          const message = generateMessage();
          const { channel, chatClient } = await initClient();
          const clientDeleteMessageSpy = jest
            .spyOn(chatClient, 'deleteMessage')
            .mockImplementationOnce(() => Promise.resolve({ message }));
          await renderComponent({ channel, chatClient }, ({ deleteMessage }) => {
            deleteMessage(message);
          });
          await waitFor(() =>
            expect(clientDeleteMessageSpy).toHaveBeenCalledWith(message.id),
          );
        });

        it('should throw error instead of calling custom doDeleteMessageRequest function', async () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...message } = generateMessage();
          const { channel, chatClient } = await initClient();
          const clientDeleteMessageSpy = jest
            .spyOn(chatClient, 'deleteMessage')
            .mockImplementationOnce(() => Promise.resolve({ message }));
          const doDeleteMessageRequest = jest.fn();
          let deleteMessageHandler;
          await renderComponent(
            { channel, chatClient, doDeleteMessageRequest },
            ({ deleteMessage }) => {
              deleteMessageHandler = deleteMessage;
            },
          );

          await expect(() => deleteMessageHandler(message)).rejects.toThrow(
            'Cannot delete a message - missing message ID.',
          );
          expect(clientDeleteMessageSpy).not.toHaveBeenCalled();
          expect(doDeleteMessageRequest).not.toHaveBeenCalled();
        });

        it('should call the custom doDeleteMessageRequest instead of client.deleteMessage()', async () => {
          const message = generateMessage();
          const { channel, chatClient } = await initClient();
          const doDeleteMessageRequest = jest.fn();
          const clientDeleteMessageSpy = jest
            .spyOn(chatClient, 'deleteMessage')
            .mockImplementationOnce(() => Promise.resolve({ message }));

          await renderComponent(
            { channel, chatClient, doDeleteMessageRequest },
            ({ deleteMessage }) => {
              deleteMessage(message);
            },
          );

          await waitFor(() => {
            expect(clientDeleteMessageSpy).not.toHaveBeenCalled();
            expect(doDeleteMessageRequest).toHaveBeenCalledWith(message);
          });
        });
      });

      it('should enable editing messages', async () => {
        const { channel, chatClient } = await initClient();
        const newText = 'something entirely different';
        const updatedMessage = { ...messages[0], text: newText };
        const clientUpdateMessageSpy = jest.spyOn(chatClient, 'updateMessage');
        await renderComponent({ channel, chatClient }, ({ editMessage }) => {
          editMessage(updatedMessage);
        });
        await waitFor(() =>
          expect(clientUpdateMessageSpy).toHaveBeenCalledWith(
            updatedMessage,
            undefined,
            undefined,
          ),
        );
      });

      it('should use doUpdateMessageRequest for the editMessage callback if provided', async () => {
        const { channel, chatClient } = await initClient();
        const doUpdateMessageRequest = jest.fn((channelId, message) => message);

        await renderComponent(
          { channel, chatClient, doUpdateMessageRequest },
          ({ editMessage }) => {
            editMessage(messages[0]);
          },
        );

        await waitFor(() =>
          expect(doUpdateMessageRequest).toHaveBeenCalledWith(
            channel.cid,
            messages[0],
            undefined,
          ),
        );
      });

      it('should update messages passed into the updateMessage callback', async () => {
        const { channel, chatClient } = await initClient();
        const newText = 'something entirely different';
        const updatedMessage = { ...messages[0], text: newText, updated_at: Date.now() };
        let hasUpdated = false;

        const { findByText } = await renderComponent(
          { channel, chatClient, children: <MockMessageList /> },
          ({ updateMessage }) => {
            if (!hasUpdated) updateMessage(updatedMessage);
            hasUpdated = true;
          },
        );

        await waitFor(async () => {
          expect(await findByText(updatedMessage.text)).toBeInTheDocument();
        });
      });

      it('should enable retrying message sending', async () => {
        const { channel, chatClient } = await initClient();
        // flag to prevent infinite loop
        let hasSent = false;
        let hasRetried = false;
        const messageObject = { text: 'bla bla' };

        await renderComponent(
          { channel, chatClient, children: <MockMessageList /> },
          ({ messages: contextMessages, retrySendMessage, sendMessage }) => {
            if (!hasSent) {
              jest
                .spyOn(channel, 'sendMessage')
                .mockImplementationOnce(() => Promise.reject());
              sendMessage(messageObject);
              hasSent = true;
            } else if (
              !hasRetried &&
              contextMessages.some(({ status }) => status === 'failed')
            ) {
              // retry
              useMockedApis(chatClient, [sendMessageApi(messageObject)]);
              retrySendMessage(messageObject);
              hasRetried = true;
            }
          },
        );

        expect(screen.queryByText(messageObject.text)).toBeInTheDocument();
      });

      it('should remove scraped attachment on retry-sending message', async () => {
        const { channel, chatClient } = await initClient();
        // flag to prevent infinite loop
        let hasSent = false;
        let hasRetried = false;
        const fileAttachment = generateFileAttachment();
        const scrapedAttachment = generateScrapedDataAttachment();
        const attachments = [fileAttachment, scrapedAttachment];
        const messageObject = { attachments, text: 'bla bla' };
        const sendMessageSpy = jest
          .spyOn(channel, 'sendMessage')
          .mockImplementationOnce(() => Promise.reject());

        await renderComponent(
          { channel, chatClient, children: <MockMessageList /> },
          ({ messages: contextMessages, retrySendMessage, sendMessage }) => {
            if (!hasSent) {
              sendMessage(messageObject);
              hasSent = true;
            } else if (
              !hasRetried &&
              contextMessages.some(({ status }) => status === 'failed')
            ) {
              // retry
              useMockedApis(chatClient, [sendMessageApi(generateMessage(messageObject))]);
              retrySendMessage(messageObject);
              hasRetried = true;
            }
          },
        );

        expect(sendMessageSpy).not.toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ attachments: [scrapedAttachment] }),
        );
        expect(sendMessageSpy).not.toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ attachments: [fileAttachment] }),
        );
      });

      it('should allow removing messages', async () => {
        const { channel, chatClient } = await initClient();
        let allMessagesRemoved = false;
        const removeSpy = jest.spyOn(channel.state, 'removeMessage');

        await renderComponent(
          { channel, chatClient },
          ({ messages: contextMessages, removeMessage }) => {
            if (contextMessages.length > 0) {
              // if there are messages passed as the context, remove them
              removeMessage(contextMessages[0]);
            } else {
              // once they're all gone, set to true so we can verify that we no longer have messages
              allMessagesRemoved = true;
            }
          },
        );

        await waitFor(() => expect(removeSpy).toHaveBeenCalledWith(messages[0]));
        await waitFor(() => expect(allMessagesRemoved).toBe(true));
      });
    });

    describe('Channel events', () => {
      // note: these tests rely on Client.dispatchEvent, which eventually propagates to the channel component.
      const createOneTimeEventDispatcher = (event, client, channel) => {
        let hasDispatchedEvent = false;
        return () => {
          if (!hasDispatchedEvent)
            client.dispatchEvent({
              ...event,
              cid: channel.cid,
            });
          hasDispatchedEvent = true;
        };
      };

      const createChannelEventDispatcher = (
        body,
        client,
        channel,
        type = 'message.new',
      ) =>
        createOneTimeEventDispatcher(
          {
            type,
            ...body,
          },
          client,
          channel,
        );

      it('should eventually pass down a message when a message.new event is triggered on the channel', async () => {
        const { channel, chatClient } = await initClient();
        const message = generateMessage({ user });
        const dispatchMessageEvent = createChannelEventDispatcher(
          { message },
          chatClient,
          channel,
        );

        const { findByText } = await renderComponent(
          {
            channel,
            chatClient,
            children: <MockMessageList />,
          },
          () => {
            // dispatch event in effect because it happens after active channel is set
            dispatchMessageEvent();
          },
        );

        expect(await findByText(message.text)).toBeInTheDocument();
      });

      it('should not overwrite the message with send response, if already updated by WS events', async () => {
        const { channel, chatClient } = await initClient();
        let oldText;
        const newText = 'new text';
        const creationDate = new Date();
        const created_at = creationDate.toISOString();
        const updated_at = new Date(creationDate.getTime() + 1).toISOString();
        let hasSent = false;

        jest.spyOn(channel, 'sendMessage').mockImplementationOnce((message) => {
          oldText = message.text;
          const finalMessage = { ...message, created_at, updated_at: created_at };
          useMockedApis(chatClient, [sendMessageApi(finalMessage)]);
          // both effects have to be emitted, otherwise the original message in status "sending" will not be filtered out (done when message.new is emitted) => and the message.updated event would add the updated message as a new message.
          createChannelEventDispatcher(
            {
              created_at,
              message: {
                ...finalMessage,
                text: newText,
              },
              user,
            },
            chatClient,
            channel,
          )();
          createChannelEventDispatcher(
            {
              created_at: updated_at,
              message: {
                ...finalMessage,
                text: newText,
                updated_at,
                user,
              },
              type: 'message.updated',
            },
            chatClient,
            channel,
          )();
          return channel.sendMessage(message);
        });

        const { queryByText } = await renderComponent(
          { channel, chatClient, children: <MockMessageList /> },
          ({ sendMessage }) => {
            if (!hasSent) {
              sendMessage(generateMessage());
              hasSent = true;
            }
          },
        );

        await waitFor(async () => {
          expect(
            await queryByText(oldText, undefined, { timeout: 100 }),
          ).not.toBeInTheDocument();
          expect(
            await queryByText(newText, undefined, { timeout: 100 }),
          ).toBeInTheDocument();
        });
      });

      it('should overwrite the message of status "sending" regardless of updated_at timestamp', async () => {
        const { channel, chatClient } = await initClient();
        let oldText;
        const newText = 'new text';
        const creationDate = new Date();
        const created_at = creationDate.toISOString();
        const updated_at = new Date(creationDate.getTime() - 1).toISOString();
        let hasSent = false;

        jest.spyOn(channel, 'sendMessage').mockImplementationOnce((message) => {
          oldText = message.text;
          const finalMessage = { ...message, created_at, text: newText, updated_at };
          useMockedApis(chatClient, [sendMessageApi(finalMessage)]);
          return channel.sendMessage(message);
        });

        const { queryByText } = await renderComponent(
          { channel, chatClient, children: <MockMessageList /> },
          ({ sendMessage }) => {
            if (!hasSent) {
              sendMessage(generateMessage());
              hasSent = true;
            }
          },
        );

        await waitFor(async () => {
          expect(
            await queryByText(oldText, undefined, { timeout: 100 }),
          ).not.toBeInTheDocument();
          expect(
            await queryByText(newText, undefined, { timeout: 100 }),
          ).toBeInTheDocument();
        });
      });

      it('should not mark the channel as read if a new message from another user comes in and the user is looking at the page', async () => {
        const { channel, chatClient } = await initClient();
        const markReadSpy = jest.spyOn(channel, 'markRead');

        const message = generateMessage({ user: generateUser() });
        const dispatchMessageEvent = createChannelEventDispatcher(
          { message },
          chatClient,
          channel,
        );

        await renderComponent({ channel, chatClient }, () => {
          dispatchMessageEvent();
        });

        await waitFor(() => expect(markReadSpy).not.toHaveBeenCalled());
      });

      it('should not mark the channel as read if the new message author is the current user and the user is looking at the page', async () => {
        const { channel, chatClient } = await initClient();
        const markReadSpy = jest.spyOn(channel, 'markRead');

        const message = generateMessage({ user: generateUser() });
        const dispatchMessageEvent = createChannelEventDispatcher(
          { message },
          chatClient,
          channel,
        );

        await renderComponent({ channel, chatClient }, () => {
          dispatchMessageEvent();
        });

        await waitFor(() => expect(markReadSpy).not.toHaveBeenCalled());
      });

      it('title of the page should include the unread count if the user is not looking at the page when a new message event happens', async () => {
        const { channel, chatClient } = await initClient();
        const unreadAmount = 1;
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          get: () => true,
        });
        jest.spyOn(channel, 'countUnread').mockImplementation(() => unreadAmount);
        const message = generateMessage({ user: generateUser() });
        const dispatchMessageEvent = createChannelEventDispatcher(
          { message },
          chatClient,
          channel,
        );

        await renderComponent({ channel, chatClient }, () => {
          dispatchMessageEvent();
        });

        await waitFor(() => expect(document.title).toContain(`${unreadAmount}`));
      });

      it('should update the `thread` parent message if an event comes in that modifies it', async () => {
        const { channel, chatClient } = await initClient();
        const threadMessage = messages[0];
        const newText = 'new text';
        const updatedThreadMessage = { ...threadMessage, text: newText };
        const dispatchUpdateMessageEvent = createChannelEventDispatcher(
          { message: updatedThreadMessage, type: 'message.updated' },
          chatClient,
          channel,
        );
        let threadStarterHasUpdatedText = false;
        await renderComponent({ channel, chatClient }, ({ openThread, thread }) => {
          if (!thread) {
            // first, open thread
            openThread(threadMessage, { preventDefault: () => null });
          } else if (thread.text !== newText) {
            // then, update the thread message
            // FIXME: dispatch event needs to be queued on event loop now
            setTimeout(() => dispatchUpdateMessageEvent(), 0);
          } else {
            threadStarterHasUpdatedText = true;
          }
        });

        await waitFor(() => expect(threadStarterHasUpdatedText).toBe(true));
      });

      it('should update the threadMessages if a new message comes in that is part of the thread', async () => {
        const { channel, chatClient } = await initClient();
        const threadMessage = messages[0];
        const newThreadMessage = generateMessage({
          parent_id: threadMessage.id,
        });
        const dispatchNewThreadMessageEvent = createChannelEventDispatcher(
          {
            message: newThreadMessage,
          },
          chatClient,
          channel,
        );
        let newThreadMessageWasAdded = false;
        await renderComponent(
          { channel, chatClient },
          ({ openThread, thread, threadMessages }) => {
            if (!thread) {
              // first, open thread
              openThread(threadMessage, { preventDefault: () => null });
            } else if (!threadMessages.some(({ id }) => id === newThreadMessage.id)) {
              // then, add new thread message
              // FIXME: dispatch event needs to be queued on event loop now
              setTimeout(() => dispatchNewThreadMessageEvent(), 0);
            } else {
              newThreadMessageWasAdded = true;
            }
          },
        );

        await waitFor(() => expect(newThreadMessageWasAdded).toBe(true));
      });

      [
        {
          component: MessageList,
          getFirstMessageAvatar: () => {
            const [avatar] = screen.queryAllByTestId('custom-avatar') || [];
            return avatar;
          },
          name: 'MessageList',
        },
        {
          callback:
            (message) =>
            ({ openThread, thread }) => {
              if (!thread) openThread(message, { preventDefault: () => null });
            },
          component: Thread,
          getFirstMessageAvatar: () => {
            // the first avatar is that of the ThreadHeader
            const avatars = screen.queryAllByTestId('custom-avatar') || [];
            return avatars[0];
          },
          name: 'Thread',
        },
      ].forEach(({ callback, component: Component, getFirstMessageAvatar, name }) => {
        const [threadMessage] = messages;

        it(`should update user data in ${name} based on updated_at`, async () => {
          const { channel, chatClient } = await initClient();
          const updatedAttribute = { name: 'newName' };
          const dispatchUserUpdatedEvent = createChannelEventDispatcher(
            {
              type: 'user.updated',
              user: {
                ...user,
                ...updatedAttribute,
                updated_at: new Date().toISOString(),
              },
            },
            chatClient,
            channel,
          );
          await renderComponent(
            {
              Avatar: MockAvatar,
              channel,
              chatClient,
              children: <Component />,
            },
            callback?.(threadMessage),
          );

          await waitFor(() => {
            expect(getFirstMessageAvatar()).toHaveTextContent(user.name);
          });

          await act(() => {
            dispatchUserUpdatedEvent();
          });

          await waitFor(() => {
            expect(getFirstMessageAvatar()).toHaveTextContent(updatedAttribute.name);
          });
        });

        it(`should not update user data in ${name} if updated_at has not changed`, async () => {
          const { channel, chatClient } = await initClient();
          const updatedAttribute = { name: 'newName' };
          const dispatchUserUpdatedEvent = createChannelEventDispatcher(
            {
              type: 'user.updated',
              user: { ...user, ...updatedAttribute },
            },
            chatClient,
            channel,
          );
          await renderComponent(
            {
              Avatar: MockAvatar,
              channel,
              chatClient,
              children: <Component />,
            },
            callback?.(threadMessage),
          );

          await waitFor(() => {
            expect(getFirstMessageAvatar()).toHaveTextContent(user.name);
          });

          await act(() => {
            dispatchUserUpdatedEvent();
          });

          await waitFor(() => {
            expect(getFirstMessageAvatar()).toHaveTextContent(user.name);
          });
        });
      });

      it.each([
        ['should', 'active'],
        ['should not', 'another'],
      ])(
        '%s reset channel unread UI state on channel.truncated for the %s channel',
        async (expected, forChannel) => {
          const unread_messages = 20;
          const NO_UNREAD_TEXT = 'no-unread-text';
          const UNREAD_TEXT = `unread-text-${unread_messages}`;
          const {
            channels: [activeChannel, anotherChannel],
            client: chatClient,
          } = await initClientWithChannels({
            channelsData: [
              {
                messages: [generateMessage()],
                read: [
                  {
                    last_read: new Date().toISOString(),
                    last_read_message_id: 'last_read_message_id-1',
                    unread_messages,
                    user,
                  },
                ],
              },
              {
                messages: [generateMessage()],
                read: [
                  {
                    last_read: new Date().toISOString(),
                    last_read_message_id: 'last_read_message_id-2',
                    unread_messages,
                    user,
                  },
                ],
              },
            ],
            customUser: user,
          });

          const Component = () => {
            const { channelUnreadUiState } = useChannelStateContext();
            if (!channelUnreadUiState) return <div>{NO_UNREAD_TEXT}</div>;
            return <div>{`unread-text-${channelUnreadUiState.unread_messages}`}</div>;
          };

          await act(async () => {
            await renderComponent({
              channel: activeChannel,
              chatClient,
              children: <Component />,
            });
          });

          expect(screen.queryByText(UNREAD_TEXT)).toBeInTheDocument();
          expect(screen.queryByText(NO_UNREAD_TEXT)).not.toBeInTheDocument();

          act(() => {
            dispatchChannelTruncatedEvent(
              chatClient,
              forChannel === 'active' ? activeChannel : anotherChannel,
            );
          });

          if (forChannel === 'active') {
            expect(screen.queryByText(UNREAD_TEXT)).not.toBeInTheDocument();
            expect(screen.queryByText(NO_UNREAD_TEXT)).toBeInTheDocument();
          } else {
            expect(screen.queryByText(UNREAD_TEXT)).toBeInTheDocument();
            expect(screen.queryByText(NO_UNREAD_TEXT)).not.toBeInTheDocument();
          }
        },
      );
    });
  });

  describe('Custom Components', () => {
    it('should render CustomMessageActionsList if provided', async () => {
      const { channel, chatClient } = await initClient();
      const CustomMessageActionsList = jest
        .fn()
        .mockImplementation(() => 'CustomMessageActionsList');

      const messageContextValue = {
        message: generateMessage(),
        messageListRect: {},
      };

      await renderComponent({
        channel,
        chatClient,
        children: (
          <MessageProvider value={{ ...messageContextValue }}>
            <MessageActionsBox getMessageActions={jest.fn(() => [])} />
          </MessageProvider>
        ),
        CustomMessageActionsList,
      });

      await waitFor(() => {
        expect(CustomMessageActionsList).toHaveBeenCalledTimes(1);
      });
    });
  });
});
