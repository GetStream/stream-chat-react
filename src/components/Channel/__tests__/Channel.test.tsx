import { fromPartial } from '@total-typescript/shoehorn';
import { nanoid } from 'nanoid';
import React, { useEffect } from 'react';
import type {
  ChannelResponse,
  Channel as ChannelType,
  Event,
  LocalMessage,
  MessageRequest,
  MessageResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';
import { localMessageToNewMessagePayload } from 'stream-chat';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';

import { Channel, ChannelPlaceholder } from '../Channel';
import { Chat } from '../../Chat';

import { ChatProvider } from '../../../context/ChatContext';
import { useChannel } from '../../../context/useChannel';
import { useStateStore } from '../../../store';

import type { GenerateChannelOptions } from '../../../mock-builders';
import {
  dispatchChannelTruncatedEvent,
  dispatchConnectionChangedEvent,
  dispatchConnectionRecoveredEvent,
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
import { convertDateToTimestamp } from '../../../mock-builders';

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
// mocked API responses are typed against MessageRequest / MessageResponse. The shapes are runtime-identical
// for these tests, so bridge them explicitly rather than weakening assertions.
const toMessage = (m: LocalMessage) => m as unknown as MessageRequest;
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
  // `Channel` does not query any more -- whoever supplies the channel initializes it.
  await channel.watch();

  chatClient.channelServerConfigsStore.partialNext({
    configs: {
      ...chatClient.channelServerConfigs,
      [channel.cid]: mockedChannel.channel.config as never,
    },
  });
  return { channel, chatClient };
};

const MockMessageList = () => {
  const channel = useChannel();
  const { items } = useStateStore(channel.messagePaginator.state, (state) => ({
    items: state.items,
  }));
  const channelMessages = items ?? [];

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
          created_at: convertDateToTimestamp(new Date((i + 1) * 1000000)),
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

  it('renders the channel column with no channel bound, for the slot to fill while none is selected', async () => {
    // `Channel` used to accept no channel and render an `EmptyPlaceholder` in its place. A channel
    // is required now; an application that needs the column while nothing is selected renders this.
    const { asFragment } = render(
      <ChatProvider value={fromPartial<ChatContextValue>({})}>
        <ChannelPlaceholder>empty</ChannelPlaceholder>
      </ChatProvider>,
    );

    await waitFor(() => expect(screen.getByText('empty')).toBeInTheDocument());
    expect(asFragment()).toMatchSnapshot();
  });

  it('never queries the channel', async () => {
    // Initializing is the caller's job now: `Channel` binds a channel to its subtree and subscribes
    // to it, but it does not fetch. A channel that arrives unqueried stays that way, and its
    // children render whatever an empty channel renders.
    const { chatClient } = await setup();
    const unqueried = chatClient.channel('messaging', 'never-queried');
    const watchSpy = vi.spyOn(unqueried, 'watch');

    await renderComponent({ channel: unqueried, chatClient });

    expect(watchSpy).not.toHaveBeenCalled();
    expect(unqueried.initialized).toBe(false);
  });

  it('should provide context and render children', async () => {
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

  it('should not mark the channel as read on mount (owned by useMarkRead when caught up at the bottom)', async () => {
    const { channel, chatClient } = await setup();
    vi.spyOn(channel, 'countUnread').mockImplementation(() => 1);
    const channelOnSpy = vi.spyOn(channel, 'on');
    const markReadSpy = vi.spyOn(channel, 'markRead');

    // <Channel> renders no message list here, so nothing marks read on open; marking read is
    // triggered by useMarkRead (see useMarkRead tests), not by Channel mounting.
    await renderComponent({ channel, chatClient });
    // Wait for the mount/bootstrap effect to finish (it registers the channel event handler)...
    await waitFor(() => expect(channelOnSpy).toHaveBeenCalledWith(expect.any(Function)));
    // ...then confirm it did not mark read.
    expect(markReadSpy).not.toHaveBeenCalled();
  });

  describe('connection recovery', () => {
    // The client's reconnect hydration skips re-seeding the message list of an `active` channel
    // (Channel marks it active while mounted) and delegates that window to `channel.reload()`.
    // Nothing else calls it, so these pin the SDK component as the thing that does.
    it('reloads the channel when the connection is recovered', async () => {
      const { channel, chatClient } = await setup();
      await renderComponent({ channel, chatClient });

      const reloadSpy = vi.spyOn(channel, 'reload').mockResolvedValue(undefined);

      await act(async () => {
        dispatchConnectionRecoveredEvent(chatClient);
        await Promise.resolve();
      });

      await waitFor(() => expect(reloadSpy).toHaveBeenCalledTimes(1));
    });

    it('does not reload a channel that is pending disposal', async () => {
      const { channel, chatClient } = await setup();
      await renderComponent({ channel, chatClient });

      const reloadSpy = vi.spyOn(channel, 'reload').mockResolvedValue(undefined);
      // `reload()` goes through `getClient()`, which throws once the channel is pending disposal.
      channel.pendingDisposal = true;

      await act(async () => {
        dispatchConnectionRecoveredEvent(chatClient);
        await Promise.resolve();
      });

      expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('keeps rendering when the reload fails', async () => {
      const { channel, chatClient } = await setup();
      const { container } = await renderComponent({ channel, chatClient });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const reloadSpy = vi
        .spyOn(channel, 'reload')
        .mockRejectedValue(new Error('socket flapped'));

      await act(async () => {
        dispatchConnectionRecoveredEvent(chatClient);
        await Promise.resolve();
      });

      await waitFor(() => expect(reloadSpy).toHaveBeenCalledTimes(1));
      expect(container.querySelector('.str-chat__channel')).toBeInTheDocument();
      warnSpy.mockRestore();
    });
  });

  describe('disconnected client (#2393)', () => {
    it('does not crash rendering when the client disconnects while the channel is mounted', async () => {
      const { channel, chatClient } = await setup();
      const { container } = await renderComponent({ channel, chatClient });

      // the channel is initialized; the shared client then disconnects, leaving the channel
      // pending disposal
      channel.pendingDisposal = true;

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
      channel.pendingDisposal = true;

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
        const m = generateMessage({ cid: channel.cid, text: messageText });
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
          cid: channel.cid,
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

      it('sends through a request handler registered on client.config', async () => {
        // Successor to the removed `doSendMessageRequest` prop. Registration is declarative now, so
        // there is one place to install a handler and no mount-order arbitration between components.
        const { channel, chatClient } = await setup();
        const message = generateMessage();
        const sendMessageRequest = vi.fn(({ message: sentMessage }) =>
          Promise.resolve({ message: sentMessage }),
        );
        chatClient.config.set({ channel: { requestHandlers: { sendMessageRequest } } });

        await renderComponent({ channel, chatClient });

        await act(async () => {
          await channel
            .sendMessageWithLocalUpdate({
              localMessage: fromPartial({ ...message, status: 'sending' }),
              message: toMessage(message),
            })
            .catch(() => {});
        });

        expect(sendMessageRequest).toHaveBeenCalledWith(
          expect.objectContaining({ message: expect.objectContaining(message) }),
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
            // v10: single request object - `client.deleteMessage({ id, ...options })`.
            expect(clientDeleteMessageSpy).toHaveBeenCalledWith({
              id: message.id,
              ...deleteMessageOptions,
            }),
          );
        });

        it('calls a registered deleteMessageRequest instead of client.deleteMessage()', async () => {
          const { channel, chatClient } = await setup();
          const message = generateMessage();
          const deleteMessageOptions = { deleteForMe: true, hard: false };
          const deleteMessageRequest = vi.fn(() =>
            Promise.resolve({ message: toMessageResponse(message) }),
          );
          const clientDeleteMessageSpy = vi
            .spyOn(chatClient, 'deleteMessage')
            .mockResolvedValue(fromPartial({ message: toMessageResponse(message) }));
          chatClient.config.set({
            channel: { requestHandlers: { deleteMessageRequest } },
          });

          await renderComponent({ channel, chatClient });

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
            expect(deleteMessageRequest).toHaveBeenCalledWith(
              expect.objectContaining({ options: deleteMessageOptions }),
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
          // v10: single request object - `client.updateMessage({ id, message })`, where `message` is
          // the LocalMessage projected onto the API payload shape.
          expect(clientUpdateMessageSpy).toHaveBeenCalledWith({
            id: updatedMessage.id,
            message: localMessageToNewMessagePayload(fromPartial(updatedMessage)),
          }),
        );
      });

      it('uses a registered updateMessageRequest for the edit path', async () => {
        const { channel, chatClient, messages } = await setup();
        const updateMessageRequest = vi.fn(({ localMessage }) =>
          Promise.resolve({ message: localMessage }),
        );
        chatClient.config.set({ channel: { requestHandlers: { updateMessageRequest } } });

        await renderComponent({ channel, chatClient });

        await act(async () => {
          await channel
            .updateMessageWithLocalUpdate({ localMessage: fromPartial(messages[0]) })
            .catch(() => {});
        });

        await waitFor(() =>
          expect(updateMessageRequest).toHaveBeenCalledWith(
            expect.objectContaining({
              localMessage: expect.objectContaining({ id: messages[0].id }),
            }),
          ),
        );
      });

      it('should enable retrying message sending', async () => {
        const { channel, chatClient } = await setup();
        const messageObject = generateMessage({
          cid: channel.cid,
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
        const inTimeline = () =>
          channel.messagePaginator.items?.some((m) => m.id === firstMessage.id);
        expect(inTimeline()).toBe(true);

        act(() => {
          channel.messagePaginator.removeItem({ id: firstMessage.id });
        });

        await waitFor(() => expect(inTimeline()).toBe(false));
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

        // Message state now lives on the stream-chat channel's messagePaginator (the React reducer
        // and legacy channel.state message list were removed), so the message.new event is
        // reflected there.
        await waitFor(() => {
          expect(channel.messagePaginator.getItem(message.id)?.id).toBe(message.id);
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

      it('leaves document.title alone when a new message arrives', async () => {
        // The SDK no longer writes the tab title at all: what belongs there depends on what the
        // application is showing, which no SDK component can know. `examples/vite` shows an
        // application doing it for itself.
        const { channel, chatClient } = await setup();
        const titleBefore = document.title;
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          get: () => true,
        });
        vi.spyOn(channel, 'countUnread').mockImplementation(() => 1);
        const message = generateMessage({ user: generateUser() });
        const dispatchMessageEvent = createChannelEventDispatcher(
          { message },
          chatClient,
          channel,
        );

        await renderComponent({ channel, chatClient }, () => {
          dispatchMessageEvent();
        });

        expect(document.title).toBe(titleBefore);
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
              updated_at: convertDateToTimestamp(new Date().toISOString()),
            },
          },
          chatClient,
          channel,
        );
        await renderComponent({ channel, chatClient });

        await waitFor(() => {
          expect(channel.messagePaginator.headItems[0]?.user?.name).toBe(user.name);
        });

        await act(() => {
          dispatchUserUpdatedEvent();
        });

        // User references are now updated on the stream-chat channel's messagePaginator (via
        // client._updateUserMessageReferences -> reflectUserUpdate), which the MessageList reads
        // from (the removed React reducer used to own this mapping).
        await waitFor(() => {
          expect(channel.messagePaginator.headItems[0]?.user?.name).toBe(
            updatedAttribute.name,
          );
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
                    last_read: convertDateToTimestamp(new Date().toISOString()),
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
                    last_read: convertDateToTimestamp(new Date().toISOString()),
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
