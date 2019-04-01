import React, { PureComponent } from 'react';
import { Attachment } from './Attachment';
import { Avatar } from './Avatar';
import { MessageActionsBox } from './MessageActionsBox';
import { ReactionSelector } from './ReactionSelector';
import { EditMessageForm } from './EditMessageForm';
import { SimpleReactionsList } from './SimpleReactionsList';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';
import { LoadingIndicator } from './LoadingIndicator';
import { Tooltip } from './Tooltip';
import { Gallery } from './Gallery';
import { MessageInput } from './MessageInput';
import PropTypes from 'prop-types';
import moment from 'moment';

import { isOnlyEmojis, renderText } from '../utils';

const reactionSvg =
  '<svg width="14" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z" fillRule="evenodd"/></svg>';
const threadSvg =
  '<svg width="14" height="10" xmlns="http://www.w3.org/2000/svg"><path d="M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z" fillRule="evenodd" /></svg>';
const optionsSvg =
  '<svg width="11" height="3" viewBox="0 0 11 3" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fillRule="nonzero" /></svg>';

/**
 * MessageTeam - Render component, should be used together with the Message component
 * Implements the look and feel for a team style collaboration environment
 *
 * @example ./docs/MessageTeam.md
 * @extends PureComponent
 */
export class MessageTeam extends PureComponent {
  static propTypes = {
    /** The message object */
    message: PropTypes.object,
    /** The attachment component */
    Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** The message component, most logic is delegated to this component */
    Message: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.func,
      PropTypes.object,
    ]).isRequired,
    groupStyles: PropTypes.array,
  };

  static defaultProps = {
    Attachment,
    groupStyles: ['single'],
  };

  state = {
    actionsBoxOpen: false,
    reactionSelectorOpen: false,
  };

  reactionSelectorRef = React.createRef();
  editMessageFormRef = React.createRef();

  onClickReactionsAction = () => {
    this.setState(
      {
        reactionSelectorOpen: true,
      },
      () => document.addEventListener('click', this.hideReactions, false),
    );
  };

  onClickOptionsAction = () => {
    this.setState(
      {
        actionsBoxOpen: true,
      },
      () => document.addEventListener('click', this.hideOptions, false),
    );
  };

  hideOptions = () => {
    this.setState({
      actionsBoxOpen: false,
    });
    document.removeEventListener('click', this.hideOptions, false);
  };

  hideReactions = (e) => {
    if (
      !this.reactionSelectorRef.current.reactionSelector.current.contains(
        e.target,
      )
    ) {
      this.setState({
        reactionSelectorOpen: false,
      });
      document.removeEventListener('click', this.hideReactions, false);
    }
  };

  onMouseLeaveMessage = () => {
    this.hideOptions();
    this.setState(
      {
        reactionSelectorOpen: false,
      },
      () => document.removeEventListener('click', this.hideReactions, false),
    );
  };

  // https://stackoverflow.com/a/29234240/7625485
  formatArray = (arr) => {
    let outStr = '';
    const slicedArr = arr.map((item) => item.name || item.id).slice(0, 5);
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

  isMine() {
    return this.props.Message.isMyMessage(this.props.message);
  }

  renderStatus = () => {
    const message = this.props;
    if (!this.isMine() || message.type === 'error') {
      return null;
    }
    const justReadByMe =
      message.readBy.length === 1 &&
      message.readBy[0].id === this.props.client.user.id;
    if (this.props.message.status === 'sending') {
      return (
        <span className="str-chat__message-team-status">
          <Tooltip>Sending...</Tooltip>
          <LoadingIndicator isLoading />
        </span>
      );
    } else if (
      message.readBy.length !== 0 &&
      !this.props.threadList &&
      !justReadByMe
    ) {
      return (
        <span className="str-chat__message-team-status">
          <Tooltip>{this.formatArray(message.readBy)}</Tooltip>
          <Avatar
            name={this.props.readBy[0].id}
            image={this.props.readBy[0].image}
            size={15}
          />
          {message.readBy.length > 1 && (
            <span className="str-chat__message-team-status-number">
              {message.readBy.length}
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
        <span className="str-chat__message-team-status">
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
  componentWillUnmount() {
    document.removeEventListener('click', this.hideOptions, false);
    document.removeEventListener('click', this.hideReactions, false);
  }

  render() {
    const { message, groupStyles } = this.props;
    if (message.type === 'message.read') {
      return null;
    }
    const hasAttachment = Boolean(
      message.attachments && message.attachments.length,
    );
    const Attachment = this.props.Attachment;

    if (message.deleted_at) {
      return null;
    }

    let galleryImages =
      message.attachments &&
      message.attachments.filter((item) => item.type === 'image');
    let attachments = message.attachments;
    if (galleryImages && galleryImages.length > 1) {
      attachments = message.attachments.filter((item) => item.type !== 'image');
    } else {
      galleryImages = [];
    }

    // determine reaction selector alignment
    const reactionDirection = 'left';

    if (this.props.editing) {
      return (
        <div
          className={`str-chat__message-team str-chat__message-team--${
            groupStyles[0]
          } str-chat__message-team--editing`}
          onMouseLeave={this.onMouseLeaveMessage}
        >
          {(groupStyles[0] === 'top' || groupStyles[0] === 'single') && (
            <div className="str-chat__message-team-meta">
              <Avatar
                image={message.user.image}
                name={message.user.name || message.user.id}
                size={40}
              />
            </div>
          )}
          <MessageInput
            Input={EditMessageForm}
            message={this.props.message}
            clearEditingState={this.props.clearEditingState}
            updateMessage={this.props.updateMessage}
          />
        </div>
      );
    }

    return (
      <React.Fragment>
        <div
          className={`str-chat__message-team str-chat__message-team--${
            groupStyles[0]
          } str-chat__message-team--${message.type} ${
            this.props.threadList ? 'thread-list' : ''
          } str-chat__message-team--${message.status}`}
          onMouseLeave={this.onMouseLeaveMessage}
        >
          <div className="str-chat__message-team-meta">
            {groupStyles[0] === 'top' ||
            groupStyles[0] === 'single' ||
            this.props.initialMessage ? (
              <Avatar
                image={message.user.image}
                name={message.user.name || message.user.id}
                size={40}
              />
            ) : (
              <div style={{ width: 40, marginRight: 0 }} />
            )}

            <time dateTime={message.created_at} title={message.created_at}>
              {Boolean(Date.parse(message.created_at)) &&
                moment(message.created_at).format('h:mmA')}
            </time>
          </div>
          <div className="str-chat__message-team-group">
            {(groupStyles[0] === 'top' ||
              groupStyles[0] === 'single' ||
              this.props.initialMessage) && (
              <div className="str-chat__message-team-author">
                <strong>{message.user.name || message.user.id}</strong>
                {message.type === 'error' && (
                  <div className="str-chat__message-team-error-header">
                    Only visible to you
                  </div>
                )}
              </div>
            )}
            <div
              className={`str-chat__message-team-content str-chat__message-team-content--${
                groupStyles[0]
              } str-chat__message-team-content--${
                message.text === '' ? 'image' : 'text'
              }`}
            >
              {!this.props.initialMessage &&
                message.status !== 'sending' &&
                message.status !== 'failed' &&
                message.type !== 'error' && (
                  <div className={`str-chat__message-team-actions`}>
                    {this.state.reactionSelectorOpen && (
                      <ReactionSelector
                        handleReaction={this.props.handleReaction}
                        latest_reactions={message.latest_reactions}
                        reaction_counts={message.reaction_counts}
                        detailedView={true}
                        direction={reactionDirection}
                        ref={this.reactionSelectorRef}
                      />
                    )}

                    <span
                      title="Reactions"
                      dangerouslySetInnerHTML={{
                        __html: reactionSvg,
                      }}
                      onClick={this.onClickReactionsAction}
                    />
                    {!this.props.threadList && (
                      <span
                        title="Start a thread"
                        dangerouslySetInnerHTML={{
                          __html: threadSvg,
                        }}
                        onClick={(e) => this.props.openThread(e, message)}
                      />
                    )}
                    <span onClick={this.onClickOptionsAction}>
                      <span
                        title="Message actions"
                        dangerouslySetInnerHTML={{
                          __html: optionsSvg,
                        }}
                      />
                      <MessageActionsBox
                        Message={this.props.Message}
                        open={this.state.actionsBoxOpen}
                        message={this.props.message}
                        messageListRect={this.props.messageListRect}
                        mine={this.props.Message.isMyMessage(
                          this.props.message,
                        )}
                      />
                    </span>
                  </div>
                )}
              <span
                className={
                  isOnlyEmojis(message.text)
                    ? 'str-chat__message-team-text--is-emoji'
                    : ''
                }
              >
                {renderText(message.text)}
              </span>

              {galleryImages.length !== 0 && <Gallery images={galleryImages} />}

              {message.text === '' &&
                attachments.map((attachment, index) => (
                  <Attachment
                    key={`${message.id}-${index}`}
                    attachment={attachment}
                    actionHandler={this.props.handleAction}
                  />
                ))}

              {message.latest_reactions &&
                message.latest_reactions.length !== 0 &&
                message.text !== '' && (
                  <SimpleReactionsList
                    reaction_counts={message.reaction_counts}
                    handleReaction={this.props.handleReaction}
                    reactions={message.latest_reactions}
                  />
                )}
              {message.status === 'failed' && (
                <button
                  className="str-chat__message-team-failed"
                  onClick={this.props.handleRetry.bind(
                    this,
                    this.props.message,
                  )}
                >
                  <svg
                    width="14"
                    height="14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 0a7 7 0 1 0 0 14A7 7 0 0 0 7 0zm.875 10.938a.438.438 0 0 1-.438.437h-.875a.438.438 0 0 1-.437-.438v-.874c0-.242.196-.438.438-.438h.875c.241 0 .437.196.437.438v.874zm0-2.626a.438.438 0 0 1-.438.438h-.875a.438.438 0 0 1-.437-.438v-5.25c0-.241.196-.437.438-.437h.875c.241 0 .437.196.437.438v5.25z"
                      fill="#EA152F"
                      fillRule="evenodd"
                    />
                  </svg>
                  Message failed. Click to try again.
                </button>
              )}
            </div>
            {this.renderStatus()}
            {message.text !== '' &&
              hasAttachment &&
              attachments.map((attachment, index) => (
                <Attachment
                  key={`${message.id}-${index}`}
                  attachment={attachment}
                  actionHandler={this.props.handleAction}
                />
              ))}
            {message.latest_reactions &&
              message.latest_reactions.length !== 0 &&
              message.text === '' && (
                <SimpleReactionsList
                  reaction_counts={message.reaction_counts}
                  handleReaction={this.props.handleReaction}
                  reactions={message.latest_reactions}
                />
              )}
            {!this.props.threadList && (
              <MessageRepliesCountButton
                onClick={this.props.openThread}
                reply_count={message.reply_count}
              />
            )}
          </div>
        </div>
      </React.Fragment>
    );
  }
}
