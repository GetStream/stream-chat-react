import { memo } from 'react';
import { EmojiButton } from './EmojiButton';
import type { EmojiDataEmoji } from '../data';

export type EmojiPickerCategory = {
  emojis: EmojiDataEmoji[];
  id: string;
  label: string;
};

export type EmojiGridProps = {
  categories: EmojiPickerCategory[];
};

/**
 * Renders every category as a labelled section of emoji cells. Non-virtualized —
 * virtualization is layered on in a later phase behind this same category model.
 */
export const EmojiGrid = memo(function EmojiGrid({ categories }: EmojiGridProps) {
  return (
    <div className='str-chat__emoji-picker__grid' role='grid'>
      {categories.map((category) => (
        <section
          aria-label={category.label}
          className='str-chat__emoji-picker__category'
          data-category-id={category.id}
          key={category.id}
        >
          <div className='str-chat__emoji-picker__category-label' role='presentation'>
            {category.label}
          </div>
          <div className='str-chat__emoji-picker__category-emojis' role='row'>
            {category.emojis.map((emoji) => (
              <EmojiButton emoji={emoji} key={emoji.id} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
});
