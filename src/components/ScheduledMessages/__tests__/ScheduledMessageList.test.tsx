import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { SCHEDULED_MESSAGE_FAILURE_REASON, SCHEDULED_MESSAGE_STATUS } from 'stream-chat';
import type { PaginatorState, ScheduledMessageResponse, StreamChat } from 'stream-chat';

import { axe } from '../../../../axe-helper';
import {
  ChatProvider,
  DialogManagerProvider,
  TranslationProvider,
} from '../../../context';
import { WithComponents } from '../../../context/WithComponents';
import { Streami18n } from '../../../i18n';
import {
  convertDateToTimestamp,
  generatePoll,
  generateScheduledMessage,
  getScheduledMessagesPaginator,
  getTestClientWithUser,
  hydrateScheduledMessages,
  mockChatContext,
} from '../../../mock-builders';
import { ScheduledMessageList } from '../ScheduledMessageList';
import type { EditScheduledMessage, ScheduledMessageItemProps } from '../types';

const cid = 'messaging:general';

const WEDNESDAY_MORNING = new Date(2026, 9, 28, 10, 30);

const atLocalTime = (day: number, hour: number) =>
  convertDateToTimestamp(new Date(2026, 9, day, hour, 0));

type RenderListOptions = {
  client?: StreamChat;
  components?: Parameters<typeof WithComponents>[0]['overrides'];
  onEdit?: EditScheduledMessage;
  scheduledMessages?: ScheduledMessageResponse[];
  searchQuery?: string;
};

const renderList = async ({
  client: clientArg,
  components = {},
  onEdit,
  scheduledMessages = [],
  searchQuery,
}: RenderListOptions = {}) => {
  const client = clientArg ?? (await getTestClientWithUser({ id: 'user-id' }));
  hydrateScheduledMessages(client, cid, scheduledMessages);

  const { t, tDateTimeParser } = await new Streami18n({ language: 'en' }).init();

  const view = render(
    <WithComponents overrides={components}>
      <ChatProvider value={mockChatContext({ client })}>
        <TranslationProvider value={{ t, tDateTimeParser, userLanguage: 'en' }}>
          <DialogManagerProvider id='scheduled-message-list-test-dialog-manager'>
            <ScheduledMessageList cid={cid} onEdit={onEdit} searchQuery={searchQuery} />
          </DialogManagerProvider>
        </TranslationProvider>
      </ChatProvider>
    </WithComponents>,
  );

  return { ...view, client };
};

const getListedTexts = () =>
  screen
    .getAllByTestId('scheduled-message-item')
    .map(
      (item) => item.querySelector('.str-chat__summarized-message-preview')?.textContent,
    );

const getPaginator = (client: StreamChat) => getScheduledMessagesPaginator(client, cid);

const setPaginatorState = (
  client: StreamChat,
  state: Partial<PaginatorState<ScheduledMessageResponse>>,
) => act(() => getPaginator(client).state.partialNext(state));

const setNextCursor = (client: StreamChat) =>
  setPaginatorState(client, { hasMoreTail: true });

describe('ScheduledMessageList', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
    vi.setSystemTime(WEDNESDAY_MORNING);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('in a channel that takes no scheduled messages', () => {
    const setCapabilities = (
      client: StreamChat,
      ownCapabilities: string[],
      frozen = false,
    ) =>
      act(() => {
        const channel = client.channel('messaging', 'general');
        channel.data = { ...channel.data, frozen };
        channel.state.partialNext({ ownCapabilities });
      });

    it('says a frozen channel will not send them', async () => {
      const { client } = await renderList({
        scheduledMessages: [generateScheduledMessage({ cid })],
      });

      setCapabilities(client, [], true);

      expect(screen.getByRole('alert')).toHaveTextContent(
        "This channel is frozen. Scheduled messages won't be sent",
      );
    });

    it('says the user cannot schedule here, even with nothing scheduled', async () => {
      const { client } = await renderList();

      setCapabilities(client, ['send-message']);

      expect(screen.getByRole('alert')).toHaveTextContent(
        "You can't schedule messages in this channel",
      );
      expect(screen.getByText('No scheduled messages')).toBeInTheDocument();
    });

    it('shows nothing while the channel can schedule', async () => {
      const { client } = await renderList();

      setCapabilities(client, ['send-message', 'schedule-message']);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('shows the empty state without scheduled messages', async () => {
    await renderList();

    expect(screen.getByText('No scheduled messages')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Click the arrow next to the send button in a channel to schedule a message.',
      ),
    ).toBeInTheDocument();
  });

  it('shows skeleton rows while the first page loads', async () => {
    const { client } = await renderList();

    setPaginatorState(client, { isLoading: true, items: undefined });

    expect(screen.queryByText('No scheduled messages')).not.toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Loading scheduled messages' }),
    ).toBeInTheDocument();
  });

  it('shows the empty state while a later reload runs', async () => {
    const { client } = await renderList();

    setPaginatorState(client, { isLoading: true });

    expect(screen.getByText('No scheduled messages')).toBeInTheDocument();
    expect(
      screen.queryByTestId('scheduled-message-list-loading'),
    ).not.toBeInTheDocument();
  });

  it('shows the load error and reloads on retry', async () => {
    const { client } = await renderList();
    const reload = vi.spyOn(getPaginator(client), 'reload').mockResolvedValue(undefined);

    setPaginatorState(client, {
      isLoading: false,
      items: undefined,
      lastQueryError: new Error('offline'),
    });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText("Couldn't load scheduled messages")).toBeInTheDocument();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('keeps showing stored messages when a reload fails', async () => {
    const { client } = await renderList({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          message: { custom: {}, text: 'Launch moved to Monday' },
        }),
      ],
    });

    setPaginatorState(client, { lastQueryError: new Error('offline') });

    expect(screen.getByText('Launch moved to Monday')).toBeInTheDocument();
    expect(
      screen.queryByText("Couldn't load scheduled messages"),
    ).not.toBeInTheDocument();
  });

  it('shows only the messages matching the search query', async () => {
    await renderList({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          message: { custom: {}, text: 'Launch moved to Monday' },
        }),
        generateScheduledMessage({ cid, message: { custom: {}, text: 'Lunch at noon' } }),
      ],
      searchQuery: 'launch',
    });

    expect(screen.getByText('Launch moved to Monday')).toBeInTheDocument();
    expect(screen.queryByText('Lunch at noon')).not.toBeInTheDocument();
  });

  it('shows no results when the search matches nothing', async () => {
    await renderList({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          message: { custom: {}, text: 'Launch moved to Monday' },
        }),
      ],
      searchQuery: 'friday',
    });

    expect(screen.getByText('No messages found')).toBeInTheDocument();
    expect(screen.queryByText('No scheduled messages')).not.toBeInTheDocument();
  });

  it('loads further pages while the search matches nothing loaded', async () => {
    const { client } = await renderList({
      scheduledMessages: [
        generateScheduledMessage({ cid, message: { custom: {}, text: 'Lunch at noon' } }),
      ],
      searchQuery: 'friday',
    });
    const query = vi.spyOn(client, 'queryScheduledMessages').mockResolvedValue({
      duration: '',
      scheduled_messages: [
        generateScheduledMessage({ cid, message: { custom: {}, text: 'Friday demo' } }),
      ],
    } as never);

    setNextCursor(client);

    expect(await screen.findByText('Friday demo')).toBeInTheDocument();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('stops loading further pages when one fails', async () => {
    const { client } = await renderList({
      scheduledMessages: [
        generateScheduledMessage({ cid, message: { custom: {}, text: 'Lunch at noon' } }),
      ],
      searchQuery: 'friday',
    });
    const query = vi
      .spyOn(client, 'queryScheduledMessages')
      .mockRejectedValue(new Error('offline'));

    setNextCursor(client);

    expect(await screen.findByText('No messages found')).toBeInTheDocument();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('renders the list states through the list-state slots', async () => {
    const { client } = await renderList({
      components: {
        EmptyListIndicator: () => <div>Nothing here</div>,
        FirstPageLoadingIndicator: () => <div>Loading here</div>,
      },
    });

    expect(screen.getByText('Nothing here')).toBeInTheDocument();

    setPaginatorState(client, { isLoading: true, items: undefined });

    expect(screen.getByText('Loading here')).toBeInTheDocument();
  });

  // a failed message failed at its send time, so ordering by time alone lists it first
  it('lists the messages earliest first, failed ones included, without grouping', async () => {
    await renderList({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          message: { custom: {}, text: 'Friday plans' },
          scheduled_at: atLocalTime(30, 13),
        }),
        generateScheduledMessage({
          cid,
          message: { custom: {}, text: 'Tomorrow plans' },
          scheduled_at: atLocalTime(29, 9),
        }),
        generateScheduledMessage({
          cid,
          message: { custom: {}, text: 'Failed earlier' },
          scheduled_at: atLocalTime(28, 9),
          status: SCHEDULED_MESSAGE_STATUS.Failed,
        }),
      ],
    });

    expect(getListedTexts()).toEqual([
      expect.stringContaining('Failed earlier'),
      expect.stringContaining('Tomorrow plans'),
      expect.stringContaining('Friday plans'),
    ]);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows the send time and preview of each message', async () => {
    await renderList({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          message: { custom: {}, text: 'Launch moved to Monday' },
          scheduled_at: atLocalTime(29, 9),
        }),
      ],
    });

    const item = screen.getByTestId('scheduled-message-item');

    expect(within(item).getByText('Launch moved to Monday')).toBeInTheDocument();
    expect(within(item).getByText('Send Thu, Oct 29 at 09:00')).toBeInTheDocument();
    expect(within(item).queryByText('Scheduled')).not.toBeInTheDocument();
  });

  describe('a scheduled poll', () => {
    const scheduledPoll = () =>
      generateScheduledMessage({
        cid,
        message: { custom: {}, poll_id: 'poll-1', text: '' },
      });

    // the row reads "Poll", as a channel preview does; the composer preview shows the question
    it('loads the poll it carries only the ID of, and shows it as a poll', async () => {
      const client = await getTestClientWithUser({ id: 'user-id' });
      const getPoll = vi.spyOn(client, 'getPoll').mockResolvedValue({
        duration: '',
        poll: generatePoll({
          created_by: { id: 'user-id' },
          id: 'poll-1',
          name: 'Where do we eat?',
          vote_count: 0,
        }),
      } as never);

      await renderList({ client, scheduledMessages: [scheduledPoll()] });

      expect(await screen.findByText('Poll')).toBeInTheDocument();
      expect(getPoll).toHaveBeenCalledWith({ poll_id: 'poll-1' });
    });

    it('takes a poll the client already holds without loading it', async () => {
      const client = await getTestClientWithUser({ id: 'user-id' });
      const getPoll = vi.spyOn(client, 'getPoll').mockResolvedValue({
        duration: '',
        poll: generatePoll({ id: 'poll-1', name: 'Pizza or pasta?' }),
      } as never);
      await client.polls.getPoll('poll-1');
      getPoll.mockClear();

      await renderList({ client, scheduledMessages: [scheduledPoll()] });

      expect(screen.getByText('Poll')).toBeInTheDocument();
      expect(getPoll).not.toHaveBeenCalled();
    });
  });

  it('summarises attachments when the message has no text', async () => {
    await renderList({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          message: {
            attachments: [
              { custom: {}, image_url: 'https://example.com/a.png', type: 'image' },
            ],
            custom: {},
            text: '',
          },
        }),
      ],
    });

    expect(screen.getByText('Image')).toBeInTheDocument();
  });

  it('marks a message that is being sent', async () => {
    await renderList({
      scheduledMessages: [
        generateScheduledMessage({ cid, status: SCHEDULED_MESSAGE_STATUS.Sending }),
      ],
    });

    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('explains why a message failed', async () => {
    await renderList({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          failure_reason: SCHEDULED_MESSAGE_FAILURE_REASON.ChannelFrozen,
          status: SCHEDULED_MESSAGE_STATUS.Failed,
        }),
      ],
    });

    const item = screen.getByTestId('scheduled-message-item');

    expect(item).toHaveClass('str-chat__scheduled-message-item--failed');
    expect(within(item).getByText('This channel is frozen')).toBeInTheDocument();
  });

  it('loads the next page when scrolled to the end', async () => {
    const { client } = await renderList({
      scheduledMessages: [generateScheduledMessage({ cid })],
    });
    const query = vi
      .spyOn(client, 'queryScheduledMessages')
      .mockResolvedValue({ duration: '', scheduled_messages: [] } as never);
    setNextCursor(client);
    const list = screen.getByTestId('scheduled-message-list');
    Object.defineProperties(list, {
      clientHeight: { configurable: true, value: 100 },
      offsetParent: { configurable: true, value: document.body },
      scrollTop: { configurable: true, value: 0, writable: true },
    });
    Object.defineProperty(list.firstElementChild, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });

    list.scrollTop = 900;
    fireEvent.scroll(list);

    await waitFor(() => expect(query).toHaveBeenCalledTimes(1));
  });

  it('renders items through the ScheduledMessageItem slot', async () => {
    const CustomItem = ({ scheduledMessage }: ScheduledMessageItemProps) => (
      <div data-testid='custom-item'>{scheduledMessage.id}</div>
    );

    await renderList({
      components: { ScheduledMessageItem: CustomItem },
      scheduledMessages: [generateScheduledMessage({ cid, id: 'scheduled-id' })],
    });

    expect(screen.getByTestId('custom-item')).toHaveTextContent('scheduled-id');
  });

  it.each([
    ['loading', { isLoading: true, items: undefined }],
    [
      'load error',
      { isLoading: false, items: undefined, lastQueryError: new Error('offline') },
    ],
  ])('has no accessibility violations in the %s state', async (_, state) => {
    const { client, container } = await renderList();

    setPaginatorState(client, state);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations', async () => {
    const { container } = await renderList({
      scheduledMessages: [
        generateScheduledMessage({ cid }),
        generateScheduledMessage({ cid, status: SCHEDULED_MESSAGE_STATUS.Failed }),
      ],
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
