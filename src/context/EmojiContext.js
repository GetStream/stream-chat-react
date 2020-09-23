// @ts-check
import React from 'react';

export const emojiSetDef = {
  spriteUrl: 'https://getstream.imgix.net/images/emoji-sprite.png',
  size: 20,
  sheetColumns: 2,
  sheetRows: 3,
  sheetSize: 64,
};

/** @type {import("types").commonEmojiInterface} */
export const commonEmoji = {
  emoticons: [],
  short_names: [],
  custom: true,
};

/** @type {import("types").MinimalEmojiInterface[]} */
export const defaultMinimalEmojis = [
  {
    id: 'like',
    name: 'like',
    colons: ':+1:',
    sheet_x: 0,
    sheet_y: 0,
    ...commonEmoji,
    ...emojiSetDef,
  },
  {
    id: 'love',
    name: 'love',
    colons: ':heart:',
    sheet_x: 1,
    sheet_y: 2,
    ...commonEmoji,
    ...emojiSetDef,
  },
  {
    id: 'haha',
    name: 'haha',
    colons: ':joy:',
    sheet_x: 1,
    sheet_y: 0,
    ...commonEmoji,
    ...emojiSetDef,
  },
  {
    id: 'wow',
    name: 'wow',
    colons: ':astonished:',
    sheet_x: 0,
    sheet_y: 2,
    ...commonEmoji,
    ...emojiSetDef,
  },
  {
    id: 'sad',
    name: 'sad',
    colons: ':pensive:',
    sheet_x: 0,
    sheet_y: 1,
    ...commonEmoji,
    ...emojiSetDef,
  },
  {
    id: 'angry',
    name: 'angry',
    colons: ':angry:',
    sheet_x: 1,
    sheet_y: 1,
    ...commonEmoji,
    ...emojiSetDef,
  },
];

// use this only for small lists like in ReactionSelector
/** @typedef {import('emoji-mart').Data} EmojiData
 * @type {(data: EmojiData) => EmojiData}
 */
export const getStrippedEmojiData = (data) => ({
  ...data,
  emojis: {},
});

/**
 * @typedef {import('types').EmojiContextValue} EmojiContextProps
 */
export const EmojiContext = React.createContext(
  /** @type {EmojiContextProps} */ ({
    emojiData: {},
    EmojiPicker: null,
    Emoji: null,
    defaultMinimalEmojis,
    commonEmoji,
  }),
);

/**
 * @function
 * @template P
 * @param {React.ComponentType<P>} OriginalComponent
 * @returns {React.ComponentType<Exclude<P, EmojiContextProps>>}
 */
export function withEmojiContext(OriginalComponent) {
  /** @param {Exclude<P, EmojiContextProps>} props */
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <EmojiContext.Consumer>
        {(context) => <OriginalComponent {...context} {...props} />}
      </EmojiContext.Consumer>
    );
  };

  ContextAwareComponent.displayName = (
    OriginalComponent.displayName ||
    OriginalComponent.name ||
    'Component'
  ).replace('Base', '');

  return ContextAwareComponent;
}
