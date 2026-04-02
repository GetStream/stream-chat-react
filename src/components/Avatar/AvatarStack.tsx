import React, { type ComponentProps, type ElementType, useMemo } from 'react';
import { useComponentContext } from '../../context';
import { type AvatarProps, Avatar as DefaultAvatar } from './Avatar';
import clsx from 'clsx';
import { Badge, type BadgeSize } from '../Badge';

export function AvatarStack({
  badgeSize,
  capLimit = 3,
  component: Component = 'div',
  displayInfo = [],
  size,
}: {
  component?: ElementType;
  displayInfo?: (Pick<AvatarProps, 'imageUrl' | 'userName'> & { id?: string })[];
  size: 'md' | 'sm' | 'xs' | null;
  badgeSize?: BadgeSize;
  capLimit?: number;
}) {
  const { Avatar = DefaultAvatar } = useComponentContext(AvatarStack.name);

  const displayInfoToRender = useMemo(
    () => (displayInfo.length > capLimit ? displayInfo.slice(0, capLimit) : displayInfo),
    [displayInfo, capLimit],
  );
  const overflowCount = displayInfo.length - displayInfoToRender.length;

  if (!displayInfo.length) {
    return null;
  }

  return (
    <Component
      className={clsx('str-chat__avatar-stack', {
        [`str-chat__avatar-stack--size-${size}`]: typeof size === 'string',
      })}
      data-testid='avatar-stack'
    >
      {displayInfoToRender.map((info, index) => (
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
          data-testid='avatar-stack-count-badge'
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
