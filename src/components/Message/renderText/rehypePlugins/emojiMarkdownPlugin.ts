import type { ReplaceFunction } from 'hast-util-find-and-replace';
import { findAndReplace } from 'hast-util-find-and-replace';
import { u } from 'unist-builder';
import emojiRegex from 'emoji-regex';

import type { Nodes } from 'hast-util-find-and-replace/lib';

export const emojiMarkdownPlugin = () => {
  const replace: ReplaceFunction = (match) =>
    u('element', { properties: {}, tagName: 'emoji' }, [u('text', match)]);

  const transform = (node: Nodes) => findAndReplace(node, [emojiRegex(), replace]);

  return transform;
};
