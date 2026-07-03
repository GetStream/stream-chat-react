import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmojiGrid, type EmojiPickerCategory } from '../EmojiGrid';
import { EmojiPickerProvider } from '../../context/EmojiPickerContext';

// Mirror the repo's react-virtuoso mock: render every item synchronously so the
// non-search view's accessibility tree is assertable in jsdom.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data = [],
    itemContent,
  }: {
    data?: EmojiPickerCategory[];
    itemContent?: (index: number, item: EmojiPickerCategory) => React.ReactNode;
  }) => (
    <div>
      {data.map((item, index) => (
        <React.Fragment key={index}>{itemContent?.(index, item)}</React.Fragment>
      ))}
    </div>
  ),
}));

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
