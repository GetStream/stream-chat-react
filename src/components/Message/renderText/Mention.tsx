import React, { PropsWithChildren } from 'react';

import type { UserResponse } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export type MentionProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = PropsWithChildren<{
  /**
   * @deprecated will be removed in the next major release, transition to using `node.mentionedUser` instead
   */
  mentioned_user: UserResponse<StreamChatGenerics>;
  node: {
    /**
     * @deprecated will be removed in the next major release, transition to using `node.mentionedUser` instead
     */
    mentioned_user: UserResponse<StreamChatGenerics>;
    mentionedUser: UserResponse<StreamChatGenerics>;
  };
}>;
export const Mention = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  children,
  node: { mentionedUser },
}: MentionProps<StreamChatGenerics>) => (
  <span className='str-chat__message-mention' data-user-id={mentionedUser.id}>
    {children}
  </span>
);
