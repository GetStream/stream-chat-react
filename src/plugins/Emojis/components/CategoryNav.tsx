import clsx from 'clsx';
import { EMOJI_CATEGORY_META } from './categories';
import type { EmojiPickerCategory } from './EmojiGrid';

export type CategoryNavProps = {
  categories: EmojiPickerCategory[];
  onNavigate: (categoryId: string) => void;
  activeCategoryId?: string;
};

/**
 * Top navigation bar with one tab per category. Clicking a tab scrolls its section
 * into view; the active tab reflects the currently visible section.
 */
export const CategoryNav = ({
  activeCategoryId,
  categories,
  onNavigate,
}: CategoryNavProps) => (
  <div className='str-chat__emoji-picker__category-nav' role='tablist'>
    {categories.map(({ id, label }) => (
      <button
        aria-label={label}
        aria-selected={activeCategoryId === id}
        className={clsx('str-chat__emoji-picker__category-nav-button', {
          'str-chat__emoji-picker__category-nav-button--active': activeCategoryId === id,
        })}
        key={id}
        onClick={() => onNavigate(id)}
        role='tab'
        type='button'
      >
        <span aria-hidden='true'>{EMOJI_CATEGORY_META[id]?.glyph ?? '•'}</span>
      </button>
    ))}
  </div>
);
