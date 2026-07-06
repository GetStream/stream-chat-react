import type { EmojiData, EmojiDataEmoji } from './types';

const REGIONAL_INDICATOR_START = 0x1f1e6;
const REGIONAL_INDICATOR_END = 0x1f1ff;

/**
 * A country flag's `unified` is a pair of Unicode regional-indicator codepoints
 * (e.g. `1f1fa-1f1f8` for 🇺🇸). Non-country flags (🏁, 🏴, 🚩) fall outside that range.
 */
export const isCountryFlag = (emoji: EmojiDataEmoji): boolean => {
  const unified = emoji.skins[0]?.unified ?? '';
  const points = unified.split('-').map((part) => parseInt(part, 16));
  return (
    points.length > 0 &&
    points.every((cp) => cp >= REGIONAL_INDICATOR_START && cp <= REGIONAL_INDICATOR_END)
  );
};

type FilterEmojiDataOptions = {
  emojiVersion?: number;
  exceptEmojis?: string[];
  noCountryFlags?: boolean;
};

/**
 * Returns a dataset with emoji removed per the options, pruning any category left empty.
 * Returns the SAME reference when no filter applies, so callers memoize cheaply and the
 * picker renders identically to the unfiltered dataset.
 */
export const filterEmojiData = (
  data: EmojiData,
  { emojiVersion, exceptEmojis = [], noCountryFlags = false }: FilterEmojiDataOptions,
): EmojiData => {
  if (!exceptEmojis.length && emojiVersion == null && !noCountryFlags) return data;

  const excluded = new Set(exceptEmojis);
  const keep = (emoji: EmojiDataEmoji) => {
    if (excluded.has(emoji.id)) return false;
    if (emojiVersion != null && emoji.version > emojiVersion) return false;
    if (noCountryFlags && isCountryFlag(emoji)) return false;
    return true;
  };

  const emojis: EmojiData['emojis'] = {};
  for (const id of Object.keys(data.emojis)) {
    if (keep(data.emojis[id])) emojis[id] = data.emojis[id];
  }
  const categories = data.categories
    .map((category) => ({
      ...category,
      emojis: category.emojis.filter((id) => emojis[id]),
    }))
    .filter((category) => category.emojis.length > 0);

  return { ...data, categories, emojis };
};
