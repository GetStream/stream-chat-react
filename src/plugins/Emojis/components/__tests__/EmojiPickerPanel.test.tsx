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

// The real grid uses react-virtuoso, which renders no items without layout (jsdom).
// Mock it to expose the categories it receives so we can assert what the panel feeds it.
vi.mock('../EmojiGrid', async () => {
  const { forwardRef } = await import('react');
  return {
    EmojiGrid: forwardRef(function EmojiGrid({
      categories,
    }: {
      categories: { emojis: { id: string; name: string }[]; id: string }[];
    }) {
      return (
        <div data-testid='grid'>
          {categories
            .flatMap((category) => category.emojis)
            .map((emoji) => (
              <span key={emoji.id}>{emoji.name}</span>
            ))}
        </div>
      );
    }),
  };
});

import { EmojiPickerPanel, themeClassName } from '../EmojiPickerPanel';
import { DEFAULT_EMOJI_PICKER_OPTIONS } from '../../options';

const DATA = {
  aliases: {},
  categories: [{ emojis: ['grinning', 'smile'], id: 'people' }],
  emojis: {
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

describe('EmojiPickerPanel option: exceptEmojis', () => {
  beforeEach(() => {
    hookState.data = DATA;
    hookState.error = false;
  });

  it('removes excluded emoji from the grid, keeping the rest', () => {
    render(
      <EmojiPickerPanel
        onEmojiSelect={() => {}}
        options={{ ...DEFAULT_EMOJI_PICKER_OPTIONS, exceptEmojis: ['smile'] }}
      />,
    );
    expect(screen.getByText('Grinning')).toBeInTheDocument();
    expect(screen.queryByText('Smile')).not.toBeInTheDocument();
  });
});

const TWO_CATS = {
  aliases: {},
  categories: [
    { emojis: ['grinning'], id: 'people' },
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
  },
};

describe('EmojiPickerPanel option: categories', () => {
  beforeEach(() => {
    hookState.data = TWO_CATS;
    hookState.error = false;
  });

  it('shows only the requested categories, in the requested order', () => {
    render(
      <EmojiPickerPanel
        onEmojiSelect={() => {}}
        options={{ ...DEFAULT_EMOJI_PICKER_OPTIONS, categories: ['nature'] }}
      />,
    );
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.getByText('Dog')).toBeInTheDocument();
    expect(screen.queryByText('Grinning')).not.toBeInTheDocument();
  });
});

describe('EmojiPickerPanel layout positions', () => {
  beforeEach(() => {
    hookState.data = DATA;
    hookState.error = false;
  });

  it('omits the search input when searchPosition is none', () => {
    render(
      <EmojiPickerPanel
        onEmojiSelect={() => {}}
        options={{ ...DEFAULT_EMOJI_PICKER_OPTIONS, searchPosition: 'none' }}
      />,
    );
    expect(screen.queryByPlaceholderText('Search emoji')).not.toBeInTheDocument();
  });

  it('omits the category nav when navPosition is none', () => {
    render(
      <EmojiPickerPanel
        onEmojiSelect={() => {}}
        options={{ ...DEFAULT_EMOJI_PICKER_OPTIONS, navPosition: 'none' }}
      />,
    );
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('omits the skin-tone selector when skinTonePosition is none', () => {
    render(
      <EmojiPickerPanel
        onEmojiSelect={() => {}}
        onSkinToneChange={() => {}}
        options={{ ...DEFAULT_EMOJI_PICKER_OPTIONS, skinTonePosition: 'none' }}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'aria/Choose default skin tone' }),
    ).not.toBeInTheDocument();
  });

  it('does not focus the search input when autoFocus is false', () => {
    render(
      <EmojiPickerPanel
        onEmojiSelect={() => {}}
        options={{ ...DEFAULT_EMOJI_PICKER_OPTIONS, autoFocus: false }}
      />,
    );
    expect(screen.getByPlaceholderText('Search emoji')).not.toHaveFocus();
  });
});
