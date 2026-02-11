/* eslint-disable arrow-body-style */
import { type ComponentProps, type ElementType } from 'react';
import { useComponentContext } from '../../context';
import { type AvatarProps, Avatar as DefaultAvatar } from './Avatar';

export function AvatarStack({
  component: Component = 'div',
  displayInfo = [],
}: {
  component?: ElementType;
  displayInfo?: (Pick<AvatarProps, 'imageUrl' | 'userName'> & { id?: string })[];
}) {
  const { Avatar = DefaultAvatar } = useComponentContext(AvatarStack.name);

  if (!displayInfo.length) {
    return null;
  }

  return (
    <Component className='str-chat__avatar-stack'>
      {displayInfo.map((info, index) => (
        <Avatar
          className='str-chat__avatar--with-border'
          imageUrl={info.imageUrl}
          key={info.id ?? `${info.userName}-${info.imageUrl}-${index}`}
          size='xs'
          userName={info.userName}
        />
      ))}
    </Component>
  );
}

export type AvatarStackProps = ComponentProps<typeof AvatarStack>;
