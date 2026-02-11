import React from 'react';

import { Avatar, GroupAvatar } from './';
import type { AvatarProps, GroupAvatarProps } from './';

export type ChannelAvatarProps = Partial<Omit<GroupAvatarProps & AvatarProps, 'size'>> & {
  size: GroupAvatarProps['size'];
};

export const ChannelAvatar = ({
  groupChannelDisplayInfo,
  imageUrl,
  size,
  userName,
  ...sharedProps
}: ChannelAvatarProps) => {
  if (groupChannelDisplayInfo) {
    return (
      <GroupAvatar
        groupChannelDisplayInfo={groupChannelDisplayInfo}
        size={size}
        {...sharedProps}
      />
    );
  }
  return <Avatar imageUrl={imageUrl} size={size} userName={userName} {...sharedProps} />;
};
