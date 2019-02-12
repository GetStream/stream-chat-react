import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export class MessageNotification extends PureComponent {
  static propTypes = {
    /** If we should show the notification or not */
    showNotification: PropTypes.bool,
    /** Onclick handler */
    onClick: PropTypes.func.isRequired,
  };

  static defaultProps = {
    showNotification: true,
  };

  render() {
    if (!this.props.showNotification) {
      return null;
    } else {
      return (
        <button
          className="str-chat__message-notification"
          onClick={this.props.onClick}
        >
          {this.props.children}
        </button>
      );
    }
  }
}
