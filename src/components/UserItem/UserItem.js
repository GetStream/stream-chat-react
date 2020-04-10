import React from 'react';
import PropTypes from 'prop-types';

import { Avatar } from '../';

const UserItem = ({ entity }) => (
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
  }),
};

export default React.memo(UserItem);
