import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { MessageActionsBox } from './MessageActionsBox';

export class MessageActions extends PureComponent {
  static propTypes = {
    onClickReact: PropTypes.func,
    /** If the message actions box should be open or not */
    open: PropTypes.bool.isRequired,
    /**
     * @deprecated
     *
     *  The message component, most logic is delegated to this component and MessageActionsBox uses the following functions explicitly:
     *  `handleFlag`, `handleMute`, `handleEdit`, `handleDelete`, `canDeleteMessage`, `canEditMessage`, `isMyMessage`, `isAdmin`
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
    /**
     * Handler for flaging a current message
     *
     * @param event React's MouseEventHandler event
     * @returns void
     * */
    handleFlag: PropTypes.func,
    /**
     * Handler for muting a current message
     *
     * @param event React's MouseEventHandler event
     * @returns void
     * */
    handleMute: PropTypes.func,
    /**
     * Handler for editing a current message
     *
     * @param event React's MouseEventHandler event
     * @returns void
     * */
    handleEdit: PropTypes.func,
    /**
     * Handler for deleting a current message
     *
     * @param event React's MouseEventHandler event
     * @returns void
     * */
    handleDelete: PropTypes.func,
    /**
     * Returns array of avalable message actions for current message.
     * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
     */
    getMessageActions: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      actionBox: false,
      reactionBox: false,
    };
    this.reactionsBox = React.createRef();
    this.actionsRef = React.createRef();
  }

  _openActionBox = () => {
    this.setState(
      {
        actionBox: true,
      },
      () => {
        document.addEventListener('click', this._closeActionBox);
      },
    );
  };

  _closeActionBox = () => {
    this.setState(
      {
        actionBox: false,
      },
      () => {
        document.removeEventListener('click', this._closeActionBox);
      },
    );
  };

  componentWillUnmount() {
    document.removeEventListener('click', this._closeActionBox);
  }

  render() {
    return (
      <div ref={this.actionsRef} className="str-chat__message-actions">
        <div
          className="str-chat__message-actions-reactions"
          onClick={this.props.onClickReact}
        >
          <svg
            width="20"
            height="18"
            viewBox="0 0 20 18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16.5 4.5H15a.5.5 0 1 1 0-1h1.5V2a.5.5 0 1 1 1 0v1.5H19a.5.5 0 1 1 0 1h-1.5V6a.5.5 0 1 1-1 0V4.5zM9 13c-1.773 0-3.297-.82-4-2h8c-.703 1.18-2.227 2-4 2zm4.057-11.468a.5.5 0 1 1-.479.878A7.45 7.45 0 0 0 9 1.5C4.865 1.5 1.5 4.865 1.5 9s3.365 7.5 7.5 7.5 7.5-3.365 7.5-7.5c0-.315-.02-.628-.058-.937a.5.5 0 1 1 .992-.124c.044.35.066.704.066 1.06 0 4.688-3.813 8.501-8.5 8.501C4.313 17.5.5 13.687.5 9 .5 4.312 4.313.5 9 .5a8.45 8.45 0 0 1 4.057 1.032zM7.561 5.44a1.5 1.5 0 1 1-2.123 2.122 1.5 1.5 0 0 1 2.123-2.122zm5 0a1.5 1.5 0 1 1-2.122 2.122 1.5 1.5 0 0 1 2.122-2.122z"
              fillRule="evenodd"
            />
          </svg>
        </div>
        <div
          className="str-chat__message-actions-options"
          onClick={() => this._openActionBox()}
        >
          <svg
            width="11"
            height="3"
            viewBox="0 0 11 3"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
              fillRule="nonzero"
            />
          </svg>
        </div>
        {/* ActionsBox */}
        <MessageActionsBox {...this.props} open={this.state.actionBox} />
      </div>
    );
  }
}

MessageActions.propTypes = {
  Message: PropTypes.object.isRequired,
};
