import React from 'react';

import { Avatar, GroupAvatar } from './';
import type { AvatarProps, GroupAvatarProps } from './';

export type ChannelAvatarProps = Partial<GroupAvatarProps> & AvatarProps;

export const ChannelAvatar = ({
  groupChannelDisplayInfo,
  imageUrl,
  size,
  userName,
  ...sharedProps
}: ChannelAvatarProps) => {
  if (groupChannelDisplayInfo) {
    return (
      <GroupAvatar groupChannelDisplayInfo={groupChannelDisplayInfo} {...sharedProps} />
    );
  }
  return <Avatar imageUrl={imageUrl} size={size} userName={userName} {...sharedProps} />;
};
