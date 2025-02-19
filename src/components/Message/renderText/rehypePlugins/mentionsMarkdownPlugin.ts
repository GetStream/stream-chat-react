import { escapeRegExp } from '../regex';
import type { ReplaceFunction } from 'hast-util-find-and-replace';
import { findAndReplace } from 'hast-util-find-and-replace';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';

import type { Nodes } from 'hast-util-find-and-replace/lib';
import type { Element } from 'hast';
import type { UserResponse } from 'stream-chat';

export const mentionsMarkdownPlugin = (mentioned_users: UserResponse[]) => () => {
  const mentioned_usernames = mentioned_users
    .map((user) => user.name || user.id)
    .filter(Boolean)
    .map(escapeRegExp);

  const mentionedUsersRegex = new RegExp(
    mentioned_usernames.map((username) => `@${username}`).join('|'),
    'g',
  );

  const replace: ReplaceFunction = (match) => {
    const usernameOrId = match.replace('@', '');
    const user = mentioned_users.find(
      ({ id, name }) => name === usernameOrId || id === usernameOrId,
    );
    return u('element', { mentionedUser: user, properties: {}, tagName: 'mention' }, [
      u('text', match),
    ]);
  };

  const transform = (tree: Nodes) => {
    if (!mentioned_usernames.length) return;

    // handles special cases of mentions where user.name is an e-mail
    // Remark GFM translates all e-mail-like text nodes to links creating
    // two separate child nodes "@" and "your.name@as.email" instead of
    // keeping it as one text node with value "@your.name@as.email"
    // this piece finds these two separated nodes and merges them together
    // before "replace" function takes over
    visit(tree, (node, index, parent) => {
      if (typeof index === 'undefined') return;
      if (!parent) return;

      const nextChild = parent.children.at(index + 1) as Element;
      const nextChildHref = nextChild?.properties?.href as string | undefined;

      if (
        node.type === 'text' &&
        // text value has to have @ sign at the end of the string
        // and no other characters except whitespace can precede it
        // valid cases:   "text @", "@", " @"
        // invalid cases: "text@", "@text",
        /.?\s?@$|^@$/.test(node.value) &&
        nextChildHref?.startsWith('mailto:')
      ) {
        const newTextValue = node.value.replace(/@$/, '');
        const username = nextChildHref.replace('mailto:', '');
        parent.children[index] = u('text', newTextValue);
        parent.children[index + 1] = u('text', `@${username}`);
      }
    });

    findAndReplace(tree, [mentionedUsersRegex, replace]);
  };

  return transform;
};
