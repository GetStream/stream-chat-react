import { escapeRegExp } from '../regex';
import type { ReplaceFunction } from 'hast-util-find-and-replace';
import { findAndReplace } from 'hast-util-find-and-replace';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';

import type { Element } from 'hast';
import type { LocalMessage, UserGroupResponse, UserResponse } from 'stream-chat';

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
  | 'mentioned_groups'
  | 'mentioned_here'
  | 'mentioned_roles'
  | 'mentioned_users'
>;

type MentionReplacement = {
  /** Every distinct entity whose display text is `mentionDisplayText`. */
  entities: RenderTextMentionEntity[];
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
  plugin: () => (tree: HastTree) => void;
};

type HastTree = Parameters<typeof findAndReplace>[0];
type MentionTraversalParent = {
  children: unknown[];
};
type TextNode = {
  type: 'text';
  value: string;
};

// A mention match ends at the end of the string, before whitespace, or before trailing
// punctuation, which stays outside the mention node.
const MENTION_TRAILING_BOUNDARY = String.raw`(?=$|\s|[!,.?;:'")\]}])`;

/**
 * Returns the display texts, without the leading `@`, that match the entity in message text.
 * Roles and user groups match by name or ID, other entities by name falling back to ID.
 *
 * @param entity - Mention entity to resolve.
 * @returns Display texts the mention renderer wraps.
 */
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

  if (metadata.mentioned_groups?.length) {
    mentions.push(
      ...metadata.mentioned_groups.map((group: UserGroupResponse) => ({
        id: group.id,
        mentionType: 'user_group' as const,
        name: group.name,
      })),
    );
  }

  return mentions;
};

/**
 * Whether the message mentions anyone: a user, `@channel`, `@here`, a role or a user group. It is
 * true exactly when `getRenderTextMentionEntities` returns at least one entity, without building
 * them.
 *
 * @param metadata - The message's mention fields.
 */
export const messageHasMentions = (metadata?: RenderTextMentionMetadata) =>
  Boolean(
    metadata?.mentioned_users?.length ||
    metadata?.mentioned_channel ||
    metadata?.mentioned_here ||
    metadata?.mentioned_roles?.length ||
    metadata?.mentioned_groups?.length,
  );

const isSameMentionEntity = (a: RenderTextMentionEntity, b: RenderTextMentionEntity) =>
  a.mentionType === b.mentionType && a.id === b.id;

/**
 * Maps each `@<display text>` to every distinct entity with that display text. The message text
 * says only `@Alice`, so when several entities share it the mention cannot be resolved to one of
 * them, whatever their order in the message's mention fields.
 */
const createMentionLookup = (
  mentionEntities: RenderTextMentionEntity[],
): MentionLookup => {
  const mentionReplacementMap = new Map<string, MentionReplacement>();

  mentionEntities.forEach((entity) => {
    getMentionDisplayTexts(entity).forEach((mentionDisplayText) => {
      const prefixedMentionDisplayText = `@${mentionDisplayText}`;
      const replacement = mentionReplacementMap.get(prefixedMentionDisplayText);

      if (!replacement) {
        mentionReplacementMap.set(prefixedMentionDisplayText, {
          entities: [entity],
          mentionDisplayText: prefixedMentionDisplayText,
        });
      } else if (
        !replacement.entities.some((candidate) => isSameMentionEntity(candidate, entity))
      ) {
        replacement.entities.push(entity);
      }
    });
  });

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

      const { entities } = replacement;

      return u(
        'element',
        {
          mentionedEntities: entities,
          // The first candidate. When `mentionedEntities` holds more than one, it is not
          // necessarily the entity the mention refers to.
          mentionedEntity: entities[0],
          properties: {},
          tagName: 'mention',
        },
        [u('text', mentionDisplayText)],
      );
    };

    const transform = (tree: HastTree) => {
      if (!mentionReplacements.length || !mentionsRegex) return;

      // Remark GFM turns e-mail-like text into links, so a mention such as "@your.name@as.email"
      // arrives as a text ending in "@" followed by a mailto link. For a known mention, drop that
      // "@" and replace the link with a text node holding the mention text before `replace` runs.
      if (mentionDisplayTextSet.size) {
        visit(
          tree,
          (node: unknown, index, parent: MentionTraversalParent | undefined) => {
            if (typeof index === 'undefined') return;
            if (!parent) return;

            const nextChild = parent.children.at(index + 1) as Element;
            const nextChildHref = nextChild?.properties?.href as string | undefined;
            const textNode = node as TextNode;

            if (
              textNode.type === 'text' &&
              // The text node has to end with the `@` that starts the mention.
              textNode.value.endsWith('@') &&
              nextChildHref?.startsWith('mailto:')
            ) {
              const newTextValue = textNode.value.replace(/@$/, '');
              const rawDisplayName = nextChildHref.replace('mailto:', '');
              const mentionDisplayText = `@${rawDisplayName}`;
              if (!mentionDisplayTextSet.has(mentionDisplayText)) return;
              parent.children[index] = u('text', newTextValue);
              parent.children[index + 1] = u('text', mentionDisplayText);
            }
          },
        );
      }

      findAndReplace(tree, [mentionsRegex, replace]);
    };

    return transform;
  };

export const createMentionPluginAndDisplayTextSet = (
  mentionEntities: RenderTextMentionEntity[],
): MentionPluginAndDisplayTextSet => {
  const mentionLookup = createMentionLookup(mentionEntities);

  return {
    mentionDisplayTextSet: mentionLookup.mentionDisplayTextSet,
    plugin: mentionsMarkdownPluginFromLookup(mentionLookup),
  };
};

export function mentionsMarkdownPlugin(
  mentionEntities: RenderTextMentionEntity[],
): () => (tree: HastTree) => void {
  return createMentionPluginAndDisplayTextSet(mentionEntities).plugin;
}
