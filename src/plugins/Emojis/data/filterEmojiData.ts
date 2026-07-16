import type { EmojiData } from './types';

type FilterEmojiDataOptions = {
  exceptEmojis?: string[];
};

/**
 * Returns a dataset with the excluded emoji removed, pruning any category left empty.
 * Returns the SAME reference when nothing is excluded, so callers memoize cheaply and
 * the picker renders identically to the unfiltered dataset.
 */
export const filterEmojiData = (
  data: EmojiData,
  { exceptEmojis = [] }: FilterEmojiDataOptions,
): EmojiData => {
  if (!exceptEmojis.length) return data;

  const excluded = new Set(exceptEmojis);
  const emojis: EmojiData['emojis'] = {};
  for (const id of Object.keys(data.emojis)) {
    if (!excluded.has(id)) emojis[id] = data.emojis[id];
  }
  const categories = data.categories
    .map((category) => ({
      ...category,
      emojis: category.emojis.filter((id) => emojis[id]),
    }))
    .filter((category) => category.emojis.length > 0);

  return { ...data, categories, emojis };
};
