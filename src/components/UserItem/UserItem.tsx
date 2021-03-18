import React from 'react';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

export type UserItemProps = {
  /** The user */
  entity: {
    /** Id of the user */
    id?: string;
    /** Image of the user */
    image?: string;
    /** The parts of the Name for the user item input value for use in custom styling.
     * Default is bold for matches. Will be null if no name provided for entity
     * */
    itemNameParts?: { match: string; parts: string[] };
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

  const hasEntity = Object.keys(entity).length;
  const itemParts = entity?.itemNameParts;

  const renderName = () => {
    if (!hasEntity) return null;

    if (!itemParts) return <div>{entity.id}</div>;

    return (
      hasEntity &&
      itemParts?.parts.map((part, i) =>
        part.toLowerCase() === itemParts.match.toLowerCase() ? (
          <span className='str-chat__emoji-item--highlight' key={`part-${i}`}>
            {part}
          </span>
        ) : (
          <span className='str-chat__emoji-item--part' key={`part-${i}`}>
            {part}
          </span>
        ),
      )
    );
  };

  return (
    <div className='str-chat__user-item'>
      <Avatar image={entity.image} size={20} />
      <span
        className='str-chat__user-item--name'
        data-testid={'user-item-name'}
      >
        {renderName()}
      </span>
    </div>
  );
};

export const UserItem = React.memo(
  UnMemoizedUserItem,
) as typeof UnMemoizedUserItem;
