import clsx from 'clsx';
import React, { type ComponentPropsWithoutRef, useMemo } from 'react';
import { Avatar, type AvatarProps } from './Avatar';
import { Badge, type BadgeSize } from '../Badge';

export type GroupAvatarMember = {
  imageUrl?: string;
  userName?: string;
  id?: string;
};

export type GroupAvatarProps = {
  /** Members to show. With more than 4, the first 2 render plus a `+N` badge. Defaults to `[]`. */
  displayMembers?: GroupAvatarMember[];
  size: '2xl' | 'xl' | 'lg' | (string & {}) | null;
  badgeSize?: BadgeSize;
  isOnline?: boolean;
} & ComponentPropsWithoutRef<'div'>;

/**
 * Avatar for several users: a single `Avatar` for fewer than 2 members, otherwise up to 4 avatars,
 * or 2 plus a `+N` badge when there are more than 4 members.
 */
export const GroupAvatar = ({
  badgeSize,
  className,
  displayMembers = [],
  isOnline,
  size,
  ...rest
}: GroupAvatarProps) => {
  const displayMembersToRender = useMemo(
    () => (displayMembers.length > 4 ? displayMembers.slice(0, 2) : displayMembers),
    [displayMembers],
  );
  const overflowCount = displayMembers.length - displayMembersToRender.length;

  if (displayMembers.length < 2) {
    const firstUser = displayMembers[0];

    return (
      <Avatar
        imageUrl={firstUser?.imageUrl}
        isOnline={isOnline}
        size={size}
        userName={firstUser?.userName}
        {...rest}
      />
    );
  }

  let avatarSize: AvatarProps['size'] = null;
  if (size === '2xl') {
    avatarSize = 'lg';
  } else if (size === 'xl') {
    avatarSize = 'md';
  } else if (size === 'lg') {
    avatarSize = 'sm';
  }

  return (
    <div
      className={clsx(
        'str-chat__avatar-group',
        {
          'str-chat__avatar-group--offline': typeof isOnline === 'boolean' && !isOnline,
          'str-chat__avatar-group--online': typeof isOnline === 'boolean' && isOnline,
          [`str-chat__avatar-group--size-${size}`]: typeof size === 'string',
        },
        className,
      )}
      data-testid='group-avatar'
      role='button'
      {...rest}
    >
      {displayMembersToRender.map(({ id, imageUrl, userName }, index) => (
        <Avatar
          imageUrl={imageUrl}
          key={id || `${userName}-${imageUrl}-${index}`}
          size={avatarSize}
          userName={userName}
        />
      ))}
      {typeof overflowCount === 'number' && overflowCount > 0 && (
        <Badge
          className='str-chat__avatar-group__count-badge'
          data-testid='group-avatar-count-badge'
          size={badgeSize}
          variant='counter'
        >
          +{overflowCount}
        </Badge>
      )}
    </div>
  );
};
