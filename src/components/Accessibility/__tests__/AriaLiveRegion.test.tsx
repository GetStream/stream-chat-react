import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AriaLiveRegion } from '../AriaLiveRegion';
import { useAriaLiveAnnouncer } from '../useAriaLiveAnnouncer';

const LIVE_ANNOUNCEMENT_TTL_MS = 1500;

const getLatestAnnouncement = (region: HTMLElement) =>
  region.lastElementChild?.textContent ?? '';

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
      expect(getLatestAnnouncement(politeRegion)).toBe('Polite announcement');
    });

    fireEvent.click(screen.getByRole('button', { name: 'announce-assertive' }));
    await waitFor(() => {
      expect(getLatestAnnouncement(assertiveRegion)).toBe('Assertive announcement');
    });
  });

  it('re-announces repeated identical messages as distinct live nodes', async () => {
    render(
      <AriaLiveRegion>
        <AnnouncerTrigger />
      </AriaLiveRegion>,
    );

    const politeRegion = screen.getByTestId('str-chat__aria-live-region--polite');
    const repeatButton = screen.getByRole('button', { name: 'announce-repeat' });

    fireEvent.click(repeatButton);
    await waitFor(() => {
      expect(getLatestAnnouncement(politeRegion)).toBe('Repeat announcement');
    });

    fireEvent.click(repeatButton);

    await waitFor(() => {
      expect(getLatestAnnouncement(politeRegion)).toBe('Repeat announcement');
    });
    expect(politeRegion.childElementCount).toBe(2);
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
      expect(getLatestAnnouncement(politeRegion)).toBe('Polite announcement');
    });
  });

  it('expires polite announcements after their TTL', () => {
    vi.useFakeTimers();

    try {
      render(
        <AriaLiveRegion>
          <AnnouncerTrigger />
        </AriaLiveRegion>,
      );

      const politeRegion = screen.getByTestId('str-chat__aria-live-region--polite');

      fireEvent.click(screen.getByRole('button', { name: 'announce-polite' }));
      expect(getLatestAnnouncement(politeRegion)).toBe('Polite announcement');

      act(() => {
        vi.advanceTimersByTime(LIVE_ANNOUNCEMENT_TTL_MS - 1);
      });
      expect(getLatestAnnouncement(politeRegion)).toBe('Polite announcement');

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(getLatestAnnouncement(politeRegion)).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps rapid polite announcements independent until each TTL expires', () => {
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

      expect(politeRegion.childElementCount).toBe(2);
      expect(getLatestAnnouncement(politeRegion)).toBe('Repeat announcement');

      act(() => {
        vi.advanceTimersByTime(LIVE_ANNOUNCEMENT_TTL_MS);
      });

      expect(getLatestAnnouncement(politeRegion)).toBe('');
      expect(politeRegion.childElementCount).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
