import type { PropsWithChildren } from 'react';
import React from 'react';

import type { RenderTextMentionEntity } from '../rehypePlugins/mentionsMarkdownPlugin';

export type MentionProps = PropsWithChildren<{
  node: {
    /**
     * Every entity whose display text matches the mention. It holds more than one entity when
     * they share the display text, e.g. two users named Alice, or a user named `admin` and the
     * role `admin`. `mentionsMarkdownPlugin` always sets it; a node built by another plugin
     * without it counts as a mention of `mentionedEntity` alone.
     */
    mentionedEntities?: RenderTextMentionEntity[];
    /**
     * The entity the mention refers to. When `mentionedEntities` holds more than one entity, the
     * message text does not say which of them is meant and this is only the first of them.
     */
    mentionedEntity: RenderTextMentionEntity;
  };
}>;

/**
 * Returns the mention type the candidates have in common, e.g. `'user'` for two users named
 * Alice, or `undefined` when their types differ.
 */
const getSharedMentionType = (entities: RenderTextMentionEntity[]) => {
  const [first, ...rest] = entities;
  if (!first) return undefined;
  return rest.every(({ mentionType }) => mentionType === first.mentionType)
    ? first.mentionType
    : undefined;
};

/**
 * Highlights a mention. A mention that matches exactly one entity carries its `data-mention-id`,
 * `data-mention-type` and, for a user, `data-user-id`. A mention whose display text several
 * entities share carries no ID, so a click handler cannot act on the wrong entity; it keeps
 * `data-mention-type` only when all of them have the same type.
 */
export const Mention = ({
  children,
  node: { mentionedEntities, mentionedEntity },
}: MentionProps) => {
  const candidates = mentionedEntities ?? [mentionedEntity];
  const entity = candidates.length > 1 ? undefined : mentionedEntity;
  const mentionType = getSharedMentionType(candidates);

  return (
    <span
      className='str-chat__message-mention'
      data-mention-id={entity?.id}
      data-mention-type={mentionType}
      data-user-id={entity?.mentionType === 'user' ? entity.id : undefined}
    >
      {children}
    </span>
  );
};
