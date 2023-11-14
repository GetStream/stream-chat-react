import { findAndReplace, ReplaceFunction } from 'hast-util-find-and-replace';
import { u } from 'unist-builder';
import emojiRegex from 'emoji-regex';

import type { HNode } from '../types';

export const emojiMarkdownPlugin = () => {
  const replace: ReplaceFunction = (match) =>
    u('element', { tagName: 'emoji' }, [u('text', match)]);

  const transform = (node: HNode) => findAndReplace(node, emojiRegex(), replace);

  return transform;
};
