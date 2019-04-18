import React, { PureComponent } from 'react';
import { Attachment } from './Attachment';
import { ReactionsList } from './ReactionsList';
import { Avatar } from './Avatar';
import { Gallery } from './Gallery';
import { ReactionSelector } from './ReactionSelector';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';

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
      !this.reactionSelectorRef.current.reactionSelector.current.contains(
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

  componentWillUnmount() {
    if (!this.props.message.deleted_at) {
      document.removeEventListener('click', this._closeDetailedReactions);
    }
  }

  isMine() {
    return !this.props.Message.isMyMessage(this.props.message);
  }

  renderOptions() {
    if (this.props.message.type === 'error' || this.props.initialMessage) {
      return;
    }
    if (this.isMine()) {
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
        </div>
      );
    }
  }

  render() {
    const { message, groupStyles } = this.props;
    const Attachment = this.props.Attachment;
    const when = moment(message.created_at).format('LT');

    const messageClasses = this.isMine()
      ? 'str-chat__message-commerce str-chat__message-commerce--left'
      : 'str-chat__message-commerce str-chat__message-commerce--right';

    const hasAttachment = Boolean(
      message.attachments && message.attachments.length,
    );
    const images =
      hasAttachment &&
      message.attachments.filter((item) => item.type === 'image');
    const hasReactions = Boolean(
      message.latest_reactions && message.latest_reactions.length,
    );

    if (
      message.type === 'message.read' ||
      message.deleted_at ||
      message.type === 'message.date'
    ) {
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
            This message was deleted...
          </span>
          <div className="clearfix" />
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <div
          key={message.id}
          className={`
						${messageClasses}
						str-chat__message-commerce--${message.type}
						${
              message.text
                ? 'str-chat__message-commerce--has-text'
                : 'str-chat__message-commerce--has-no-text'
            }
						${hasAttachment ? 'str-chat__message-commerce--has-attachment' : ''}
						${hasReactions ? 'str-chat__message-commerce--with-reactions' : ''}
						${`str-chat__message-commerce--${groupStyles[0]}`}
					`.trim()}
          onMouseLeave={this._hideOptions}
          ref={this.messageRef}
        >
          {(groupStyles[0] === 'bottom' || groupStyles[0] === 'single') && (
            <Avatar
              image={message.user.image}
              size={32}
              name={message.user.name || message.user.id}
            />
          )}
          <div className="str-chat__message-commerce-inner">
            {!message.text && (
              <React.Fragment>
                {this.renderOptions()}
                {/* if reactions show them */}
                {hasReactions > 0 && !this.state.showDetailedReactions && (
                  <ReactionsList
                    reactions={message.latest_reactions}
                    reaction_counts={message.reaction_counts}
                    onClick={this._clickReactionList}
                  />
                )}
                {this.state.showDetailedReactions && (
                  <ReactionSelector
                    reverse={false}
                    handleReaction={this.props.handleReaction}
                    actionsEnabled={this.props.actionsEnabled}
                    detailedView
                    reaction_counts={message.reaction_counts}
                    latest_reactions={message.latest_reactions}
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
              <div className="str-chat__message-commerce-text">
                <div
                  className={`str-chat__message-commerce-text-inner
									${hasAttachment ? 'str-chat__message-commerce-text-inner--has-attachment' : ''}
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
                  {renderText(message)}

                  {/* if reactions show them */}
                  {hasReactions > 0 && !this.state.showDetailedReactions && (
                    <ReactionsList
                      reverse
                      reactions={message.latest_reactions}
                      reaction_counts={message.reaction_counts}
                      onClick={this._clickReactionList}
                    />
                  )}
                  {this.state.showDetailedReactions && (
                    <ReactionSelector
                      reverse={false}
                      handleReaction={this.props.handleReaction}
                      actionsEnabled={this.props.actionsEnabled}
                      detailedView
                      reaction_counts={message.reaction_counts}
                      latest_reactions={message.latest_reactions}
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
            <div className={`str-chat__message-commerce-data`}>
              {this.isMine() ? (
                <span className="str-chat__message-commerce-name">
                  {message.user.name || message.user.id}
                </span>
              ) : null}
              <span className="str-chat__message-commerce-timestamp">
                {when}
              </span>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
