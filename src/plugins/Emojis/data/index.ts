import { memoizeAsyncWithReset } from '../memoizeAsyncWithReset';
import type { EmojiData } from './types';

export type {
  EmojiData,
  EmojiDataCategory,
  EmojiDataEmoji,
  EmojiDataSkin,
} from './types';

/**
 * Lazily loads the vendored emoji dataset. The JSON is imported dynamically so
 * bundlers emit it as a separate async chunk — it is fetched only when the emoji
 * picker or search actually runs, and never enters the main `stream-chat-react`
 * bundle. The result is memoized, so repeated calls share a single load; a failed
 * load (offline, stale chunk after a deploy) is not cached, so a later call retries.
 */
export const loadEmojiData = memoizeAsyncWithReset<EmojiData>(() =>
  import('./emoji-data.json').then(
    (mod) =>
      ((mod as unknown as { default?: EmojiData }).default ??
        mod) as unknown as EmojiData,
  ),
);
