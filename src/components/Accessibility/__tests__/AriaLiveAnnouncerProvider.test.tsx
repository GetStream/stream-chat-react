import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { AriaLiveAnnouncerProvider } from '../AriaLiveAnnouncerProvider';
import { AriaLiveOutlet } from '../AriaLiveOutlet';
import { useAriaLiveAnnouncer } from '../useAriaLiveAnnouncer';

const Trigger = ({ message = 'Hello' }: { message?: string }) => {
  const announce = useAriaLiveAnnouncer();
  return <button onClick={() => announce(message)}>announce</button>;
};

const politeRegions = () => screen.queryAllByTestId('str-chat__aria-live-region--polite');

describe('AriaLiveAnnouncerProvider + AriaLiveOutlet', () => {
  it('renders exactly one live region for a single outlet and announces into it', async () => {
    render(
      <AriaLiveAnnouncerProvider>
        <Trigger />
        <AriaLiveOutlet />
      </AriaLiveAnnouncerProvider>,
    );

    await waitFor(() => expect(politeRegions()).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'announce' }));

    await waitFor(() =>
      expect(within(politeRegions()[0]).getByText('Hello')).toBeInTheDocument(),
    );
  });

  it('renders only the innermost (higher-layer) outlet when several are mounted', async () => {
    render(
      <AriaLiveAnnouncerProvider>
        <Trigger />
        <AriaLiveOutlet layer={0} />
        <div data-testid='modal'>
          <AriaLiveOutlet layer={1} />
        </div>
      </AriaLiveAnnouncerProvider>,
    );

    // Exactly one region rendered (the modal/layer-1 outlet), inside the modal subtree.
    await waitFor(() => expect(politeRegions()).toHaveLength(1));
    expect(
      within(screen.getByTestId('modal')).getByTestId(
        'str-chat__aria-live-region--polite',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'announce' }));
    await waitFor(() =>
      expect(within(politeRegions()[0]).getByText('Hello')).toBeInTheDocument(),
    );
  });

  it('falls back to the lower-layer outlet when the higher-layer outlet unmounts', async () => {
    const Harness = ({ modalOpen }: { modalOpen: boolean }) => (
      <AriaLiveAnnouncerProvider>
        <div data-testid='root'>
          <AriaLiveOutlet layer={0} />
        </div>
        {modalOpen && (
          <div data-testid='modal'>
            <AriaLiveOutlet layer={1} />
          </div>
        )}
      </AriaLiveAnnouncerProvider>
    );

    const { rerender } = render(<Harness modalOpen />);
    await waitFor(() =>
      expect(
        within(screen.getByTestId('modal')).queryByTestId(
          'str-chat__aria-live-region--polite',
        ),
      ).toBeInTheDocument(),
    );
    // Root outlet is inactive while the modal outlet is mounted.
    expect(
      within(screen.getByTestId('root')).queryByTestId(
        'str-chat__aria-live-region--polite',
      ),
    ).not.toBeInTheDocument();

    rerender(<Harness modalOpen={false} />);
    await waitFor(() =>
      expect(
        within(screen.getByTestId('root')).queryByTestId(
          'str-chat__aria-live-region--polite',
        ),
      ).toBeInTheDocument(),
    );
    expect(politeRegions()).toHaveLength(1);
  });

  it('keeps two providers independent (announcements do not cross instances)', async () => {
    render(
      <>
        <div data-testid='chat-a'>
          <AriaLiveAnnouncerProvider>
            <Trigger message='From A' />
            <AriaLiveOutlet />
          </AriaLiveAnnouncerProvider>
        </div>
        <div data-testid='chat-b'>
          <AriaLiveAnnouncerProvider>
            <AriaLiveOutlet />
          </AriaLiveAnnouncerProvider>
        </div>
      </>,
    );

    await waitFor(() => expect(politeRegions()).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: 'announce' }));

    await waitFor(() =>
      expect(
        within(screen.getByTestId('chat-a')).getByText('From A'),
      ).toBeInTheDocument(),
    );
    expect(
      within(screen.getByTestId('chat-b')).queryByText('From A'),
    ).not.toBeInTheDocument();
  });

  it('re-announces a repeated identical message as a distinct (text-changed) node', async () => {
    render(
      <AriaLiveAnnouncerProvider>
        <Trigger message='Giphy image changed' />
        <AriaLiveOutlet />
      </AriaLiveAnnouncerProvider>,
    );

    const button = screen.getByRole('button', { name: 'announce' });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() =>
      expect(politeRegions()[0].childElementCount).toBeGreaterThanOrEqual(2),
    );
    // Both messages exist as separate nodes, but their text differs (the 2nd carries a silent
    // U+200B) so screen readers treat the repeat as a change rather than suppressing it.
    const texts = Array.from(politeRegions()[0].children).map((n) => n.textContent);
    expect(texts[0]).toBe('Giphy image changed');
    expect(texts[1]).toBe('Giphy image changed\u200B');
    expect(texts[0]).not.toBe(texts[1]);
  });

  it('does not throw and is a no-op when an outlet renders without a provider', () => {
    expect(() => render(<AriaLiveOutlet />)).not.toThrow();
    expect(politeRegions()).toHaveLength(0);
  });

  it('clears announcement timers on unmount', () => {
    vi.useFakeTimers();
    try {
      const { unmount } = render(
        <AriaLiveAnnouncerProvider>
          <Trigger />
          <AriaLiveOutlet />
        </AriaLiveAnnouncerProvider>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'announce' }));
      expect(() => {
        unmount();
        act(() => vi.runAllTimers());
      }).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});
