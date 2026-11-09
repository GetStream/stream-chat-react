import emojiRegex from 'emoji-regex';

/**
 * Shared emoji regex, built once because `emojiRegex()` compiles a large source on every call. It
 * has the `g` flag and so a mutable `lastIndex`: use it only with consumers that reset it before
 * scanning (`String#match`, `String#replace`, `hast-util-find-and-replace`), never in stateful
 * `.test()` or `.exec()` loops.
 */
export const EMOJI_REGEX = emojiRegex();
