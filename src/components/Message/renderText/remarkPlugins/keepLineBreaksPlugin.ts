import { visit, Visitor } from 'unist-util-visit';
import { u } from 'unist-builder';

import type { Break } from 'mdast';
import type { HNode } from '../types';

const visitor: Visitor = (node, index, parent) => {
  if (index === null || index === 0) return;
  if (!parent) return;
  if (!node.position) return;

  console.log('node', node);
  const prevSibling = parent.children.at(index - 1);
  if (!prevSibling?.position) return;
  console.log(
    'prevSibling',
    prevSibling,
    node.position.start.line === prevSibling.position.start.line,
  );

  if (node.position.start.line === prevSibling.position.start.line) return false;
  const ownStartLine = node.position.start.line;
  const prevEndLine = prevSibling.position.end.line;

  // the -1 is adjustment for the single line break into which multiple line breaks are converted
  const countTruncatedLineBreaks = ownStartLine - prevEndLine - 1;
  console.log('countTruncatedLineBreaks', countTruncatedLineBreaks);
  if (countTruncatedLineBreaks < 1) return;

  const lineBreaks = Array.from({ length: countTruncatedLineBreaks }).map(() =>
    u('break', { tagName: 'br' }),
  ) as Break[];

  // @ts-ignore
  parent.children = [
    ...parent.children.slice(0, index),
    ...lineBreaks,
    ...parent.children.slice(index),
  ];
  console.log('parent.children', parent.children);
  return;
};
const transform = (tree: HNode) => {
  visit(tree, visitor);
};

export const keepLineBreaksPlugin = () => transform;
