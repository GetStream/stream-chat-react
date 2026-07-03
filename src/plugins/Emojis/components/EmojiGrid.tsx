import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { EmojiButton } from './EmojiButton';
import type { EmojiDataEmoji } from '../data';

export type EmojiPickerCategory = {
  emojis: EmojiDataEmoji[];
  id: string;
  label: string;
};

export type EmojiGridHandle = {
  scrollToCategory: (categoryId: string) => void;
};

export type EmojiGridProps = {
  categories: EmojiPickerCategory[];
  onActiveCategoryChange?: (categoryId: string) => void;
};

const CategorySection = ({ category }: { category: EmojiPickerCategory }) => (
  <section
    aria-label={category.label}
    className='str-chat__emoji-picker__category'
    data-category-id={category.id}
  >
    <div className='str-chat__emoji-picker__category-label' role='presentation'>
      {category.label}
    </div>
    <div className='str-chat__emoji-picker__category-emojis'>
      {category.emojis.map((emoji) => (
        <EmojiButton emoji={emoji} key={emoji.id} />
      ))}
    </div>
  </section>
);

/**
 * The category-grouped emoji grid. Virtualized at the category level with
 * react-virtuoso: only the categories in (and near) the viewport are mounted, which
 * keeps opening the picker fast without giving up section headers, scroll-spy, or
 * per-category scrolling. `scrollToCategory` is exposed imperatively for the nav.
 */
export const EmojiGrid = forwardRef<EmojiGridHandle, EmojiGridProps>(function EmojiGrid(
  { categories, onActiveCategoryChange },
  ref,
) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useImperativeHandle(
    ref,
    () => ({
      scrollToCategory: (categoryId: string) => {
        const index = categories.findIndex((category) => category.id === categoryId);
        if (index >= 0) virtuosoRef.current?.scrollToIndex({ align: 'start', index });
      },
    }),
    [categories],
  );

  return (
    <Virtuoso
      className='str-chat__emoji-picker__grid'
      data={categories}
      itemContent={(_index, category) => <CategorySection category={category} />}
      rangeChanged={({ startIndex }) => {
        const category = categories[startIndex];
        if (category) onActiveCategoryChange?.(category.id);
      }}
      ref={virtuosoRef}
      style={{ height: '100%' }}
    />
  );
});
