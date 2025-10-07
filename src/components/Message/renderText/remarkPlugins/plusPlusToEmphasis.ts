// remark-plusplus-ins.ts
import type { Plugin } from 'unified';
import { SKIP, visit } from 'unist-util-visit';
import type { Visitor } from 'unist-util-visit';
import type { Parent, PhrasingContent, Text } from 'mdast';

/**
 * \S → first char must be non-whitespace
 * (?:...)?→ optional middle+closing when length > 1
 * [\s\S]*?→ anything (including newlines), lazy
 * final \S→ last char non-whitespace (only required when there’s more than 1)
 *
 * Matches:
 * ++a++
 * Does not match:
 * ++++
 * ++ ++
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
 * Converts MD "++Some text++" to inserted text element rendered in HTML as <ins>Some text</ins>
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ins
 */
export const plusPlusToEmphasis: Plugin<[]> = () => {
  const visitor: Visitor = (node, index, parent) => {
    // 1) Don’t traverse inside ignored nodes
    if (IGNORE_NODE_TYPES.has(node.type)) return SKIP;

    // 2) Only transform text nodes with a valid parent + index
    if (node.type !== 'text' || parent == null || typeof index !== 'number') return;

    const value = (node as Text).value;

    // Reset lastIndex to 0 per node so each node is scanned from the beginning
    INS_REGEX.lastIndex = 0;

    let match: RegExpExecArray | null;
    let last = 0;
    const out: PhrasingContent[] = [];

    while ((match = INS_REGEX.exec(value))) {
      const [full, inner] = match;
      const start = match.index;

      if (start > last) out.push({ type: 'text', value: value.slice(last, start) });

      // Render as <ins>…</ins> (remark-rehype respects data.hName)
      out.push({
        children: [{ type: 'text', value: inner }],
        data: { hName: 'ins' },
        type: 'emphasis',
      });

      last = start + full.length;
    }

    if (out.length === 0) return; // nothing to change
    if (last < value.length) out.push({ type: 'text', value: value.slice(last) });

    (parent as Parent).children.splice(index, 1, ...out);

    // Skip re-visiting the replaced range; continue after inserted nodes
    return [SKIP, index + out.length];
  };

  return (tree) => visit(tree, visitor);
};
