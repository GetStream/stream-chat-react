import { fireEvent, render, screen } from '@testing-library/react';

const { hookState } = vi.hoisted(() => ({
  hookState: {
    data: null as unknown,
    error: false,
    retry: vi.fn(),
  },
}));

vi.mock('../../hooks/useEmojiPickerState', () => ({
  useEmojiPickerState: () => hookState,
}));

vi.mock('../../../../context', () => ({
  useTranslationContext: () => ({ t: (key: string) => key }),
}));

import { EmojiPickerPanel, themeClassName } from '../EmojiPickerPanel';

// The picker's theme CSS keys off the class this maps to: a forced `light`/`dark`
// must emit an SDK theme class on the panel root so the forced-light variable override
// in EmojiPicker.scss can win over an ancestor `.str-chat__theme-dark`. If these strings
// or the mapping drift, forced theming silently stops overriding the ancestor theme.
describe('themeClassName', () => {
  it('maps a forced theme to the matching SDK theme class', () => {
    expect(themeClassName('light')).toBe('str-chat__theme-light');
    expect(themeClassName('dark')).toBe('str-chat__theme-dark');
  });

  it('emits no class for auto/undefined so the panel inherits the ancestor theme', () => {
    expect(themeClassName('auto')).toBeUndefined();
    expect(themeClassName(undefined)).toBeUndefined();
  });
});

describe('EmojiPickerPanel dataset loading', () => {
  beforeEach(() => {
    hookState.data = null;
    hookState.error = false;
    hookState.retry.mockClear();
  });

  it('renders a recoverable error (not a permanent spinner) when the dataset fails to load', () => {
    hookState.error = true;
    render(<EmojiPickerPanel onEmojiSelect={() => {}} />);

    // No stuck aria-busy loading region…
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    // …an announced error with a working retry instead.
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(hookState.retry).toHaveBeenCalledTimes(1);
  });

  it('shows the loading region while the dataset is still loading', () => {
    render(<EmojiPickerPanel onEmojiSelect={() => {}} />);

    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
