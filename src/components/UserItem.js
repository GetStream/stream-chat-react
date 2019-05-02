import React, { PureComponent } from 'react';
import { Avatar } from './Avatar';

export class UserItem extends PureComponent {
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
