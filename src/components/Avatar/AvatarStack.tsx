import React, { type ComponentProps, type ElementType } from 'react';
import { useComponentContext } from '../../context';
import { type AvatarProps, Avatar as DefaultAvatar } from './Avatar';
import clsx from 'clsx';
import { Badge, type BadgeSize } from '../Badge';

export function AvatarStack({
  badgeSize,
  component: Component = 'div',
  displayInfo = [],
  overflowCount,
  size,
}: {
  component?: ElementType;
  displayInfo?: (Pick<AvatarProps, 'imageUrl' | 'userName'> & { id?: string })[];
  overflowCount?: number;
  size: 'md' | 'sm' | 'xs' | null;
  badgeSize?: BadgeSize;
}) {
  const { Avatar = DefaultAvatar } = useComponentContext(AvatarStack.name);

  if (!displayInfo.length) {
    return null;
  }

  return (
    <Component
      className={clsx('str-chat__avatar-stack', {
        [`str-chat__avatar-stack--size-${size}`]: typeof size === 'string',
      })}
    >
      {displayInfo.map((info, index) => (
        <Avatar
          imageUrl={info.imageUrl}
          key={info.id ?? `${info.userName}-${info.imageUrl}-${index}`}
          size={size}
          userName={info.userName}
        />
      ))}
      {typeof overflowCount === 'number' && overflowCount > 0 && (
        <Badge
          className='str-chat__avatar-stack__count-badge'
          size={badgeSize ?? size}
          variant='counter'
        >
          +{overflowCount}
        </Badge>
      )}
    </Component>
  );
}

export type AvatarStackProps = ComponentProps<typeof AvatarStack>;
