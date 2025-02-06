import type { PropsWithChildren } from 'react';
import React from 'react';

import type { UserResponse } from 'stream-chat';

export type MentionProps = PropsWithChildren<{
  node: {
    mentionedUser: UserResponse;
  };
}>;

export const Mention = ({ children, node: { mentionedUser } }: MentionProps) => (
  <span className='str-chat__message-mention' data-user-id={mentionedUser.id}>
    {children}
  </span>
);
