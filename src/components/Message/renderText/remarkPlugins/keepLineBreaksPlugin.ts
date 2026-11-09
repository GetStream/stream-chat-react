import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Node, Parent as UnistParent } from 'unist';
import type { Root, RootContent, ThematicBreak } from 'mdast';

function isParentWithChildren(
  node: Node,
): node is UnistParent & { children: RootContent[] } {
  const maybe = node as unknown as { children?: unknown };
  return Array.isArray(maybe.children);
}

/**
 * A table holds only rows, and the line gap between its rows is not a blank line: the delimiter
 * row between the header and the first data row is syntax. A `<br>` there would render as an
 * empty row and is invalid inside `<tbody>`.
 */
function holdsOnlyTableRows(node: Node): boolean {
  return node.type === 'table';
}

/** A `thematicBreak` that `mdast-util-to-hast` renders as `<br>` through `data.hName`. */
function brNode(): ThematicBreak {
  return { data: { hName: 'br' }, type: 'thematicBreak' };
}

/**
 * Preserves the blank source lines between sibling block nodes by inserting a `<br>` for each
 * blank line. The rows of a table are left as they are.
 */
export const keepLineBreaksPlugin: Plugin<[], Root> = () => (tree) => {
  visit(
    tree as unknown as UnistParent, // visit needs a Unist parent-like root
    isParentWithChildren, // limit to parents with children
    (parent) => {
      if (holdsOnlyTableRows(parent)) return;

      const children = parent.children as RootContent[];
      if (children.length < 2) return;

      const out: RootContent[] = [];

      for (let i = 0; i < children.length; i++) {
        const curr = children[i];
        out.push(curr);

        if (i === children.length - 1) break;

        const next = children[i + 1];

        const currEndLine =
          curr.position && curr.position.end ? curr.position.end.line : undefined;
        const nextStartLine =
          next.position && next.position.start ? next.position.start.line : undefined;

        if (typeof currEndLine !== 'number' || typeof nextStartLine !== 'number') {
          continue;
        }

        // Each blank source line between the two nodes becomes one `<br>`.
        const extraBlankLines = Math.max(0, nextStartLine - currEndLine - 1);
        if (extraBlankLines > 0) {
          for (let k = 0; k < extraBlankLines; k++) {
            out.push(brNode());
          }
        }
      }

      parent.children = out;
    },
  );
};
