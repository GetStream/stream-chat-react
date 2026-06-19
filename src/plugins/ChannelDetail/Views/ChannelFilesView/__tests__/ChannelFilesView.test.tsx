import Dayjs from 'dayjs';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { Channel, MessageResponse } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import {
  useChatContext,
  useModalContext,
  useTranslationContext,
} from '../../../../../context';
import { useStateStore } from '../../../../../store';
import { ChannelDetailProvider } from '../../../ChannelDetailContext';
import { ChannelFilesView } from '../ChannelFilesView';

const mocks = vi.hoisted(() => ({
  searchSourceActivate: vi.fn(),
  searchSourceCancelScheduledQuery: vi.fn(),
  searchSourceInstances: [] as Array<{
    messageSearchChannelFilters?: unknown;
    messageSearchFilters?: unknown;
  }>,
  searchSourceOptions: [] as unknown[],
  searchSourceSearch: vi.fn(),
}));

vi.mock('stream-chat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('stream-chat')>();

  class MessageSearchSource {
    messageSearchChannelFilters?: unknown;
    messageSearchFilters?: unknown;
    state = {};

    constructor(_client: unknown, options: unknown) {
      mocks.searchSourceOptions.push(options);
      mocks.searchSourceInstances.push(this);
    }

    activate = mocks.searchSourceActivate;
    search = mocks.searchSourceSearch;
    cancelScheduledQuery = mocks.searchSourceCancelScheduledQuery;
  }

  return {
    ...actual,
    MessageSearchSource,
  };
});

vi.mock('../../../../../context');
vi.mock('../../../../../store');

// Render react-virtuoso's GroupedVirtuoso synchronously: jsdom has no layout,
// so the real component would window down to zero items. The stub renders each
// group header followed by its items, plus the empty/footer slots.
vi.mock('react-virtuoso', () => ({
  GroupedVirtuoso: ({
    components = {},
    groupContent,
    groupCounts = [],
    itemContent,
  }: {
    components?: {
      EmptyPlaceholder?: React.ComponentType;
      Footer?: React.ComponentType;
    };
    groupContent: (groupIndex: number) => React.ReactNode;
    groupCounts?: number[];
    itemContent: (index: number, groupIndex: number) => React.ReactNode;
  }) => {
    const { EmptyPlaceholder, Footer } = components;
    const totalItems = groupCounts.reduce((sum, count) => sum + count, 0);
    // `itemContent` receives the flat item index (0-based across items,
    // excluding group headers), mirroring GroupedVirtuoso.
    let itemIndex = 0;
    return (
      <div data-testid='grouped-virtuoso'>
        {totalItems === 0
          ? EmptyPlaceholder && <EmptyPlaceholder />
          : groupCounts.map((count, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {groupContent(groupIndex)}
                {Array.from({ length: count }, () => {
                  const index = itemIndex++;
                  return (
                    <React.Fragment key={index}>
                      {itemContent(index, groupIndex)}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
        {Footer && <Footer />}
      </div>
    );
  },
}));

vi.mock('../../../../../components/Dialog', () => ({
  Prompt: {
    Body: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Header: ({ title }: { title?: React.ReactNode }) => (
      <header>
        <h2>{title}</h2>
      </header>
    ),
  },
}));

const messages: MessageResponse[] = [
  {
    attachments: [
      {
        asset_url: 'https://cdn.test/financial-report-Q1-2026.pdf',
        file_size: 4 * 1024 * 1024,
        mime_type: 'application/pdf',
        title: 'financial-report-Q1-2026.pdf',
        type: 'file',
      },
      {
        image_url: 'https://cdn.test/screenshot.png',
        title: 'screenshot',
        type: 'image',
      },
      {
        og_scrape_url: 'https://getstream.io',
        title: 'scraped-link-preview',
        title_link: 'https://getstream.io',
        type: 'file',
      },
    ],
    cid: 'messaging:test-channel',
    created_at: '2026-03-10T15:53:00.000Z',
    id: 'message-1',
    type: 'regular',
    updated_at: '2026-03-10T15:53:00.000Z',
    user: { id: 'user-1', name: 'Alice' },
  },
  {
    attachments: [
      {
        asset_url: 'https://cdn.test/customer-feedback.wav',
        file_size: 7 * 1024 * 1024,
        mime_type: 'audio/wav',
        title: 'customer-feedback.wav',
        type: 'audio',
      },
    ],
    cid: 'messaging:test-channel',
    created_at: '2026-02-05T15:53:00.000Z',
    id: 'message-2',
    type: 'regular',
    updated_at: '2026-02-05T15:53:00.000Z',
    user: { id: 'user-2', name: 'Bob' },
  },
  {
    attachments: [
      {
        asset_url: 'https://cdn.test/sales-report-may.xlsx',
        file_size: 6 * 1024 * 1024,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        title: 'sales-report-may.xlsx',
        type: 'file',
      },
    ],
    cid: 'messaging:test-channel',
    created_at: '2026-02-01T15:53:00.000Z',
    id: 'message-3',
    type: 'regular',
    updated_at: '2026-02-01T15:53:00.000Z',
    user: { id: 'user-1', name: 'Alice' },
  },
];

const channel = fromPartial<Channel>({ cid: 'messaging:test-channel' });

const renderView = () =>
  render(
    <ChannelDetailProvider channel={channel}>
      <ChannelFilesView layout='tabs' />
    </ChannelDetailProvider>,
  );

describe('ChannelFilesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchSourceInstances.length = 0;
    mocks.searchSourceOptions.length = 0;

    vi.mocked(useTranslationContext).mockReturnValue({
      t: (key: string) => key,
      tDateTimeParser: (input?: string | number | Date) => Dayjs(input),
    } as unknown as ReturnType<typeof useTranslationContext>);

    vi.mocked(useChatContext).mockReturnValue({
      client: { userID: 'user-1' },
    } as ReturnType<typeof useChatContext>);

    vi.mocked(useModalContext).mockReturnValue({
      close: vi.fn(),
    } as ReturnType<typeof useModalContext>);

    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      messages,
    });
  });

  it('configures MessageSearchSource to paginate file and audio attachments in the channel', () => {
    renderView();

    expect(mocks.searchSourceOptions[0]).toMatchObject({
      allowEmptySearchString: true,
      pageSize: 30,
      resetOnNewSearchQuery: false,
    });
    expect(mocks.searchSourceInstances[0]).toMatchObject({
      messageSearchChannelFilters: { cid: 'messaging:test-channel' },
      messageSearchFilters: { 'attachments.type': { $in: ['file', 'audio'] } },
    });
    expect(mocks.searchSourceActivate).toHaveBeenCalled();
  });

  it('loads the first page on mount without waiting for a scroll event', () => {
    renderView();

    expect(mocks.searchSourceSearch).toHaveBeenCalledWith('');
  });

  it('renders a list item per file/audio attachment, ignoring image/video attachments', () => {
    renderView();

    expect(screen.getByRole('heading', { name: 'Files' })).toBeInTheDocument();

    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByText('financial-report-Q1-2026.pdf')).toBeInTheDocument();
    expect(screen.getByText('customer-feedback.wav')).toBeInTheDocument();
    expect(screen.getByText('sales-report-may.xlsx')).toBeInTheDocument();
    expect(screen.queryByText('screenshot')).not.toBeInTheDocument();
    expect(screen.queryByText('scraped-link-preview')).not.toBeInTheDocument();
  });

  it('groups attachments into descending month sections', () => {
    renderView();

    expect(screen.getByText('March 2026')).toBeInTheDocument();
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('renders an empty state once results load with no files', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      messages: [],
    });

    renderView();

    expect(screen.getByText('No files')).toBeInTheDocument();
    expect(screen.getByText('Share a file to see it here')).toBeInTheDocument();
  });
});
