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
    ]).isRequired,
    /** The message for which the action box is displayed */
    message: PropTypes.object.isRequired,
  };

  static defaultProp = {
    open: false,
  };

  actionsBoxRef = React.createRef();

  state = {
    reverse: false,
    rect: null,
  };

  componentDidMount() {}

  async componentDidUpdate(prevProps) {
    if (!prevProps.open && this.props.open) {
      if (this.state.rect === null) {
        await this.setState({
          rect: this.actionsBoxRef.current.getBoundingClientRect(),
        });
      }
      const ml = this.props.messageListRect;

      if (this.props.mine) {
        this.setState({
          reverse: this.state.rect.left < ml.left ? true : false,
        });
      } else if (!this.props.mine) {
        this.setState({
          reverse: this.state.rect.right + 5 > ml.right ? true : false,
        });
      }
    }
  }

  render() {
    const { Message, message } = this.props;
    return (
      <div
        className={`str-chat__message-actions-box
          ${this.props.open ? 'str-chat__message-actions-box--open' : ''}
          ${this.props.mine ? 'str-chat__message-actions-box--mine' : ''}
          ${this.state.reverse ? 'str-chat__message-actions-box--reverse' : ''}
        `}
        ref={this.actionsBoxRef}
      >
        <ul className="str-chat__message-actions-list">
          {!Message.isMyMessage(message) && (
            <button onClick={Message.handleFlag}>
              <li className="str-chat__message-actions-list-item">Flag</li>
            </button>
          )}
          {!Message.isMyMessage(message) && (
            <button onClick={Message.handleMute}>
              <li className="str-chat__message-actions-list-item">Mute</li>
            </button>
          )}
          {Message.canEditMessage(message) && (
            <button onClick={Message.handleEdit}>
              <li className="str-chat__message-actions-list-item">
                Edit Message
              </li>
            </button>
          )}
          {Message.canDeleteMessage(message) && (
            <button onClick={Message.handleDelete}>
              <li className="str-chat__message-actions-list-item">Delete</li>
            </button>
          )}
        </ul>
      </div>
    );
  }
}
