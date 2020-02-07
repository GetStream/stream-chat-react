import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export class EmoticonItem extends PureComponent {
  static propTypes = {
    entity: PropTypes.shape({
      /** Name for emoticon */
      name: PropTypes.string,
      /** Native value or actual emoticon */
      native: PropTypes.string,
      /** Representative character for emoticon */
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
