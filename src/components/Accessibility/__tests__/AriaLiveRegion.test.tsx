import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AriaLiveRegion } from '../AriaLiveRegion';
import { useAriaLiveAnnouncer } from '../useAriaLiveAnnouncer';

const AnnouncerTrigger = () => {
  const announce = useAriaLiveAnnouncer();

  return (
    <>
      <button onClick={() => announce('Polite announcement')}>announce-polite</button>
      <button onClick={() => announce('Assertive announcement', 'assertive')}>
        announce-assertive
      </button>
      <button onClick={() => announce('Repeat announcement')}>announce-repeat</button>
    </>
  );
};

describe('AriaLiveRegion', () => {
  it('renders both polite and assertive live regions', () => {
    render(
      <AriaLiveRegion>
        <AnnouncerTrigger />
      </AriaLiveRegion>,
    );

    expect(screen.getByTestId('str-chat__aria-live-region--polite')).toHaveAttribute(
      'aria-live',
      'polite',
    );
    expect(screen.getByTestId('str-chat__aria-live-region--assertive')).toHaveAttribute(
      'aria-live',
      'assertive',
    );
  });

  it('updates polite and assertive live region text after announce', async () => {
    render(
      <AriaLiveRegion>
        <AnnouncerTrigger />
      </AriaLiveRegion>,
    );

    const politeRegion = screen.getByTestId('str-chat__aria-live-region--polite');
    const assertiveRegion = screen.getByTestId('str-chat__aria-live-region--assertive');

    fireEvent.click(screen.getByRole('button', { name: 'announce-polite' }));
    await waitFor(() => {
      expect(politeRegion).toHaveTextContent('Polite announcement');
    });

    fireEvent.click(screen.getByRole('button', { name: 'announce-assertive' }));
    await waitFor(() => {
      expect(assertiveRegion).toHaveTextContent('Assertive announcement');
    });
  });

  it('re-announces repeated identical messages by clearing then resetting text', async () => {
    render(
      <AriaLiveRegion>
        <AnnouncerTrigger />
      </AriaLiveRegion>,
    );

    const politeRegion = screen.getByTestId('str-chat__aria-live-region--polite');
    const repeatButton = screen.getByRole('button', { name: 'announce-repeat' });

    fireEvent.click(repeatButton);
    await waitFor(() => {
      expect(politeRegion).toHaveTextContent('Repeat announcement');
    });

    fireEvent.click(repeatButton);
    expect(politeRegion).toHaveTextContent('');

    await waitFor(() => {
      expect(politeRegion).toHaveTextContent('Repeat announcement');
    });
  });

  it('announces messages in React Strict Mode', async () => {
    render(
      <React.StrictMode>
        <AriaLiveRegion>
          <AnnouncerTrigger />
        </AriaLiveRegion>
      </React.StrictMode>,
    );

    const politeRegion = screen.getByTestId('str-chat__aria-live-region--polite');

    fireEvent.click(screen.getByRole('button', { name: 'announce-polite' }));

    await waitFor(() => {
      expect(politeRegion).toHaveTextContent('Polite announcement');
    });
  });

  it('delays polite announcements to force a detectable DOM mutation', () => {
    vi.useFakeTimers();

    try {
      render(
        <AriaLiveRegion>
          <AnnouncerTrigger />
        </AriaLiveRegion>,
      );

      const politeRegion = screen.getByTestId('str-chat__aria-live-region--polite');

      fireEvent.click(screen.getByRole('button', { name: 'announce-polite' }));
      expect(politeRegion).toHaveTextContent('');

      act(() => {
        vi.advanceTimersByTime(49);
      });
      expect(politeRegion).toHaveTextContent('');

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(politeRegion).toHaveTextContent('Polite announcement');
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels stale pending polite announcements when a newer one arrives', () => {
    vi.useFakeTimers();

    try {
      render(
        <AriaLiveRegion>
          <AnnouncerTrigger />
        </AriaLiveRegion>,
      );

      const politeRegion = screen.getByTestId('str-chat__aria-live-region--polite');

      fireEvent.click(screen.getByRole('button', { name: 'announce-polite' }));
      fireEvent.click(screen.getByRole('button', { name: 'announce-repeat' }));

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(politeRegion).toHaveTextContent('Repeat announcement');
      expect(politeRegion).not.toHaveTextContent('Polite announcement');
    } finally {
      vi.useRealTimers();
    }
  });
});
