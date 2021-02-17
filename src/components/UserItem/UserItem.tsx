import React from 'react';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

export type UserItemProps = {
  /** The user */
  entity: {
    /** Id of the user */
    id?: string;
    /** Image of the user */
    image?: string;
    /** Name of the user */
    name?: string;
  };
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx)
   */
  Avatar?: React.ComponentType<AvatarProps>;
};

/**
 * UserItem - Component rendered in commands menu
 */
const UnMemoizedUserItem: React.FC<UserItemProps> = (props) => {
  const { Avatar = DefaultAvatar, entity } = props;
  return (
    <div className='str-chat__user-item'>
      <Avatar image={entity.image} size={20} />
      <div>
        <strong>{entity.name}</strong> {!entity.name ? entity.id : ''}
      </div>
    </div>
  );
};

export const UserItem = React.memo(
  UnMemoizedUserItem,
) as typeof UnMemoizedUserItem;
