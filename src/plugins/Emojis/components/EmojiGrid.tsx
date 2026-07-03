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
  const atBottomRef = useRef(false);

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
      atBottomStateChange={(atBottom) => {
        atBottomRef.current = atBottom;
        // The last category is often short and never reaches the top of the viewport,
        // so scroll-spy alone would never mark it active — pin it while at the bottom.
        if (atBottom) {
          const last = categories[categories.length - 1];
          if (last) onActiveCategoryChange?.(last.id);
        }
      }}
      className='str-chat__emoji-picker__grid'
      data={categories}
      itemContent={(_index, category) => <CategorySection category={category} />}
      rangeChanged={({ startIndex }) => {
        // While pinned at the bottom, atBottomStateChange owns the active category.
        if (atBottomRef.current) return;
        const category = categories[startIndex];
        if (category) onActiveCategoryChange?.(category.id);
      }}
      ref={virtuosoRef}
      style={{ height: '100%' }}
    />
  );
});
