import React, { useEffect } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Channel } from '../Channel';
import { Chat } from '../../Chat';
import { LoadingErrorIndicator } from '../../Loading';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { ChatProvider, useChatContext } from '../../../context/ChatContext';
import { useComponentContext } from '../../../context/ComponentContext';
import { useEmojiContext } from '../../../context/EmojiContext';
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  sendMessageApi,
  threadRepliesApi,
  useMockedApis,
} from '../../../mock-builders';
import { MessageList } from '../../MessageList';
import { Thread } from '../../Thread';

jest.mock('../../Loading', () => ({
  LoadingErrorIndicator: jest.fn(() => <div />),
  LoadingIndicator: jest.fn(() => <div>loading</div>),
}));

const MockAvatar = ({ name }) => (
  <div className='avatar' data-testid='custom-avatar'>
    {name}
  </div>
);

let chatClient;
let channel;

// This component is used for performing effects in a component that consumes the contexts from Channel,
// i.e. making use of the callbacks & values provided by the Channel component.
// the effect is called every time channelContext changes
const CallbackEffectWithChannelContexts = ({ callback }) => {
  const channelStateContext = useChannelStateContext();
  const channelActionContext = useChannelActionContext();
  const componentContext = useComponentContext();
  const emojiContext = useEmojiContext();

  const channelContext = {
    ...channelStateContext,
    ...channelActionContext,
    ...componentContext,
    ...emojiContext,
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

// create a full message state so we can properly test `loadMore`
const messages = Array.from({ length: 25 }, () => generateMessage({ user }));

const pinnedMessages = [generateMessage({ pinned: true, user })];

const renderComponent = (props = {}, callback = () => {}) =>
  render(
    <Chat client={chatClient}>
      <ActiveChannelSetter activeChannel={channel} />
      <Channel {...props}>
        {props.children}
        <CallbackEffectWithChannelContexts callback={callback} />
      </Channel>
    </Chat>,
  );

describe('Channel', () => {
  const MockMessageList = () => {
    const { messages: channelMessages } = useChannelStateContext();

    return channelMessages.map(
      ({ id, status, text }) => status !== 'failed' && <div key={id}>{text}</div>,
    );
  };

  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannel({
      members,
      messages,
      pinnedMessages,
    });
    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.channel.id);

    jest.spyOn(channel, 'getConfig').mockImplementation(() => mockedChannel.channel.config);
  });

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
    const childrenContent = 'Channel children';
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
        <Channel LoadingIndicator={() => <div>{loadingText}</div>}>{childrenContent}</Channel>
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
    const watchSpy = jest.spyOn(channel, 'watch');

    await act(() => {
      renderComponent();
    });

    await waitFor(() => expect(watchSpy).toHaveBeenCalledTimes(1));
  });

  it('should not call watch the current channel on mount if channel is initialized', async () => {
    const watchSpy = jest.spyOn(channel, 'watch');
    channel.initialized = true;
    await act(() => {
      renderComponent();
    });
    await waitFor(() => expect(watchSpy).not.toHaveBeenCalled());
  });

  it('should set an error if watching the channel goes wrong, and render a LoadingErrorIndicator', async () => {
    const watchError = new Error('watching went wrong');
    jest.spyOn(channel, 'watch').mockImplementationOnce(() => Promise.reject(watchError));

    renderComponent();

    await waitFor(() =>
      expect(LoadingErrorIndicator).toHaveBeenCalledWith(
        expect.objectContaining({
          error: watchError,
        }),
        expect.any(Object),
      ),
    );
  });

  it('should render a LoadingIndicator if it is loading', async () => {
    const watchPromise = new Promise(() => {});
    jest.spyOn(channel, 'watch').mockImplementationOnce(() => watchPromise);
    let result;
    await act(() => {
      result = renderComponent();
    });

    await waitFor(() => expect(result.asFragment()).toMatchSnapshot());
  });

  it('should provide context and render children if channel is set and the component is not loading or errored', async () => {
    const { findByText } = renderComponent({ children: <div>children</div> });

    expect(await findByText('children')).toBeInTheDocument();
  });

  it('should store pinned messages as an array in the channel context', async () => {
    let ctxPins;

    const { getByText } = renderComponent(
      {
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
    const clientOnSpy = jest.spyOn(chatClient, 'on');

    renderComponent();

    await waitFor(() =>
      expect(clientOnSpy).toHaveBeenCalledWith('connection.recovered', expect.any(Function)),
    );
  });

  it('should add an `on` handler to the channel on mount', async () => {
    const channelOnSpy = jest.spyOn(channel, 'on');
    renderComponent();

    await waitFor(() => expect(channelOnSpy).toHaveBeenCalledWith(expect.any(Function)));
  });

  it('should mark the current channel as read if the user switches to the current window', async () => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
    const markReadSpy = jest.spyOn(channel, 'markRead');
    const watchSpy = jest.spyOn(channel, 'watch');

    renderComponent();

    // first, wait for the effect in which the channel is watched,
    // so we know the event listener is added to the document.
    await waitFor(() => expect(watchSpy).toHaveBeenCalledWith());
    setTimeout(() => fireEvent(document, new Event('visibilitychange')), 0);

    await waitFor(() => expect(markReadSpy).toHaveBeenCalledWith());
  });

  it('should mark the channel as read if the count of unread messages is higher than 0 on mount', async () => {
    jest.spyOn(channel, 'countUnread').mockImplementationOnce(() => 1);
    const markReadSpy = jest.spyOn(channel, 'markRead');

    renderComponent();

    await waitFor(() => expect(markReadSpy).toHaveBeenCalledWith());
  });
  it('should use the doMarkReadRequest prop to mark channel as read, if that is defined', async () => {
    jest.spyOn(channel, 'countUnread').mockImplementationOnce(() => 1);
    const doMarkReadRequest = jest.fn();

    renderComponent({
      doMarkReadRequest,
    });

    await waitFor(() => expect(doMarkReadRequest).toHaveBeenCalledTimes(1));
  });

  describe('Children that consume the contexts set in Channel', () => {
    it('should expose the emoji config', async () => {
      let context;
      const emojiData = {
        aliases: {},
        categories: [],
        compressed: true,
        emojis: {},
      };
      const CustomEmojiPicker = () => <div />;
      const CustomEmoji = () => <span />;

      renderComponent({ Emoji: CustomEmoji, emojiData, EmojiPicker: CustomEmojiPicker }, (ctx) => {
        context = ctx;
      });

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        expect(context.emojiConfig.emojiData).toBe(emojiData);
        expect(context.EmojiPicker).toBe(CustomEmojiPicker);
        expect(context.Emoji).toBe(CustomEmoji);
      });
    });

    it('should be able to open threads', async () => {
      const threadMessage = messages[0];
      const hasThread = jest.fn();

      // this renders Channel, calls openThread from a child context consumer with a message,
      // and then calls hasThread with the thread id if it was set.
      renderComponent({}, ({ openThread, thread }) => {
        if (!thread) {
          openThread(threadMessage, { preventDefault: () => null });
        } else {
          hasThread(thread.id);
        }
      });

      await waitFor(() => expect(hasThread).toHaveBeenCalledWith(threadMessage.id));
    });

    it('should be able to load more messages in a thread', async () => {
      const getRepliesSpy = jest.spyOn(channel, 'getReplies');
      const threadMessage = messages[0];

      const replies = [generateMessage({ parent_id: threadMessage.id })];

      useMockedApis(chatClient, [threadRepliesApi(replies)]);

      const hasThreadMessages = jest.fn();

      renderComponent({}, ({ loadMoreThread, openThread, thread, threadMessages }) => {
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
      });

      await waitFor(() => {
        expect(getRepliesSpy).toHaveBeenCalledWith(threadMessage.id, expect.any(Object));
      });
      await waitFor(() => {
        expect(hasThreadMessages).toHaveBeenCalledWith(replies);
      });
    });

    it('should allow closing a thread after it has been opened', async () => {
      let threadHasClosed = false;
      const threadMessage = messages[0];

      let threadHasAlreadyBeenOpened = false;
      renderComponent({}, ({ closeThread, openThread, thread }) => {
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
      });

      await waitFor(() => expect(threadHasClosed).toBe(true));
    });

    it('should call the onMentionsHover/onMentionsClick prop if a child component calls onMentionsHover with the right event', async () => {
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

      const { findByText } = renderComponent({
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
      const queryChannelWithNewMessages = (newMessages) =>
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
      const limit = 10;
      it('should be able to load more messages', async () => {
        const channelQuerySpy = jest.spyOn(channel, 'query');
        let newMessageAdded = false;

        const newMessages = [generateMessage()];

        renderComponent({}, ({ loadMore, messages: contextMessages }) => {
          if (!contextMessages.find((message) => message.id === newMessages[0].id)) {
            // Our new message is not yet passed as part of channel context. Call loadMore and mock API response to include it.
            useMockedApis(chatClient, [queryChannelWithNewMessages(newMessages)]);
            loadMore(limit);
          } else {
            // If message has been added, update checker so we can verify it happened.
            newMessageAdded = true;
          }
        });

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
        let channelHasMore = false;
        const newMessages = [generateMessage()];
        await act(() => {
          renderComponent({}, ({ hasMore, loadMore, messages: contextMessages }) => {
            if (!contextMessages.find((message) => message.id === newMessages[0].id)) {
              // Our new message is not yet passed as part of channel context. Call loadMore and mock API response to include it.
              useMockedApis(chatClient, [queryChannelWithNewMessages(newMessages)]);
              loadMore(limit);
            } else {
              // If message has been added, set our checker variable so we can verify if hasMore is false.
              channelHasMore = hasMore;
            }
          });
        });

        await waitFor(() => expect(channelHasMore).toBe(false));
      });

      it('should set hasMore to true if querying channel returns an amount of messages that equals the limit', async () => {
        let channelHasMore = false;
        const newMessages = Array(limit)
          .fill(null)
          .map(() => generateMessage());
        await act(() => {
          renderComponent({}, ({ hasMore, loadMore, messages: contextMessages }) => {
            if (!contextMessages.some((message) => message.id === newMessages[0].id)) {
              // Our new messages are not yet passed as part of channel context. Call loadMore and mock API response to include it.
              useMockedApis(chatClient, [queryChannelWithNewMessages(newMessages)]);
              loadMore(limit);
            } else {
              // If message has been added, set our checker variable so we can verify if hasMore is true.
              channelHasMore = hasMore;
            }
          });
        });

        await waitFor(() => expect(channelHasMore).toBe(true));
      });

      it('should set loadingMore to true while loading more', async () => {
        const queryPromise = new Promise(() => {});
        let isLoadingMore = false;

        renderComponent({}, ({ loadingMore, loadMore }) => {
          // return a promise that hasn't resolved yet, so loadMore will be stuck in the 'await' part of the function
          jest.spyOn(channel, 'query').mockImplementationOnce(() => queryPromise);
          loadMore();
          isLoadingMore = loadingMore;
        });
        await waitFor(() => expect(isLoadingMore).toBe(true));
      });
    });

    describe('Sending/removing/updating messages', () => {
      it('should remove error messages from channel state when sending a new message', async () => {
        const filterErrorMessagesSpy = jest.spyOn(channel.state, 'filterErrorMessages');
        // flag to prevent infinite loop
        let hasSent = false;

        renderComponent({}, ({ sendMessage }) => {
          if (!hasSent) sendMessage({ text: 'message' });
          hasSent = true;
        });

        await waitFor(() => expect(filterErrorMessagesSpy).toHaveBeenCalledWith());
      });

      it('should add a preview for messages that are sent to the channel state, so that they are rendered even without API response', async () => {
        // flag to prevent infinite loop
        let hasSent = false;
        const messageText = 'bla bla';

        const { findByText } = renderComponent(
          {
            children: <MockMessageList />,
          },
          ({ sendMessage }) => {
            jest.spyOn(channel, 'sendMessage').mockImplementationOnce(() => new Promise(() => {}));
            if (!hasSent) sendMessage({ text: messageText });
            hasSent = true;
          },
        );

        expect(await findByText(messageText)).toBeInTheDocument();
      });

      it('should use the doSendMessageRequest prop to send messages if that is defined', async () => {
        // flag to prevent infinite loop
        let hasSent = false;
        const doSendMessageRequest = jest.fn(() => new Promise(() => {}));
        const message = { text: 'message' };
        renderComponent(
          {
            doSendMessageRequest,
          },
          ({ sendMessage }) => {
            if (!hasSent) sendMessage(message);
            hasSent = true;
          },
        );

        await waitFor(() =>
          expect(doSendMessageRequest).toHaveBeenCalledWith(
            channel.cid,
            expect.objectContaining(message),
          ),
        );
      });

      it('should eventually pass the result of the sendMessage API as part of ChannelActionContext', async () => {
        const sentMessage = { text: 'message' };
        const messageResponse = { text: 'different message' };
        let hasSent = false;

        const { findByText } = renderComponent(
          {
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

      it('should enable editing messages', async () => {
        const newText = 'something entirely different';
        const updatedMessage = { ...messages[0], text: newText };
        const clientUpdateMessageSpy = jest.spyOn(chatClient, 'updateMessage');
        renderComponent({}, ({ editMessage }) => {
          editMessage(updatedMessage);
        });
        await waitFor(() => expect(clientUpdateMessageSpy).toHaveBeenCalledWith(updatedMessage));
      });

      it('should use doUpdateMessageRequest for the editMessage callback if provided', async () => {
        const doUpdateMessageRequest = jest.fn((channelId, message) => message);

        renderComponent({ doUpdateMessageRequest }, ({ editMessage }) => {
          editMessage(messages[0]);
        });

        await waitFor(() =>
          expect(doUpdateMessageRequest).toHaveBeenCalledWith(channel.cid, messages[0]),
        );
      });

      it('should update messages passed into the updateMessage callback', async () => {
        const newText = 'something entirely different';
        const updatedMessage = { ...messages[0], text: newText, updated_at: Date.now() };
        let hasUpdated = false;

        const { findByText } = renderComponent(
          { children: <MockMessageList /> },
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
        // flag to prevent infinite loop
        let hasSent = false;
        let hasRetried = false;
        const messageObject = { text: 'bla bla' };

        const { findByText } = renderComponent(
          { children: <MockMessageList /> },
          ({ messages: contextMessages, retrySendMessage, sendMessage }) => {
            if (!hasSent) {
              jest.spyOn(channel, 'sendMessage').mockImplementationOnce(() => Promise.reject());
              sendMessage(messageObject);
              hasSent = true;
            } else if (!hasRetried && contextMessages.some(({ status }) => status === 'failed')) {
              // retry
              useMockedApis(chatClient, [sendMessageApi(generateMessage(messageObject))]);
              retrySendMessage(messageObject);
              hasRetried = true;
            }
          },
        );

        await waitFor(async () => {
          expect(await findByText(messageObject.text)).toBeInTheDocument();
        });
      });

      it('should allow removing messages', async () => {
        let allMessagesRemoved = false;
        const removeSpy = jest.spyOn(channel.state, 'removeMessage');

        renderComponent({}, ({ messages: contextMessages, removeMessage }) => {
          if (contextMessages.length > 0) {
            // if there are messages passed as the context, remove them
            removeMessage(contextMessages[0]);
          } else {
            // once they're all gone, set to true so we can verify that we no longer have messages
            allMessagesRemoved = true;
          }
        });

        await waitFor(() => expect(removeSpy).toHaveBeenCalledWith(messages[0]));
        await waitFor(() => expect(allMessagesRemoved).toBe(true));
      });
    });

    describe('Channel events', () => {
      // note: these tests rely on Client.dispatchEvent, which eventually propagates to the channel component.
      const createOneTimeEventDispatcher = (event) => {
        let hasDispatchedEvent = false;
        return () => {
          if (!hasDispatchedEvent)
            chatClient.dispatchEvent({
              ...event,
              cid: channel.cid,
            });
          hasDispatchedEvent = true;
        };
      };

      const createChannelEventDispatcher = (body, type = 'message.new') =>
        createOneTimeEventDispatcher({
          type,
          ...body,
        });

      it('should eventually pass down a message when a message.new event is triggered on the channel', async () => {
        const message = generateMessage({ user });
        const dispatchMessageEvent = createChannelEventDispatcher({ message });

        const { findByText } = renderComponent(
          {
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
          createChannelEventDispatcher({
            created_at,
            message: {
              ...finalMessage,
              text: newText,
            },
            user,
          })();
          createChannelEventDispatcher({
            created_at: updated_at,
            message: {
              ...finalMessage,
              text: newText,
              updated_at,
              user,
            },
            type: 'message.updated',
          })();
          return channel.sendMessage(message);
        });

        const { queryByText } = renderComponent(
          { children: <MockMessageList /> },
          ({ sendMessage }) => {
            if (!hasSent) {
              sendMessage(generateMessage());
              hasSent = true;
            }
          },
        );

        await waitFor(async () => {
          expect(await queryByText(oldText, undefined, { timeout: 100 })).not.toBeInTheDocument();
          expect(await queryByText(newText, undefined, { timeout: 100 })).toBeInTheDocument();
        });
      });

      it('should overwrite the message of status "sending" regardless of updated_at timestamp', async () => {
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

        const { queryByText } = renderComponent(
          { children: <MockMessageList /> },
          ({ sendMessage }) => {
            if (!hasSent) {
              sendMessage(generateMessage());
              hasSent = true;
            }
          },
        );

        await waitFor(async () => {
          expect(await queryByText(oldText, undefined, { timeout: 100 })).not.toBeInTheDocument();
          expect(await queryByText(newText, undefined, { timeout: 100 })).toBeInTheDocument();
        });
      });

      it('should mark the channel as read if a new message from another user comes in and the user is looking at the page', async () => {
        const markReadSpy = jest.spyOn(channel, 'markRead');

        const message = generateMessage({ user: generateUser() });
        const dispatchMessageEvent = createChannelEventDispatcher({ message });

        renderComponent({}, () => {
          dispatchMessageEvent();
        });

        await waitFor(() => expect(markReadSpy).toHaveBeenCalledWith());
      });

      it('title of the page should include the unread count if the user is not looking at the page when a new message event happens', async () => {
        const unreadAmount = 1;
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          get: () => true,
        });
        jest.spyOn(channel, 'countUnread').mockImplementation(() => unreadAmount);
        const message = generateMessage({ user: generateUser() });
        const dispatchMessageEvent = createChannelEventDispatcher({ message });

        renderComponent({}, () => {
          dispatchMessageEvent();
        });

        await waitFor(() => expect(document.title).toContain(`${unreadAmount}`));
      });

      it('should update the `thread` parent message if an event comes in that modifies it', async () => {
        const threadMessage = messages[0];
        const newText = 'new text';
        const updatedThreadMessage = { ...threadMessage, text: newText };
        const dispatchUpdateMessageEvent = createChannelEventDispatcher(
          { message: updatedThreadMessage },
          'message.updated',
        );
        let threadStarterHasUpdatedText = false;
        renderComponent({}, ({ openThread, thread }) => {
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
        const threadMessage = messages[0];
        const newThreadMessage = generateMessage({
          parent_id: threadMessage.id,
        });
        const dispatchNewThreadMessageEvent = createChannelEventDispatcher({
          message: newThreadMessage,
        });
        let newThreadMessageWasAdded = false;
        renderComponent({}, ({ openThread, thread, threadMessages }) => {
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
        });

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
          callback: (message) => ({ openThread, thread }) => {
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
          const updatedAttribute = { name: 'newName' };
          const dispatchUserUpdatedEvent = createChannelEventDispatcher(
            {
              user: { ...user, ...updatedAttribute, updated_at: new Date().toISOString() },
            },
            'user.updated',
          );
          renderComponent(
            {
              Avatar: MockAvatar,
              children: <Component />,
            },
            callback?.(threadMessage),
          );

          await waitFor(() => {
            expect(getFirstMessageAvatar()).toHaveTextContent(user.name);
          });

          act(() => {
            dispatchUserUpdatedEvent();
          });

          await waitFor(() => {
            expect(getFirstMessageAvatar()).toHaveTextContent(updatedAttribute.name);
          });
        });

        it(`should not update user data in ${name} if updated_at has not changed`, async () => {
          const updatedAttribute = { name: 'newName' };
          const dispatchUserUpdatedEvent = createChannelEventDispatcher(
            {
              user: { ...user, ...updatedAttribute },
            },
            'user.updated',
          );
          renderComponent(
            {
              Avatar: MockAvatar,
              children: <Component />,
            },
            callback?.(threadMessage),
          );

          await waitFor(() => {
            expect(getFirstMessageAvatar()).toHaveTextContent(user.name);
          });

          act(() => {
            dispatchUserUpdatedEvent();
          });

          await waitFor(() => {
            expect(getFirstMessageAvatar()).toHaveTextContent(user.name);
          });
        });
      });
    });
  });
});
