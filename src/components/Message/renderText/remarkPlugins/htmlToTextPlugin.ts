import type { Visitor } from 'unist-util-visit';
import { visit } from 'unist-util-visit';

import type { Nodes } from 'hast-util-find-and-replace/lib';

const visitor: Visitor = (node) => {
  if (node.type !== 'html') return;

  node.type = 'text';
};
const transform = (tree: Nodes) => {
  visit(tree, visitor);
};

export const htmlToTextPlugin = () => transform;
