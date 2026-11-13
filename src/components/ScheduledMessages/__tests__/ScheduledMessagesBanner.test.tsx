import '../../..';
import React from 'react';
import type { PropsWithChildren } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { formatMessage, ScheduledMessageEventType, Thread } from 'stream-chat';
import type { ScheduledMessageResponse } from 'stream-chat';

import type { ScheduledMessageListDialogProps } from '../ScheduledMessageListDialog';

import { axe } from '../../../../axe-helper';
import { AriaLiveAnnouncerContext } from '../../Accessibility';
import type { AriaLiveAnnounce } from '../../Accessibility';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { WithComponents } from '../../../context/WithComponents';
import { MessageComposer } from '../../MessageComposer';
import { ThreadProvider } from '../../Threads';
import {
  convertDateToTimestamp,
  dispatchScheduledMessageEvent,
  generateMessage,
  generateScheduledMessage,
  generateUser,
  getScheduledMessagesPaginator,
  hydrateScheduledMessages,
  initClientWithChannels,
} from '../../../mock-builders';

const user = generateUser({ id: 'user-id' });

const cid = 'messaging:general';
const parentId = 'parent-1';

const threadReply = () =>
  generateScheduledMessage({
    cid,
    message: { custom: {}, parent_id: parentId, text: 'reply' },
  });

type RenderComposerOptions = {
  announce?: AriaLiveAnnounce;
  awaitsScheduledMessages?: boolean;
  canSchedule?: boolean;
  components?: Parameters<typeof WithComponents>[0]['overrides'];
  inThread?: boolean;
  scheduledMessages?: ScheduledMessageResponse[];
};

const renderComposer = async ({
  announce,
  awaitsScheduledMessages = true,
  canSchedule = true,
  components = {},
  inThread = false,
  scheduledMessages = [],
}: RenderComposerOptions = {}) => {
  const ownCapabilities = canSchedule
    ? ['send-message', 'schedule-message']
    : ['send-message'];
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [
      {
        channel: { id: 'general', own_capabilities: ownCapabilities, type: 'messaging' },
      },
    ],
    customUser: user,
  });
  vi.spyOn(client, 'queryScheduledMessages').mockResolvedValue(
    fromPartial({ duration: '', scheduled_messages: scheduledMessages }),
  );

  const thread = inThread
    ? new Thread({
        channel,
        client,
        parentMessage: formatMessage(generateMessage({ cid, id: parentId })),
      })
    : undefined;

  const ThreadScope = ({ children }: PropsWithChildren) =>
    thread ? <ThreadProvider thread={thread}>{children}</ThreadProvider> : children;

  await act(() => {
    render(
      <Chat client={client}>
        <AnnouncerScope announce={announce}>
          <WithComponents overrides={components}>
            <Channel channel={channel}>
              <ThreadScope>
                <MessageComposer />
              </ThreadScope>
            </Channel>
          </WithComponents>
        </AnnouncerScope>
      </Chat>,
    );
  });

  if (awaitsScheduledMessages) {
    await waitFor(() =>
      expect(getScheduledMessagesPaginator(client, cid).hasLoadedPage).toBe(true),
    );
  }

  return { channel, client };
};

const AnnouncerScope = ({
  announce,
  children,
}: PropsWithChildren<{ announce?: AriaLiveAnnounce }>) =>
  announce ? (
    <AriaLiveAnnouncerContext.Provider value={{ announce }}>
      {children}
    </AriaLiveAnnouncerContext.Provider>
  ) : (
    children
  );

const queryBanner = () => screen.queryByTestId('scheduled-messages-banner');

const ON_JANUARY_15 = convertDateToTimestamp(new Date(2030, 0, 15, 9, 0));

describe('ScheduledMessagesBanner', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('stays hidden without scheduled messages', async () => {
    await renderComposer();

    expect(queryBanner()).not.toBeInTheDocument();
  });

  it('counts the scheduled messages of the channel', async () => {
    await renderComposer({
      scheduledMessages: [
        generateScheduledMessage({ cid }),
        generateScheduledMessage({ cid }),
        threadReply(),
      ],
    });

    expect(queryBanner()).toHaveTextContent('2 scheduled messages');
  });

  it('shows when the only scheduled message is sent, with View', async () => {
    await renderComposer({
      scheduledMessages: [generateScheduledMessage({ cid, scheduled_at: ON_JANUARY_15 })],
    });

    expect(queryBanner()).toHaveTextContent('Scheduled for Tue, Jan 15 at 09:00');
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
  });

  it('is hidden while the composer edits a scheduled message', async () => {
    const scheduledMessage = generateScheduledMessage({ cid });
    const { channel } = await renderComposer({ scheduledMessages: [scheduledMessage] });

    await act(() => channel.messageComposer.editScheduledMessage(scheduledMessage));

    expect(queryBanner()).not.toBeInTheDocument();
  });

  it('announces a change, but not the banner the channel opens with', async () => {
    const announce = vi.fn(() => () => undefined);
    const scheduledMessage = generateScheduledMessage({
      cid,
      scheduled_at: ON_JANUARY_15,
    });
    const { client } = await renderComposer({
      announce,
      scheduledMessages: [scheduledMessage],
    });

    expect(announce).not.toHaveBeenCalled();

    act(() =>
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage: { ...scheduledMessage, status: 'failed' },
        type: ScheduledMessageEventType.Failed,
      }),
    );

    await waitFor(() => expect(announce).toHaveBeenCalledWith('1 failed to send'));
  });

  it('switches to the failed count when a scheduled message failed', async () => {
    await renderComposer({
      scheduledMessages: [
        generateScheduledMessage({ cid }),
        generateScheduledMessage({ cid, status: 'failed' }),
      ],
    });

    expect(queryBanner()).toHaveTextContent('1 failed to send');
    expect(queryBanner()).not.toHaveTextContent('scheduled messages');
    expect(queryBanner()).toHaveClass('str-chat__scheduled-messages-banner--failed');
  });

  it('leaves out the failed count when nothing failed', async () => {
    await renderComposer({ scheduledMessages: [generateScheduledMessage({ cid })] });

    expect(queryBanner()).not.toHaveTextContent('failed');
  });

  it('disappears when the store is reset for another user', async () => {
    const { client } = await renderComposer({
      scheduledMessages: [generateScheduledMessage({ cid })],
    });

    act(() => getScheduledMessagesPaginator(client, cid).resetState());

    expect(queryBanner()).not.toBeInTheDocument();
  });

  it('follows the scheduled messages of the next user after a reset', async () => {
    const { client } = await renderComposer({
      scheduledMessages: [generateScheduledMessage({ cid })],
    });

    act(() => getScheduledMessagesPaginator(client, cid).resetState());
    act(() =>
      hydrateScheduledMessages(client, cid, [
        generateScheduledMessage({ cid }),
        generateScheduledMessage({ cid }),
      ]),
    );

    expect(queryBanner()).toHaveTextContent('2 scheduled messages');
  });

  it('counts only the replies of the thread in a thread composer', async () => {
    await renderComposer({
      inThread: true,
      scheduledMessages: [
        generateScheduledMessage({ cid }),
        threadReply(),
        threadReply(),
      ],
    });

    expect(queryBanner()).toHaveTextContent('2 scheduled replies');
  });

  /** Without the capability nothing is queried: the messages come with the channel query. */
  const renderWithoutCapability = async (
    scheduledMessages: ScheduledMessageResponse[],
  ) => {
    const { channel, client } = await renderComposer({
      awaitsScheduledMessages: false,
      canSchedule: false,
    });
    act(() => channel.scheduledMessagesPaginator.hydrate(scheduledMessages));
    return { channel, client };
  };

  it('stays hidden without the schedule-message capability', async () => {
    await renderWithoutCapability([generateScheduledMessage({ cid })]);

    expect(queryBanner()).not.toBeInTheDocument();
  });

  it('shows failed scheduled messages without the schedule-message capability', async () => {
    await renderWithoutCapability([generateScheduledMessage({ cid, status: 'failed' })]);

    expect(queryBanner()).toHaveTextContent('1 failed to send');
    expect(queryBanner()).toHaveTextContent('View all');
  });

  it('does not query scheduled messages without the schedule-message capability', async () => {
    const { client } = await renderWithoutCapability([]);

    expect(client.queryScheduledMessages).not.toHaveBeenCalled();
  });

  it('updates when scheduled message events arrive', async () => {
    const { client } = await renderComposer();
    const scheduledMessage = generateScheduledMessage({ cid });

    act(() =>
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage,
        type: ScheduledMessageEventType.Created,
      }),
    );

    await waitFor(() => expect(queryBanner()).toHaveTextContent('Scheduled for'));

    act(() =>
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage: { ...scheduledMessage, status: 'sent' },
        type: ScheduledMessageEventType.Sent,
      }),
    );

    await waitFor(() => expect(queryBanner()).not.toBeInTheDocument());
  });

  it('opens the scheduled message list from View', async () => {
    await renderComposer({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          message: { custom: {}, text: 'Launch moved to Monday' },
        }),
      ],
    });

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'View' })));

    const dialog = await screen.findByTestId('scheduled-message-list-dialog');

    expect(dialog).toHaveTextContent('Scheduled messages');
    expect(dialog).toHaveTextContent('Launch moved to Monday');
  });

  it('filters the scheduled message list with the search field', async () => {
    await renderComposer({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          message: { custom: {}, text: 'Launch moved to Monday' },
        }),
        generateScheduledMessage({ cid, message: { custom: {}, text: 'Lunch at noon' } }),
      ],
    });

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'View all' })));
    const dialog = await screen.findByTestId('scheduled-message-list-dialog');
    const search = within(dialog).getByRole('searchbox', { name: 'Search' });
    fireEvent.change(search, { target: { value: 'launch' } });

    expect(dialog).toHaveTextContent('Launch moved to Monday');
    expect(dialog).not.toHaveTextContent('Lunch at noon');

    // a button, so the keyboard reaches it
    fireEvent.click(within(dialog).getByRole('button', { name: 'Clear search' }));

    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    // kept in place so the field keeps its height, hidden from pointer and keyboard
    expect(screen.getByRole('button', { name: 'Clear search' })).toHaveClass(
      'str-chat__form-text-input__clear-button--hidden',
    );
    expect(dialog).toHaveTextContent('Lunch at noon');
  });

  it('titles the list as replies in a thread', async () => {
    await renderComposer({ inThread: true, scheduledMessages: [threadReply()] });

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'View' })));

    expect(await screen.findByTestId('scheduled-message-list-dialog')).toHaveTextContent(
      'Scheduled replies',
    );
  });

  it('opens what the ScheduledMessageListDialog slot renders', async () => {
    const scheduledMessage = generateScheduledMessage({ cid });
    const ScheduledMessageListDialog = vi.fn(
      ({ close, open, openInComposer }: ScheduledMessageListDialogProps) =>
        open ? (
          <div data-testid='custom-list'>
            <button onClick={close} type='button'>
              Close list
            </button>
            <button onClick={() => openInComposer?.(scheduledMessage)} type='button'>
              Edit it
            </button>
          </div>
        ) : null,
    );
    const { channel } = await renderComposer({
      components: { ScheduledMessageListDialog },
      scheduledMessages: [scheduledMessage],
    });

    expect(screen.queryByTestId('custom-list')).not.toBeInTheDocument();

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'View' })));

    expect(screen.getByTestId('custom-list')).toBeInTheDocument();
    expect(ScheduledMessageListDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        scheduledMessages: channel.scheduledMessages,
      }),
      undefined,
    );

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Close list' })));

    expect(screen.queryByTestId('custom-list')).not.toBeInTheDocument();

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'View' })));
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Edit it' })));

    // editing closes the list and opens the message in the composer
    expect(screen.queryByTestId('custom-list')).not.toBeInTheDocument();
    expect(channel.messageComposer.editedScheduledMessage?.id).toBe(scheduledMessage.id);
  });

  it('can be hidden through the ScheduledMessagesBanner slot', async () => {
    const { client } = await renderComposer({
      awaitsScheduledMessages: false,
      components: { ScheduledMessagesBanner: null },
      scheduledMessages: [generateScheduledMessage({ cid })],
    });

    expect(queryBanner()).not.toBeInTheDocument();
    expect(client.queryScheduledMessages).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    await renderComposer({ scheduledMessages: [generateScheduledMessage({ cid })] });

    expect(await axe(queryBanner() as HTMLElement)).toHaveNoViolations();
  });

  it('has no accessibility violations with failed messages', async () => {
    await renderComposer({
      scheduledMessages: [generateScheduledMessage({ cid, status: 'failed' })],
    });

    expect(await axe(queryBanner() as HTMLElement)).toHaveNoViolations();
  });
});
