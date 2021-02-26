// @ts-check
/* eslint-disable */
import emojiRegex from 'emoji-regex';
import RootReactMarkdown from 'react-markdown';
import ReactMarkdown from 'react-markdown/with-html';
import React from 'react';
import * as linkify from 'linkifyjs';
import { Channel, StreamChat } from 'stream-chat';

/** @type {(text: string | undefined) => boolean} */
export const isOnlyEmojis = (text) => {
  if (!text) return false;

  const noEmojis = text.replace(emojiRegex(), '');
  const noSpace = noEmojis.replace(/[\s\n]/gm, '');
  return !noSpace;
};

/** @type {(thing: any) => boolean} */
export const isPromise = (thing) => typeof thing?.then === 'function';

/**
 * @typedef {{created_at: number}} Datelike
 * @type {(a: Datelike, b: Datelike) => number}
 **/
export const byDate = (a, b) => a.created_at - b.created_at;

/** @type {import('react-markdown').NodeType[]} */
const allowedMarkups = [
  'html',
  // @ts-expect-error
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

/** @type {(message: string) => (string|null)[]} */
const matchMarkdownLinks = (message) => {
  const regexMdLinks = /\[([^\[]+)\](\(.*\))/gm;
  const matches = message.match(regexMdLinks);
  const singleMatch = /\[([^\[]+)\]\((.*)\)/;

  const links = matches
    ? matches.map((match) => {
        const i = singleMatch.exec(match);
        return i && i[2];
      })
    : [];
  return links;
};

/** @type {(message: string) => (string|null)[]} */
const messageCodeBlocks = (message) => {
  const codeRegex = /```[a-z]*\n[\s\S]*?\n```|`[a-z]*[\s\S]*?`/gm;
  const matches = message.match(codeRegex);
  return matches || [];
};

/** @type {(input: string, length: number) => string} */
export const truncate = (input, length, end = '...') => {
  if (input.length > length) {
    return `${input.substring(0, length - end.length)}${end}`;
  }
  return input;
};

const markDownRenderers = {
  /** @param {{ href: string | undefined; children: React.ReactElement; }} props   */
  link: (props) => {
    if (
      !props.href ||
      (!props.href.startsWith('http') && !props.href.startsWith('mailto:'))
    ) {
      return props.children;
    }

    return (
      <a href={props.href} target="_blank" rel="nofollow noreferrer noopener">
        {props.children}
      </a>
    );
  },
};

/** @type {(input: string | undefined, mentioned_users: import('stream-chat').UserResponse[] | undefined) => React.ReactNode} */
export const renderText = (text, mentioned_users) => {
  // take the @ mentions and turn them into markdown?
  // translate links
  if (!text) return null;

  let newText = text;
  let markdownLinks = matchMarkdownLinks(newText);
  let codeBlocks = messageCodeBlocks(newText);
  // extract all valid links/emails within text and replace it with proper markup
  linkify.find(newText).forEach(({ type, href, value }) => {
    const linkIsInBlock = codeBlocks.some((block) => block?.includes(value));

    //check if link is in markdown or a code block
    if (markdownLinks || linkIsInBlock) return;

    const displayLink =
      type === 'email'
        ? value
        : truncate(value.replace(/(http(s?):\/\/)?(www\.)?/, ''), 20);
    newText = newText.replace(value, `[${displayLink}](${encodeURI(href)})`);
  });

  if (mentioned_users && mentioned_users.length) {
    for (let i = 0; i < mentioned_users.length; i++) {
      let username = mentioned_users[i].name || mentioned_users[i].id;
      if (username) {
        username = escapeRegExp(username);
      }
      const mkdown = `**@${username}**`;
      const re = new RegExp(`@${username}`, 'g');
      newText = newText.replace(re, mkdown);
    }
  }

  return (
    <ReactMarkdown
      allowedTypes={allowedMarkups}
      source={newText}
      renderers={markDownRenderers}
      escapeHtml={true}
      unwrapDisallowed={true}
      transformLinkUri={(uri) =>
        uri.startsWith('app://') ? uri : RootReactMarkdown.uriTransformer(uri)
      }
    />
  );
};

/** @param { string } text */
function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
}

// https://stackoverflow.com/a/6860916/2570866
export function generateRandomId() {
  // prettier-ignore
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// @ts-expect-error
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
  /** @type {React.Component} */
  const ComponentOrLiteral = ElementOrComponentOrLiteral;

  if (
    typeof ComponentOrLiteral === 'string' ||
    typeof ComponentOrLiteral === 'number' ||
    typeof ComponentOrLiteral === 'boolean' ||
    ComponentOrLiteral == null
  ) {
    return ComponentOrLiteral;
  }
  // @ts-expect-error
  return <ComponentOrLiteral {...props} />;
};

/**
 * @type { import('prop-types').Validator<any> }
 **/
export const checkChannelPropType = (propValue, _, componentName) => {
  if (propValue?.constructor?.name !== Channel.name) {
    return Error(
      `Failed prop type: Invalid prop \`channel\` of type \`${propValue.constructor.name}\` supplied to \`${componentName}\`, expected instance of \`${Channel.name}\`.`,
    );
  }
  return null;
};

/**
 * @type { import('prop-types').Validator<any> }
 **/
export const checkClientPropType = (propValue, _, componentName) => {
  if (propValue?.constructor?.name !== StreamChat.name) {
    return Error(
      `Failed prop type: Invalid prop \`client\` of type \`${propValue.constructor.name}\` supplied to \`${componentName}\`, expected instance of \`${StreamChat.name}\`.`,
    );
  }
  return null;
};
