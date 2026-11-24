import { screen } from '@testing-library/react';
import React from 'react';
import type { Channel } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import {
  createdFakeSearchSources,
  type FakeSearchSource,
} from '../../../__tests__/fakeSearchSource';
import {
  itShowsTheFirstPageLoadError,
  listStateOverrides,
  queryNextPageLoadingIndicator,
  renderChannelDetailView,
  setSearchSourceState,
} from '../../../__tests__/listStateTestUtils';
import { ChannelFilesView } from '../ChannelFilesView';

vi.mock('stream-chat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('stream-chat')>();
  const { createFakeSearchSourceClass } =
    await import('../../../__tests__/fakeSearchSource');
  return {
    ...actual,
    MessageSearchSource: createFakeSearchSourceClass('messages'),
  };
});

vi.mock('react-virtuoso', () => import('../../../__tests__/virtuosoStub'));

const channel = fromPartial<Channel>({ cid: 'messaging:test-channel' });

const fileMessage = {
  attachments: [
    { asset_url: 'https://cdn.test/report.pdf', title: 'report.pdf', type: 'file' },
  ],
  cid: 'messaging:test-channel',
  created_at: '2026-01-01T15:53:00.000Z',
  id: 'message-1',
  user: { id: 'user-1', name: 'Alice' },
};

const renderFilesView = (
  overrides?: Parameters<typeof renderChannelDetailView>[1]['overrides'],
) => {
  const result = renderChannelDetailView(<ChannelFilesView layout='tabs' />, {
    channel,
    overrides,
  });
  const source = createdFakeSearchSources.at(-1) as FakeSearchSource;
  return { ...result, source };
};

const EMPTY_TEXT = 'No files';

describe('ChannelFilesView list states', () => {
  beforeEach(() => {
    createdFakeSearchSources.length = 0;
  });

  itShowsTheFirstPageLoadError(renderFilesView, fileMessage);

  it('shows no empty state while the first page loads', () => {
    const { source } = renderFilesView();
    setSearchSourceState(source, { isLoading: true });

    expect(screen.queryByText(EMPTY_TEXT)).not.toBeInTheDocument();
  });

  it('shows the next page loading below the files', () => {
    const { container, source } = renderFilesView();
    setSearchSourceState(source, {
      hasNext: true,
      isLoading: true,
      items: [fileMessage],
    });

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(queryNextPageLoadingIndicator(container)).toBeInTheDocument();
  });

  it('shows the empty state once a loaded page has no files', () => {
    const { source } = renderFilesView();
    setSearchSourceState(source, { items: [] });

    expect(screen.getByText(EMPTY_TEXT)).toBeInTheDocument();
  });

  it('renders the app overrides of the shared keys', () => {
    const { source } = renderFilesView(listStateOverrides);

    setSearchSourceState(source, { items: [] });
    expect(screen.getByTestId('app-empty')).toBeInTheDocument();
  });
});
