import type { EmojiData, EmojiDataEmoji, EmojiDataSkin } from '../data';

export type SearchableEmoji = {
  id: string;
  name: string;
  native: string;
  /** Comma-prefixed, lowercased haystack — mirrors emoji-mart's `emoji.search`. */
  search: string;
  skins: EmojiDataSkin[];
  emoticons?: string[];
};

// Mirrors emoji-mart's SearchIndex haystack construction (module.js): id (not
// tokenized), name (tokenized on /[-|_|\s]+/), keywords and emoticons (not
// tokenized) — all lowercased and comma-joined — followed by each skin's native.
const buildHaystack = (emoji: EmojiDataEmoji): string => {
  const fields: Array<[string | string[] | undefined, boolean]> = [
    [emoji.id, false],
    [emoji.name, true],
    [emoji.keywords, false],
    [emoji.emoticons, false],
  ];

  const tokens = fields
    .map(([strings, split]) => {
      if (!strings) return [];
      return (Array.isArray(strings) ? strings : [strings])
        .map((string) =>
          (split ? string.split(/[-|_|\s]+/) : [string]).map((part) =>
            part.toLowerCase(),
          ),
        )
        .flat();
    })
    .flat()
    .filter((token) => token && token.trim());

  let haystack = `,${tokens.join(',')}`;
  for (const skin of emoji.skins) {
    if (skin?.native) haystack += `,${skin.native}`;
  }
  return haystack;
};

/**
 * Transforms the vendored emoji dataset into a flat, search-ready index. Pure and
 * side-effect free — the produced `search` haystack matches emoji-mart's format so
 * that ranking parity with `emoji-mart`'s `SearchIndex` is preserved.
 */
export const buildEmojiSearchData = (data: EmojiData): SearchableEmoji[] =>
  Object.values(data.emojis).map((emoji) => ({
    emoticons: emoji.emoticons,
    id: emoji.id,
    name: emoji.name,
    native: emoji.skins[0]?.native ?? '',
    search: buildHaystack(emoji),
    skins: emoji.skins,
  }));
