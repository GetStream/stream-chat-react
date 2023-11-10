import { visit, Visitor } from 'unist-util-visit';
import { u } from 'unist-builder';

import type { Nodes } from 'react-markdown/lib';
import type { Break } from 'mdast';

const visitor: Visitor = (node, index, parent) => {
  if (typeof index === 'undefined') return;
  if (typeof parent === 'undefined') return;
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
  return;
};
const transform = (tree: Nodes) => {
  visit(tree, visitor);
};

export const keepLineBreaksPlugin = () => transform;
