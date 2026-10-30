import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ScheduledMessageFailureReason, ScheduledMessageStatus } from 'stream-chat';
import type { ScheduledMessageResponse, StreamChat } from 'stream-chat';

import { axe } from '../../../../axe-helper';
import { ChatProvider, TranslationProvider } from '../../../context';
import { WithComponents } from '../../../context/WithComponents';
import { Streami18n } from '../../../i18n';
import {
  generateScheduledMessage,
  getTestClientWithUser,
  mockChatContext,
} from '../../../mock-builders';
import { ScheduledMessageList } from '../ScheduledMessageList';
import type { ScheduledMessageItemProps } from '../types';

const cid = 'messaging:general';

const WEDNESDAY_MORNING = new Date(2026, 9, 28, 10, 30);

const atLocalTime = (day: number, hour: number) =>
  new Date(2026, 9, day, hour, 0).toISOString();

type RenderListOptions = {
  components?: Parameters<typeof WithComponents>[0]['overrides'];
  scheduledMessages?: ScheduledMessageResponse[];
};

const renderList = async ({
  components = {},
  scheduledMessages = [],
}: RenderListOptions = {}) => {
  const client = await getTestClientWithUser({ id: 'user-id' });
  scheduledMessages.forEach(client.scheduledMessages.upsertToState);

  const translators = await new Streami18n({ language: 'en' }).getTranslators();

  const view = render(
    <WithComponents overrides={components}>
      <ChatProvider value={mockChatContext({ client })}>
        <TranslationProvider value={{ ...translators, userLanguage: 'en' }}>
          <ScheduledMessageList cid={cid} />
        </TranslationProvider>
      </ChatProvider>
    </WithComponents>,
  );

  return { ...view, client };
};

const getGroupHeaders = () =>
  screen.getAllByRole('heading', { level: 3 }).map(({ textContent }) => textContent);

const setNextCursor = (client: StreamChat) =>
  act(() => client.scheduledMessages.state.partialNext({ next: 'cursor' }));

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

  it('shows the empty state without scheduled messages', async () => {
    await renderList();

    expect(screen.getByText('No scheduled messages')).toBeInTheDocument();
    expect(screen.getByText('Messages you schedule appear here')).toBeInTheDocument();
  });

  it('shows a loading indicator while the first page loads', async () => {
    const { client } = await renderList();

    act(() => client.scheduledMessages.state.partialNext({ isLoading: true }));

    expect(screen.queryByText('No scheduled messages')).not.toBeInTheDocument();
    expect(document.querySelector('.str-chat__loading-indicator')).toBeInTheDocument();
  });

  it('lists failed messages first, then one group per day', async () => {
    await renderList({
      scheduledMessages: [
        generateScheduledMessage({ cid, scheduled_at: atLocalTime(29, 9) }),
        generateScheduledMessage({ cid, scheduled_at: atLocalTime(30, 13) }),
        generateScheduledMessage({
          cid,
          scheduled_at: atLocalTime(29, 13),
          status: ScheduledMessageStatus.Failed,
        }),
      ],
    });

    expect(getGroupHeaders()).toEqual(['Failed', 'Tomorrow', 'Friday']);
  });

  it('shows the preview, scheduled time and status of each message', async () => {
    await renderList({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          message: { text: 'Launch moved to Monday' },
          scheduled_at: atLocalTime(29, 9),
        }),
      ],
    });

    const item = screen.getByTestId('scheduled-message-item');

    expect(within(item).getByText('Launch moved to Monday')).toBeInTheDocument();
    expect(within(item).getByText('Tomorrow at 09:00')).toBeInTheDocument();
    expect(within(item).getByText('Scheduled')).toBeInTheDocument();
  });

  it('summarises attachments when the message has no text', async () => {
    await renderList({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          message: {
            attachments: [{ image_url: 'https://example.com/a.png', type: 'image' }],
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
        generateScheduledMessage({ cid, status: ScheduledMessageStatus.Sending }),
      ],
    });

    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('explains why a message failed', async () => {
    await renderList({
      scheduledMessages: [
        generateScheduledMessage({
          cid,
          failure_reason: ScheduledMessageFailureReason.ChannelFrozen,
          status: ScheduledMessageStatus.Failed,
        }),
      ],
    });

    const item = screen.getByTestId('scheduled-message-item');

    expect(item).toHaveClass('str-chat__scheduled-message-item--failed');
    expect(within(item).getByText('This channel is frozen')).toBeInTheDocument();
  });

  it('loads more only when the store has another page', async () => {
    const { client } = await renderList({
      scheduledMessages: [generateScheduledMessage({ cid })],
    });
    const loadMore = vi
      .spyOn(client.scheduledMessages, 'loadMore')
      .mockResolvedValue(undefined);

    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();

    setNextCursor(client);
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('disables load more while a page is loading', async () => {
    const { client } = await renderList({
      scheduledMessages: [generateScheduledMessage({ cid })],
    });

    setNextCursor(client);
    act(() => client.scheduledMessages.state.partialNext({ isLoading: true }));

    expect(screen.getByRole('button', { name: 'Load more' })).toBeDisabled();
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

  it('has no accessibility violations', async () => {
    const { container } = await renderList({
      scheduledMessages: [
        generateScheduledMessage({ cid }),
        generateScheduledMessage({ cid, status: ScheduledMessageStatus.Failed }),
      ],
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
