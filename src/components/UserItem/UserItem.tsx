import React from 'react';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

export type UserItemProps = {
  /** The user */
  entity: {
    /** Id of the user */
    id?: string;
    /** Image of the user */
    image?: string;
    /** The parts of the Name for the emoticon and the user input value for use in custom styling. Default is bold for matches.*/
    itemNameParts: { parts: string[]; match: string };
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

  const itemParts = entity.itemNameParts;
  return (
    <div className='str-chat__user-item'>
      <Avatar image={entity.image} size={20} />
      <span className='str-chat__user-item--name'>
        {itemParts.parts.map((part, i) => 
        part.toLowerCase() === itemParts.match.toLowerCase() ?
          <span className='str-chat__user-item--highlight'key={`part-${i}`}>
            { part }
          </span> : <span className='str-chat__user-item--part'key={`part-${i}`}>
            { part }
          </span>)
        }
      </span>



    </div>
  );
};

export const UserItem = React.memo(
  UnMemoizedUserItem,
) as typeof UnMemoizedUserItem;
