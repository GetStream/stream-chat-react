import React, { useEffect, useContext } from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';
import Visibility from 'visibilityjs';
import Immutable from 'seamless-immutable';
import Channel from '../Channel';
import { Chat } from '../../Chat';
import { ChannelContext, ChatContext } from '../../../context';
import {
  useMockedApis,
  generateMember,
  generateMessage,
  generateChannel,
  getTestClientWithUser,
  getOrCreateChannelApi,
  getThreadReplies,
  generateUser,
  queryApi,
  sendMessageApi,
} from '../../../mock-builders';
import { LoadingErrorIndicator } from '../../Loading';

jest.mock('axios');
jest.mock('../../Loading', () => ({
  LoadingIndicator: jest.fn(() => <div>loading</div>),
  LoadingErrorIndicator: jest.fn(() => <div />),
}));

jest.mock('visibilityjs');

let chatClient;
let channel;

// This component is used for performing effects in a component that consumes ChannelContext,
// i.e. making use of the callbacks & values provided by the Channel component.
// the effect is called every time channelContext changes
const CallbackEffectWithChannelContext = ({ callback }) => {
  const channelContext = useContext(ChannelContext);
  useEffect(() => {
    callback(channelContext);
  }, [callback, channelContext]);

  return null;
};
// In order for ChannelInner to be rendered, we need to set the active channel first.
const ActiveChannelSetter = ({ activeChannel }) => {
  const { setActiveChannel } = useContext(ChatContext);
  useEffect(() => {
    setActiveChannel(activeChannel);
  });
  return null;
};

const user = generateUser({ name: 'name', id: 'id' });
const messages = [generateMessage({ user })];
const renderComponent = (props = {}, callback = () => {}) =>
  render(
    <Chat client={chatClient}>
      <ActiveChannelSetter activeChannel={channel} />
      <Channel {...props}>
        {props.children}
        <CallbackEffectWithChannelContext callback={callback} />
      </Channel>
    </Chat>,
  );

describe('Channel', () => {
  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannel({
      messages,
      members,
    });
    useMockedApis(axios, [getOrCreateChannelApi(mockedChannel)]);
    chatClient = await getTestClientWithUser(user);
    channel = chatClient.channel('messaging', mockedChannel.id);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the EmptyPlaceholder prop if the channel is not provided by the ChatContext', () => {
    const { getByText } = render(
      <Channel EmptyPlaceholder={<div>empty</div>}></Channel>,
    );

    expect(getByText('empty')).toBeInTheDocument();
  });

  it('should watch the current channel on mount', async () => {
    const watchSpy = jest.spyOn(channel, 'watch');

    renderComponent();

    await waitFor(() => expect(watchSpy).toHaveBeenCalledTimes(1));
  });

  it('should set an error if watching the channel goes wrong, and render a LoadingErrorIndicator', async () => {
    const watchError = new Error('watching went wrong');
    jest
      .spyOn(channel, 'watch')
      .mockImplementationOnce(() => Promise.reject(watchError));

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

    const { getByText } = renderComponent();

    await waitFor(() => expect(getByText('loading')).toBeInTheDocument());
  });

  it('should provide context and render children if channel is set and the component is not loading or errored', async () => {
    const { findByText } = renderComponent({ children: <div>children</div> });

    expect(await findByText('children')).toBeInTheDocument();
  });

  // should these 'on' tests actually test if the handler works?
  it('should add a connection recovery handler on the client on mount', async () => {
    const clientOnSpy = jest.spyOn(chatClient, 'on');

    renderComponent();

    await waitFor(() =>
      expect(clientOnSpy).toHaveBeenCalledWith(
        'connection.recovered',
        expect.any(Function),
      ),
    );
  });

  it('should add an `on` handler to the channel on mount', async () => {
    const channelOnSpy = jest.spyOn(channel, 'on');
    renderComponent();

    await waitFor(() =>
      expect(channelOnSpy).toHaveBeenCalledWith(expect.any(Function)),
    );
  });

  it('should mark the current channel as read if the user switches to the current window', async () => {
    // This mocks the Visibilityjs module so it immediately calls the change callback with state === 'visible'
    jest.spyOn(Visibility, 'change').mockImplementationOnce((callback) => {
      callback(new Event('change'), 'visible');
    });
    const markReadSpy = jest.spyOn(channel, 'markRead');

    renderComponent();

    await waitFor(() => expect(markReadSpy).toHaveBeenCalledWith());
  });

  it('should mark the channel as read if the count of unread messages is higher than 0 on mount', async () => {
    jest.spyOn(channel, 'countUnread').mockImplementationOnce(() => 1);
    const markReadSpy = jest.spyOn(channel, 'markRead');

    renderComponent();

    await waitFor(() => expect(markReadSpy).toHaveBeenCalledWith());
  });

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Children that consume ChannelContext', () => {
    it('should be able to open threads', async () => {
      const threadMessage = messages[0];
      const hasThread = jest.fn();

      // this renders Channel, calls openThread from a child context consumer with a message,
      // and then calls hasThread with the thread id if it was set.
      renderComponent({}, ({ openThread, thread }) => {
        if (!thread) {
          openThread(threadMessage);
        } else {
          hasThread(thread.id);
        }
      });

      await waitFor(() =>
        expect(hasThread).toHaveBeenCalledWith(threadMessage.id),
      );
    });

    it('should be able to load more messages in a thread', async () => {
      const getRepliesSpy = jest.spyOn(channel, 'getReplies');
      const threadMessage = messages[0];

      const replies = [generateMessage({ parent_id: threadMessage.id })];

      useMockedApis(axios, [getThreadReplies(replies)]);

      const hasThreadMessages = jest.fn();

      renderComponent(
        {},
        ({ openThread, thread, loadMoreThread, threadMessages }) => {
          if (!thread) {
            // first, open a thread
            openThread(threadMessage);
          } else if (!threadMessages.length) {
            // then, load more messages in the thread
            loadMoreThread();
          } else {
            // then, call our mock fn so we can verify what was passed as threadMessages
            hasThreadMessages(threadMessages);
          }
        },
      );

      await waitFor(() => {
        expect(getRepliesSpy).toHaveBeenCalledWith(
          threadMessage.id,
          expect.any(Object),
        );
      });
      await waitFor(() => {
        expect(hasThreadMessages).toHaveBeenCalledWith(replies);
      });
    });

    it('should allow closing a thread after it has been opened', async () => {
      const threadHasClosed = jest.fn();
      const threadMessage = messages[0];

      let threadHasAlreadyBeenOpened = false;
      renderComponent({}, ({ thread, openThread, closeThread }) => {
        if (!thread) {
          // if there is no open thread
          if (!threadHasAlreadyBeenOpened) {
            // and we haven't opened one before, open a thread
            openThread(threadMessage);
            threadHasAlreadyBeenOpened = true;
          } else {
            // if we opened it ourselves before, it means the thread was succesfully closed
            threadHasClosed();
          }
        } else {
          // if a thread is open, close it.
          closeThread();
        }
      });

      await waitFor(() => expect(threadHasClosed).toHaveBeenCalledTimes(1));
    });

    it('should call the onMentionsHover/onMentionsClick prop if a child component calls onMentionsHover with the right event', async () => {
      const onMentionsHoverMock = jest.fn();
      const onMentionsClickMock = jest.fn();
      const username = 'Mentioned User';
      const mentionedUserMock = {
        name: username,
      };

      const MentionedUserComponent = () => {
        const { onMentionsHover } = useContext(ChannelContext);
        return (
          <span
            onMouseOver={(e) => onMentionsHover(e, [mentionedUserMock])}
            onClick={(e) => onMentionsHover(e, [mentionedUserMock])}
          >
            <strong>@{username}</strong> this is a message
          </span>
        );
      };

      const { findByText } = renderComponent({
        onMentionsHover: onMentionsHoverMock,
        onMentionsClick: onMentionsClickMock,
        children: <MentionedUserComponent />,
      });

      const usernameText = await findByText(`@${username}`);

      fireEvent.mouseOver(usernameText);
      fireEvent.click(usernameText);

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
      it('should be able to load more messages', async () => {
        const channelQuerySpy = jest.spyOn(channel, 'query');
        const newMessageAdded = jest.fn();

        const newMessages = [generateMessage()];

        renderComponent({}, ({ loadMore, messages: contextMessages }) => {
          if (
            !contextMessages.find((message) => message.id === newMessages[0].id)
          ) {
            // Our new message is not yet passed as part of channel context. Call loadMore and mock API response to include it.
            useMockedApis(axios, [queryApi(channel, newMessages)]);
            loadMore(limit);
          } else {
            // If message has been added, call our mock so we can verify it happened.
            newMessageAdded();
          }
        });

        await waitFor(() =>
          expect(channelQuerySpy).toHaveBeenCalledWith({
            messages: {
              limit,
              id_lt: messages[0].id,
            },
          }),
        );

        await waitFor(() => expect(newMessageAdded).toHaveBeenCalledTimes(1));
      });

      it('should set hasMore to false if querying channel returns less messages than the limit', async () => {
        const checkHasMore = jest.fn();
        const newMessages = [generateMessage()];
        renderComponent(
          {},
          ({ loadMore, messages: contextMessages, hasMore }) => {
            if (
              !contextMessages.find(
                (message) => message.id === newMessages[0].id,
              )
            ) {
              // Our new message is not yet passed as part of channel context. Call loadMore and mock API response to include it.
              useMockedApis(axios, [queryApi(channel, newMessages)]);
              loadMore(limit);
            } else {
              // If message has been added, call our mock so we can verify if hasMore is false.
              checkHasMore(hasMore);
            }
          },
        );

        await waitFor(() => expect(checkHasMore).toHaveBeenCalledWith(false));
      });

      it('should set hasMore to true if querying channel returns an amount of messages that equals the limit', async () => {
        const checkHasMore = jest.fn();
        const newMessages = Array(limit)
          .fill(null)
          .map(() => generateMessage());
        renderComponent(
          {},
          ({ loadMore, messages: contextMessages, hasMore }) => {
            if (
              !contextMessages.some(
                (message) => message.id === newMessages[0].id,
              )
            ) {
              // Our new messages are not yet passed as part of channel context. Call loadMore and mock API response to include it.
              useMockedApis(axios, [queryApi(channel, newMessages)]);
              loadMore(limit);
            } else {
              // If message has been added, call our mock so we can verify if hasMore is false.
              checkHasMore(hasMore);
            }
          },
        );

        await waitFor(() => expect(checkHasMore).toHaveBeenCalledWith(true));
      });

      it('should set loadingMore to true while loading more', async () => {
        const queryPromise = new Promise(() => {});
        const loadingMoreChecker = jest.fn();

        renderComponent({}, ({ loadingMore, loadMore }) => {
          // return a promise that hasn't resolved yet, so loadMore will be stuck in the 'await' part of the function
          jest
            .spyOn(channel, 'query')
            .mockImplementationOnce(() => queryPromise);
          loadMore();
          loadingMoreChecker(loadingMore);
        });
        await waitFor(() =>
          expect(loadingMoreChecker).toHaveBeenCalledWith(true),
        );
      });
    });

    describe('Sending/removing/updateing messages', () => {
      const MockMessageList = () => {
        const { messages: channelMessages } = useContext(ChannelContext);

        return channelMessages.map(
          ({ text, status }, i) =>
            status !== 'failed' && <div key={i}>{text}</div>,
        );
      };

      it('should remove error messages from channel state when sending a new message', async () => {
        const filterErrorMessagesSpy = jest.spyOn(
          channel.state,
          'filterErrorMessages',
        );
        // flag to prevent infinite loop
        let hasSent = false;

        renderComponent({}, ({ sendMessage }) => {
          if (!hasSent) sendMessage({ text: 'message' });
          hasSent = true;
        });

        await waitFor(() =>
          expect(filterErrorMessagesSpy).toHaveBeenCalledWith(),
        );
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
            jest
              .spyOn(channel, 'sendMessage')
              .mockImplementationOnce(() => new Promise(() => {}));
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

      it('should eventually pass the result of the sendMessage API as part of ChannelContext', async () => {
        const sentMessage = { text: 'message' };
        const messageResponse = { text: 'different message' };
        let hasSent = false;

        const { findByText } = renderComponent(
          {
            children: <MockMessageList />,
          },
          ({ sendMessage }) => {
            useMockedApis(axios, [
              sendMessageApi(generateMessage(messageResponse)),
            ]);
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
        await waitFor(() =>
          expect(clientUpdateMessageSpy).toHaveBeenCalledWith(updatedMessage),
        );
      });

      it('should use doUpdateMessageRequest for the editMessage callback if provided', async () => {
        const doUpdateMessageRequest = jest.fn((channelId, message) => message);

        renderComponent({ doUpdateMessageRequest }, ({ editMessage }) => {
          editMessage(messages[0]);
        });

        await waitFor(() =>
          expect(doUpdateMessageRequest).toHaveBeenCalledWith(
            channel.cid,
            messages[0],
          ),
        );
      });

      it('should update messages passed into the updaetMessage callback', async () => {
        const newText = 'something entirely different';
        const updatedMessage = { ...messages[0], text: newText };
        let hasUpdated = false;
        const { findByText } = renderComponent(
          { children: <MockMessageList /> },
          ({ updateMessage }) => {
            if (!hasUpdated) updateMessage(updatedMessage);
            hasUpdated = true;
          },
        );

        expect(await findByText(updatedMessage.text)).toBeInTheDocument();
      });

      it('should enable retrying message sending', async () => {
        // flag to prevent infinite loop
        let hasSent = false;
        let hasRetried = false;
        const messageObject = Immutable({ text: 'bla bla' });

        const { findByText } = renderComponent(
          {
            children: <MockMessageList />,
          },
          ({ sendMessage, retrySendMessage, messages: contextMessages }) => {
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
              useMockedApis(axios, [
                sendMessageApi(generateMessage(messageObject)),
              ]);
              retrySendMessage(messageObject);
              hasRetried = true;
            }
          },
        );

        expect(await findByText(messageObject.text)).toBeInTheDocument();
      });

      it('should allow removing messages', async () => {
        const allMessagesRemoved = jest.fn();
        const removeSpy = jest.spyOn(channel.state, 'removeMessage');

        renderComponent({}, ({ removeMessage, messages: contextMessages }) => {
          if (contextMessages.length > 0) {
            // if there are messages passed as the context, remove them
            removeMessage(contextMessages[0]);
          } else {
            // once they're all gone, call our mock so we can verify that we no longer have messages
            allMessagesRemoved();
          }
        });

        await waitFor(() =>
          expect(removeSpy).toHaveBeenCalledWith(messages[0]),
        );
        await waitFor(() =>
          expect(allMessagesRemoved).toHaveBeenCalledTimes(1),
        );
      });
    });
  });

  // TODO: all unmount tests

  // TODO: figure out how to test debounced / throttled setters

  // TODO: test handleEvent by creating actual events on client/channel whatever

  // TODO: test thread thing in componentDidUpdate by calling updateMessage (or something that updates a messages by ID) on whatever message is channel.thread
});
