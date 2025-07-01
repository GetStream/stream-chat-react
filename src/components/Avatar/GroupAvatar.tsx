import clsx from 'clsx';
import React from 'react';
import type { AvatarProps } from './Avatar';
import { Avatar } from './Avatar';
import type { GroupChannelDisplayInfo } from '../ChannelPreview';

export type GroupAvatarProps = Pick<
  AvatarProps,
  'className' | 'onClick' | 'onMouseOver'
> & {
  /** Mapping of image URLs to names which initials will be used as fallbacks in case image assets fail to load. */
  groupChannelDisplayInfo: GroupChannelDisplayInfo;
};

export const GroupAvatar = ({
  className,
  groupChannelDisplayInfo,
  onClick,
  onMouseOver,
}: GroupAvatarProps) => (
  <div
    className={clsx(
      `str-chat__avatar-group`,
      { 'str-chat__avatar-group--three-part': groupChannelDisplayInfo.length === 3 },
      className,
    )}
    data-testid='group-avatar'
    onClick={onClick}
    onMouseOver={onMouseOver}
    role='button'
  >
    {groupChannelDisplayInfo.slice(0, 4).map(({ image, name }, i) => (
      <Avatar
        className={clsx({
          'str-chat__avatar--single': groupChannelDisplayInfo.length === 3 && i === 0,
        })}
        image={image}
        key={`${name}-${image}-${i}`}
        name={name}
      />
    ))}
  </div>
);
