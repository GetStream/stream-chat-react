import clsx from 'clsx';
import React, { type ComponentPropsWithoutRef } from 'react';
import { Avatar } from './Avatar';
import type { GroupChannelDisplayInfo } from '../ChannelPreview';

export type GroupAvatarProps = ComponentPropsWithoutRef<'div'> & {
  /** Mapping of image URLs to names which initials will be used as fallbacks in case image assets fail to load. */
  groupChannelDisplayInfo: GroupChannelDisplayInfo;
};

export const GroupAvatar = ({
  className,
  groupChannelDisplayInfo,
  ...rest
}: GroupAvatarProps) => (
  <div
    className={clsx(
      `str-chat__avatar-group`,
      { 'str-chat__avatar-group--three-part': groupChannelDisplayInfo.length === 3 },
      className,
    )}
    data-testid='group-avatar'
    role='button'
    {...rest}
  >
    {groupChannelDisplayInfo.slice(0, 4).map(({ image, name }, i) => (
      <Avatar
        className={clsx({
          'str-chat__avatar--single': groupChannelDisplayInfo.length === 3 && i === 0,
        })}
        imageUrl={image}
        key={`${name}-${image}-${i}`}
        size='md'
        userName={name}
      />
    ))}
  </div>
);
