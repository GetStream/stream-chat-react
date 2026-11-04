import type { PropsWithChildren } from 'react';
import React from 'react';

import type { RenderTextMentionEntity } from '../rehypePlugins/mentionsMarkdownPlugin';

export type MentionProps = PropsWithChildren<{
  node: { mentionedEntity: RenderTextMentionEntity };
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
