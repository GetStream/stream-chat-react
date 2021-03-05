import React from 'react';
import emojiRegex from 'emoji-regex';
import * as linkify from 'linkifyjs';
import RootReactMarkdown, { NodeType } from 'react-markdown';
import ReactMarkdown from 'react-markdown/with-html';

import type { UserResponse } from 'stream-chat';

import type { DefaultUserType, UnknownType } from '../types/types';

export const isOnlyEmojis = (text?: string) => {
  if (!text) return false;

  const noEmojis = text.replace(emojiRegex(), '');
  const noSpace = noEmojis.replace(/[\s\n]/gm, '');

  return !noSpace;
};

const allowedMarkups: NodeType[] = [
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

const matchMarkdownLinks = (message: string) => {
  const regexMdLinks = /\[([^[]+)\](\(.*\))/gm;
  const matches = message.match(regexMdLinks);
  const singleMatch = /\[([^[]+)\]\((.*)\)/;

  const links = matches
    ? matches.map((match) => {
        const i = singleMatch.exec(match);
        return i && i[2];
      })
    : [];

  return links;
};

const messageCodeBlocks = (message: string) => {
  const codeRegex = /```[a-z]*\n[\s\S]*?\n```|`[a-z]*[\s\S]*?`/gm;
  const matches = message.match(codeRegex);
  return matches || [];
};

export const truncate = (input?: string, length?: number, end = '...') => {
  if (!input || !length) return '';
  if (input.length > length) {
    return `${input.substring(0, length - end.length)}${end}`;
  }
  return input;
};

type MarkDownRenderers = {
  children: React.ReactElement;
  href?: string;
};

const markDownRenderers = {
  // eslint-disable-next-line react/display-name
  link: (props: MarkDownRenderers) => {
    if (
      !props.href ||
      (!props.href.startsWith('http') && !props.href.startsWith('mailto:'))
    ) {
      return props.children;
    }

    return (
      <a href={props.href} rel='nofollow noreferrer noopener' target='_blank'>
        {props.children}
      </a>
    );
  },
};

export const renderText = <Us extends DefaultUserType<Us> = DefaultUserType>(
  text?: string,
  mentioned_users?: UserResponse<Us>[],
) => {
  // take the @ mentions and turn them into markdown?
  // translate links
  if (!text) return null;

  let newText = text;
  const markdownLinks = matchMarkdownLinks(newText);
  const codeBlocks = messageCodeBlocks(newText);
  const detectHttp = /(http(s?):\/\/)?(www\.)?/;

  // extract all valid links/emails within text and replace it with proper markup
  linkify.find(newText).forEach(({ href, type, value }) => {
    const linkIsInBlock = codeBlocks.some((block) => block?.includes(value));

    // check if message is already  markdown
    const noParsingNeeded =
      markdownLinks &&
      markdownLinks.filter((text) => {
        const strippedHref = href?.replace(detectHttp, '');
        const strippedText = text?.replace(detectHttp, '');

        if (!strippedHref || !strippedText) return false;

        return (
          strippedHref.includes(strippedText) ||
          strippedText.includes(strippedHref)
        );
      });

    if (noParsingNeeded.length > 0 || linkIsInBlock) return;

    const displayLink =
      type === 'email' ? value : truncate(value.replace(detectHttp, ''), 20);
    newText = newText.replace(value, `[${displayLink}](${encodeURI(href)})`);
  });

  if (mentioned_users && mentioned_users.length) {
    for (let i = 0; i < mentioned_users.length; i++) {
      let username = mentioned_users[i].name || mentioned_users[i].id;

      if (username) {
        username = escapeRegExp(username);
      }

      const nameMarkdown = `**@${username}**`;
      const nameRegex = new RegExp(`@${username}`, 'g');

      newText = newText.replace(nameRegex, nameMarkdown);
    }
  }

  return (
    <ReactMarkdown
      allowedTypes={allowedMarkups}
      escapeHtml={true}
      renderers={markDownRenderers}
      source={newText}
      transformLinkUri={(uri) =>
        uri.startsWith('app://') ? uri : RootReactMarkdown.uriTransformer(uri)
      }
      unwrapDisallowed={true}
    />
  );
};

function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
}

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// https://stackoverflow.com/a/6860916/2570866
export function generateRandomId() {
  // prettier-ignore
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

export const smartRender = (
  ElementOrComponentOrLiteral: React.ComponentType,
  props?: UnknownType,
  fallback?: React.ComponentType | null,
) => {
  if (ElementOrComponentOrLiteral === undefined && fallback) {
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
