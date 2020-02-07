import React, { PureComponent } from 'react';
import { Avatar } from './Avatar';
import PropTypes from 'prop-types';

export class UserItem extends PureComponent {
  static propTypes = {
    entity: PropTypes.shape({
      /** Name of the user */
      name: PropTypes.string,
      /** Id of the user */
      id: PropTypes.string,
      /** Image of the user */
      image: PropTypes.string,
    }),
  };
  render() {
    const u = this.props.entity;
    return (
      <div className="str-chat__user-item">
        <Avatar size={20} image={u.image} />
        <div>
          <strong>{u.name}</strong> {!u.name ? u.id : ''}
        </div>
      </div>
    );
  }
}
