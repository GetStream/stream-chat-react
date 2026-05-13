import type { ReplaceFunction } from 'hast-util-find-and-replace';
import { findAndReplace } from 'hast-util-find-and-replace';
import { u } from 'unist-builder';
import emojiRegex from 'emoji-regex';

// `Nodes` is not part of hast-util-find-and-replace's public surface; derive
// it from findAndReplace's first parameter so we don't deep-import its lib/.
type Nodes = Parameters<typeof findAndReplace>[0];

export const emojiMarkdownPlugin = () => {
  const replace: ReplaceFunction = (match) =>
    u('element', { properties: {}, tagName: 'emoji' }, [u('text', match)]);

  const transform = (node: Nodes) => findAndReplace(node, [emojiRegex(), replace]);

  return transform;
};
