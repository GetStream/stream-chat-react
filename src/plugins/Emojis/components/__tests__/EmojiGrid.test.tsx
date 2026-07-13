import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

// Capture the Virtuoso scroll callbacks so the scroll-spy behavior is testable, and
// render every item synchronously so the non-search view's a11y tree is assertable.
const { virtuoso } = vi.hoisted(() => ({
  virtuoso: {} as {
    atBottomStateChange?: (atBottom: boolean) => void;
    rangeChanged?: (range: { endIndex: number; startIndex: number }) => void;
  },
}));

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    atBottomStateChange,
    data = [],
    itemContent,
    rangeChanged,
  }: {
    atBottomStateChange?: (atBottom: boolean) => void;
    data?: unknown[];
    itemContent?: (index: number, item: unknown) => React.ReactNode;
    rangeChanged?: (range: { endIndex: number; startIndex: number }) => void;
  }) => {
    virtuoso.atBottomStateChange = atBottomStateChange;
    virtuoso.rangeChanged = rangeChanged;
    return (
      <div>
        {data.map((item, index) => (
          <React.Fragment key={index}>{itemContent?.(index, item)}</React.Fragment>
        ))}
      </div>
    );
  },
}));

const { ctx, preview } = vi.hoisted(() => ({
  ctx: {} as Record<string, unknown>,
  preview: { previewedEmoji: null, setPreviewedEmoji: vi.fn() },
}));
vi.mock('../../context/EmojiPickerContext', () => ({
  useEmojiPickerContext: () => ctx,
}));
vi.mock('../../context/EmojiPickerPreviewContext', () => ({
  useEmojiPickerPreviewContext: () => preview,
}));
vi.mock('../../../../context', () => ({
  useTranslationContext: () => ({ t: (key: string) => key }),
}));

import { EmojiGrid, type EmojiPickerCategory } from '../EmojiGrid';

const emoji = (id: string, native: string, name = id) => ({
  id,
  keywords: [],
  name,
  skins: [{ native, unified: '' }],
  version: 1,
});

const base = () => ({
  categories: [] as EmojiPickerCategory[],
  isSearching: false,
  resolveNative: (e: { skins: { native: string }[] }) => e.skins[0]?.native ?? '',
  scrollTarget: null,
  searchResults: null as null | ReturnType<typeof emoji>[],
  selectEmoji: vi.fn(),
  setActiveCategory: vi.fn(),
});

beforeEach(() => {
  Object.assign(ctx, base());
});

describe('EmojiGrid accessibility (non-search view)', () => {
  beforeEach(() => {
    ctx.categories = [
      {
        emojis: [emoji('grinning', '😀', 'Grinning')],
        id: 'people',
        label: 'Smileys & People',
      },
    ];
  });

  it('renders emojis as accessible buttons with no orphaned grid/row/gridcell roles', () => {
    render(<EmojiGrid />);

    // The review flagged row/gridcell elements with no owning grid in the virtualized
    // view. Native button semantics avoid the invalid ARIA entirely.
    expect(screen.queryAllByRole('grid')).toHaveLength(0);
    expect(screen.queryAllByRole('row')).toHaveLength(0);
    expect(screen.queryAllByRole('gridcell')).toHaveLength(0);

    expect(screen.getByRole('button', { name: 'Grinning' })).toBeInTheDocument();
  });

  it('keeps emojis grouped under a labeled category region', () => {
    render(<EmojiGrid />);
    expect(screen.getByRole('region', { name: 'Smileys & People' })).toBeInTheDocument();
  });
});

describe('EmojiGrid scroll-spy (active category tracking)', () => {
  beforeEach(() => {
    ctx.categories = [
      { emojis: [emoji('grinning', '😀')], id: 'people', label: 'People' },
      { emojis: [emoji('checkered_flag', '🏁')], id: 'flags', label: 'Flags' },
    ];
  });

  it('marks the category at the top of the viewport active as the list scrolls', () => {
    render(<EmojiGrid />);
    virtuoso.rangeChanged?.({ endIndex: 1, startIndex: 1 });
    expect(ctx.setActiveCategory).toHaveBeenLastCalledWith('flags');
  });

  it('marks the last category active at the bottom, even when a short final category never reaches the top', () => {
    render(<EmojiGrid />);
    virtuoso.rangeChanged?.({ endIndex: 1, startIndex: 0 });
    virtuoso.atBottomStateChange?.(true);
    expect(ctx.setActiveCategory).toHaveBeenLastCalledWith('flags');
    // Range changes while pinned at the bottom must not steal the active category back.
    virtuoso.rangeChanged?.({ endIndex: 1, startIndex: 0 });
    expect(ctx.setActiveCategory).toHaveBeenLastCalledWith('flags');
  });
});

describe('EmojiGrid search view', () => {
  it('renders flat search results and selects through context', () => {
    const rocket = emoji('rocket', '🚀', 'Rocket');
    ctx.isSearching = true;
    ctx.searchResults = [rocket];
    render(<EmojiGrid />);
    fireEvent.click(screen.getByRole('button', { name: 'Rocket' }));
    expect(ctx.selectEmoji).toHaveBeenCalledWith(rocket);
  });
});
