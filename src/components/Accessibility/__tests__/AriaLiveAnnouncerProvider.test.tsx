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

  it('clears pending announcements when a higher-layer outlet unmounts (no leak to the lower outlet)', async () => {
    const ModalTrigger = () => {
      const announce = useAriaLiveAnnouncer();
      return (
        <button onClick={() => announce('Option moved', { priority: 'assertive' })}>
          announce-in-modal
        </button>
      );
    };
    const Harness = ({ modalOpen }: { modalOpen: boolean }) => (
      <AriaLiveAnnouncerProvider>
        <div data-testid='root'>
          <AriaLiveOutlet layer={0} />
        </div>
        {modalOpen && (
          <div data-testid='modal'>
            <ModalTrigger />
            <AriaLiveOutlet layer={1} />
          </div>
        )}
      </AriaLiveAnnouncerProvider>
    );

    const { rerender } = render(<Harness modalOpen />);
    fireEvent.click(screen.getByRole('button', { name: 'announce-in-modal' }));
    await waitFor(() =>
      expect(
        within(screen.getByTestId('modal')).getByText('Option moved'),
      ).toBeInTheDocument(),
    );

    // Close the modal: the dialog's announcement must NOT migrate down and re-announce in root.
    rerender(<Harness modalOpen={false} />);
    await waitFor(() =>
      expect(
        within(screen.getByTestId('root')).queryByTestId(
          'str-chat__aria-live-region--assertive',
        ),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText('Option moved')).not.toBeInTheDocument();
  });

  it('keeps a pending announcement when a higher-layer outlet mounts (migrates up to it)', async () => {
    const RootTrigger = () => {
      const announce = useAriaLiveAnnouncer();
      return (
        <button onClick={() => announce('Dialog opening', { priority: 'assertive' })}>
          announce-in-root
        </button>
      );
    };
    const Harness = ({ modalOpen }: { modalOpen: boolean }) => (
      <AriaLiveAnnouncerProvider>
        <div data-testid='root'>
          <RootTrigger />
          <AriaLiveOutlet layer={0} />
        </div>
        {modalOpen && (
          <div data-testid='modal'>
            <AriaLiveOutlet layer={1} />
          </div>
        )}
      </AriaLiveAnnouncerProvider>
    );

    const { rerender } = render(<Harness modalOpen={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'announce-in-root' }));
    await waitFor(() =>
      expect(
        within(screen.getByTestId('root')).getByText('Dialog opening'),
      ).toBeInTheDocument(),
    );

    // Open the modal: the announcement survives and renders in the now-active modal outlet.
    rerender(<Harness modalOpen />);
    await waitFor(() =>
      expect(
        within(screen.getByTestId('modal')).getByText('Dialog opening'),
      ).toBeInTheDocument(),
    );
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

  it('delays a delayed announcement until delayMs elapses', async () => {
    const Delayed = () => {
      const announce = useAriaLiveAnnouncer();
      return <button onClick={() => announce('Later', { delayMs: 80 })}>announce</button>;
    };
    render(
      <AriaLiveAnnouncerProvider>
        <Delayed />
        <AriaLiveOutlet />
      </AriaLiveAnnouncerProvider>,
    );
    await waitFor(() => expect(politeRegions()).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: 'announce' }));
    // Not announced synchronously — it waits for the delay.
    expect(within(politeRegions()[0]).queryByText('Later')).not.toBeInTheDocument();

    await waitFor(() =>
      expect(within(politeRegions()[0]).getByText('Later')).toBeInTheDocument(),
    );
  });

  it('returns a cancel that prevents a still-pending delayed announcement', async () => {
    let cancel: () => void = () => undefined;
    const Delayed = () => {
      const announce = useAriaLiveAnnouncer();
      return (
        <>
          <button
            onClick={() => {
              cancel = announce('Later', { delayMs: 80 });
            }}
          >
            announce
          </button>
          <button onClick={() => cancel()}>cancel</button>
        </>
      );
    };
    render(
      <AriaLiveAnnouncerProvider>
        <Delayed />
        <AriaLiveOutlet />
      </AriaLiveAnnouncerProvider>,
    );
    await waitFor(() => expect(politeRegions()).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: 'announce' }));
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));

    // Wait past the delay; the cancelled announcement must never appear.
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(within(politeRegions()[0]).queryByText('Later')).not.toBeInTheDocument();
  });

  it('suppresses an identical message announced again within the dedupe window', async () => {
    const Deduped = () => {
      const announce = useAriaLiveAnnouncer();
      return (
        <button onClick={() => announce('Dialog opened', { dedupeMs: 1000 })}>
          announce
        </button>
      );
    };
    render(
      <AriaLiveAnnouncerProvider>
        <Deduped />
        <AriaLiveOutlet />
      </AriaLiveAnnouncerProvider>,
    );
    await waitFor(() => expect(politeRegions()).toHaveLength(1));

    const button = screen.getByRole('button', { name: 'announce' });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() =>
      expect(within(politeRegions()[0]).getByText('Dialog opened')).toBeInTheDocument(),
    );
    // The second identical announcement within the window is suppressed: a single node only
    // (without dedupe a repeat would render a second ZWSP-alternated node).
    expect(politeRegions()[0].childElementCount).toBe(1);
  });

  it('re-announces an identical message after the dedupe window elapses', () => {
    vi.useFakeTimers();
    try {
      const Deduped = () => {
        const announce = useAriaLiveAnnouncer();
        return (
          <button onClick={() => announce('Dialog opened', { dedupeMs: 1000 })}>
            announce
          </button>
        );
      };
      render(
        <AriaLiveAnnouncerProvider>
          <Deduped />
          <AriaLiveOutlet />
        </AriaLiveAnnouncerProvider>,
      );

      const button = screen.getByRole('button', { name: 'announce' });
      act(() => {
        fireEvent.click(button);
      });
      // Past the window: the same message is allowed through again.
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      act(() => {
        fireEvent.click(button);
      });

      expect(politeRegions()[0].childElementCount).toBe(2);
    } finally {
      vi.useRealTimers();
    }
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
