import anchorme from 'anchorme';
import emojiRegex from 'emoji-regex';
import ReactMarkdown from 'react-markdown/with-html';
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
export const formatTypingArray = (intl, dict) => {
  const arr2 = Object.keys(dict);
  const arr3 = [];
  arr2.forEach((item, i) =>
    arr3.push(dict[arr2[i]].user.name || dict[arr2[i]].user.id),
  );

  const and = intl.formatMessage({
    id: 'message_input.and',
    defaultMessage: 'and',
  });
  const typing = intl.formatMessage(
    {
      id: 'message_input.typing',
      defaultMessage:
        '{count, plural, one {is typing...} other {are typing...}}',
    },
    { count: arr3.length },
  );

  let outStr = '';
  if (arr3.length === 1) {
    outStr = arr3[0] + ' ' + typing;
  } else if (arr3.length === 2) {
    //joins all with "and" but =no commas
    //example: "bob and sam"
    outStr = arr3.join(' ' + and + ' ') + ' ' + typing;
  } else if (arr3.length > 2) {
    //joins all with commas, but last one gets ", and" (oxford comma!)
    //example: "bob, joe, and sam"
    outStr =
      arr3.slice(0, -1).join(', ') +
      ', ' +
      and +
      ' ' +
      arr3.slice(-1) +
      ' ' +
      typing;
  }

  return outStr;
};

// https://stackoverflow.com/a/29234240/7625485
export const formatStatusArray = (intl, arr) => {
  let outStr = '';
  const slicedArr = arr.map((item) => item.name || item.id).slice(0, 5);
  const restLength = arr.length - slicedArr.length;

  const and = intl.formatMessage({
    id: 'message_status.and',
    defaultMessage: 'and',
  });
  const more = intl.formatMessage(
    {
      id: 'message_status.more',
      defaultMessage: 'and {count} more',
    },
    { count: restLength },
  );

  const lastStr = restLength > 0 ? ' ' + more : '';

  if (slicedArr.length === 1) {
    outStr = slicedArr[0] + ' ';
  } else if (slicedArr.length === 2) {
    //joins all with "and" but =no commas
    //example: "bob and sam"
    outStr = slicedArr.join(' ' + and + ' ') + ' ';
  } else if (slicedArr.length > 2) {
    //joins all with commas, but last one gets ", and" (oxford comma!)
    //example: "bob, joe, and sam"
    outStr = slicedArr.join(', ') + lastStr;
  }

  return outStr;
};

export const renderText = (message) => {
  // take the @ mentions and turn them into markdown?
  // translate links
  let { text } = message;
  const { mentioned_users } = message;

  if (!text) {
    return;
  }

  const allowed = [
    'html',
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

  const urls = anchorme(text, {
    list: true,
  });
  for (const urlInfo of urls) {
    const displayLink = truncate(urlInfo.encoded.replace(/^(www\.)/, ''), {
      length: 20,
      omission: '...',
    });
    const mkdown = `[${displayLink}](${urlInfo.protocol}${urlInfo.encoded})`;
    text = text.replace(urlInfo.raw, mkdown);
  }
  let newText = text;
  if (mentioned_users && mentioned_users.length) {
    for (let i = 0; i < mentioned_users.length; i++) {
      const username = mentioned_users[i].name || mentioned_users[i].id;
      const mkdown = `**@${username}**`;
      const re = new RegExp(`@${username}`, 'g');
      newText = newText.replace(re, mkdown);
    }
  }

  return (
    <ReactMarkdown
      allowedTypes={allowed}
      source={newText}
      linkTarget="_blank"
      plugins={[]}
      escapeHtml={true}
      skipHtml={false}
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

export const smartRender = (ElementOrComponentOrLiteral, props, fallback) => {
  if (ElementOrComponentOrLiteral === undefined) {
    ElementOrComponentOrLiteral = fallback;
  }
  if (React.isValidElement(ElementOrComponentOrLiteral)) {
    // Flow cast through any, to make flow believe it's a React.Element
    const element = ElementOrComponentOrLiteral;
    return element;
  }

  // Flow cast through any to remove React.Element after previous check
  const ComponentOrLiteral = ElementOrComponentOrLiteral;

  if (
    typeof ComponentOrLiteral === 'string' ||
    typeof ComponentOrLiteral === 'number' ||
    typeof ComponentOrLiteral === 'boolean' ||
    ComponentOrLiteral == null
  ) {
    return ComponentOrLiteral;
  }
  return <ComponentOrLiteral {...props} />;
};

export const MESSAGE_ACTIONS = {
  edit: 'edit',
  delete: 'delete',
  flag: 'flag',
  mute: 'mute',
};
