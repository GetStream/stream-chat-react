import { fromPartial } from '@total-typescript/shoehorn';
import { nanoid } from 'nanoid';
import React, { useEffect } from 'react';
import type {
  ChannelResponse,
  Channel as ChannelType,
  Event,
  LocalMessage,
  Message,
  MessageResponse,
  QueryChannelAPIResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';

import { Channel } from '../Channel';
import { Chat } from '../../Chat';
import { LoadingErrorIndicator } from '../../Loading';

import { ChatProvider } from '../../../context/ChatContext';
import { useChannel } from '../../../context/useChannel';
import { useStateStore } from '../../../store';

import type { GenerateChannelOptions } from '../../../mock-builders';
import {
  dispatchChannelTruncatedEvent,
  dispatchConnectionChangedEvent,
  erroredPostApi,
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  initClientWithChannels,
  sendMessageApi,
  useMockedApis,
} from '../../../mock-builders';
import { WithComponents } from '../../../context';
import type { ChatContextValue, ComponentContextValue } from '../../../context';
import { generateMessageDraft } from '../../../mock-builders/generator/messageDraft';
import type { ChannelProps } from '../Channel';

vi.mock('../../Loading', () => ({
  LoadingChannel: vi.fn(() => <div>Loading channel</div>),
  LoadingErrorIndicator: vi.fn(() => <div />),
  LoadingIndicator: vi.fn(() => <div>loading</div>),
}));

// Runs `callback` in an effect once the Channel subtree has mounted — used by tests that need to
// dispatch events or trigger channel actions after the channel is ready. It intentionally exposes
// no context: tests read state/actions straight off the stream-chat `channel` instance
// (channel.state, channel.messagePaginator, channel.*WithLocalUpdate).
const OnChannelReady = ({ callback }: { callback: () => void }) => {
  useEffect(() => {
    callback();
  }, [callback]);

  return null;
};

// The mock-builder generators produce LocalMessage objects, while the stream-chat write APIs and
// mocked API responses are typed against Message / MessageResponse. The shapes are runtime-identical
// for these tests, so bridge them explicitly rather than weakening assertions.
const toMessage = (m: LocalMessage) => m as unknown as Message;
const toMessageResponse = (m: LocalMessage) => m as unknown as MessageResponse;

const renderComponent = async (
  props: {
    channel?: ChannelType;
    chatClient?: typeof import('stream-chat').StreamChat.prototype;
    children?: React.ReactNode;
    components?: Partial<ComponentContextValue>;
  } & Partial<ChannelProps> = {},
  callback: () => void = () => {},
) => {
  const {
    chatClient: chatClientFromProps,
    children,
    components,
    ...channelProps
  } = props;
  let result: RenderResult | undefined;
  await act(() => {
    result = render(
      <WithComponents overrides={components ?? {}}>
        <Chat client={chatClientFromProps as StreamChat}>
          <Channel {...channelProps}>
            {children}
            <OnChannelReady callback={callback} />
          </Channel>
        </Chat>
      </WithComponents>,
    );
  });
  return result as RenderResult;
};

const initClient = async ({
  channelId,
  channelType,
  messages,
  pinnedMessages,
  user,
}: {
  channelId?: string;
  channelType?: string;
  messages?: LocalMessage[];
  pinnedMessages?: LocalMessage[];
  user: UserResponse;
}) => {
  const members = [generateMember({ user })];
  const mockedChannel = generateChannel({
    channel: {
      id: channelId,
      type: channelType,
    },
    members,
    messages: messages as unknown as GenerateChannelOptions['messages'],
    pinned_messages: (pinnedMessages ??
      []) as unknown as GenerateChannelOptions['pinned_messages'],
  });
  const chatClient = await getTestClientWithUser(user);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
  const channel = chatClient.channel('messaging', mockedChannel.channel.id);

  vi.spyOn(channel, 'getConfig').mockImplementation(() => mockedChannel.channel.config);
  return { channel, chatClient };
};

const MockMessageList = () => {
  const channel = useChannel();
  const { items } = useStateStore(channel.messagePaginator.state, (state) => ({
    items: state.items,
  }));
  const channelMessages = items ?? channel.state.messages ?? [];

  return channelMessages.map(
    ({ id, status, text }) =>
      status !== 'failed' && <div key={id || nanoid()}>{text}</div>,
  );
};

describe('Channel', () => {
  const user = generateUser(fromPartial<UserResponse>({ id: 'id', name: 'name' }));
  const channelType = 'messaging';

  // Instantiate a fresh client + channel per test. Callers may override the seeded messages /
  // pinned messages; otherwise a full 25-message state is created so `loadMore` can be exercised.
  const setup = async ({
    messages: messagesOverride,
    pinnedMessages: pinnedMessagesOverride,
  }: { messages?: LocalMessage[]; pinnedMessages?: LocalMessage[] } = {}) => {
    const channelId = nanoid();
    const messages =
      messagesOverride ??
      Array.from({ length: 25 }, (_, i) =>
        generateMessage({
          cid: `${channelType}:${channelId}`,
          created_at: new Date((i + 1) * 1000000),
          user,
        }),
      );
    const pinnedMessages = pinnedMessagesOverride ?? [
      generateMessage({ cid: `${channelType}:${channelId}`, pinned: true, user }),
    ];

    const { channel, chatClient } = await initClient({
      channelId,
      channelType,
      messages,
      pinnedMessages,
      user,
    });
    vi.spyOn(channel, 'getDraft').mockResolvedValue(
      fromPartial({
        draft: generateMessageDraft({
          channel: channel as unknown as ChannelResponse,
          channel_cid: channel.cid,
        }),
      }),
    );
    return { channel, channelId, chatClient, messages };
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the EmptyPlaceholder prop if the channel is not provided by the ChatContext', async () => {
    const DefaultEmptyStateIndicator = () => <div>default empty state</div>;

    // get rid of console warnings as they are expected - Channel reaches to ChatContext
    vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    render(
      <WithComponents overrides={{ EmptyStateIndicator: DefaultEmptyStateIndicator }}>
        <ChatProvider value={fromPartial<ChatContextValue>({})}>
          <Channel EmptyPlaceholder={<div>empty</div>} />
        </ChatProvider>
      </WithComponents>,
    );

    await waitFor(() => expect(screen.getByText('empty')).toBeInTheDocument());
    expect(screen.queryByText('default empty state')).not.toBeInTheDocument();
  });

  it('should render empty channel container if no channel is provided and EmptyPlaceholder is null', async () => {
    const childrenContent = 'Channel children';
    const { asFragment } = render(
      <ChatProvider value={fromPartial<ChatContextValue>({})}>
        <Channel EmptyPlaceholder={null}>{childrenContent}</Channel>
      </ChatProvider>,
    );
    await waitFor(() => expect(asFragment()).toMatchSnapshot());
  });

  it('should render the provided loading indicator while the channel is being watched', async () => {
    const { channel, chatClient } = await setup();
    const loadingText = 'Loading channel';
    // Keep the channel in the bootstrapping (loading) state indefinitely.
    const watchPromise = new Promise<never>(() => {});
    vi.spyOn(channel, 'watch').mockImplementation(() => watchPromise);

    await renderComponent({
      channel,
      chatClient,
      components: {
        LoadingIndicator: () => <div>{loadingText}</div>,
      },
    });

    await waitFor(() => expect(screen.getByText(loadingText)).toBeInTheDocument());
  });

  it('should render the provided error indicator if watching the channel fails', async () => {
    const { channel, chatClient } = await setup();
    const errMsg = 'Channel query failed';
    vi.spyOn(channel, 'watch').mockImplementation(() =>
      Promise.reject(new Error(errMsg)),
    );

    await renderComponent({
      channel,
      chatClient,
      components: {
        LoadingErrorIndicator: ({ error }) => <div>{error?.message}</div>,
      },
    });

    await waitFor(() => expect(screen.getByText(errMsg)).toBeInTheDocument());
  });

  it('should watch the current channel on mount', async () => {
    const { channel, chatClient } = await setup();
    const watchSpy = vi.spyOn(channel, 'watch');

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
    const { channel, chatClient } = await setup();
    const watchSpy = vi.spyOn(channel, 'watch');
    const channelQueryOptions = {
      messages: { limit: 20 },
    };
    await renderComponent({ channel, channelQueryOptions, chatClient });

    await waitFor(() => {
      expect(watchSpy).toHaveBeenCalledTimes(1);
      expect(watchSpy).toHaveBeenCalledWith(channelQueryOptions);
    });
  });

  it('should not call watch the current channel on mount if channel is initialized', async () => {
    const { channel, chatClient } = await setup();
    const watchSpy = vi.spyOn(channel, 'watch');
    channel.initialized = true;
    await renderComponent({ channel, chatClient });
    await waitFor(() => expect(watchSpy).not.toHaveBeenCalled());
  });

  it('should set an error if watching the channel goes wrong, and render a LoadingErrorIndicator', async () => {
    const { channel, chatClient } = await setup();
    const watchError = new Error('watching went wrong');
    vi.spyOn(channel, 'watch').mockImplementation(() => Promise.reject(watchError));

    await renderComponent({
      channel,
      chatClient,
      components: { LoadingErrorIndicator },
    });

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
    const { channel, chatClient } = await setup();
    const watchPromise = new Promise<never>(() => {});
    vi.spyOn(channel, 'watch').mockImplementationOnce(() => watchPromise);
    const result = await renderComponent({ channel, chatClient });

    await waitFor(() => expect(result.asFragment()).toMatchSnapshot());
  });

  it('should provide context and render children if channel is set and the component is not loading or errored', async () => {
    const { channel, chatClient } = await setup();
    const { findByText } = await renderComponent({
      channel,
      chatClient,
      children: <div>children</div>,
    });

    expect(await findByText('children')).toBeInTheDocument();
  });

  // should these 'on' tests actually test if the handler works?
  it('should add a connection recovery handler on the client on mount', async () => {
    const { channel, chatClient } = await setup();
    const clientOnSpy = vi.spyOn(chatClient, 'on');

    await renderComponent({ channel, chatClient });

    await waitFor(() =>
      expect(clientOnSpy).toHaveBeenCalledWith(
        'connection.recovered',
        expect.any(Function),
      ),
    );
  });

  it('should add an `on` handler to the channel on mount', async () => {
    const { channel, chatClient } = await setup();
    const channelOnSpy = vi.spyOn(channel, 'on');
    await renderComponent({ channel, chatClient });

    await waitFor(() => expect(channelOnSpy).toHaveBeenCalledWith(expect.any(Function)));
  });

  it('should mark the channel as read when the channel is mounted', async () => {
    const { channel, chatClient } = await setup();
    vi.spyOn(channel, 'countUnread').mockImplementation(() => 1);
    const markReadSpy = vi.spyOn(channel, 'markRead');

    await renderComponent({ channel, chatClient });

    await waitFor(() => expect(markReadSpy).toHaveBeenCalledWith());
  });

  it('should not mark the channel as read if the count of unread messages is higher than 0 on mount and the feature is disabled', async () => {
    const { channel, chatClient } = await setup();
    vi.spyOn(channel, 'countUnread').mockImplementationOnce(() => 1);
    const markReadSpy = vi.spyOn(channel, 'markRead');

    await renderComponent({ channel, chatClient, markReadOnMount: false });

    await waitFor(() => expect(markReadSpy).not.toHaveBeenCalledWith());
  });

  it('should use the doMarkReadRequest prop to mark channel as read, if that is defined', async () => {
    const { channel, chatClient } = await setup();
    vi.spyOn(channel, 'countUnread').mockImplementation(() => 1);
    const doMarkReadRequest = vi.fn();

    await renderComponent({
      channel,
      chatClient,
      doMarkReadRequest,
      markReadOnMount: true,
    });

    await waitFor(() => expect(doMarkReadRequest).toHaveBeenCalledTimes(1));
  });

  it('should not query the channel from the backend when initializeOnMount is disabled', async () => {
    const { channel, chatClient } = await setup();
    const watchSpy = vi
      .spyOn(channel, 'watch')
      .mockImplementationOnce(() =>
        Promise.resolve(fromPartial<QueryChannelAPIResponse>({})),
      );
    await renderComponent({
      channel,
      chatClient,
      initializeOnMount: false,
    });
    await waitFor(() => expect(watchSpy).not.toHaveBeenCalled());
  });

  it('should query the channel from the backend when initializeOnMount is enabled (the default)', async () => {
    const { channel, chatClient } = await setup();
    const watchSpy = vi.spyOn(channel, 'watch');
    await renderComponent({ channel, chatClient });
    await waitFor(() => expect(watchSpy).toHaveBeenCalledTimes(1));
  });

  describe('disconnected client (#2393)', () => {
    it('does not crash rendering when the client disconnects while the channel is mounted', async () => {
      const { channel, chatClient } = await setup();
      const { container } = await renderComponent({ channel, chatClient });

      // the channel is initialized; the shared client then disconnects
      channel.disconnected = true;

      // a re-render that reads channel state must not throw
      // (channel.lastRead() throws once the client is disconnected)
      await act(async () => {
        dispatchConnectionChangedEvent(chatClient, false);
        await Promise.resolve();
      });

      // the tree re-rendered without throwing and the channel's paginator state stays
      // readable while offline
      expect(container.querySelector('.str-chat__channel')).toBeInTheDocument();
      expect(() => channel.messagePaginator.state.getLatestValue()).not.toThrow();
    });

    it('does not paginate (query) when the client is disconnected', async () => {
      const { channel, chatClient } = await setup();
      await renderComponent({
        channel,
        channelQueryOptions: { messages: { limit: 25 } },
        chatClient,
      });

      const querySpy = vi.spyOn(channel, 'query');
      const prevSpy = vi.spyOn(channel.messagePaginator, 'prev');
      channel.disconnected = true;

      await act(async () => {
        dispatchConnectionChangedEvent(chatClient, false);
        await Promise.resolve();
      });

      // while the client is offline the mounted Channel must not issue a
      // pagination query/prev against the disconnected channel
      expect(prevSpy).not.toHaveBeenCalled();
      expect(querySpy).not.toHaveBeenCalled();
    });
  });

  describe('Children that consume the contexts set in Channel', () => {
    describe('Sending/removing/updating messages', () => {
      it('should add a preview for messages that are sent to the channel state, so that they are rendered even without API response', async () => {
        const { channel, chatClient } = await setup();
        const messageText = nanoid();
        const m = generateMessage({ text: messageText });
        useMockedApis(chatClient, [sendMessageApi(m)]);

        await renderComponent({ channel, chatClient });

        // The optimistic local update writes the preview to the paginator synchronously, before the
        // mocked send response is applied.
        const sendPromise = channel.sendMessageWithLocalUpdate({
          localMessage: fromPartial({ ...m, status: 'sending' }),
          message: toMessage(m),
        });

        const preview = channel.messagePaginator.getItem(m.id);
        expect(preview).toBeDefined();
        expect(preview?.text).toBe(messageText);
        expect(preview?.status).toBe('sending');

        await act(async () => {
          await sendPromise;
        });
      });

      it('should mark message as received when the backend reports duplicated message id', async () => {
        const { channel, chatClient } = await setup();
        const messageText = nanoid();
        const messageId = nanoid();

        // The send request fails with a code-4 "already exists" error; messageOperations' state
        // policy treats that as success and flips the optimistic message to 'received'.
        useMockedApis(chatClient, [
          erroredPostApi({
            code: 4,
            message: `SendMessage failed with error: "a message with ID ${messageId} already exists"`,
          }),
        ]);

        await renderComponent({ channel, chatClient, children: <MockMessageList /> });

        const m = generateMessage({
          id: messageId,
          status: 'sending',
          text: messageText,
        });
        await act(async () => {
          await channel
            .sendMessageWithLocalUpdate({
              localMessage: fromPartial<LocalMessage>({ ...m, status: 'sending' }),
              message: toMessage(m),
            })
            .catch(() => {});
        });

        await waitFor(() => {
          expect(channel.messagePaginator.getItem(messageId)?.status).toBe('received');
        });
      });

      it('should use the doSendMessageRequest prop to send messages if that is defined', async () => {
        const { channel, chatClient } = await setup();
        const message = generateMessage();
        const doSendMessageRequest = vi.fn((_channel, sentMessage) =>
          Promise.resolve({ message: sentMessage }),
        ) as unknown as ChannelProps['doSendMessageRequest'];

        await renderComponent({
          channel,
          chatClient,
          doSendMessageRequest,
        });

        await act(async () => {
          await channel
            .sendMessageWithLocalUpdate({
              localMessage: fromPartial({ ...message, status: 'sending' }),
              message: toMessage(message),
            })
            .catch(() => {});
        });

        expect(doSendMessageRequest).toHaveBeenCalledWith(
          channel,
          expect.objectContaining(message),
          undefined,
        );
      });

      describe('delete message', () => {
        it('should call the default client.deleteMessage() function', async () => {
          const { channel, chatClient } = await setup();
          const message = generateMessage();
          const deleteMessageOptions = { deleteForMe: true, hard: false };
          const clientDeleteMessageSpy = vi
            .spyOn(chatClient, 'deleteMessage')
            .mockResolvedValue(fromPartial({ message: toMessageResponse(message) }));
          await renderComponent({ channel, chatClient });
          await act(async () => {
            await channel
              .deleteMessageWithLocalUpdate({
                localMessage: fromPartial(message),
                options: deleteMessageOptions,
              })
              .catch(() => {});
          });
          await waitFor(() =>
            expect(clientDeleteMessageSpy).toHaveBeenCalledWith(
              message.id,
              deleteMessageOptions,
            ),
          );
        });

        it('should call the custom doDeleteMessageRequest instead of client.deleteMessage()', async () => {
          const { channel, chatClient } = await setup();
          const message = generateMessage();
          const deleteMessageOptions = { deleteForMe: true, hard: false };
          const doDeleteMessageRequest = vi.fn(() =>
            Promise.resolve(message),
          ) as unknown as ChannelProps['doDeleteMessageRequest'];
          const clientDeleteMessageSpy = vi
            .spyOn(chatClient, 'deleteMessage')
            .mockResolvedValue(fromPartial({ message: toMessageResponse(message) }));

          await renderComponent({ channel, chatClient, doDeleteMessageRequest });

          await act(async () => {
            await channel
              .deleteMessageWithLocalUpdate({
                localMessage: fromPartial(message),
                options: deleteMessageOptions,
              })
              .catch(() => {});
          });

          await waitFor(() => {
            expect(clientDeleteMessageSpy).not.toHaveBeenCalled();
            expect(doDeleteMessageRequest).toHaveBeenCalledWith(
              message,
              deleteMessageOptions,
            );
          });
        });
      });

      it('should enable editing messages', async () => {
        const { channel, chatClient, messages } = await setup();
        const newText = 'something entirely different';
        const updatedMessage = { ...messages[0], text: newText };
        const clientUpdateMessageSpy = vi
          .spyOn(chatClient, 'updateMessage')
          .mockResolvedValue(fromPartial({ message: toMessageResponse(updatedMessage) }));
        await renderComponent({ channel, chatClient });
        await act(async () => {
          await channel
            .updateMessageWithLocalUpdate({ localMessage: fromPartial(updatedMessage) })
            .catch(() => {});
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
        const { channel, chatClient, messages } = await setup();
        const doUpdateMessageRequest = vi.fn((channelId, message) => ({
          message,
        })) as unknown as ChannelProps['doUpdateMessageRequest'];

        await renderComponent({ channel, chatClient, doUpdateMessageRequest });

        await act(async () => {
          await channel
            .updateMessageWithLocalUpdate({ localMessage: fromPartial(messages[0]) })
            .catch(() => {});
        });

        await waitFor(() =>
          expect(doUpdateMessageRequest).toHaveBeenCalledWith(
            channel.cid,
            messages[0],
            undefined,
          ),
        );
      });

      it('should enable retrying message sending', async () => {
        const { channel, chatClient } = await setup();
        const messageObject = generateMessage({
          text: nanoid(),
        });

        await renderComponent({ channel, chatClient });

        // First send fails.
        useMockedApis(chatClient, [erroredPostApi()]);
        await act(async () => {
          await channel
            .sendMessageWithLocalUpdate({
              localMessage: fromPartial({ ...messageObject, status: 'sending' }),
              message: toMessage(messageObject),
            })
            .catch(() => {});
        });

        expect(channel.messagePaginator.getItem(messageObject.id)?.status).toBe('failed');

        // Retry succeeds.
        useMockedApis(chatClient, [sendMessageApi(messageObject)]);
        await act(async () => {
          await channel
            .retrySendMessageWithLocalUpdate({
              localMessage: fromPartial({ ...messageObject, status: 'failed' }),
            })
            .catch(() => {});
        });

        expect(channel.messagePaginator.getItem(messageObject.id)?.status).toBe(
          'received',
        );
      });

      it('should allow removing messages', async () => {
        const { channel, chatClient, messages } = await setup();
        await renderComponent({ channel, chatClient });

        const [firstMessage] = messages;
        expect(channel.state.findMessage(firstMessage.id)).toBeDefined();

        act(() => {
          channel.state.removeMessage(firstMessage);
        });

        await waitFor(() =>
          expect(channel.state.findMessage(firstMessage.id)).toBeUndefined(),
        );
      });
    });

    describe('Channel events', () => {
      // note: these tests rely on Client.dispatchEvent, which eventually propagates to the channel component.
      const createOneTimeEventDispatcher = (
        event: Record<string, unknown>,
        client: StreamChat,
        channel: ChannelType,
      ) => {
        let hasDispatchedEvent = false;
        return () => {
          if (!hasDispatchedEvent)
            client.dispatchEvent({
              ...event,
              cid: channel.cid,
            } as Event);
          hasDispatchedEvent = true;
        };
      };

      const createChannelEventDispatcher = (
        body: Record<string, unknown>,
        client: StreamChat,
        channel: ChannelType,
        type: string = 'message.new',
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
        const { channel, chatClient } = await setup();
        const message = generateMessage({ user });
        const dispatchMessageEvent = createChannelEventDispatcher(
          { message },
          chatClient,
          channel,
        );

        await renderComponent(
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

        // Message state now lives on the stream-chat channel (the React reducer was removed),
        // so the message.new event is reflected in channel.state.messages.
        await waitFor(() => {
          expect(channel.state.messages.some(({ id }) => id === message.id)).toBe(true);
        });
      });

      it('should not mark the channel as read if a new message from another user comes in and the user is looking at the page', async () => {
        const { channel, chatClient } = await setup();
        const markReadSpy = vi.spyOn(channel, 'markRead');

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
        const { channel, chatClient } = await setup();
        const markReadSpy = vi.spyOn(channel, 'markRead');

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
        const { channel, chatClient } = await setup();
        const unreadAmount = 1;
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          get: () => true,
        });
        vi.spyOn(channel, 'countUnread').mockImplementation(() => unreadAmount);
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

      it('should update user data in MessageList based on updated_at', async () => {
        const { channel, chatClient } = await setup();
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
        await renderComponent({ channel, chatClient });

        await waitFor(() => {
          expect(channel.state.messages[0]?.user?.name).toBe(user.name);
        });

        await act(() => {
          dispatchUserUpdatedEvent();
        });

        // User references are now updated on the stream-chat channel state, which the
        // MessageList reads from (the removed React reducer used to own this mapping).
        await waitFor(() => {
          expect(channel.state.messages[0]?.user?.name).toBe(updatedAttribute.name);
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

          // The channel unread UI state moved from ChannelStateContext.channelUnreadUiState to
          // channel.messagePaginator.unreadStateSnapshot. It is populated by a paginator query in
          // the app; seed it directly here since this harness does not run that query.
          activeChannel.messagePaginator.setUnreadSnapshot({
            unreadCount: unread_messages,
          });

          const Component = () => {
            const channel = useChannel();
            const { unreadCount } = useStateStore(
              channel.messagePaginator.unreadStateSnapshot,
              (state) => ({ unreadCount: state.unreadCount }),
            );
            if (!unreadCount) return <div>{NO_UNREAD_TEXT}</div>;
            return <div>{`unread-text-${unreadCount}`}</div>;
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
});
