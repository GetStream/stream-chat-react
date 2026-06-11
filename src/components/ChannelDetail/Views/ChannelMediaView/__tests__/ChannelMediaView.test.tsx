import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import type { Channel, MessageResponse } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import {
  useChatContext,
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../../context';
import { useStateStore } from '../../../../../store';
import { ChannelDetailProvider } from '../../../ChannelDetailContext';
import { ChannelMediaView } from '../ChannelMediaView';

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

vi.mock('../../../../InfiniteScrollPaginator/InfiniteScrollPaginator', () => ({
  InfiniteScrollPaginator: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='infinite-scroll-paginator'>{children}</div>
  ),
}));

vi.mock('../../../../Dialog', () => ({
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
      { image_url: 'https://cdn.test/image-1.png', title: 'image-1', type: 'image' },
    ],
    cid: 'messaging:test-channel',
    created_at: '2026-01-01T15:53:00.000Z',
    id: 'message-1',
    type: 'regular',
    updated_at: '2026-01-01T15:53:00.000Z',
    user: { id: 'user-1', image: 'https://cdn.test/avatar-1.png', name: 'Alice' },
  },
  {
    attachments: [
      {
        asset_url: 'https://cdn.test/video-1.mp4',
        duration: 8,
        thumb_url: 'https://cdn.test/video-1-thumb.png',
        title: 'video-1',
        type: 'video',
      },
    ],
    cid: 'messaging:test-channel',
    created_at: '2026-01-02T15:53:00.000Z',
    id: 'message-2',
    type: 'regular',
    updated_at: '2026-01-02T15:53:00.000Z',
    user: { id: 'user-2', name: 'Bob' },
  },
];

const channel = fromPartial<Channel>({ cid: 'messaging:test-channel' });

const renderView = () =>
  render(
    <ChannelDetailProvider channel={channel}>
      <ChannelMediaView layout='tabs' />
    </ChannelDetailProvider>,
  );

describe('ChannelMediaView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchSourceInstances.length = 0;
    mocks.searchSourceOptions.length = 0;

    vi.mocked(useTranslationContext).mockReturnValue({
      t: (key: string) => key,
    } as ReturnType<typeof useTranslationContext>);

    vi.mocked(useChatContext).mockReturnValue({
      client: { userID: 'user-1' },
    } as ReturnType<typeof useChatContext>);

    vi.mocked(useModalContext).mockReturnValue({
      close: vi.fn(),
    } as ReturnType<typeof useModalContext>);

    vi.mocked(useComponentContext).mockReturnValue({
      BaseImage: (props: React.ComponentProps<'img'>) => <img {...props} />,
      Gallery: () => <div data-testid='gallery' />,
      Modal: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
        open ? <div data-testid='media-viewer'>{children}</div> : null,
    } as unknown as ReturnType<typeof useComponentContext>);

    vi.mocked(useStateStore).mockReturnValue({
      hasNextPage: false,
      isLoading: false,
      messages,
    });
  });

  it('configures MessageSearchSource to paginate image and video attachments in the channel', () => {
    renderView();

    expect(mocks.searchSourceOptions[0]).toMatchObject({
      allowEmptySearchString: true,
      pageSize: 30,
      resetOnNewSearchQuery: false,
    });
    expect(mocks.searchSourceInstances[0]).toMatchObject({
      messageSearchChannelFilters: { cid: 'messaging:test-channel' },
      messageSearchFilters: { 'attachments.type': { $in: ['image', 'video'] } },
    });
    expect(mocks.searchSourceActivate).toHaveBeenCalled();
  });

  it('renders a media item per image/video attachment with avatar and video duration badge', () => {
    renderView();

    expect(screen.getByRole('heading', { name: 'Photos & videos' })).toBeInTheDocument();

    const items = screen.getAllByRole('button');
    expect(items).toHaveLength(2);

    expect(screen.getAllByTestId('avatar')).toHaveLength(2);
    expect(screen.getByText('00:08')).toBeInTheDocument();
  });

  it('opens the full-screen viewer when a media item is clicked', () => {
    renderView();

    expect(screen.queryByTestId('media-viewer')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(screen.getByTestId('media-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('gallery')).toBeInTheDocument();
  });

  it('renders an empty state once results load with no media', () => {
    vi.mocked(useStateStore).mockReturnValue({
      hasNextPage: false,
      isLoading: false,
      messages: [],
    });

    renderView();

    expect(screen.getByText('No photos or videos')).toBeInTheDocument();
    expect(screen.getByText('Share a photo or video to see it here')).toBeInTheDocument();
  });
});
