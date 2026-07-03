import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmojiGrid, type EmojiPickerCategory } from '../EmojiGrid';
import { EmojiPickerProvider } from '../../context/EmojiPickerContext';

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
    data?: EmojiPickerCategory[];
    itemContent?: (index: number, item: EmojiPickerCategory) => React.ReactNode;
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

const emoji = (id: string, native: string) => ({
  id,
  keywords: [],
  name: id,
  skins: [{ native, unified: '' }],
  version: 1,
});

const categories: EmojiPickerCategory[] = [
  {
    emojis: [
      {
        id: 'grinning',
        keywords: ['face', 'smile'],
        name: 'Grinning',
        skins: [{ native: '😀', unified: '1f600' }],
        version: 1,
      },
    ],
    id: 'people',
    label: 'Smileys & People',
  },
];

const renderGrid = () =>
  render(
    <EmojiPickerProvider
      value={{ onSelectEmoji: vi.fn(), setPreviewedEmoji: vi.fn(), skinToneIndex: 0 }}
    >
      <EmojiGrid categories={categories} />
    </EmojiPickerProvider>,
  );

describe('EmojiGrid accessibility (non-search view)', () => {
  it('renders emojis as accessible buttons with no orphaned grid/row/gridcell roles', () => {
    renderGrid();

    // The review flagged row/gridcell elements with no owning grid in the virtualized
    // view. Native button semantics avoid the invalid ARIA entirely.
    expect(screen.queryAllByRole('grid')).toHaveLength(0);
    expect(screen.queryAllByRole('row')).toHaveLength(0);
    expect(screen.queryAllByRole('gridcell')).toHaveLength(0);

    expect(screen.getByRole('button', { name: 'Grinning' })).toBeInTheDocument();
  });

  it('keeps emojis grouped under a labeled category region', () => {
    renderGrid();

    expect(screen.getByRole('region', { name: 'Smileys & People' })).toBeInTheDocument();
  });
});

describe('EmojiGrid scroll-spy (active category tracking)', () => {
  const twoCategories: EmojiPickerCategory[] = [
    { emojis: [emoji('grinning', '😀')], id: 'people', label: 'People' },
    { emojis: [emoji('checkered_flag', '🏁')], id: 'flags', label: 'Flags' },
  ];

  const renderSpy = (onActiveCategoryChange: (id: string) => void) =>
    render(
      <EmojiPickerProvider
        value={{ onSelectEmoji: vi.fn(), setPreviewedEmoji: vi.fn(), skinToneIndex: 0 }}
      >
        <EmojiGrid
          categories={twoCategories}
          onActiveCategoryChange={onActiveCategoryChange}
        />
      </EmojiPickerProvider>,
    );

  it('marks the category at the top of the viewport active as the list scrolls', () => {
    const onActive = vi.fn();
    renderSpy(onActive);

    virtuoso.rangeChanged?.({ endIndex: 1, startIndex: 1 });

    expect(onActive).toHaveBeenLastCalledWith('flags');
  });

  it('marks the last category active at the bottom, even when a short final category never reaches the top', () => {
    const onActive = vi.fn();
    renderSpy(onActive);

    // Top of the viewport is still the first category…
    virtuoso.rangeChanged?.({ endIndex: 1, startIndex: 0 });
    // …but the list is scrolled to the very bottom, so the last category is active.
    virtuoso.atBottomStateChange?.(true);
    expect(onActive).toHaveBeenLastCalledWith('flags');

    // Range changes while pinned at the bottom must not steal the active category back.
    virtuoso.rangeChanged?.({ endIndex: 1, startIndex: 0 });
    expect(onActive).toHaveBeenLastCalledWith('flags');
  });
});
