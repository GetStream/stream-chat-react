import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Node, Parent as UnistParent } from 'unist';
import type { Root, RootContent, ThematicBreak } from 'mdast';

/** Type guard: does the node have mdast children? */
function isParentWithChildren(
  node: Node,
): node is UnistParent & { children: RootContent[] } {
  const maybe = node as unknown as { children?: unknown };
  return Array.isArray(maybe.children);
}

/** Build a single <br> by mapping a standard mdast node via data.hName */
function brNode(): ThematicBreak {
  return { data: { hName: 'br' }, type: 'thematicBreak' };
}

/**
 * Inserts runs of <br> between sibling block nodes to preserve the exact
 * number of *blank source lines* between them. No paragraph wrappers are added.
 *
 * Works because `mdast-util-to-hast` respects `data.hName`, turning our
 * `thematicBreak` into `<br>`. Multiple blank lines -> multiple `<br>` siblings.
 */
export const keepLineBreaksPlugin: Plugin<[], Root> = () => (tree) => {
  visit(
    tree as unknown as UnistParent, // visit needs a Unist parent-like root
    isParentWithChildren, // limit to parents with children
    (parent) => {
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

        // Markdown already separates blocks by at least one visual gap.
        // We add back only the *extra* blank lines from the source.
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
