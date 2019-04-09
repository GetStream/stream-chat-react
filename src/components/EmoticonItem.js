import React, { PureComponent } from 'react';

export class EmoticonItem extends PureComponent {
  render() {
    return (
      <div className="str-chat__emoji-item">
        <span className="str-chat__emoji-item--entity">
          {this.props.entity.native}
        </span>
        <span className="str-chat__emoji-item--name">
          {this.props.entity.name}
        </span>
        <span className="str-chat__emoji-item--char">
          {this.props.entity.char}
        </span>
      </div>
    );
  }
}
