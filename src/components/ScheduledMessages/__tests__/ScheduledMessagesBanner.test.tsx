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

import { axe } from '../../../../axe-helper';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { WithComponents } from '../../../context/WithComponents';
import { MessageComposer } from '../../MessageComposer';
import { ThreadProvider } from '../../Threads';
import {
  dispatchScheduledMessageEvent,
  generateMessage,
  generateScheduledMessage,
  generateUser,
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
  awaitsScheduledMessages?: boolean;
  canSchedule?: boolean;
  components?: Parameters<typeof WithComponents>[0]['overrides'];
  inThread?: boolean;
  scheduledMessages?: ScheduledMessageResponse[];
};

const renderComposer = async ({
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
        <WithComponents overrides={components}>
          <Channel channel={channel}>
            <ThreadScope>
              <MessageComposer />
            </ThreadScope>
          </Channel>
        </WithComponents>
      </Chat>,
    );
  });

  if (awaitsScheduledMessages) {
    await waitFor(() =>
      expect(client.scheduledMessages.getChannelPaginator(cid).hasLoadedPage).toBe(true),
    );
  }

  return { channel, client };
};

const queryBanner = () => screen.queryByTestId('scheduled-messages-banner');

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

  it('uses the singular for one scheduled message', async () => {
    await renderComposer({ scheduledMessages: [generateScheduledMessage({ cid })] });

    expect(queryBanner()).toHaveTextContent('1 scheduled message');
    expect(queryBanner()).not.toHaveTextContent('1 scheduled messages');
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

    act(() => client.scheduledMessages.resetState());

    expect(queryBanner()).not.toBeInTheDocument();
  });

  it('follows the scheduled messages of the next user after a reset', async () => {
    const { client } = await renderComposer({
      scheduledMessages: [generateScheduledMessage({ cid })],
    });

    act(() => client.scheduledMessages.resetState());
    act(() =>
      client.scheduledMessages.hydrateChannelState(cid, [
        generateScheduledMessage({ cid }),
        generateScheduledMessage({ cid }),
      ]),
    );

    expect(queryBanner()).toHaveTextContent('2 scheduled messages');
  });

  it('counts only the replies of the thread in a thread composer', async () => {
    await renderComposer({
      inThread: true,
      scheduledMessages: [generateScheduledMessage({ cid }), threadReply()],
    });

    expect(queryBanner()).toHaveTextContent('1 scheduled reply');
  });

  it('stays hidden without the schedule-message capability', async () => {
    await renderComposer({
      canSchedule: false,
      scheduledMessages: [generateScheduledMessage({ cid })],
    });

    expect(queryBanner()).not.toBeInTheDocument();
  });

  it('shows failed scheduled messages without the schedule-message capability', async () => {
    await renderComposer({
      canSchedule: false,
      scheduledMessages: [generateScheduledMessage({ cid, status: 'failed' })],
    });

    expect(queryBanner()).toHaveTextContent('1 failed to send');
    expect(queryBanner()).toHaveTextContent('View all');
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

    await waitFor(() => expect(queryBanner()).toHaveTextContent('1 scheduled message'));

    act(() =>
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage: { ...scheduledMessage, status: 'sent' },
        type: ScheduledMessageEventType.Sent,
      }),
    );

    await waitFor(() => expect(queryBanner()).not.toBeInTheDocument());
  });

  it('opens the scheduled message list from View all', async () => {
    await renderComposer({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          message: { custom: {}, text: 'Launch moved to Monday' },
        }),
      ],
    });

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'View all' })));

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
    fireEvent.change(within(dialog).getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'launch' },
    });

    expect(dialog).toHaveTextContent('Launch moved to Monday');
    expect(dialog).not.toHaveTextContent('Lunch at noon');
  });

  it('titles the list as replies in a thread', async () => {
    await renderComposer({ inThread: true, scheduledMessages: [threadReply()] });

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'View all' })));

    expect(await screen.findByTestId('scheduled-message-list-dialog')).toHaveTextContent(
      'Scheduled replies',
    );
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
