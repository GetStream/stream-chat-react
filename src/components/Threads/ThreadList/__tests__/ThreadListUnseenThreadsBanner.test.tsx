import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { StreamChat } from 'stream-chat';

import { ChatProvider, WithComponents } from '../../../../context';
import { TranslationProvider } from '../../../../context/TranslationContext';
import {
  initClientWithChannels,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../../mock-builders';
import { mockT } from '../../../../mock-builders/translator';
import { ThreadListUnseenThreadsBanner } from '../ThreadListUnseenThreadsBanner';

const LoadingIndicator = () => <div data-testid='loading-indicator' />;

let client: StreamChat;

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
  ({ client } = await initClientWithChannels());
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

  it('renders the LoadingIndicator from ComponentContext while its reload is pending', () => {
    vi.spyOn(client.threads, 'reload').mockReturnValue(deferred().promise);
    client.threads.state.partialNext({ unseenThreadIds: ['unseen-thread'] });
    renderWithClient(<ThreadListUnseenThreadsBanner />);

    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
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
