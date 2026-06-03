import emojiRegex from 'emoji-regex';

/**
 * `emojiRegex()` compiles a ~15KB regex source on every call, so we build a
 * single shared instance at module load and reuse it everywhere an emoji match
 * is needed.
 *
 * The instance is global (carries the `g` flag and therefore a mutable
 * `lastIndex`), so it is only safe to reuse with consumers that reset
 * `lastIndex` before scanning:
 * - `String#match` / `String#replace` reset it internally;
 * - `hast-util-find-and-replace` resets it before each use.
 *
 * Do NOT use it directly with stateful `.test()` / `.exec()` loops.
 */
export const EMOJI_REGEX = emojiRegex();
