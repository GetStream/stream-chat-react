import type { PropsWithChildren } from 'react';
import React from 'react';

import type { UserResponse } from 'stream-chat';
import type { RenderTextMentionEntity } from '../rehypePlugins/mentionsMarkdownPlugin';

type UserMentionNode = {
  mentionedEntity: Extract<RenderTextMentionEntity, { mentionType: 'user' }>;
  /**
   * @deprecated Use `mentionedEntity` instead.
   */
  mentionedUser: UserResponse;
};

type NonUserMentionNode = {
  mentionedEntity: Exclude<RenderTextMentionEntity, { mentionType: 'user' }>;
  /**
   * @deprecated Use `mentionedEntity` instead.
   */
  mentionedUser?: undefined;
};

export type MentionProps = PropsWithChildren<{
  node: UserMentionNode | NonUserMentionNode;
}>;

export const Mention = ({ children, node: { mentionedEntity } }: MentionProps) => (
  <span
    className='str-chat__message-mention'
    data-mention-id={mentionedEntity.id}
    data-mention-type={mentionedEntity.mentionType}
    data-user-id={mentionedEntity.mentionType === 'user' ? mentionedEntity.id : undefined}
  >
    {children}
  </span>
);
