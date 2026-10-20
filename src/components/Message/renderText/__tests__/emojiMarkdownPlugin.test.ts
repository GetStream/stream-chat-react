import type { Element, Nodes, Root } from 'hast';
import { findAndReplace, type ReplaceFunction } from 'hast-util-find-and-replace';
import emojiRegex from 'emoji-regex';

import { emojiMarkdownPlugin } from '../rehypePlugins/emojiMarkdownPlugin';

// `findAndReplace` only visits text nodes inside an element, hence the <p>. The plugin mutates
// the tree in place, replacing each emoji with an `<emoji>` element wrapping it.
const buildTree = (text: string): Root => ({
  children: [
    {
      children: [{ type: 'text', value: text }],
      properties: {},
      tagName: 'p',
      type: 'element',
    },
  ],
  type: 'root',
});

const collectEmojiNodes = (node: Nodes): Element[] => {
  const found: Element[] = [];
  const visit = (current: Nodes) => {
    if (current.type === 'element' && current.tagName === 'emoji') {
      found.push(current);
    }
    if ('children' in current) {
      current.children.forEach(visit);
    }
  };
  visit(node);
  return found;
};

describe('emojiMarkdownPlugin', () => {
  it('wraps an emoji in an <emoji> element node', () => {
    const transform = emojiMarkdownPlugin();
    const tree = buildTree('hello 😀');

    transform(tree);

    const emojiNodes = collectEmojiNodes(tree);
    expect(emojiNodes).toHaveLength(1);
    expect(emojiNodes[0].children[0]).toMatchObject({ type: 'text', value: '😀' });
  });

  it('wraps every emoji in a string', () => {
    const transform = emojiMarkdownPlugin();
    const tree = buildTree('😀 a 🎉 b 🚀');

    transform(tree);

    expect(collectEmojiNodes(tree)).toHaveLength(3);
  });

  // Guards the shared global `EMOJI_REGEX` (emojiRegex.ts): a `lastIndex` leaked between
  // transform() calls would make later calls miss matches.
  it('keeps matching across repeated calls regardless of emoji position', () => {
    const transform = emojiMarkdownPlugin();

    // The emoji sits at a different position each call: a leaked `lastIndex` that began the
    // search mid-string would skip an earlier emoji.
    const inputs = ['😀 leading', 'trailing 😀', 'mid 😀 dle', '😀', 'tail end 😀'];

    for (const input of inputs) {
      const tree = buildTree(input);
      transform(tree);
      expect(collectEmojiNodes(tree)).toHaveLength(1);
    }
  });

  // Reusing one global regexp is safe only because `findAndReplace` resets its `lastIndex`
  // before scanning. This asserts that directly by poisoning `lastIndex` first.
  it('findAndReplace resets a global regexp lastIndex before scanning', () => {
    const regex = emojiRegex();
    // Simulate stale state leaked from a previous use: point lastIndex past the input.
    regex.lastIndex = 999;

    let matched = false;
    const replace: ReplaceFunction = (match) => {
      if (match === '😀') matched = true;
      return { type: 'text', value: typeof match === 'string' ? match : '' };
    };

    findAndReplace(buildTree('😀'), [regex, replace]);

    expect(matched).toBe(true);
  });
});
