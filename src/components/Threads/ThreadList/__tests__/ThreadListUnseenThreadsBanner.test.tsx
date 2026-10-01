import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Channel, StreamChat, Thread } from 'stream-chat';

import { ChatProvider, WithComponents } from '../../../../context';
import { TranslationProvider } from '../../../../context/TranslationContext';
import {
  generateMessage,
  initClientWithChannels,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../../mock-builders';
import { mockT } from '../../../../mock-builders/translator';
import { ThreadListUnseenThreadsBanner } from '../ThreadListUnseenThreadsBanner';
import { ThreadListLoadingIndicator } from '../ThreadListLoadingIndicator';

const LoadingIndicator = () => <div data-testid='loading-indicator' />;

let channel: Channel;
let client: StreamChat;

const listedThread = (): Thread =>
  client.threads.ensure({
    channel,
    parentMessage: generateMessage({ cid: channel.cid, reply_count: 1 }),
  });

const renderWithClient = (ui: React.ReactElement) =>
  render(
    <ChatProvider value={mockChatContext({ client })}>
      <TranslationProvider value={mockTranslationContextValue({ t: mockT })}>
        <WithComponents overrides={{ LoadingIndicator }}>{ui}</WithComponents>
      </TranslationProvider>
    </ChatProvider>,
  );

const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
};

beforeEach(async () => {
  ({
    channels: [channel],
    client,
  } = await initClientWithChannels());
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ThreadListUnseenThreadsBanner', () => {
  it('renders nothing without unseen threads', () => {
    const { container } = renderWithClient(<ThreadListUnseenThreadsBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the loading state while its reload is pending', async () => {
    const pending = deferred();
    const reload = vi.spyOn(client.threads, 'reload').mockReturnValue(pending.promise);
    client.threads.state.partialNext({ unseenThreadIds: ['unseen-thread'] });
    renderWithClient(<ThreadListUnseenThreadsBanner />);

    const banner = screen.getByRole('button');
    expect(banner).not.toBeDisabled();

    fireEvent.click(banner);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(banner).toBeDisabled();
    expect(banner).toHaveClass('str-chat__unseen-threads-banner--loading');
    expect(banner).toHaveTextContent('Loading...');

    await act(async () => {
      // A successful reload clears `unseenThreadIds`.
      client.threads.state.partialNext({ unseenThreadIds: [] });
      pending.resolve();
      await pending.promise;
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps the banner after a failed reload', async () => {
    // `reload()` logs a failure and leaves `unseenThreadIds` in place.
    const pending = deferred();
    vi.spyOn(client.threads, 'reload').mockReturnValue(pending.promise);
    client.threads.state.partialNext({ unseenThreadIds: ['unseen-thread'] });
    renderWithClient(<ThreadListUnseenThreadsBanner />);

    fireEvent.click(screen.getByRole('button'));

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });

    const banner = screen.getByRole('button');
    expect(banner).not.toBeDisabled();
    expect(banner).not.toHaveClass('str-chat__unseen-threads-banner--loading');
    expect(banner).not.toHaveTextContent('Loading...');
  });
});

describe('ThreadListLoadingIndicator', () => {
  it('does not show during the first load', () => {
    client.threads.paginator.state.partialNext({ isLoading: true, items: undefined });

    const { container } = renderWithClient(<ThreadListLoadingIndicator />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows while the next page loads', () => {
    client.threads.paginator.state.partialNext({
      isLoading: true,
      items: [listedThread()],
    });

    renderWithClient(<ThreadListLoadingIndicator />);

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('hides once the page has loaded', () => {
    client.threads.paginator.state.partialNext({
      isLoading: true,
      items: [listedThread()],
    });
    renderWithClient(<ThreadListLoadingIndicator />);

    act(() => client.threads.paginator.state.partialNext({ isLoading: false }));

    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
  });
});
