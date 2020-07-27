/* eslint-disable */
import emojiRegex from 'emoji-regex';
import ReactMarkdown from 'react-markdown/with-html';
import data from 'emoji-mart/data/all.json';
import React from 'react';
import { find as linkifyFind } from 'linkifyjs/lib/linkify';

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

export const isPromise = (thing) => thing && typeof thing.then === 'function';

export const byDate = (a, b) => a.created_at - b.created_at;

// https://stackoverflow.com/a/29234240/7625485
/**
 * @deprecated This function is deprecated and will be removed in future major release.
 * @param {*} dict
 * @param {*} currentUserId
 */
export const formatArray = (dict, currentUserId) => {
  const arr2 = Object.keys(dict);
  const arr3 = [];
  arr2.forEach((item, i) => {
    if (currentUserId === dict[arr2[i]].user.id) {
      return;
    }

    arr3.push(dict[arr2[i]].user.name || dict[arr2[i]].user.id);
  });
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

const allowedMarkups = [
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
  'delete',
];

const matchMarkdownLinks = (message) => {
  const regexMdLinks = /\[([^\[]+)\](\(.*\))/gm;
  const matches = message.match(regexMdLinks);
  const singleMatch = /\[([^\[]+)\]\((.*)\)/;

  const links = matches
    ? matches.map((match) => singleMatch.exec(match)[2])
    : [];
  return links;
};

export const truncate = (input, length, end = '...') => {
  if (input.length > length) {
    return `${input.substring(0, length - end.length)}${end}`;
  }
  return input;
};

export const renderText = (text, mentioned_users) => {
  // take the @ mentions and turn them into markdown?
  // translate links
  if (!text) return null;

  let newText = text;
  let markdownLinks = matchMarkdownLinks(newText);
  // extract all valid links/emails within text and replace it with proper markup
  linkifyFind(newText).forEach(({ type, href, value }) => {
    // check if message is already  markdown
    const noParsingNeeded =
      markdownLinks &&
      markdownLinks.filter((text) => text.indexOf(href) !== -1);
    if (noParsingNeeded.length > 0) return;

    const displayLink =
      type === 'email'
        ? value
        : truncate(value.replace(/(http(s?):\/\/)?(www\.)?/, ''), 20);
    newText = newText.replace(value, `[${displayLink}](${encodeURI(href)})`);
  });

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
      allowedTypes={allowedMarkups}
      source={newText}
      linkTarget="_blank"
      plugins={[]}
      escapeHtml={true}
      skipHtml={false}
      unwrapDisallowed={true}
      transformLinkUri={(uri) => {
        if (uri.startsWith('app://')) {
          return uri;
        } else {
          return ReactMarkdown.uriTransformer(uri);
        }
      }}
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
    const element = ElementOrComponentOrLiteral; // eslint-disable-line
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

export const filterEmoji = (emoji) => {
  if (
    emoji.name === 'White Smiling Face' ||
    emoji.name === 'White Frowning Face'
  ) {
    return false;
  }
  return true;
};

export const getReadByTooltipText = (users, t, client) => {
  let outStr = '';
  // first filter out client user, so restLength won't count it
  const otherUsers = users
    .filter((item) => item && item.id !== client.user.id)
    .map((item) => item.name || item.id);

  const slicedArr = otherUsers.slice(0, 5);
  const restLength = otherUsers.length - slicedArr.length;

  if (slicedArr.length === 1) {
    outStr = slicedArr[0] + ' ';
  } else if (slicedArr.length === 2) {
    //joins all with "and" but =no commas
    //example: "bob and sam"
    outStr = t('{{ firstUser }} and {{ secondUser }}', {
      firstUser: slicedArr[0],
      secondUser: slicedArr[1],
    });
  } else if (slicedArr.length > 2) {
    //joins all with commas, but last one gets ", and" (oxford comma!)
    //example: "bob, joe, sam and 4 more"
    if (restLength === 0) {
      // mutate slicedArr to remove last user to display it separately
      const lastUser = slicedArr.splice(slicedArr.length - 2, 1);
      outStr = t('{{ commaSeparatedUsers }}, and {{ lastUser }}', {
        commaSeparatedUsers: slicedArr.join(', '),
        lastUser,
      });
    } else {
      outStr = t('{{ commaSeparatedUsers }} and {{ moreCount }} more', {
        commaSeparatedUsers: slicedArr.join(', '),
        moreCount: restLength,
      });
    }
  }

  return outStr;
};
