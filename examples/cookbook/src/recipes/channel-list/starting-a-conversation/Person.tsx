import type { UserResponse } from 'stream-chat';
import { Avatar } from 'stream-chat-react';
import type { AvatarProps } from 'stream-chat-react';

export const nameOf = (user: UserResponse) => user.name ?? user.id;

/**
 * A person's avatar and name. The avatar repeats the name beside it, so it's hidden from assistive
 * technology. Avatar renders role="button" by default, which a chip or a result mustn't announce.
 */
export const Person = ({
  size,
  user,
}: {
  size: AvatarProps['size'];
  user: UserResponse;
}) => (
  <>
    <Avatar aria-hidden role='presentation' size={size} userName={nameOf(user)} />
    {nameOf(user)}
  </>
);
