import React from 'react';
import { Avatar, AvatarProps, GroupAvatar, GroupAvatarProps } from './index';
import type { DefaultStreamChatGenerics } from '../../types';

export type ChannelAvatarProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<GroupAvatarProps> & AvatarProps<StreamChatGenerics>;

export const ChannelAvatar = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  groupChannelDisplayInfo,
  image,
  name,
  user,
  ...sharedProps
}: ChannelAvatarProps<StreamChatGenerics>) => {
  if (groupChannelDisplayInfo) {
    return (
      <GroupAvatar groupChannelDisplayInfo={groupChannelDisplayInfo} {...sharedProps} />
    );
  }
  return <Avatar image={image} name={name} user={user} {...sharedProps} />;
};
