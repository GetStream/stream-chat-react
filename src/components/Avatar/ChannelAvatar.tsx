import React from 'react';

import { Avatar, GroupAvatar } from './';
import type { AvatarProps, GroupAvatarProps } from './';

export type ChannelAvatarProps = Partial<GroupAvatarProps> & AvatarProps;

export const ChannelAvatar = ({
  groupChannelDisplayInfo,
  image,
  name,
  user,
  ...sharedProps
}: ChannelAvatarProps) => {
  if (groupChannelDisplayInfo) {
    return (
      <GroupAvatar groupChannelDisplayInfo={groupChannelDisplayInfo} {...sharedProps} />
    );
  }
  return <Avatar image={image} name={name} user={user} {...sharedProps} />;
};
