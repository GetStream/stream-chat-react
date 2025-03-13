import React from 'react';
import clsx from 'clsx';

import type { AvatarProps } from '../Avatar';
import { Avatar as DefaultAvatar } from '../Avatar';

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
const UnMemoizedUserItem = ({ Avatar = DefaultAvatar, entity }: UserItemProps) => {
  const hasEntity = !!Object.keys(entity).length;
  // const itemParts = entity?.itemNameParts;

  const renderName = () => {
    if (!hasEntity) return null;

    // return itemParts.parts.map((part, i) => {
    //   const matches = part.toLowerCase() === itemParts.match.toLowerCase();
    //
    //   return (
    //     <span
    //       className={clsx({
    //         'str-chat__emoji-item--highlight': matches,
    //         'str-chat__emoji-item--part': !matches,
    //       })}
    //       key={`part-${i}`}
    //     >
    //       {part}
    //     </span>
    //   );
    // });

    return (
      <span
        className={clsx({
          'str-chat__emoji-item--part': true,
        })}
      >
        {/* FIXME: temporal adjustment so that the component can be rendered */}
        {entity.name ?? entity.id}
      </span>
    );
  };

  return (
    <div className='str-chat__user-item'>
      <Avatar
        className='str-chat__avatar--autocomplete-item'
        image={entity.image}
        name={entity.name || entity.id}
      />
      <span className='str-chat__user-item--name' data-testid={'user-item-name'}>
        {renderName()}
      </span>
      <div className='str-chat__user-item-at'>@</div>
    </div>
  );
};

export const UserItem = React.memo(UnMemoizedUserItem) as typeof UnMemoizedUserItem;
