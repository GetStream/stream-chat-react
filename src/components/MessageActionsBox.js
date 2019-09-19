import React from 'react';
import PropTypes from 'prop-types';
import { MESSAGE_ACTIONS } from '../utils';

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
    /**
     * @deprecated
     *
     *  The message component, most logic is delegated to this component and MessageActionsBox uses the following functions explicitly:
     *  `handleFlag`, `handleMute`, `handleEdit`, `handleDelete`, `canDeleteMessagec`, `canEditMessage`, `isMyMessage`, `isAdmin`
     */
    Message: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.func,
      PropTypes.object,
    ]).isRequired,
    /** If message belongs to current user. */
    mine: PropTypes.bool,
    /** DOMRect object for parent MessageList component */
    messageListRect: PropTypes.object,
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
    const {
      handleFlag,
      handleMute,
      handleEdit,
      handleDelete,
      getMessageActions,
    } = this.props;
    const messageActions = getMessageActions();

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
          {messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1 && (
            <button onClick={handleFlag}>
              <li className="str-chat__message-actions-list-item">Flag</li>
            </button>
          )}
          {messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1 && (
            <button onClick={handleMute}>
              <li className="str-chat__message-actions-list-item">Mute</li>
            </button>
          )}
          {messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 && (
            <button onClick={handleEdit}>
              <li className="str-chat__message-actions-list-item">
                Edit Message
              </li>
            </button>
          )}
          {messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 && (
            <button onClick={handleDelete}>
              <li className="str-chat__message-actions-list-item">Delete</li>
            </button>
          )}
        </ul>
      </div>
    );
  }
}
