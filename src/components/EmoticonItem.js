import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export class EmoticonItem extends PureComponent {
  static propTypes = {
    entity: PropTypes.shape({
      name: PropTypes.string,
      native: PropTypes.string,
      char: PropTypes.string,
    }),
  };

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
