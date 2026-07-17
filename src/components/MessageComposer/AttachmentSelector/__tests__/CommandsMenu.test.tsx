import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { CommandsMenu, CommandsSubmenuHeader } from '../CommandsMenu';

const { announceInteraction, closeMenu, returnToParentMenu, setCommand } = vi.hoisted(
  () => ({
    announceInteraction: vi.fn(),
    closeMenu: vi.fn(),
    returnToParentMenu: vi.fn(),
    setCommand: vi.fn(),
  }),
);

const { commandsMock } = vi.hoisted(() => ({ commandsMock: { value: [] as unknown[] } }));

// Strip the `aria/` prefix so assertions read the natural-language value.
const t = (key: string) => (key.startsWith('aria/') ? key.replace('aria/', '') : key);

// Keep the real Dialog primitives (ContextMenuBackButton/Button/Header) — only stub the context hook.
vi.mock('../../../Dialog', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../Dialog')>()),
  useContextMenuContext: () => ({ closeMenu, returnToParentMenu }),
}));

vi.mock('../../../../context', () => ({
  useComponentContext: () => ({}),
  useMessageComposerContext: () => ({ textareaRef: { current: null } }),
  useTranslationContext: () => ({ t }),
}));

vi.mock('../../hooks', () => ({
  useMessageComposerCommands: () => commandsMock.value,
  useMessageComposerController: () => ({ textComposer: { setCommand } }),
}));

vi.mock('../../../Accessibility', () => ({
  useInteractionAnnouncements: () => ({
    announceInteraction,
    cancelInteraction: vi.fn(),
  }),
}));

describe('CommandsSubmenuHeader (RW22 — commands submenu back affordance, #76)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exposes the header as an activatable menuitem back button', () => {
    render(<CommandsSubmenuHeader />);
    const backButton = screen.getByRole('menuitem');
    expect(backButton.tagName).toBe('BUTTON');
    expect(backButton).toHaveClass('str-chat__context-menu__back-button');
  });

  it('announces the submenu title AND names the back destination', () => {
    render(<CommandsSubmenuHeader />);
    expect(screen.getByRole('menuitem')).toHaveAccessibleName(
      /Instant commands.*Back to attachments/,
    );
    expect(screen.getByRole('menuitem')).not.toHaveAccessibleName(/parent menu/i);
  });

  it('returns to the parent (attachments) menu when activated', () => {
    render(<CommandsSubmenuHeader />);
    fireEvent.click(screen.getByRole('menuitem'));
    expect(returnToParentMenu).toHaveBeenCalledTimes(1);
  });
});

describe('CommandsMenu — command activation announcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    commandsMock.value = [{ command: { name: 'giphy' }, enabled: true }];
  });

  it('announces the activated command when a command is selected', () => {
    render(<CommandsMenu />);
    fireEvent.click(screen.getByRole('menuitem', { name: /giphy/ }));

    expect(setCommand).toHaveBeenCalledWith({ name: 'giphy' });
    expect(closeMenu).toHaveBeenCalledTimes(1);
    expect(announceInteraction).toHaveBeenCalledWith('command.selected', {
      command: 'giphy',
    });
  });

  it('does not activate or announce a disabled command', () => {
    commandsMock.value = [{ command: { name: 'giphy' }, enabled: false }];
    render(<CommandsMenu />);
    fireEvent.click(screen.getByRole('menuitem', { name: /giphy/ }));

    expect(setCommand).not.toHaveBeenCalled();
    expect(announceInteraction).not.toHaveBeenCalled();
  });
});
