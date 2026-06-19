/* eslint-disable sort-keys */

import React from 'react';

type LegacyReactionOptions = Array<{
  Component: React.ComponentType;
  type: string;
  name?: string;
}>;

type ReactionOptionData = {
  Component: React.ComponentType;
  name?: string;
  unicode?: string;
};

export type ReactionOptions =
  | LegacyReactionOptions
  | {
      quick: {
        [key: string]: ReactionOptionData;
      };
      extended?: {
        [key: string]: ReactionOptionData;
      };
    };

export const mapEmojiMartData = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emojiMartData: any,
): NonNullable<Exclude<ReactionOptions, LegacyReactionOptions>['extended']> => {
  if (!emojiMartData || !emojiMartData.emojis) {
    return {};
  }

  const newMap: ReturnType<typeof mapEmojiMartData> = {};

  for (const emojiId in emojiMartData.emojis) {
    const emojiData = emojiMartData.emojis[emojiId];
    const [firstEmoji] = emojiData.skins;

    if (!firstEmoji || !firstEmoji.native) continue;

    const nativeEmoji = firstEmoji.native as string;

    const unicode = emojiToUnicode(nativeEmoji);

    newMap[unicode] = {
      Component: () => <>{nativeEmoji}</>,
      name: emojiData.name,
      unicode,
    };
  }

  return newMap;
};

export type AdvancedReactionOptions = {
  quick: ReactionOptions;
  extended: ReactionOptions;
};

export const emojiToUnicode = (emoji: string) => {
  const unicodeStrings = [];
  for (const c of emoji) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const codePoint = c.codePointAt(0)!;
    unicodeStrings.push(`U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`);
  }

  return unicodeStrings.join('-');
};

export const unicodeToEmoji = (unicode: string) =>
  unicode
    .split('-')
    .map((code) => String.fromCodePoint(parseInt(code.replace('U+', ''), 16)))
    .join('');

export const defaultReactionOptions: ReactionOptions = {
  quick: {
    haha: {
      Component: () => <>😂</>,
      name: 'Joy',
      unicode: emojiToUnicode('😂'),
    },
    like: {
      Component: () => <>👍</>,
      name: 'Thumbs up',
      unicode: emojiToUnicode('👍'),
    },
    love: {
      Component: () => <>❤️</>,
      name: 'Heart',
      unicode: emojiToUnicode('❤️'),
    },
    sad: { Component: () => <>😔</>, name: 'Sad', unicode: emojiToUnicode('😔') },
    wow: {
      Component: () => <>😮</>,
      name: 'Astonished',
      unicode: emojiToUnicode('😮'),
    },
    fire: {
      Component: () => <>🔥</>,
      name: 'Fire',
      unicode: emojiToUnicode('🔥'),
    },
  },
};

export const getHasExtendedReactions = (reactionOptions: ReactionOptions) =>
  !Array.isArray(reactionOptions) &&
  typeof reactionOptions.extended !== 'undefined' &&
  Object.keys(reactionOptions.extended).length > 0;

/**
 * Resolves the native emoji character (e.g. "👍") for a given reaction type from
 * the configured reaction options. The value is used as the `emoji_code` sent
 * with a reaction so that push notifications can render the emoji.
 *
 * Returns `undefined` when no `unicode` is available for the type (e.g. legacy
 * array reaction options or custom options that omit `unicode`).
 */
export const getEmojiCodeByReactionType = (
  reactionOptions: ReactionOptions,
  reactionType: string,
): string | undefined => {
  // Legacy array reaction options carry no unicode data.
  if (Array.isArray(reactionOptions)) return undefined;

  const unicode =
    reactionOptions.quick[reactionType]?.unicode ??
    reactionOptions.extended?.[reactionType]?.unicode;

  return unicode ? unicodeToEmoji(unicode) : undefined;
};
