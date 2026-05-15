import { escapeRegExp } from '../regex';
import type { ReplaceFunction } from 'hast-util-find-and-replace';
import { findAndReplace } from 'hast-util-find-and-replace';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';

import type { Nodes } from 'hast-util-find-and-replace/lib';
import type { Element } from 'hast';
import type { LocalMessage, UserResponse } from 'stream-chat';

export type RenderTextMentionEntity =
  | (UserResponse & {
      mentionType: 'user';
    })
  | {
      id: 'channel';
      mentionType: 'channel';
      name?: 'channel';
    }
  | {
      id: 'here';
      mentionType: 'here';
      name?: 'here';
    }
  | {
      id: string;
      mentionType: 'role';
      name?: string;
    }
  | {
      id: string;
      mentionType: 'user_group';
      name?: string;
    };

export type RenderTextMentionMetadata = Pick<
  Partial<LocalMessage>,
  | 'mentioned_channel'
  | 'mentioned_group_ids'
  | 'mentioned_here'
  | 'mentioned_roles'
  | 'mentioned_users'
>;

type MentionReplacement = {
  entity: RenderTextMentionEntity;
  mentionDisplayText: string;
};

type MentionLookup = {
  mentionDisplayTextSet: Set<string>;
  mentionReplacementMap: Map<string, MentionReplacement>;
  mentionReplacements: MentionReplacement[];
  mentionsRegex: RegExp | null;
};

type MentionPluginAndDisplayTextSet = {
  mentionDisplayTextSet: Set<string>;
  plugin: () => (tree: Nodes) => void;
};

// Mention matches may end at the end of the string, before whitespace,
// or before common trailing punctuation that should stay outside the mention node.
const MENTION_TRAILING_BOUNDARY = String.raw`(?=$|\s|[!,.?;:'")\]}])`;

const isUserMentionEntity = (
  entity: RenderTextMentionEntity,
): entity is Extract<RenderTextMentionEntity, { mentionType: 'user' }> =>
  entity.mentionType === 'user';

// Mention display text is the exact substring found in the message text and wrapped by the mention renderer.
export const getMentionDisplayTexts = (entity: RenderTextMentionEntity) => {
  if (entity.mentionType === 'user') {
    return [entity.name || entity.id].filter(Boolean);
  }

  if (entity.mentionType === 'channel' || entity.mentionType === 'here') {
    return [entity.name || entity.id];
  }

  return Array.from(new Set([entity.name, entity.id].filter(Boolean)));
};

export const getRenderTextMentionEntities = (
  metadata?: RenderTextMentionMetadata,
): RenderTextMentionEntity[] => {
  if (!metadata) return [];

  const mentions: RenderTextMentionEntity[] = (metadata.mentioned_users ?? []).map(
    (user) => ({
      ...user,
      mentionType: 'user',
    }),
  );

  if (metadata.mentioned_channel) {
    mentions.push({
      id: 'channel',
      mentionType: 'channel',
      name: 'channel',
    });
  }

  if (metadata.mentioned_here) {
    mentions.push({
      id: 'here',
      mentionType: 'here',
      name: 'here',
    });
  }

  if (metadata.mentioned_roles?.length) {
    mentions.push(
      ...metadata.mentioned_roles.map((role) => ({
        id: role,
        mentionType: 'role' as const,
        name: role,
      })),
    );
  }

  if (metadata.mentioned_group_ids?.length) {
    mentions.push(
      ...metadata.mentioned_group_ids.map((groupId) => ({
        id: groupId,
        mentionType: 'user_group' as const,
      })),
    );
  }

  return mentions;
};

const toRenderTextMentionEntities = (
  mentionEntities: RenderTextMentionEntity[] | UserResponse[],
): RenderTextMentionEntity[] =>
  mentionEntities.map((entity) =>
    'mentionType' in entity
      ? entity
      : {
          ...entity,
          mentionType: 'user',
        },
  );

const createMentionLookup = (
  mentionEntitiesOrUsers: RenderTextMentionEntity[] | UserResponse[],
): MentionLookup => {
  const mentionEntities = toRenderTextMentionEntities(mentionEntitiesOrUsers);
  const mentionReplacementMap = mentionEntities.reduce((replacementMap, entity) => {
    getMentionDisplayTexts(entity).forEach((mentionDisplayText) => {
      const prefixedMentionDisplayText = `@${mentionDisplayText}`;

      if (!replacementMap.has(prefixedMentionDisplayText)) {
        replacementMap.set(prefixedMentionDisplayText, {
          entity,
          mentionDisplayText: prefixedMentionDisplayText,
        });
      }
    });

    return replacementMap;
  }, new Map<string, MentionReplacement>());
  const mentionReplacements = Array.from(mentionReplacementMap.values()).sort(
    (a, b) => b.mentionDisplayText.length - a.mentionDisplayText.length,
  );

  return {
    mentionDisplayTextSet: new Set(mentionReplacementMap.keys()),
    mentionReplacementMap,
    mentionReplacements,
    mentionsRegex: mentionReplacements.length
      ? new RegExp(
          `(?:${mentionReplacements
            .map(({ mentionDisplayText }) => escapeRegExp(mentionDisplayText))
            .join('|')})${MENTION_TRAILING_BOUNDARY}`,
          'g',
        )
      : null,
  };
};

export const mentionsMarkdownPluginFromLookup =
  ({
    mentionDisplayTextSet,
    mentionReplacementMap,
    mentionReplacements,
    mentionsRegex,
  }: MentionLookup) =>
  () => {
    const replace: ReplaceFunction = (mentionDisplayText) => {
      const replacement = mentionReplacementMap.get(mentionDisplayText);

      if (!replacement) return mentionDisplayText;

      return u(
        'element',
        isUserMentionEntity(replacement.entity)
          ? {
              mentionedEntity: replacement.entity,
              mentionedUser: replacement.entity,
              properties: {},
              tagName: 'mention',
            }
          : {
              mentionedEntity: replacement.entity,
              properties: {},
              tagName: 'mention',
            },
        [u('text', mentionDisplayText)],
      );
    };

    const transform = (tree: Nodes) => {
      if (!mentionReplacements.length || !mentionsRegex) return;

      // handles special cases of mentions where the mention display text
      // looks like an e-mail-like token
      // Remark GFM translates all e-mail-like text nodes to links creating
      // two separate child nodes "@" and "your.name@as.email" instead of
      // keeping it as one text node with value "@your.name@as.email"
      // this piece finds these two separated nodes and merges them together
      // before "replace" function takes over
      if (mentionDisplayTextSet.size) {
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
            const rawDisplayName = nextChildHref.replace('mailto:', '');
            const mentionDisplayText = `@${rawDisplayName}`;
            if (!mentionDisplayTextSet.has(mentionDisplayText)) return;
            parent.children[index] = u('text', newTextValue);
            parent.children[index + 1] = u('text', mentionDisplayText);
          }
        });
      }

      findAndReplace(tree, [mentionsRegex, replace]);
    };

    return transform;
  };

export const createMentionPluginAndDisplayTextSet = (
  mentionEntitiesOrUsers: RenderTextMentionEntity[] | UserResponse[],
): MentionPluginAndDisplayTextSet => {
  const mentionLookup = createMentionLookup(mentionEntitiesOrUsers);

  return {
    mentionDisplayTextSet: mentionLookup.mentionDisplayTextSet,
    plugin: mentionsMarkdownPluginFromLookup(mentionLookup),
  };
};

export function mentionsMarkdownPlugin(
  mentionedUsers: UserResponse[],
): () => (tree: Nodes) => void;
export function mentionsMarkdownPlugin(
  mentionEntities: RenderTextMentionEntity[],
): () => (tree: Nodes) => void;
export function mentionsMarkdownPlugin(
  mentionEntitiesOrUsers: RenderTextMentionEntity[] | UserResponse[],
) {
  return createMentionPluginAndDisplayTextSet(mentionEntitiesOrUsers).plugin;
}
