import React from 'react';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

export type UserItemProps = {
  /** The user */
  entity: {
    /** The parts of the Name property of the entity (or id if no name) that can be matched to the user input value.
     * Default is bold for matches, but can be overwritten in css.
     * */
    itemNameParts: { match: string; parts: string[] };
    /** Id of the user */
    id?: string;
    /** Image of the user */
    image?: string;
    /** Name of the user */
    name?: string;
  };
  /** Custom UI component to display user avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps>;
};

/**
 * UI component for mentions rendered in suggestion list
 */
const UnMemoizedUserItem: React.FC<UserItemProps> = (props) => {
  const { Avatar = DefaultAvatar, entity } = props;

  const hasEntity = Object.keys(entity).length;
  const itemParts = entity?.itemNameParts;

  const renderName = () => {
    if (!hasEntity) return null;

    return (
      hasEntity &&
      itemParts.parts.map((part, i) =>
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
      <Avatar image={entity.image} name={entity.name || entity.id} size={20} />
      <span className='str-chat__user-item--name' data-testid={'user-item-name'}>
        {renderName()}
      </span>
    </div>
  );
};

export const UserItem = React.memo(UnMemoizedUserItem) as typeof UnMemoizedUserItem;
