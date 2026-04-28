import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CommandChip } from '../CommandChip';

const setCommandMock = vi.fn();
const focusMock = vi.fn();

vi.mock('../hooks', () => ({
  useMessageComposerController: () => ({
    textComposer: {
      setCommand: setCommandMock,
    },
  }),
}));

vi.mock('../../../context', () => ({
  useMessageComposerContext: () => ({
    textareaRef: {
      current: {
        focus: focusMock,
      },
    },
  }),
  useTranslationContext: () => ({
    t: (key: string, options?: { command?: string }) =>
      key.replace('{{ command }}', options?.command ?? ''),
  }),
}));

describe('CommandChip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when command is undefined', () => {
    const { container } = render(<CommandChip command={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders command name when command is defined', () => {
    render(<CommandChip command={{ name: 'giphy' }} />);
    expect(screen.getByText('giphy')).toBeInTheDocument();
  });

  it('clears command and focuses textarea on close click', () => {
    const { container } = render(<CommandChip command={{ name: 'giphy' }} />);
    const closeButton = container.querySelector('.str-chat__command-chip__close-button');

    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);

    expect(setCommandMock).toHaveBeenCalledWith(null);
    expect(focusMock).toHaveBeenCalledTimes(1);
  });

  it('has an accessible name for the close button', () => {
    render(<CommandChip command={{ name: 'giphy' }} />);

    expect(
      screen.getByRole('button', { name: 'Exit command giphy' }),
    ).toBeInTheDocument();
  });
});
