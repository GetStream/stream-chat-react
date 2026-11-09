import type { Plugin } from 'unified';
import type { Paragraph, Root, Text } from 'mdast';

/**
 * Replaces the parsed Markdown tree with a single paragraph holding the raw source as plain text,
 * so no Markdown formatting is interpreted.
 */
export const remarkIgnoreMarkdown: Plugin<[], Root> = () => (tree, file) => {
  const source = String(file.value ?? '');

  const text: Text = { type: 'text', value: source };
  const paragraph: Paragraph = { children: [text], type: 'paragraph' };

  tree.children = [paragraph];
};
