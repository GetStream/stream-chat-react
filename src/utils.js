import anchorme from 'anchorme';
import emojiRegex from 'emoji-regex';
import ReactMarkdown from 'react-markdown';
import truncate from 'lodash/truncate';
import data from 'emoji-mart/data/all.json';
import React from 'react';

export const emojiSetDef = {
  spriteUrl: 'https://getstream.imgix.net/images/emoji-sprite.png',
  size: 20,
  sheetColumns: 2,
  sheetRows: 3,
  sheetSize: 64,
};

export const commonEmoji = {
  emoticons: [],
  short_names: [],
  custom: true,
};

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

const d = Object.assign({}, data);
d.emojis = {};

// use this only for small lists like in ReactionSelector
export const emojiData = d;

export const isOnlyEmojis = (text) => {
  if (!text) return false;

  const noEmojis = text.replace(emojiRegex(), '');
  const noSpace = noEmojis.replace(/[\s\n]/gm, '');
  return !noSpace;
};

export const isPromise = (thing) => {
  const promise = thing && typeof thing.then === 'function';
  return promise;
};

export const byDate = (a, b) => a.created_at - b.created_at;

// https://stackoverflow.com/a/29234240/7625485
export const formatArray = (dict) => {
  const arr2 = Object.keys(dict);
  const arr3 = [];
  arr2.forEach((item, i) => arr3.push(dict[arr2[i]].name || dict[arr2[i]].id));

  let outStr = '';
  if (arr3.length === 1) {
    outStr = arr3[0] + ' is typing...';
    dict;
  } else if (arr3.length === 2) {
    //joins all with "and" but =no commas
    //example: "bob and sam"
    outStr = arr3.join(' and ') + ' are typing...';
  } else if (arr3.length > 2) {
    //joins all with commas, but last one gets ", and" (oxford comma!)
    //example: "bob, joe, and sam"
    outStr =
      arr3.slice(0, -1).join(', ') +
      ', and ' +
      arr3.slice(-1) +
      ' are typing...';
  }

  return outStr;
};

export const renderText = (message) => {
  // take the @ mentions and turn them into markdown?
  // translate links
  if (!message) {
    return;
  }
  const allowed = [
    'root',
    'text',
    'break',
    'paragraph',
    'emphasis',
    'strong',
    'link',
    'list',
    'listItem',
    'code',
    'inlineCode',
    'blockquote',
  ];
  const regex = /\B@[a-z0-9_-]+/gim;
  message = message.replace(regex, (x) => `**${x}**`);

  const urls = anchorme(message, {
    list: true,
  });
  for (const urlInfo of urls) {
    const displayLink = truncate(urlInfo.encoded.replace(/^(www\.)/, ''), {
      length: 30,
      omission: '...',
    });
    const mkdown = `[${displayLink}](${urlInfo.raw})`;
    message = message.replace(urlInfo.raw, mkdown);
  }

  return (
    <ReactMarkdown
      allowedTypes={allowed}
      source={message}
      linkTarget="_blank"
      plugins={[]}
      skipHtml={true}
    />
  );
};

// https://stackoverflow.com/a/6860916/2570866
export function generateRandomId() {
  // prettier-ignore
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
