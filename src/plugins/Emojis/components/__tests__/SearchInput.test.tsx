import { fireEvent, render, screen } from '@testing-library/react';

const { ctx } = vi.hoisted(() => ({
  ctx: { query: '', setQuery: vi.fn() },
}));
vi.mock('../../context/EmojiPickerContext', () => ({
  useEmojiPickerContext: () => ctx,
}));
vi.mock('../../../../context', () => ({
  useTranslationContext: () => ({ t: (key: string) => key }),
}));

import { SearchInput } from '../SearchInput';

beforeEach(() => {
  ctx.query = '';
  vi.spyOn(ctx, 'setQuery').mockImplementation();
});

describe('SearchInput', () => {
  it('reports the query through context', () => {
    render(<SearchInput autoFocus={false} />);
    fireEvent.change(screen.getByPlaceholderText('Search emoji'), {
      target: { value: 'smile' },
    });
    expect(ctx.setQuery).toHaveBeenCalledWith('smile');
  });

  it('clears the query via the clear button when there is a value', () => {
    ctx.query = 'smile';
    render(<SearchInput autoFocus={false} />);
    fireEvent.click(screen.getByLabelText('aria/Clear emoji search'));
    expect(ctx.setQuery).toHaveBeenCalledWith('');
  });

  it('moves focus to the first emoji cell on ArrowDown', () => {
    ctx.query = '';
    render(
      <div role='dialog'>
        <SearchInput autoFocus={false} />
        <button className='str-chat__emoji-picker__emoji' type='button'>
          😀
        </button>
      </div>,
    );
    const input = screen.getByPlaceholderText('Search emoji');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: '😀' })).toHaveFocus();
  });
});
