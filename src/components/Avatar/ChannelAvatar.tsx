import React from 'react';

import { Avatar, GroupAvatar } from './';
import type { AvatarProps, GroupAvatarProps } from './';
import type { GroupAvatarMember } from './GroupAvatar';

export type ChannelAvatarProps = Partial<Omit<GroupAvatarProps & AvatarProps, 'size'>> & {
  size: GroupAvatarProps['size'];
  /** When set with length >= 2, GroupAvatar is used. */
  displayMembers?: GroupAvatarMember[];
  overflowCount?: number;
};

export const ChannelAvatar = ({
  displayMembers,
  imageUrl,
  overflowCount,
  size,
  userName,
  ...sharedProps
}: ChannelAvatarProps) => {
  if ((displayMembers?.length ?? 0) >= 2) {
    return (
      <GroupAvatar
        displayMembers={displayMembers}
        overflowCount={overflowCount}
        size={size}
        {...sharedProps}
      />
    );
  }
  return <Avatar imageUrl={imageUrl} size={size} userName={userName} {...sharedProps} />;
};
