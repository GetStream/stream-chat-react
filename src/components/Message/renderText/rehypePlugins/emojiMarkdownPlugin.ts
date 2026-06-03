import type { ReplaceFunction } from 'hast-util-find-and-replace';
import { findAndReplace } from 'hast-util-find-and-replace';
import { u } from 'unist-builder';
import type { Nodes } from 'hast';

import { EMOJI_REGEX } from '../../emojiRegex';

export const emojiMarkdownPlugin = () => {
  const replace: ReplaceFunction = (match) =>
    u('element', { properties: {}, tagName: 'emoji' }, [u('text', match)]);

  const transform = (node: Nodes) => findAndReplace(node, [EMOJI_REGEX, replace]);

  return transform;
};
