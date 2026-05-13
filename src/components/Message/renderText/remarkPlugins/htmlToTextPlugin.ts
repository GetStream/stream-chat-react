import type { Visitor } from 'unist-util-visit';
import { visit } from 'unist-util-visit';

// `Nodes` is not part of hast-util-find-and-replace's public surface; derive
// the visit-compatible tree type from `visit` itself.
type Nodes = Parameters<typeof visit>[0];

const visitor: Visitor = (node) => {
  if (node.type !== 'html') return;

  node.type = 'text';
};
const transform = (tree: Nodes) => {
  visit(tree, visitor);
};

export const htmlToTextPlugin = () => transform;
