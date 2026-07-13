import { fireEvent, render, screen } from '@testing-library/react';

const { ctx } = vi.hoisted(() => ({
  ctx: {
    activeCategoryId: 'people',
    categories: [
      { emojis: [], id: 'people', label: 'People' },
      { emojis: [], id: 'nature', label: 'Nature' },
    ],
    isSearching: false,
    requestScrollToCategory: vi.fn(),
  },
}));
vi.mock('../../context/EmojiPickerContext', () => ({
  useEmojiPickerContext: () => ctx,
}));

import { CategoryNav } from '../CategoryNav';

beforeEach(() => {
  ctx.activeCategoryId = 'people';
  ctx.isSearching = false;
  vi.spyOn(ctx, 'requestScrollToCategory').mockImplementation();
});

describe('CategoryNav', () => {
  it('requests a scroll to the clicked category', () => {
    render(<CategoryNav />);
    fireEvent.click(screen.getByLabelText('Nature'));
    expect(ctx.requestScrollToCategory).toHaveBeenCalledWith('nature');
  });

  it('marks the active category tab selected', () => {
    render(<CategoryNav />);
    expect(screen.getByLabelText('People')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Nature')).toHaveAttribute('aria-selected', 'false');
  });

  it('shows no active tab while searching', () => {
    ctx.isSearching = true;
    render(<CategoryNav />);
    expect(screen.getByLabelText('People')).toHaveAttribute('aria-selected', 'false');
  });
});
