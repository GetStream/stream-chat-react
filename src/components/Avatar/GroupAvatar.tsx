import clsx from 'clsx';
import React, { type ComponentPropsWithoutRef } from 'react';
import { Avatar, type AvatarProps } from './Avatar';
import { Badge, type BadgeSize } from '../Badge';

export type GroupAvatarMember = {
  imageUrl?: string;
  userName?: string;
};

export type GroupAvatarProps = ComponentPropsWithoutRef<'div'> & {
  /** List of members to show as avatars; at most 2 when overflowCount is set, otherwise 4. Defaults to [] when omitted. */
  displayMembers?: GroupAvatarMember[];
  /** Optional count for the "+N" badge when there are more members than shown. */
  overflowCount?: number;
  size: '2xl' | 'xl' | 'lg' | null;
  badgeSize?: BadgeSize;
  isOnline?: boolean;
};

/**
 * Avatar component to display multiple users' avatars in a group.
 * Renders a single Avatar if fewer than 2 members. Otherwise, renders up to 2 avatars (when overflowCount is set) or 4, plus an optional +N badge.
 */
// TODO: rename to AvatarGroup
export const GroupAvatar = ({
  badgeSize,
  className,
  displayMembers = [],
  isOnline,
  overflowCount,
  size,
  ...rest
}: GroupAvatarProps) => {
  const displayCountBadge = typeof overflowCount === 'number' && overflowCount > 0;

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
      {displayMembers
        .slice(0, displayCountBadge ? 2 : 4)
        .map(({ imageUrl, userName }, index) => (
          <Avatar
            imageUrl={imageUrl}
            key={`${userName}-${imageUrl}-${index}`}
            size={avatarSize}
            userName={userName}
          />
        ))}
      {displayCountBadge && (
        <Badge
          className='str-chat__avatar-group__count-badge'
          size={badgeSize}
          variant='counter'
        >
          +{overflowCount}
        </Badge>
      )}
    </div>
  );
};
