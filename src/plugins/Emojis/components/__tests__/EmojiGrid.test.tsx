import React from 'react';
import { render, screen } from '@testing-library/react';

// Capture the Virtuoso scroll callbacks + imperative scroll so scroll-spy and
// scroll-to-category are testable, and render items synchronously so the browse view's
// a11y tree is assertable (jsdom has no layout).
const { virtuoso } = vi.hoisted(() => ({
  virtuoso: { scrollToIndex: vi.fn() } as {
    atBottomStateChange?: (atBottom: boolean) => void;
    rangeChanged?: (range: { endIndex: number; startIndex: number }) => void;
    scrollToIndex: ReturnType<typeof vi.fn>;
  },
}));

vi.mock('react-virtuoso', async () => {
  const { forwardRef, useImperativeHandle } = await import('react');
  return {
    Virtuoso: forwardRef(function Virtuoso(
      {
        atBottomStateChange,
        data = [],
        itemContent,
        rangeChanged,
      }: {
        atBottomStateChange?: (atBottom: boolean) => void;
        data?: unknown[];
        itemContent?: (index: number, item: unknown) => React.ReactNode;
        rangeChanged?: (range: { endIndex: number; startIndex: number }) => void;
      },
      ref,
    ) {
      virtuoso.atBottomStateChange = atBottomStateChange;
      virtuoso.rangeChanged = rangeChanged;
      useImperativeHandle(ref, () => ({ scrollToIndex: virtuoso.scrollToIndex }));
      return (
        <div>
          {data.map((item, index) => (
            <React.Fragment key={index}>{itemContent?.(index, item)}</React.Fragment>
          ))}
        </div>
      );
    }),
  };
});

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
  scrollTarget: null as { categoryId: string; nonce: number } | null,
  searchResults: null,
  selectEmoji: vi.fn(),
  setActiveCategory: vi.fn(),
});

beforeEach(() => {
  Object.assign(ctx, base());
});

describe('EmojiGrid browse view', () => {
  it('renders emojis as labeled buttons under labeled category regions, with no orphaned grid roles', () => {
    ctx.categories = [
      {
        emojis: [emoji('grinning', '😀', 'Grinning')],
        id: 'people',
        label: 'Smileys & People',
      },
    ];
    render(<EmojiGrid />);

    // Native button semantics — no invalid ARIA grid/row/gridcell in the virtualized view.
    expect(screen.queryAllByRole('grid')).toHaveLength(0);
    expect(screen.queryAllByRole('row')).toHaveLength(0);
    expect(screen.queryAllByRole('gridcell')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Grinning' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Smileys & People' })).toBeInTheDocument();
  });
});

describe('EmojiGrid scroll-spy', () => {
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

  it('pins the last category active at the bottom, even when a short final category never reaches the top', () => {
    render(<EmojiGrid />);
    virtuoso.rangeChanged?.({ endIndex: 1, startIndex: 0 });
    virtuoso.atBottomStateChange?.(true);
    expect(ctx.setActiveCategory).toHaveBeenLastCalledWith('flags');
    // Range changes while pinned at the bottom must not steal the active category back.
    virtuoso.rangeChanged?.({ endIndex: 1, startIndex: 0 });
    expect(ctx.setActiveCategory).toHaveBeenLastCalledWith('flags');
  });
});

describe('EmojiGrid scroll-to-category', () => {
  beforeEach(() => {
    // Run the scroll's requestAnimationFrame defer synchronously so it's assertable.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    virtuoso.scrollToIndex.mockClear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrolls to a requested category once, and not when categories change', () => {
    ctx.categories = [
      { emojis: [emoji('grinning', '😀')], id: 'people', label: 'People' },
      { emojis: [emoji('checkered_flag', '🏁')], id: 'flags', label: 'Flags' },
    ];
    ctx.scrollTarget = { categoryId: 'flags', nonce: 1 };
    const { rerender } = render(<EmojiGrid />);
    expect(virtuoso.scrollToIndex).toHaveBeenCalledTimes(1);
    expect(virtuoso.scrollToIndex).toHaveBeenLastCalledWith({ align: 'start', index: 1 });

    // A categories change (e.g. frequently-used updating after a selection) must NOT
    // re-fire the scroll — otherwise the grid jumps back to the last-requested category.
    ctx.categories = [
      { emojis: [emoji('clock', '🕐')], id: 'frequent', label: 'Frequently used' },
      ...(ctx.categories as EmojiPickerCategory[]),
    ];
    rerender(<EmojiGrid />);
    expect(virtuoso.scrollToIndex).toHaveBeenCalledTimes(1);

    // A fresh scroll request (new nonce) does scroll again.
    ctx.scrollTarget = { categoryId: 'flags', nonce: 2 };
    rerender(<EmojiGrid />);
    expect(virtuoso.scrollToIndex).toHaveBeenCalledTimes(2);
  });
});
