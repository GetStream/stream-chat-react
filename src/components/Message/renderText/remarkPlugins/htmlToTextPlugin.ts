import { visit, Visitor } from 'unist-util-visit';

import type { HNode } from '../types';

const visitor: Visitor = (node) => {
  if (node.type !== 'html') return;

  node.type = 'text';
};
const transform = (tree: HNode) => {
  visit(tree, visitor);
};

export const htmlToTextPlugin = () => transform;
