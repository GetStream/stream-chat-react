import type { Plugin } from 'unified';
import { SKIP, visit } from 'unist-util-visit';
import type { Visitor } from 'unist-util-visit';
import type { Parent, PhrasingContent, Text } from 'mdast';

/**
 * Matches `++text++` where the text starts and ends with a non-whitespace character and may span
 * lines, so `++a++` matches but `++++` and `++ ++` do not.
 */
const INS_REGEX = /\+\+(\S(?:[\s\S]*?\S)?)\+\+/g;
const IGNORE_NODE_TYPES = new Set([
  'code',
  'inlineCode',
  'link',
  'linkReference',
  'definition',
  'math',
  'inlineMath',
]);

/**
 * Converts `++text++` to an `<ins>` element. Code, link, definition and math nodes are skipped.
 */
export const plusPlusToEmphasis: Plugin<[]> = () => {
  const visitor: Visitor = (node, index, parent) => {
    // Do not descend into ignored nodes.
    if (IGNORE_NODE_TYPES.has(node.type)) return SKIP;

    // Only text nodes with a parent and an index are transformed.
    if (node.type !== 'text' || parent == null || typeof index !== 'number') return;

    const value = (node as Text).value;

    // The regex is global and shared, so each node must start scanning from index 0.
    INS_REGEX.lastIndex = 0;

    let match: RegExpExecArray | null;
    let last = 0;
    const out: PhrasingContent[] = [];

    while ((match = INS_REGEX.exec(value))) {
      const [full, inner] = match;
      const start = match.index;

      if (start > last) out.push({ type: 'text', value: value.slice(last, start) });

      // `data.hName` makes remark-rehype render this node as `<ins>`.
      out.push({
        children: [{ type: 'text', value: inner }],
        data: { hName: 'ins' },
        type: 'emphasis',
      });

      last = start + full.length;
    }

    if (out.length === 0) return;
    if (last < value.length) out.push({ type: 'text', value: value.slice(last) });

    (parent as Parent).children.splice(index, 1, ...out);

    // Skip re-visiting the replaced range; continue after inserted nodes
    return [SKIP, index + out.length];
  };

  return (tree) => visit(tree, visitor);
};
