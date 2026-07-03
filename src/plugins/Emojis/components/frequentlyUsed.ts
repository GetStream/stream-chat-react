import type { EmojiData, EmojiDataEmoji } from '../data';

/**
 * How many recently-used emoji the "frequently used" section shows. Matches the
 * default grid's column count, so the section stays a single row.
 *
 * Kept in sync with the fixed column count in EmojiPicker.scss
 * (`[data-category-id='frequent'] .str-chat__emoji-picker__category-emojis`): the
 * slice caps the item count and the CSS pins the columns, together guaranteeing one
 * row regardless of how many emoji have been used.
 */
export const FREQUENTLY_USED_LIMIT = 9;

/**
 * Resolves an ordered (most-recent-first) list of emoji ids to dataset entries for the
 * "frequently used" section: drops ids missing from the dataset and caps the result to
 * a single row (`FREQUENTLY_USED_LIMIT`).
 */
export const resolveFrequentlyUsedEmoji = (
  data: EmojiData,
  frequentlyUsedIds: string[],
  limit = FREQUENTLY_USED_LIMIT,
): EmojiDataEmoji[] =>
  frequentlyUsedIds
    .map((id) => data.emojis[id])
    .filter(Boolean)
    .slice(0, limit);
