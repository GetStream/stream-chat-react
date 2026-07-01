import React, { useMemo } from 'react';

import { GroupAvatar } from './';
import type { AvatarProps, GroupAvatarProps } from './';

export type ChannelAvatarProps = Partial<Omit<GroupAvatarProps & AvatarProps, 'size'>> & {
  size: GroupAvatarProps['size'] | AvatarProps['size'];
};

export const ChannelAvatar = ({
  displayMembers,
  imageUrl,
  size,
  userName,
  ...sharedProps
}: ChannelAvatarProps) => {
  const displayInfo = useMemo(() => {
    // Prefer the channel's own image; only derive the avatar from members when
    // there is no channel imageUrl to display.
    if (!imageUrl && displayMembers && displayMembers.length > 0) {
      return displayMembers;
    }

    return [
      {
        imageUrl,
        userName,
      },
    ];
  }, [displayMembers, imageUrl, userName]);

  return <GroupAvatar displayMembers={displayInfo} size={size} {...sharedProps} />;
};
