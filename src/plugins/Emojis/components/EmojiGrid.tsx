import { useCallback, useEffect, useRef } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { EmojiButton } from './EmojiButton';
import { EmptyResults } from './EmptyResults';
import { useEmojiPickerContext } from '../context/EmojiPickerContext';
import { useGridKeyboardNav } from '../hooks/useGridKeyboardNav';
import type { EmojiDataEmoji } from '../data';

export type EmojiPickerCategory = {
  emojis: EmojiDataEmoji[];
  id: string;
  label: string;
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
 * The context-driven body of the picker: while browsing, a category-grouped grid,
 * virtualized at the category level with react-virtuoso (only categories in/near the
 * viewport mount); while searching, a flat result list or the empty state. Scrolls to
 * the category named by `scrollTarget`, reports the visible category via
 * `setActiveCategory` (scroll-spy), and owns 2D roving keyboard navigation over its
 * cells. A custom Grid slot forfeits these mechanics but keeps reading the same context.
 */
export const EmojiGrid = () => {
  const { categories, isSearching, scrollTarget, searchResults, setActiveCategory } =
    useEmojiPickerContext('EmojiGrid');
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const atBottomRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const scrollToCategory = useCallback(
    (categoryId: string) => {
      const index = categories.findIndex((category) => category.id === categoryId);
      if (index >= 0) virtuosoRef.current?.scrollToIndex({ align: 'start', index });
    },
    [categories],
  );

  // Nav clicks (and any consumer) request a scroll via `scrollTarget`; the nonce makes a
  // repeat request to the same category re-fire.
  useEffect(() => {
    if (scrollTarget) scrollToCategory(scrollTarget.categoryId);
  }, [scrollTarget, scrollToCategory]);

  // Keyboard nav can target a category that virtualization has unmounted; give it the
  // category order + a way to scroll one into view so focus can traverse the whole set.
  const { onKeyDown } = useGridKeyboardNav(bodyRef, { categories, scrollToCategory });

  if (isSearching) {
    return (
      <div className='str-chat__emoji-picker__body' onKeyDown={onKeyDown} ref={bodyRef}>
        {searchResults && searchResults.length ? (
          <div className='str-chat__emoji-picker__grid-container'>
            <div className='str-chat__emoji-picker__grid'>
              <div className='str-chat__emoji-picker__category-emojis'>
                {searchResults.map((emoji) => (
                  <EmojiButton emoji={emoji} key={emoji.id} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyResults />
        )}
      </div>
    );
  }

  return (
    <div className='str-chat__emoji-picker__body' onKeyDown={onKeyDown} ref={bodyRef}>
      <Virtuoso
        atBottomStateChange={(atBottom) => {
          atBottomRef.current = atBottom;
          // The last category is often short and never reaches the top of the viewport,
          // so scroll-spy alone would never mark it active — pin it while at the bottom.
          const last = categories[categories.length - 1];
          if (atBottom && last) setActiveCategory(last.id);
        }}
        className='str-chat__emoji-picker__grid'
        data={categories}
        itemContent={(_index, category) => <CategorySection category={category} />}
        rangeChanged={({ startIndex }) => {
          // While pinned at the bottom, atBottomStateChange owns the active category.
          if (atBottomRef.current) return;
          const category = categories[startIndex];
          if (category) setActiveCategory(category.id);
        }}
        ref={virtuosoRef}
        style={{ height: '100%' }}
      />
    </div>
  );
};
