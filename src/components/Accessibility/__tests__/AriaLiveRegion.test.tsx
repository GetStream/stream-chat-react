import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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
});
