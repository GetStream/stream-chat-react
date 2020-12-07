// @ts-check
import React from 'react';
import PropTypes from 'prop-types';

import { Avatar as DefaultAvatar } from '../Avatar';

/**
 * UserItem - Component rendered in commands menu
 * @typedef {import('types').UserItemProps} Props
 * @type {React.FC<Props>}
 */
const UserItem = ({ Avatar = DefaultAvatar, entity }) => (
  <div className="str-chat__user-item">
    <Avatar size={20} image={entity.image} />
    <div>
      <strong>{entity.name}</strong> {!entity.name ? entity.id : ''}
    </div>
  </div>
);

UserItem.propTypes = {
  entity: PropTypes.shape({
    /** Name of the user */
    name: PropTypes.string,
    /** Id of the user */
    id: PropTypes.string,
    /** Image of the user */
    image: PropTypes.string,
  }).isRequired,
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar: /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */ (PropTypes.elementType),
};

export default React.memo(UserItem);
