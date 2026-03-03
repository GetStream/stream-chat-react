import clsx from 'clsx';
import React, { type ComponentPropsWithoutRef } from 'react';
import { Avatar, type AvatarProps } from './Avatar';
import type { GroupChannelDisplayInfo } from '../ChannelPreview';

export type GroupAvatarProps = ComponentPropsWithoutRef<'div'> & {
  /** Mapping of image URLs to names which initials will be used as fallbacks in case image assets fail to load. */
  groupChannelDisplayInfo: GroupChannelDisplayInfo;
  size: '2xl' | 'xl' | 'lg' | null;
  isOnline?: boolean;
  overflowCount?: number;
};

/**
 * Avatar component to display multiple users' avatars in a group channel, with a maximum of 4 avatars shown.
 * Renders a single Avatar if only one user is provided.
 */
// TODO: rename to AvatarGroup
export const GroupAvatar = ({
  className,
  groupChannelDisplayInfo,
  isOnline,
  overflowCount,
  size,
  ...rest
}: GroupAvatarProps) => {
  const displayCountBadge = typeof overflowCount === 'number' && overflowCount > 0;

  if (!groupChannelDisplayInfo || groupChannelDisplayInfo.length < 2) {
    const [firstUser] = groupChannelDisplayInfo || [];

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
      {groupChannelDisplayInfo
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
        <div className='str-chat__avatar-group__count-badge'>+{overflowCount}</div>
      )}
    </div>
  );
};
