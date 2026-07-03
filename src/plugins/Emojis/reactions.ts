import { mapEmojiMartData } from '../../components/Reactions/reactionOptions';
import { loadEmojiData } from './data';
import { memoizeAsyncWithReset } from './memoizeAsyncWithReset';

/**
 * Loads the full set of "extended" reaction options — every vendored emoji, keyed by
 * unicode — for use as `reactionOptions.extended`. This restores reacting with (almost)
 * any emoji via the reaction selector's "+" button, which previously came from feeding
 * the whole `@emoji-mart/data` object into `mapEmojiMartData`.
 *
 * Both halves of that feature read `reactionOptions.extended`: the selector only shows
 * "+" when it is non-empty, and `useProcessReactions` renders a reaction only when its
 * type is a known option — so without this map an arbitrary-emoji reaction can be sent
 * but not displayed.
 *
 * The dataset is fetched through the same lazily code-split dynamic import the picker
 * uses (and the result is memoized), so importing this loader costs nothing until it is
 * actually called and the ~340 KB JSON never lands in an app's initial bundle.
 * Integrators call it once — e.g. in an effect — and merge the result into their
 * reaction options; see the emoji migration notes in `AI.md`.
 */
export const loadDefaultExtendedReactionOptions = memoizeAsyncWithReset(async () =>
  mapEmojiMartData(await loadEmojiData()),
);
