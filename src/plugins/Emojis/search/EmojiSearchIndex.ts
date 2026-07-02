import type {
  EmojiSearchIndex,
  EmojiSearchIndexResult,
} from '../../../components/MessageComposer';
import { loadEmojiData } from '../data';
import { buildEmojiSearchData, type SearchableEmoji } from './buildEmojiSearchData';
import { runSearch } from './search';

let indexPromise: Promise<SearchableEmoji[]> | null = null;

const getIndex = (): Promise<SearchableEmoji[]> => {
  if (!indexPromise) {
    indexPromise = loadEmojiData().then(buildEmojiSearchData);
  }
  return indexPromise;
};

const toResult = (emoji: SearchableEmoji): EmojiSearchIndexResult => ({
  emoticons: emoji.emoticons,
  id: emoji.id,
  name: emoji.name,
  native: emoji.native,
  skins: emoji.skins,
});

/**
 * The built-in, `emoji-mart`-free implementation of the {@link EmojiSearchIndex}
 * interface consumed by `createTextComposerEmojiMiddleware` and the emoji picker.
 * It self-initializes: the vendored dataset is loaded and the search index built
 * lazily on first `search()` call, then memoized. An empty query resolves to `[]`
 * (functionally equivalent to emoji-mart's `null`, which the middleware coerces).
 */
export const defaultEmojiSearchIndex: EmojiSearchIndex = {
  search: async (query: string) => {
    if (!query || !query.trim()) return [];
    const results = runSearch(await getIndex(), query);
    return results ? results.map(toResult) : [];
  },
};
