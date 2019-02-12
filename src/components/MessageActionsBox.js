import React from 'react';
import PropTypes from 'prop-types';

/**
 * MessageActionsBox - A component for taking action on a message
 *
 * @example ./docs/MessageActionsBox.md
 * @extends PureComponent
 */
export class MessageActionsBox extends React.Component {
  static propTypes = {
    /** If the message actions box should be open or not */
    open: PropTypes.bool.isRequired,

    /** The message component, most logic is delegated to this component */
    Message: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.func,
      PropTypes.object,
    ]),
  };

  static defaultProp = {
    open: false,
  };

  render() {
    const { mine } = this.props;
    return (
      <div
        className={`str-chat__message-actions-box ${
          this.props.open ? 'str-chat__message-actions-box--open' : ''
        }`}
      >
        <ul className="str-chat__message-actions-list">
          {!mine && (
            <button onClick={this.props.Message.handleFlag}>
              <li className="str-chat__message-actions-list-item">Flag</li>
            </button>
          )}
          {!mine && (
            <button onClick={this.props.Message.handleMute}>
              <li className="str-chat__message-actions-list-item">Mute</li>
            </button>
          )}
          {mine && (
            <button onClick={this.props.Message.handleEdit}>
              <li className="str-chat__message-actions-list-item">
                Edit Message
              </li>
            </button>
          )}
          {mine && (
            <button onClick={this.props.Message.handleDelete}>
              <li className="str-chat__message-actions-list-item">Delete</li>
            </button>
          )}
        </ul>
      </div>
    );
  }
}
