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
    t: (key: string, second?: unknown, third?: unknown) => {
      const defaultValue = typeof second === 'string' ? second : undefined;
      const options = ((typeof second === 'object' ? second : third) ?? {}) as Record<
        string,
        unknown
      >;
      let template = defaultValue;
      if (template === undefined && typeof options.count === 'number') {
        template = (
          options.count === 1 ? options.defaultValue_one : options.defaultValue_other
        ) as string | undefined;
      }
      template ??= options.defaultValue as string | undefined;
      template ??= key;
      return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, name: string) => {
        const value = options[name];
        return value === undefined || value === null ? whole : String(value);
      });
    },
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

  it('renders a non-focusable visual-only command label', () => {
    render(<CommandChip command={{ name: 'giphy' }} />);

    const commandLabel = screen.getByText('giphy');

    expect(commandLabel).toHaveAttribute('aria-hidden', 'true');
    expect(commandLabel).toHaveAttribute('tabindex', '-1');
  });
});
