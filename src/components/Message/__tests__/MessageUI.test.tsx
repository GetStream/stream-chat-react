import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  type RenderResult,
  screen,
  waitFor,
} from '@testing-library/react';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import { fromPartial } from '@total-typescript/shoehorn';
import { axe } from '../../../../axe-helper';
import { Message } from '../Message';
import { MessageUI } from '../MessageUI';
import { MessageText as MessageTextMock } from '../MessageText';
import type { MessageProps } from '../types';

import { Chat } from '../../Chat';
import { Attachment as AttachmentMock } from '../../Attachment';
import { Avatar as AvatarMock } from '../../Avatar';
import { defaultReactionOptions } from '../../Reactions';

import { WithComponents } from '../../../context';
import {
  countReactions,
  generateFileAttachment,
  generateImageAttachment,
  generateMessage,
  generateReaction,
  generateStaticLocationResponse,
  generateUser,
  groupReactions,
  initClientWithChannels,
} from '../../../mock-builders';
import { Channel as ChannelComponent } from '../../Channel';
import { MessageBouncePrompt } from '../../MessageBounce';
import { ThreadProvider } from '../../Threads';
import { generateReminderResponse } from '../../../mock-builders/generator/reminder';
import type { Channel, StreamChat, Thread } from 'stream-chat';
import type { ComponentContextValue, MessageContextValue } from '../../../context';

// MERGE-RECONCILE (test migration): thread opening moved from the deleted ChannelActionContext
// `openThread` handler to the ChatView navigation `open`. We mock the ChatView navigation
// submodule so a single spy (openThreadMock) captures navigation from the reply-count button and
// the also-sent-in-channel "View" button.
const { openThreadMock } = vi.hoisted(() => ({ openThreadMock: vi.fn() }));

vi.mock('../../ChatView/ChatViewNavigationContext', () => ({
  createThreadEntityBinding: (
    _client: unknown,
    { message }: { message: { id?: string } },
  ) => ({ key: message?.id, kind: 'thread', source: { id: message?.id } }),
  useChatViewNavigation: () => ({ open: openThreadMock }),
  useSlotForKey: () => undefined,
  useSlotForKind: () => undefined,
}));

// MERGE-RECONCILE (test migration): the bounce retry action moved from ChannelActionContext
// `retrySendMessage` to the `useRetryHandler` hook (channel.retrySendMessageWithLocalUpdate).
// Mocking this leaf hook doubles as a spy for the retry action AND sidesteps a source-level
// circular-import fragility: MessageBounceContext imports useRetryHandler through the top
// `../components` barrel, whose re-export resolves to `undefined` under the test module graph
// (the same hook imported via the short `./hooks` path works — see report).
const { retryHandlerMock } = vi.hoisted(() => ({
  retryHandlerMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../components', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../components')>()),
  useRetryHandler: () => retryHandlerMock,
}));

Dayjs.extend(calendar);

vi.mock('../MessageText', () => ({
  MessageText: vi.fn(() => <div data-testid='mocked-message-text' />),
}));
vi.mock('../../Avatar', async (importOriginal) => ({
  ...(await importOriginal()),
  Avatar: vi.fn(() => <div data-testid='mocked-avatar' />),
}));
vi.mock('../../Modal', async (importOriginal) => ({
  ...(await importOriginal()),
  GlobalModal: vi.fn((props) => <div data-testid='mocked-modal'>{props.children}</div>),
}));

const alice = generateUser();
const bob = generateUser({ image: 'bob-avatar.jpg', name: 'bob' });
const carol = generateUser();
const removeMessageMock = vi.fn();

// Generous capability set so message actions/options render; individual MessageUI assertions
// here do not test capability-gated absence.
const OWN_CAPABILITIES = [
  'send-reaction',
  'send-reply',
  'delete-own-message',
  'update-own-message',
  'delete-any-message',
  'update-any-message',
  'flag-message',
  'mute-channel',
  'pin-message',
  'quote-message',
  'read-events',
];

function generateAliceMessage(
  messageOptions?: Parameters<typeof generateMessage>[0] & Record<string, unknown>,
) {
  return generateMessage({
    user: alice,
    ...messageOptions,
  });
}

function generateBobMessage(
  messageOptions?: Parameters<typeof generateMessage>[0] & Record<string, unknown>,
) {
  return generateMessage({
    user: bob,
    ...messageOptions,
  });
}

describe('<MessageSimple />', () => {
  let channel: Channel;
  let client: StreamChat;

  async function renderMessageSimple({
    components = {} as Partial<ComponentContextValue>,
    message,
    props = {} as Partial<MessageContextValue>,
    renderer = render,
  }: {
    // channelCapabilities / channelConfigOverrides kept for call-site compatibility; the
    // capabilities/config now live on the real channel created in beforeEach.
    channelCapabilities?: Record<string, boolean>;
    channelConfigOverrides?: Record<string, unknown>;
    components?: Partial<ComponentContextValue>;
    message: ReturnType<typeof generateMessage>;
    props?: Partial<MessageContextValue>;
    renderer?: typeof render;
  }) {
    // MERGE-RECONCILE (test migration): "in a thread" is now derived from useThreadContext()
    // (a <Thread>/ThreadProvider), not the legacy `threadList` prop. Wrap in ThreadProvider when
    // the caller opts into thread-list rendering so status suppression behaves as before.
    const messageElement = (
      <Message
        {...fromPartial<MessageProps>({
          message,
          threadList: false,
          ...props,
        })}
      />
    );
    let result: RenderResult;
    await act(() => {
      result = renderer(
        <Chat client={client}>
          <ChannelComponent channel={channel}>
            <WithComponents
              overrides={{
                Attachment: AttachmentMock,
                Message: () => <MessageUI {...props} />,
                reactionOptions: defaultReactionOptions,
                ...components,
              }}
            >
              {props.threadList ? (
                <ThreadProvider thread={fromPartial<Thread>({})}>
                  {messageElement}
                </ThreadProvider>
              ) : (
                messageElement
              )}
            </WithComponents>
          </ChannelComponent>
        </Chat>,
      );
    });
    return result;
  }

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(async () => {
    ({
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            config: {
              mutes: true,
              quotes: true,
              reactions: true,
              replies: true,
              user_message_reminder: true,
            },
            own_capabilities: OWN_CAPABILITIES,
          },
        } as any,
      ],
      customUser: alice,
    }));
    // Bounce delete removes the message from channel state (formerly ChannelActionContext
    // removeMessage).
    vi.spyOn(channel.state, 'removeMessage').mockImplementation(removeMessageMock);
  });

  it('should not render anything if message is of custom type message.date', async () => {
    const message = generateAliceMessage({
      customType: 'message.date',
      date: new Date(),
    });
    const { container } = await renderMessageSimple({ message });
    expect(container.querySelector('.str-chat__message')).not.toBeInTheDocument();
  });

  it('should render deleted message with default MessageDelete component when message was deleted', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-17T03:24:00').toISOString(),
    });
    const { container, getByTestId } = await renderMessageSimple({
      message: deletedMessage,
    });
    expect(getByTestId('message-deleted-bubble')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render deleted message when message type is deleted', async () => {
    const deletedMessage = generateAliceMessage({
      type: 'deleted',
    });
    const { container, getByTestId } = await renderMessageSimple({
      message: deletedMessage,
    });
    expect(getByTestId('message-deleted-bubble')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render deleted message when message is deleted for current user', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_for_me: true,
    });
    const { container, getByTestId } = await renderMessageSimple({
      message: deletedMessage,
    });
    expect(getByTestId('message-deleted-bubble')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render deleted message with custom component when message was deleted and a custom delete message component was passed', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-25T03:24:00').toISOString(),
    });
    const CustomMessageDeletedComponent = () => (
      <p data-testid='custom-message-deleted'>Gone!</p>
    );
    const { container, getByTestId } = await renderMessageSimple({
      components: {
        MessageDeleted: CustomMessageDeletedComponent,
      },
      message: deletedMessage,
    });
    expect(getByTestId('custom-message-deleted')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message with custom timestamp component when one is given', async () => {
    const message = generateAliceMessage();
    const CustomMessageTimestamp = () => (
      <div data-testid='custom-message-timestamp'>Timestamp</div>
    );
    const { container, getByTestId } = await renderMessageSimple({
      components: {
        MessageTimestamp: CustomMessageTimestamp,
      },
      message,
    });
    expect(getByTestId('custom-message-timestamp')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message with custom replies count button when one is given', async () => {
    const message = generateAliceMessage({ reply_count: 1 });
    const CustomRepliesCount = () => (
      <div data-testid='custom-message-replies-count'>Replies</div>
    );
    const { container, getByTestId } = await renderMessageSimple({
      components: {
        MessageRepliesCountButton: CustomRepliesCount,
      },
      message,
    });
    expect(getByTestId('custom-message-replies-count')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message with custom message-is-reply indicator', async () => {
    const message = generateAliceMessage({ parent_id: 'x', show_in_channel: true });
    const CustomMessageAlsoSentInChannelIndicator = () => (
      <div data-testid='custom-message-is-reply'>Is Reply</div>
    );
    const { container, getByTestId } = await renderMessageSimple({
      components: {
        MessageAlsoSentInChannelIndicator: CustomMessageAlsoSentInChannelIndicator,
      },
      message,
    });
    expect(getByTestId('custom-message-is-reply')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message with custom actions component when one is given', async () => {
    const message = generateAliceMessage({ text: '' });
    const CustomActions = () => <div data-testid='custom-message-actions'>Actions</div>;
    const { container, getByTestId } = await renderMessageSimple({
      components: {
        MessageActions: CustomActions,
      },
      message,
    });
    expect(getByTestId('custom-message-actions')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render custom ReminderNotification component when one is given', async () => {
    const message = generateAliceMessage({ reminder: generateReminderResponse() });
    client.reminders.hydrateState([message]);
    const testId = 'custom-reminder-notification';
    const CustomReminderNotification = () => <div data-testid={testId} />;

    const { container } = await renderMessageSimple({
      channelConfigOverrides: {
        user_message_reminder: true,
      },
      components: {
        ReminderNotification: CustomReminderNotification,
      },
      message,
    });

    expect(await screen.findByTestId(testId)).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // FIXME: test relying on deprecated channel config parameter
  it('should render reaction list even though sending reactions is disabled in channel config', async () => {
    const reactions = [generateReaction({ user: bob })];
    const message = generateAliceMessage({
      latest_reactions: reactions,
      reaction_counts: countReactions(reactions),
      reaction_groups: groupReactions(reactions),
      text: undefined,
    });

    const { container } = await renderMessageSimple({
      channelCapabilities: { 'send-reaction': false },
      message,
    });
    expect(container.querySelector('.str-chat__message-reactions')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render reaction list with custom component when one is given', async () => {
    const reactions = [generateReaction({ type: 'cool-reaction', user: bob })];
    const message = generateAliceMessage({
      latest_reactions: reactions,
      reaction_counts: countReactions(reactions),
      reaction_groups: groupReactions(reactions),
      text: undefined,
    });
    const CustomReactionsList = ({ reactions = [] }) => (
      <ul data-testid='custom-reaction-list'>
        {reactions.map((reaction) => {
          if (reaction.type === 'cool-reaction') {
            return <li key={reaction.type + reaction.user_id}>`:)`</li>;
          }
          return <li key={reaction.type + reaction.user_id}>?</li>;
        })}
      </ul>
    );
    const { container, getByTestId } = await renderMessageSimple({
      components: {
        MessageReactions: CustomReactionsList,
      },
      message,
    });
    expect(getByTestId('custom-reaction-list')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('delivery status', () => {
    it('should render no status when message not from the current user', async () => {
      const message = generateBobMessage();
      const { container, queryByTestId } = await renderMessageSimple({ message });
      expect(queryByTestId(/message-status/)).not.toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not render status when message is an error message', async () => {
      const message = generateAliceMessage({ type: 'error' });
      const { container, queryByTestId } = await renderMessageSimple({
        message,
        props: {
          readBy: [alice, bob],
        },
      });
      expect(queryByTestId(/message-status/)).not.toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render sending status when sending message', async () => {
      const message = generateAliceMessage({ status: 'sending' });
      const { container, getByTestId } = await renderMessageSimple({ message });
      expect(getByTestId('message-status-sending')).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render the "read by" status when the message is not part of a thread and was read by another chat members', async () => {
      const message = generateAliceMessage();
      const { container, getByTestId } = await renderMessageSimple({
        message,
        props: {
          readBy: [alice, bob],
        },
      });
      expect(getByTestId('message-status-read-by')).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render the "read by many" status when the message is not part of a thread and was read by more than one other chat members', async () => {
      const message = generateAliceMessage();
      const { container, getByTestId } = await renderMessageSimple({
        message,
        props: {
          readBy: [alice, bob, carol],
        },
      });
      expect(getByTestId('message-status-read-by-many')).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render a sent status when the message has status "received" and was not delivered to others and returnAllReadData=true', async () => {
      const message = generateAliceMessage({ status: 'received' });
      const { container, getByTestId } = await renderMessageSimple({
        message,
        props: {
          deliveredTo: [alice],
          returnAllReadData: true,
        },
      });
      expect(getByTestId('message-status-sent')).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not render sent status when the message is not lastOwnMessage and returnAllReadData=false', async () => {
      const message = generateAliceMessage({ status: 'received' });
      const { container } = await renderMessageSimple({
        message,
        props: {
          deliveredTo: [alice],
          lastOwnMessage: generateAliceMessage({ status: 'received' }),
        },
      });
      expect(screen.queryByTestId('message-status-sent')).not.toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render sent status when the message is not lastOwnMessage and returnAllReadData=false', async () => {
      const message = generateAliceMessage({ status: 'received' });
      const { container } = await renderMessageSimple({
        message,
        props: {
          deliveredTo: [alice],
          lastOwnMessage: message,
        },
      });
      expect(screen.queryByTestId('message-status-sent')).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render a delivered status when the message was delivered to others but not read', async () => {
      const message = generateAliceMessage({ status: 'received' });
      const { container, getByTestId } = await renderMessageSimple({
        message,
        props: {
          deliveredTo: [alice, bob],
        },
      });
      expect(getByTestId('message-status-delivered')).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not render status when rendered in a thread list and was delivered to other members', async () => {
      const message = generateAliceMessage();
      const { container, queryByTestId } = await renderMessageSimple({
        message,
        props: {
          deliveredTo: [alice, bob],
          readBy: [alice],
          threadList: true,
        },
      });
      expect(queryByTestId(/message-status/)).not.toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not render status when rendered in a thread list and was read by other members', async () => {
      const message = generateAliceMessage();
      const { container, queryByTestId } = await renderMessageSimple({
        message,
        props: {
          readBy: [alice, bob, carol],
          threadList: true,
        },
      });
      expect(queryByTestId(/message-status/)).not.toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  it("should render the message user's avatar", async () => {
    const message = generateBobMessage();
    const { container } = await renderMessageSimple({
      message,
      props: {
        onUserClick: vi.fn(),
        onUserHover: vi.fn(),
      },
    });
    expect(AvatarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: message.user.image,
        onClick: expect.any(Function),
        onMouseOver: expect.any(Function),
        userName: message.user.name,
      }),
      undefined,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render failed message with error styling', async () => {
    const message = generateAliceMessage({ status: 'failed' });
    const { container } = await renderMessageSimple({
      message,
    });
    expect(
      container.querySelector('.str-chat__message-send-can-be-retried'),
    ).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not assign keyboard button semantics to failed messages', async () => {
    const message = generateAliceMessage({ status: 'failed' });
    const { getByTestId } = await renderMessageSimple({ message });
    const messageInner = getByTestId('message-inner');

    expect(messageInner).not.toHaveAttribute('aria-label');
    expect(messageInner).not.toHaveAttribute('role');
    expect(messageInner).not.toHaveAttribute('tabindex');

    fireEvent.keyDown(messageInner, { code: 'Enter', key: 'Enter' });
    fireEvent.keyDown(messageInner, { code: 'Space', key: ' ' });
    fireEvent.click(messageInner);
    expect(retryHandlerMock).not.toHaveBeenCalled();
  });

  it('should not assign keyboard button semantics to non-retryable regular messages', async () => {
    const message = generateAliceMessage({ status: 'received' });
    const { getByTestId } = await renderMessageSimple({ message });
    const messageInner = getByTestId('message-inner');

    expect(messageInner).not.toHaveAttribute('aria-label');
    expect(messageInner).not.toHaveAttribute('role');
    expect(messageInner).not.toHaveAttribute('tabindex');
  });

  it('should render message options', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { container, getByTestId } = await renderMessageSimple({
      message,
      props: {
        handleOpenThread: vi.fn(),
      },
    });

    await waitFor(() => {
      expect(getByTestId('message-actions-toggle-button')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message text when message has text', async () => {
    const message = generateAliceMessage({ text: 'Hello' });
    const actionsEnabled = true;
    const messageListRect = {
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      toJSON: () => {},
      top: 0,
      width: 100,
      x: 0,
      y: 0,
    };
    const unsafeHTML = false;
    const { container } = await renderMessageSimple({
      message,
      props: {
        actionsEnabled,
        messageListRect,
        unsafeHTML,
      },
    });

    expect(MessageTextMock).toHaveBeenCalled();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display non image attachments in Attachment component when message has attachments that are not images', async () => {
    const message = generateAliceMessage({
      attachments: Array.from({ length: 3 }, generateFileAttachment),
    });
    const { queryAllByTestId } = await renderMessageSimple({ message });
    expect(queryAllByTestId('attachment-file')).toHaveLength(3);
  });

  it('should display image attachments in gallery when message has image attachments', async () => {
    const attachment = {
      image_url: 'http://image.jpg',
      type: 'image',
    };
    const message = generateAliceMessage({
      attachments: [attachment, attachment, attachment],
    });
    const { container } = await renderMessageSimple({ message });
    expect(container.querySelectorAll('.str-chat__modal-gallery__image')).toHaveLength(3);
  });

  it('adds shared location at the beginning of the attachment list', async () => {
    const message = generateAliceMessage({
      attachments: [
        generateFileAttachment(),
        generateImageAttachment(),
        generateImageAttachment(),
      ],
      shared_location: generateStaticLocationResponse({}),
    });
    const { container } = await renderMessageSimple({ message });
    expect(container.querySelectorAll('.str-chat__modal-gallery__image')).toHaveLength(2);
    expect(screen.getAllByTestId('attachment-file')).toHaveLength(1);
    expect(screen.getAllByTestId('attachment-geolocation')).toHaveLength(1);
  });

  it('should display reply count and handle replies count button click when not in thread list and reply count is not 0', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { container, getByTestId } = await renderMessageSimple({ message });
    expect(getByTestId('replies-count-button')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display also-sent-in-channel indicator', async () => {
    const message = generateAliceMessage({
      parent_id: 'x',
      show_in_channel: true,
    });
    const { container } = await renderMessageSimple({ message });
    expect(
      container.querySelector('.str-chat__message-also-sent-in-channel'),
    ).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // MERGE-RECONCILE (test migration): the also-sent-in-channel "View" navigation moved from the
  // ChannelActionContext `openThread` handler to useMessageAlsoSentInChannelNavigation, which
  // resolves the parent thread via `client.getThread` and then navigates through ChatView `open`.
  it('should open thread when View button is clicked and parent thread is resolved', async () => {
    const parentMessage = generateMessage({ id: 'x' });
    const message = generateAliceMessage({
      parent_id: parentMessage.id,
      show_in_channel: true,
    });
    vi.spyOn(client, 'getThread').mockResolvedValue(
      fromPartial({
        id: parentMessage.id,
        messagePaginator: { jumpToMessage: vi.fn(() => Promise.resolve(true)) },
      }),
    );
    const { container, getByText } = await renderMessageSimple({
      message,
    });
    expect(openThreadMock).not.toHaveBeenCalled();
    fireEvent.click(getByText('View'));
    await waitFor(() =>
      expect(openThreadMock).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'thread' }),
      ),
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not open thread when the parent thread cannot be resolved', async () => {
    const parentMessage = generateMessage({ id: 'x' });
    const message = generateAliceMessage({
      parent_id: parentMessage.id,
      show_in_channel: true,
    });
    vi.spyOn(client, 'getThread').mockRejectedValue(new Error('not found'));
    const { container, getByText } = await renderMessageSimple({
      message,
    });
    expect(openThreadMock).not.toHaveBeenCalled();
    fireEvent.click(getByText('View'));
    await waitFor(() => expect(client.getThread).toHaveBeenCalled());
    expect(openThreadMock).not.toHaveBeenCalled();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should fetch the parent thread via getThread when not present locally', async () => {
    const parentMessage = generateMessage({ id: 'x' });
    const message = generateAliceMessage({
      parent_id: parentMessage.id,
      show_in_channel: true,
    });
    const getThreadSpy = vi.spyOn(client, 'getThread').mockResolvedValue(
      fromPartial({
        id: parentMessage.id,
        messagePaginator: { jumpToMessage: vi.fn(() => Promise.resolve(true)) },
      }),
    );
    const { container, getByText } = await renderMessageSimple({
      message,
    });
    fireEvent.click(getByText('View'));
    await waitFor(() =>
      expect(getThreadSpy).toHaveBeenCalledWith(
        parentMessage.id,
        expect.objectContaining({ watch: true }),
      ),
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should open thread when reply count button is clicked', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { container, getByTestId } = await renderMessageSimple({
      message,
    });
    expect(openThreadMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('replies-count-button'));
    expect(openThreadMock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'thread' }),
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should display message's user name when message not from the current user", async () => {
    const message = generateBobMessage();
    // memberCount must be > 2 for the name to be shown
    channel.state.members = {
      [alice.id]: { user: alice },
      [bob.id]: { user: bob },
      [carol.id]: { user: carol },
    };
    const { container, getByText } = await renderMessageSimple({
      message,
      props: {
        isMyMessage: () => false,
      },
    });
    expect(getByText(bob.name)).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // Reset members
    channel.state.members = {};
  });

  it("should display message's timestamp", async () => {
    const messageDate = new Date('2019-12-12T03:33:00');
    const message = generateAliceMessage({
      created_at: messageDate,
    });
    const { container } = await renderMessageSimple({ message });
    const timeEl = container.querySelector('time.str-chat__message-metadata__timestamp');
    expect(timeEl).toBeInTheDocument();
    expect(timeEl).toHaveAttribute('datetime', messageDate.toISOString());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe.each<
    [string, Parameters<typeof generateMessage>[0] & Record<string, unknown>]
  >([
    [
      'v1',
      {
        moderation_details: {
          action: 'MESSAGE_RESPONSE_ACTION_BOUNCE',
        },
        type: 'error',
      },
    ],
    [
      'v2',
      {
        moderation: {
          action: 'bounce',
        },
        type: 'error',
      },
    ],
  ])('bounced message %s', (_, bouncedMessageOptions) => {
    it('should render error badge for bounced messages', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { container } = await renderMessageSimple({ message });
      expect(
        container.querySelector('.str-chat__message-error-indicator'),
      ).toBeInTheDocument();
    });

    it('should render open bounce modal on click', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { getByTestId, queryByTestId } = await renderMessageSimple({ message });
      fireEvent.click(getByTestId('message-inner'));
      expect(queryByTestId('message-bounce-prompt')).toBeInTheDocument();
    });

    it('should apply keyboard/button semantics to bounced message wrapper', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { getByTestId } = await renderMessageSimple({ message });
      const messageInner = getByTestId('message-inner');

      expect(messageInner).toHaveAttribute('aria-label', 'Review bounced message');
      expect(messageInner).toHaveAttribute('role', 'button');
      expect(messageInner).toHaveAttribute('tabindex', '0');
    });

    it('should open bounce modal on Enter key', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { getByTestId, queryByTestId } = await renderMessageSimple({ message });
      const messageInner = getByTestId('message-inner');

      fireEvent.keyDown(messageInner, { key: 'Backspace' });
      expect(queryByTestId('message-bounce-prompt')).not.toBeInTheDocument();

      fireEvent.keyDown(messageInner, { code: 'Enter', key: 'Enter' });
      expect(queryByTestId('message-bounce-prompt')).toBeInTheDocument();
    });

    it('should open bounce modal on Space key', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { getByTestId, queryByTestId } = await renderMessageSimple({ message });
      const messageInner = getByTestId('message-inner');

      fireEvent.keyDown(messageInner, { code: 'Space', key: ' ' });
      expect(queryByTestId('message-bounce-prompt')).toBeInTheDocument();
    });

    it('should render edit button in bounce prompt', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { getByTestId, queryByTestId } = await renderMessageSimple({
        message,
      });
      fireEvent.click(getByTestId('message-inner'));
      expect(queryByTestId('message-bounce-edit')).toBeInTheDocument();
    });

    it('should retry sending message', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { getByTestId } = await renderMessageSimple({
        message,
      });
      fireEvent.click(getByTestId('message-inner'));
      fireEvent.click(getByTestId('message-bounce-send'));
      expect(retryHandlerMock).toHaveBeenCalledWith({
        localMessage: expect.objectContaining({
          id: message.id,
        }),
      });
    });

    it('should remove message', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { getByTestId } = await renderMessageSimple({
        message,
      });
      fireEvent.click(getByTestId('message-inner'));
      fireEvent.click(getByTestId('message-bounce-delete'));
      expect(removeMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: message.id,
        }),
      );
    });

    it('should use overriden modal content component', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const CustomMessageBouncePrompt = () => (
        <div data-testid='custom-message-bounce-prompt'>Overriden</div>
      );
      const { getByTestId, queryByTestId } = await renderMessageSimple({
        components: {
          MessageBouncePrompt: CustomMessageBouncePrompt,
        },
        message,
      });
      fireEvent.click(getByTestId('message-inner'));
      expect(queryByTestId('custom-message-bounce-prompt')).toBeInTheDocument();
    });

    it('should use overriden modal content text', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const CustomMessageBouncePrompt = () => (
        <MessageBouncePrompt>Overriden</MessageBouncePrompt>
      );
      const { getByTestId, queryByText } = await renderMessageSimple({
        components: {
          MessageBouncePrompt: CustomMessageBouncePrompt,
        },
        message,
      });
      fireEvent.click(getByTestId('message-inner'));
      expect(queryByText('Overriden')).toBeInTheDocument();
    });

    it('should pass axe for bounced messages', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { container } = await renderMessageSimple({ message });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('edited label', () => {
    const editedMessageOptions = {
      message_text_updated_at: '2024-03-05T09:56:22.487729Z',
    };

    it('should render error badge for bounced messages', async () => {
      const message = generateAliceMessage(editedMessageOptions);
      const { queryAllByText } = await renderMessageSimple({ message });
      expect(queryAllByText('Edited', { exact: true })).not.toHaveLength(0);
    });
  });
});
