import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { AIReplyActions } from '..';
import { AriaLiveAnnouncerContext } from '../../../components/Accessibility/useAriaLiveAnnouncer';

describe('AIReplyActions', () => {
  it('moves focus between its buttons with the arrow keys, Home and End', () => {
    render(
      <AIReplyActions
        onRate={() => undefined}
        onRegenerate={() => undefined}
        text='Hi'
      />,
    );
    const toolbar = screen.getByRole('toolbar');
    const buttons = Array.from(toolbar.querySelectorAll('button'));
    expect(buttons.length).toBeGreaterThan(2);

    buttons[0].focus();
    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[1]);
    fireEvent.keyDown(toolbar, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.keyDown(toolbar, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    fireEvent.keyDown(toolbar, { key: 'Home' });
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.keyDown(toolbar, { key: 'End' });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('says that the reply was copied', async () => {
    const announce = vi.fn(() => () => undefined);
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn(() => Promise.resolve()) },
    });
    render(
      <AriaLiveAnnouncerContext.Provider value={{ announce }}>
        <AIReplyActions text='Hi' />
      </AriaLiveAnnouncerContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await act(() => Promise.resolve());
    expect(announce).toHaveBeenCalledWith('Copied to the clipboard', { dedupeMs: 1000 });
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });
});
