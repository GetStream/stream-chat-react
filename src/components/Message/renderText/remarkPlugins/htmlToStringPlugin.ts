import { visit, Visitor } from 'unist-util-visit';

import type { Nodes } from 'react-markdown/lib';

const visitor: Visitor = (node) => {
  if (node.type !== 'html') return;

  node.type = 'text';
};
const transform = (tree: Nodes) => {
  visit(tree, visitor);
};

export const htmlToStringPlugin = () => transform;
