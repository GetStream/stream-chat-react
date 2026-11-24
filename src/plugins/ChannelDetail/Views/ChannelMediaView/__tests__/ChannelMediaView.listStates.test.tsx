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
import { ChannelMediaView } from '../ChannelMediaView';

vi.mock('stream-chat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('stream-chat')>();
  const { createFakeSearchSourceClass } =
    await import('../../../__tests__/fakeSearchSource');
  return {
    ...actual,
    MessageSearchSource: createFakeSearchSourceClass('messages'),
  };
});

const channel = fromPartial<Channel>({ cid: 'messaging:test-channel' });

const imageMessage = {
  attachments: [{ image_url: 'https://cdn.test/image-1.png', type: 'image' }],
  cid: 'messaging:test-channel',
  id: 'message-1',
  user: { id: 'user-1', name: 'Alice' },
};

const renderMediaView = (
  overrides?: Parameters<typeof renderChannelDetailView>[1]['overrides'],
) => {
  const result = renderChannelDetailView(<ChannelMediaView layout='tabs' />, {
    channel,
    // The gallery modal needs a modal dialog manager; it stays closed in these tests.
    overrides: { Modal: () => null, ...overrides },
  });
  const source = createdFakeSearchSources.at(-1) as FakeSearchSource;
  return { ...result, source };
};

const EMPTY_TEXT = 'No photos or videos';

describe('ChannelMediaView list states', () => {
  beforeEach(() => {
    createdFakeSearchSources.length = 0;
  });

  itShowsTheFirstPageLoadError(renderMediaView, imageMessage);

  it('queries no further page after a query failed', () => {
    const { source } = renderMediaView();
    setSearchSourceState(source, { hasNext: true, isLoading: true, items: [] });
    const searchCalls = source.search.mock.calls.length;
    setSearchSourceState(source, {
      isLoading: false,
      lastQueryError: new Error('Request failed with status code 500'),
    });

    expect(source.search).toHaveBeenCalledTimes(searchCalls);
  });

  it('shows the error when the loaded messages hold no media and a page failed', () => {
    const { source } = renderMediaView();
    setSearchSourceState(source, {
      hasNext: true,
      isLoading: false,
      items: [{ ...imageMessage, attachments: [] }],
      lastQueryError: new Error('Request failed with status code 500'),
    });

    expect(screen.getByText("Couldn't load the list")).toBeInTheDocument();
  });

  it('shows no empty state while the first page loads', () => {
    const { source } = renderMediaView();
    setSearchSourceState(source, { isLoading: true });

    expect(screen.queryByText(EMPTY_TEXT)).not.toBeInTheDocument();
  });

  it('shows the next page loading below the media', () => {
    const { container, source } = renderMediaView();
    setSearchSourceState(source, {
      hasNext: true,
      isLoading: true,
      items: [imageMessage],
    });

    expect(
      screen.getByRole('button', { name: 'Open image shared by Alice' }),
    ).toBeInTheDocument();
    expect(queryNextPageLoadingIndicator(container)).toBeInTheDocument();
  });

  it('shows the empty state once a loaded page has no media', () => {
    const { source } = renderMediaView();
    setSearchSourceState(source, { hasNext: false, items: [] });

    expect(screen.getByText(EMPTY_TEXT)).toBeInTheDocument();
  });

  it('renders the app overrides of the shared keys', () => {
    const { source } = renderMediaView(listStateOverrides);

    setSearchSourceState(source, { hasNext: false, isLoading: false, items: [] });
    expect(screen.getByTestId('app-empty')).toBeInTheDocument();
  });
});
