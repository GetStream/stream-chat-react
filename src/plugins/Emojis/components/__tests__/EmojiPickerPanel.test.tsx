import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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

// Mock ONLY react-virtuoso (it renders nothing without layout in jsdom) and render items
// eagerly, so the panel exercises the REAL slots (nav, search, grid, preview, skin tone)
// against real context — an integration harness, not per-slot mocks.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data = [],
    itemContent,
  }: {
    data?: unknown[];
    itemContent?: (index: number, item: unknown) => React.ReactNode;
  }) => (
    <div>
      {data.map((item, index) => (
        <React.Fragment key={index}>{itemContent?.(index, item)}</React.Fragment>
      ))}
    </div>
  ),
}));

import { EmojiPickerPanel } from '../EmojiPickerPanel';
import { themeClassName } from '../EmojiPickerRoot';

const DATA = {
  aliases: {},
  categories: [
    { emojis: ['grinning', 'smile'], id: 'people' },
    { emojis: ['dog'], id: 'nature' },
  ],
  emojis: {
    dog: {
      id: 'dog',
      keywords: [],
      name: 'Dog',
      skins: [{ native: '🐶', unified: '1f436' }],
      version: 1,
    },
    grinning: {
      id: 'grinning',
      keywords: [],
      name: 'Grinning',
      skins: [{ native: '😀', unified: '1f600' }],
      version: 1,
    },
    smile: {
      id: 'smile',
      keywords: [],
      name: 'Smile',
      skins: [{ native: '😄', unified: '1f604' }],
      version: 1,
    },
  },
};

const emojiButton = (name: string) => screen.queryByRole('button', { name });

// The picker's theme CSS keys off the class this maps to: a forced `light`/`dark` must
// emit an SDK theme class on the panel root so the forced-light variable override in
// EmojiPicker.scss can win over an ancestor `.str-chat__theme-dark`.
describe('themeClassName', () => {
  it('maps forced light/dark to the SDK theme class, and nothing for auto/undefined', () => {
    expect(themeClassName('light')).toBe('str-chat__theme-light');
    expect(themeClassName('dark')).toBe('str-chat__theme-dark');
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

// Integration: the default composition rendered with real slots + real context.
describe('EmojiPickerPanel (default composition)', () => {
  beforeEach(() => {
    hookState.data = DATA;
    hookState.error = false;
  });

  it('excludes exceptEmojis from the grid, keeping the rest', () => {
    render(<EmojiPickerPanel exceptEmojis={['smile']} onEmojiSelect={() => {}} />);
    expect(emojiButton('Grinning')).toBeInTheDocument();
    expect(emojiButton('Dog')).toBeInTheDocument();
    expect(emojiButton('Smile')).not.toBeInTheDocument();
  });

  it('shows only the requested categories, in order', () => {
    render(<EmojiPickerPanel categories={['nature']} onEmojiSelect={() => {}} />);
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(emojiButton('Dog')).toBeInTheDocument();
    expect(emojiButton('Grinning')).not.toBeInTheDocument();
  });

  it('does not autofocus the search input when autoFocus is false', () => {
    render(<EmojiPickerPanel autoFocus={false} onEmojiSelect={() => {}} />);
    expect(screen.getByPlaceholderText('Search emoji')).not.toHaveFocus();
  });

  it('moves focus from the search box into the grid on ArrowDown', () => {
    render(<EmojiPickerPanel autoFocus={false} onEmojiSelect={() => {}} />);
    fireEvent.keyDown(screen.getByPlaceholderText('Search emoji'), { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: 'Grinning' })).toHaveFocus();
  });

  it('activates a category when its nav tab is clicked (nav ↔ grid via context)', () => {
    render(<EmojiPickerPanel onEmojiSelect={() => {}} />);
    const nature = screen.getByRole('tab', { name: 'Animals & Nature' });
    expect(nature).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(nature);
    expect(nature).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Smileys & People' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('reports the selected emoji (with its resolved native glyph)', () => {
    const onEmojiSelect = vi.fn();
    render(<EmojiPickerPanel autoFocus={false} onEmojiSelect={onEmojiSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Grinning' }));
    expect(onEmojiSelect).toHaveBeenCalledWith({
      id: 'grinning',
      name: 'Grinning',
      native: '😀',
    });
  });

  it('previews the hovered emoji, falling back to a placeholder when nothing is hovered', () => {
    render(<EmojiPickerPanel autoFocus={false} onEmojiSelect={() => {}} />);

    expect(screen.getByText('Pick an emoji…')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Grinning' }));
    expect(screen.getByText('Grinning')).toBeInTheDocument();
    expect(screen.getByText(':grinning:')).toBeInTheDocument();
    expect(screen.queryByText('Pick an emoji…')).not.toBeInTheDocument();
  });

  it('filters to matching emoji while searching, and restores browse on clear', async () => {
    render(<EmojiPickerPanel autoFocus={false} onEmojiSelect={() => {}} />);
    const input = screen.getByPlaceholderText('Search emoji');

    fireEvent.change(input, { target: { value: 'grin' } });
    // Search is debounced; the non-matching emoji drops out once it catches up.
    await waitFor(() => expect(emojiButton('Dog')).not.toBeInTheDocument());
    expect(emojiButton('Grinning')).toBeInTheDocument();
    // No category is active while searching.
    expect(screen.getByRole('tab', { name: 'Smileys & People' })).toHaveAttribute(
      'aria-selected',
      'false',
    );

    fireEvent.change(input, { target: { value: '' } });
    expect(emojiButton('Dog')).toBeInTheDocument();
  });
});
