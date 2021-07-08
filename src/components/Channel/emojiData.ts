import type { BaseEmoji, Data as EmojiData } from 'emoji-mart';

import type { CommonEmoji, EmojiSetDef, MinimalEmoji } from '../../context/EmojiContext';

export type ReactionEmoji = BaseEmoji | MinimalEmoji;

export const commonEmoji: CommonEmoji = {
  custom: true,
  emoticons: [],
  short_names: [],
};

export const emojiSetDef: EmojiSetDef = {
  imageUrl: '',
  sheetColumns: 2,
  sheetRows: 3,
  sheetSize: 64,
  spriteUrl: 'https://getstream.imgix.net/images/emoji-sprite.png',
};

export const defaultMinimalEmojis: MinimalEmoji[] = [
  {
    colons: ':+1:',
    id: 'like',
    name: 'like',
    sheet_x: 0,
    sheet_y: 0,
    ...commonEmoji,
    ...emojiSetDef,
  },
  {
    colons: ':heart:',
    id: 'love',
    name: 'love',
    sheet_x: 1,
    sheet_y: 2,
    ...commonEmoji,
    ...emojiSetDef,
  },
  {
    colons: ':joy:',
    id: 'haha',
    name: 'haha',
    sheet_x: 1,
    sheet_y: 0,
    ...commonEmoji,
    ...emojiSetDef,
  },
  {
    colons: ':astonished:',
    id: 'wow',
    name: 'wow',
    sheet_x: 0,
    sheet_y: 2,
    ...commonEmoji,
    ...emojiSetDef,
  },
  {
    colons: ':pensive:',
    id: 'sad',
    name: 'sad',
    sheet_x: 0,
    sheet_y: 1,
    ...commonEmoji,
    ...emojiSetDef,
  },
  {
    colons: ':angry:',
    id: 'angry',
    name: 'angry',
    sheet_x: 1,
    sheet_y: 1,
    ...commonEmoji,
    ...emojiSetDef,
  },
];

// use this only for small lists like in ReactionSelector
export const getStrippedEmojiData = (data: EmojiData) => ({
  ...data,
  emojis: {},
});
