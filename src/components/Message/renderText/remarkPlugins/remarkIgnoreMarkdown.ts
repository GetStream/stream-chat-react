import type { Plugin } from 'unified';
import type { Paragraph, Root, Text } from 'mdast';

/**
 * Replace the parsed Markdown tree with a single paragraph containing the
 * original source as a plain text node. No Markdown formatting is interpreted.
 * React will escape it.
 */
export const remarkIgnoreMarkdown: Plugin<[], Root> = () => (tree, file) => {
  const source = String(file.value ?? '');

  const text: Text = { type: 'text', value: source };
  const paragraph: Paragraph = { children: [text], type: 'paragraph' };

  tree.children = [paragraph];
};
