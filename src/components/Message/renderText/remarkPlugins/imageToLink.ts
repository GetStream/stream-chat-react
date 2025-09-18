import { SKIP, visit, type VisitorResult } from 'unist-util-visit';
import type { Image, Link, Parent, Text } from 'mdast';
import type { Node } from 'unist';

type ImgVisitor = (
  node: Image,
  index: number | null,
  parent: Parent | null,
) => VisitorResult;

export type ImageToLinkPluginOptions = {
  getTextLabelFrom?: 'alt' | 'title' | 'url';
};

const text = (value: string): Text => ({ type: 'text', value });

/**
 * Converts image Markdown links (![Minion](https://octodex.github.com/images/minion.png))
 * to HTML <a href={url}>{url | title | alt}</a>
 *
 * By default, the anchor text content is the image url so that image preview can be generated / enriched on the server.
 * @param getTextLabelFrom
 */
export function imageToLink({ getTextLabelFrom = 'url' }: ImageToLinkPluginOptions = {}) {
  return (tree: Node) => {
    const visitor: ImgVisitor = (node, index, parent) => {
      if (parent == null || index == null) return;

      const label = node[getTextLabelFrom] ?? node.url; // node.alt || node.title || node.url;
      const link: Link = {
        children: [text(label)],
        title: node.title ?? node.alt ?? node.url,
        type: 'link',
        url: node.url,
      };

      parent.children.splice(index, 1, link);
      return [SKIP, index + 1] as const;
    };

    visit(tree, 'image', visitor);
  };
}
