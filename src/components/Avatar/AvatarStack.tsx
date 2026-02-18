import { type ComponentProps, type ElementType } from 'react';
import { useComponentContext } from '../../context';
import { type AvatarProps, Avatar as DefaultAvatar } from './Avatar';
import clsx from 'clsx';

export function AvatarStack({
  badgeCount,
  component: Component = 'div',
  displayInfo = [],
  size,
}: {
  component?: ElementType;
  displayInfo?: (Pick<AvatarProps, 'imageUrl' | 'userName'> & { id?: string })[];
  badgeCount?: number;
  size: 'sm' | 'xs' | null;
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
      {typeof badgeCount === 'number' && (
        <div className='str-chat__avatar-stack-badge-count'>{badgeCount}</div>
      )}
    </Component>
  );
}

export type AvatarStackProps = ComponentProps<typeof AvatarStack>;
