import React, { PureComponent } from 'react';
import { Attachment } from './Attachment';
import { MessageActionsBox } from './MessageActionsBox';
import { ReactionsList } from './ReactionsList';
import { Avatar } from './Avatar';
import { Tooltip } from './Tooltip';
import { LoadingIndicator } from './LoadingIndicator';
import { Gallery } from './Gallery';
import { ReactionSelector } from './ReactionSelector';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';
import { Modal } from './Modal';
import { MessageInput } from './MessageInput';
import { EditMessageForm } from './EditMessageForm';

import PropTypes from 'prop-types';
import moment from 'moment';

import { isOnlyEmojis, renderText } from '../utils';

/**
 * MessageCommerce - Render component, should be used together with the Message component
 *
 * @example ./docs/MessageSimple.md
 * @extends PureComponent
 */
export class MessageCommerce extends PureComponent {
  static propTypes = {
    /** The message object */
    message: PropTypes.object,
    /** The attachment component */
    Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  };

  static defaultProps = {
    Attachment,
  };

  state = {
    isFocused: false,
    actionsBoxOpen: false,
    showDetailedReactions: false,
  };

  messageActionsRef = React.createRef();
  reactionSelectorRef = React.createRef();

  _onClickOptionsAction = () => {
    this.setState(
      {
        actionsBoxOpen: true,
      },
      () => document.addEventListener('click', this.hideOptions, false),
    );
  };

  _hideOptions = () => {
    this.setState({
      actionsBoxOpen: false,
    });
    document.removeEventListener('click', this.hideOptions, false);
  };

  _clickReactionList = () => {
    this.setState(
      () => ({
        showDetailedReactions: true,
      }),
      () => {
        document.addEventListener('click', this._closeDetailedReactions);
      },
    );
  };

  _closeDetailedReactions = (e) => {
    if (
      !this.reactionSelectorRef.current.reactionSelectorInner.current.contains(
        e.target,
      )
    ) {
      this.setState(
        () => ({
          showDetailedReactions: false,
        }),
        () => {
          document.removeEventListener('click', this._closeDetailedReactions);
        },
      );
    } else {
      return {};
    }
  };

  componentDidUpdate() {
    if (this.props.message.deleted_at || this.props.message.type === 'error') {
      document.removeEventListener('click', this._unfocusMessage);
    }
  }

  componentWillUnmount() {
    if (!this.props.message.deleted_at) {
      document.removeEventListener('click', this._unfocusMessage);
      document.removeEventListener('click', this._closeDetailedReactions);
    }
  }

  isMine() {
    return this.props.message.user.id === this.props.client.user.id;
  }

  formatArray = (arr) => {
    let outStr = '';
    const slicedArr = arr.map((item) => item.id).slice(0, 5);
    const restLength = arr.length - slicedArr.length;
    const lastStr = restLength > 0 ? ' and ' + restLength + ' more' : '';

    if (slicedArr.length === 1) {
      outStr = slicedArr[0] + ' ';
    } else if (slicedArr.length === 2) {
      //joins all with "and" but =no commas
      //example: "bob and sam"
      outStr = slicedArr.join(' and ') + ' ';
    } else if (slicedArr.length > 2) {
      //joins all with commas, but last one gets ", and" (oxford comma!)
      //example: "bob, joe, and sam"
      outStr = slicedArr.join(', ') + lastStr;
    }

    return outStr;
  };

  renderStatus = () => {
    const message = this.props;
    if (!this.isMine() || this.props.message.type === 'error') {
      return null;
    }
    const justSeenByMe =
      message.seenBy.length === 1 &&
      message.seenBy[0].id === this.props.client.user.id;
    if (this.props.message.status === 'sending') {
      return (
        <span className="str-chat__message-commerce-status">
          <Tooltip>Sending...</Tooltip>
          <LoadingIndicator isLoading />
        </span>
      );
    } else if (
      message.seenBy.length !== 0 &&
      !this.props.threadList &&
      !justSeenByMe
    ) {
      return (
        <span className="str-chat__message-commerce-status">
          <Tooltip>{this.formatArray(message.seenBy)}</Tooltip>
          <Avatar
            name={this.props.seenBy[0].id}
            source={this.props.seenBy[0].image}
            size={15}
          />
          {message.seenBy.length > 1 && (
            <span className="str-chat__message-commerce-status-number">
              {message.seenBy.length}
            </span>
          )}
        </span>
      );
    } else if (
      this.props.message.status === 'received' &&
      this.props.message.id === this.props.lastReceivedId &&
      !this.props.threadList
    ) {
      return (
        <span className="str-chat__message-commerce-status">
          <Tooltip>Delivered</Tooltip>
          <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.72 6.633a.955.955 0 1 0-1.352-1.352L6.986 8.663 5.633 7.31A.956.956 0 1 0 4.28 8.663l2.029 2.028a.956.956 0 0 0 1.353 0l4.058-4.058z"
              fill="#006CFF"
              fillRule="evenodd"
            />
          </svg>
        </span>
      );
    } else {
      return null;
    }
  };

  renderOptions() {
    if (this.props.message.type === 'error' || this.props.initialMessage) {
      return;
    }
    if (this.isMine()) {
      return (
        <div className="str-chat__message-commerce__actions">
          <div
            onClick={this._onClickOptionsAction}
            className="str-chat__message-commerce__actions__action str-chat__message-commerce__actions__action--options"
          >
            <MessageActionsBox
              Message={this.props.messageBase}
              open={this.state.actionsBoxOpen}
              mine={this.props.mine}
            />
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
          <div
            className="str-chat__message-commerce__actions__action str-chat__message-commerce__actions__action--reactions"
            onClick={this._clickReactionList}
          >
            <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z"
                fillRule="evenodd"
              />
            </svg>
          </div>
        </div>
      );
    } else {
      return (
        <div className="str-chat__message-commerce__actions">
          <div
            className="str-chat__message-commerce__actions__action str-chat__message-commerce__actions__action--reactions"
            onClick={this._clickReactionList}
          >
            <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z"
                fillRule="evenodd"
              />
            </svg>
          </div>
          {!this.props.threadList && (
            <div
              onClick={this.props.openThread}
              className="str-chat__message-commerce__actions__action str-chat__message-commerce__actions__action--thread"
            >
              <svg width="14" height="10" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z"
                  fill="#000"
                  fillRule="evenodd"
                  opacity=".5"
                />
              </svg>
            </div>
          )}
        </div>
      );
    }
  }

  render() {
    const { message } = this.props;
    const Attachment = this.props.Attachment;
    const when = moment(message.created_at).calendar();

    const messageClasses = this.isMine()
      ? 'str-chat__message str-chat__message--me str-chat__message-commerce str-chat__message-commerce--me'
      : 'str-chat__message str-chat__message-commerce';

    const hasAttachment = Boolean(
      message.attachments && message.attachments.length,
    );
    const images =
      hasAttachment &&
      message.attachments.filter((item) => item.type === 'image');
    const hasReactions = Boolean(
      message.latest_reactions && message.latest_reactions.length,
    );

    if (message.type === 'message.seen') {
      return null;
    }

    if (message.type === 'message.date') {
      return null;
    }

    if (message.deleted_at) {
      return (
        <React.Fragment>
          <span
            key={message.id}
            className={`${messageClasses} str-chat__message--deleted ${
              message.type
            } `}
          >
            {message.user.id === this.props.client.user.id
              ? 'You'
              : message.user.name || message.user.id}{' '}
            deleted this message...
          </span>
          <div className="clearfix" />
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        {this.props.editing && (
          <Modal
            open={this.props.editing}
            onClose={this.props.clearEditingState}
          >
            <MessageInput
              Input={EditMessageForm}
              message={this.props.message}
              clearEditingState={this.props.clearEditingState}
              updateMessage={this.props.updateMessage}
            />
          </Modal>
        )}
        <div
          key={message.id}
          className={`
						${messageClasses}
						str-chat__message--${message.type}
						${message.text ? 'str-chat__message--has-text' : 'has-no-text'}
						${hasAttachment ? 'str-chat__message--has-attachment' : ''}
						${hasReactions ? 'str-chat__message--with-reactions' : ''}
					`.trim()}
          onMouseLeave={this._hideOptions}
          ref={this.messageRef}
        >
          {this.renderStatus()}

          <Avatar
            source={message.user.image}
            name={message.user.name || message.user.id}
          />
          <div className="str-chat__message-inner">
            {!message.text && (
              <React.Fragment>
                {this.renderOptions()}
                {/* if reactions show them */}
                {hasReactions > 0 && !this.state.showDetailedReactions && (
                  <ReactionsList
                    mine={this.isMine()}
                    messageList={this.props.messageListRect}
                    position={this.isMine() ? 'right' : 'left'}
                    reactions={message.latest_reactions}
                    reaction_counts={message.reaction_counts}
                    onClick={this._clickReactionList}
                  />
                )}
                {this.state.showDetailedReactions && (
                  <ReactionSelector
                    reverse={this.isMine()}
                    handleReaction={this.props.handleReaction}
                    actionsEnabled={this.props.actionsEnabled}
                    detailedView
                    reaction_counts={message.reaction_counts}
                    latest_reactions={message.latest_reactions}
                    messageList={this.props.messageListRect}
                    ref={this.reactionSelectorRef}
                  />
                )}
              </React.Fragment>
            )}

            {hasAttachment &&
              images.length <= 1 &&
              message.attachments.map((attachment, index) => (
                <Attachment
                  key={`${message.id}-${index}`}
                  attachment={attachment}
                  actionHandler={this.props.handleAction}
                />
              ))}
            {images.length > 1 && <Gallery images={images} />}

            {message.text && (
              <div className="str-chat__message-text">
                <div
                  className={`
									str-chat__message-text-inner str-chat__message-commerce-text-inner
									${this.state.isFocused ? 'str-chat__message-text-inner--focused' : ''}
									${hasAttachment ? 'str-chat__message-text-inner--has-attachment' : ''}
									${
                    isOnlyEmojis(message.text)
                      ? 'str-chat__message-commerce-text-inner--is-emoji'
                      : ''
                  }
								`.trim()}
                >
                  {message.type === 'error' && (
                    <div className="str-chat__commerce-message--error-message">
                      Error · Unsent
                    </div>
                  )}
                  {renderText(message.text)}

                  {/* if reactions show them */}
                  {hasReactions > 0 && !this.state.showDetailedReactions && (
                    <ReactionsList
                      mine={this.isMine()}
                      messageList={this.props.messageListRect}
                      position={this.isMine() ? 'right' : 'left'}
                      reactions={message.latest_reactions}
                      reaction_counts={message.reaction_counts}
                      onClick={this._clickReactionList}
                    />
                  )}
                  {this.state.showDetailedReactions && (
                    <ReactionSelector
                      reverse={this.isMine()}
                      handleReaction={this.props.handleReaction}
                      actionsEnabled={this.props.actionsEnabled}
                      detailedView
                      reaction_counts={message.reaction_counts}
                      latest_reactions={message.latest_reactions}
                      messageList={this.props.messageListRect}
                      ref={this.reactionSelectorRef}
                    />
                  )}
                </div>

                {message.text && this.renderOptions()}
              </div>
            )}
            {!this.props.threadList && (
              <div className="str-chat__message-commerce-reply-button">
                <MessageRepliesCountButton
                  onClick={this.props.openThread}
                  reply_count={message.reply_count}
                />
              </div>
            )}
            <div className={`str-chat__message-data`}>
              {!this.isMine() ? (
                <span className="str-chat__message-name">
                  {message.user.id}
                </span>
              ) : null}
              <span className="str-chat__message-timestamp">{when}</span>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
