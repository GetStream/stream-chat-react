// @ts-check
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import MessageRepliesCountButton from './MessageRepliesCountButton';
import {
  isOnlyEmojis,
  renderText,
  getReadByTooltipText,
  smartRender,
} from '../../utils';
import { withTranslationContext } from '../../context';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar } from '../Avatar';
import { Gallery } from '../Gallery';
import { Modal } from '../Modal';
import { MessageInput, EditMessageForm } from '../MessageInput';
import { MessageActionsBox } from '../MessageActions';
import { Tooltip } from '../Tooltip';
import { LoadingIndicator } from '../Loading';
import { ReactionsList, ReactionSelector } from '../Reactions';
import DefaultMessageDeleted from '../MessageDeleted';

/**
 * MessageSimple - Render component, should be used together with the Message component
 *
 * @example ../../docs/MessageSimple.md
 * @typedef { import('types').MessageSimpleProps } Props
 * @typedef { import('types').MessageSimpleState } State
 * @extends PureComponent<Props, State>
 */
class MessageSimple extends PureComponent {
  static propTypes = {
    /** The [message object](https://getstream.io/chat/docs/#message_format) */
    message: PropTypes.object,
    /**
     * The attachment UI component.
     * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
     * */
    Attachment: PropTypes.elementType,
    /**
     * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
     *
     * The higher order message component, most logic is delegated to this component
     * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
     *
     * */
    Message: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.func,
      PropTypes.object,
    ]).isRequired,
    /** render HTML instead of markdown. Posting HTML is only allowed server-side */
    unsafeHTML: PropTypes.bool,
    /** Client object */
    client: PropTypes.object,
    /** If its parent message in thread. */
    initialMessage: PropTypes.bool,
    /** Channel config object */
    channelConfig: PropTypes.object,
    /** If component is in thread list */
    threadList: PropTypes.bool,
    /** Function to open thread on current messxage */
    handleOpenThread: PropTypes.func,
    /** If the message is in edit state */
    editing: PropTypes.bool,
    /** Function to exit edit state */
    clearEditingState: PropTypes.func,
    /** Returns true if message belongs to current user */
    isMyMessage: PropTypes.func,
    /**
     * Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute]
     * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
     * */
    getMessageActions: PropTypes.func,
    /**
     * Function to publish updates on message to channel
     *
     * @param message Updated [message object](https://getstream.io/chat/docs/#message_format)
     * */
    updateMessage: PropTypes.func,
    /**
     * Reattempt sending a message
     * @param message A [message object](https://getstream.io/chat/docs/#message_format) to resent.
     */
    handleRetry: PropTypes.func,
    /**
     * Add or remove reaction on message
     *
     * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
     * @param event Dom event which triggered this function
     */
    handleReaction: PropTypes.func,
    /** If actions such as edit, delete, flag, mute are enabled on message */
    actionsEnabled: PropTypes.bool,
    /** DOMRect object for parent MessageList component */
    messageListRect: PropTypes.object,
    /**
     * Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
     *
     * @param name {string} Name of action
     * @param value {string} Value of action
     * @param event Dom event that triggered this handler
     */
    handleAction: PropTypes.func,
    /**
     * The handler for hover event on @mention in message
     *
     * @param event Dom hover event which triggered handler.
     * @param user Target user object
     */
    onMentionsHoverMessage: PropTypes.func,
    /**
     * The handler for click event on @mention in message
     *
     * @param event Dom click event which triggered handler.
     * @param user Target user object
     */
    onMentionsClickMessage: PropTypes.func,
    /**
     * The handler for click event on the user that posted the message
     *
     * @param event Dom click event which triggered handler.
     */
    onUserClick: PropTypes.func,
    /**
     * The handler for mouseOver event on the user that posted the message
     *
     * @param event Dom mouseOver event which triggered handler.
     */
    onUserHover: PropTypes.func,
    /**
     * Additional props for underlying MessageInput component.
     * Available props - https://getstream.github.io/stream-chat-react/#messageinput
     * */
    additionalMessageInputProps: PropTypes.object,
    /**
     * The component that will be rendered if the message has been deleted.
     * All of Message's props are passed into this component.
     */
    MessageDeleted: PropTypes.elementType,
  };

  static defaultProps = {
    Attachment: DefaultAttachment,
    MessageDeleted: DefaultMessageDeleted,
  };

  state = {
    isFocused: false,
    actionsBoxOpen: false,
    showDetailedReactions: false,
  };

  messageActionsRef = React.createRef();

  reactionSelectorRef = React.createRef();

  /** @type {() => void} Typescript syntax */
  _onClickOptionsAction = () => {
    this.setState(
      {
        actionsBoxOpen: true,
      },
      () => document.addEventListener('click', this._hideOptions, false),
    );
  };

  /** @type {() => void} Typescript syntax */
  _hideOptions = () => {
    this.setState({
      actionsBoxOpen: false,
    });
    document.removeEventListener('click', this._hideOptions, false);
  };

  /** @type {() => void} Typescript syntax */
  _clickReactionList = () => {
    this.setState(
      () => ({
        showDetailedReactions: true,
      }),
      () => {
        document.addEventListener('click', this._closeDetailedReactions);
        document.addEventListener('touchend', this._closeDetailedReactions);
      },
    );
  };

  /** @type {EventListener} Typescript syntax */
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
          document.removeEventListener(
            'touchend',
            this._closeDetailedReactions,
          );
        },
      );
    }
  };

  componentWillUnmount() {
    if (!this.props.message?.deleted_at) {
      document.removeEventListener('click', this._closeDetailedReactions);
      document.removeEventListener('touchend', this._closeDetailedReactions);
      document.removeEventListener('click', this._hideOptions);
    }
  }

  isMine() {
    const { message, isMyMessage } = this.props;
    if (!message || !isMyMessage) {
      return false;
    }
    return isMyMessage(message);
  }

  hasReactions = () => {
    const { message } = this.props;
    if (!message) {
      return false;
    }
    return Boolean(message.latest_reactions && message.latest_reactions.length);
  };

  hasAttachment = () => {
    const { message } = this.props;
    return Boolean(
      message && message.attachments && message.attachments.length,
    );
  };

  renderStatus = () => {
    const {
      readBy,
      client,
      message,
      threadList,
      lastReceivedId,
      t,
    } = this.props;
    if (!this.isMine() || message?.type === 'error') {
      return null;
    }
    const justReadByMe =
      readBy &&
      readBy.length === 1 &&
      readBy[0] &&
      client &&
      readBy[0].id === client.user.id;
    if (message && message.status === 'sending') {
      return (
        <span
          className="str-chat__message-simple-status"
          data-testid="message-status-sending"
        >
          <Tooltip>{t && t('Sending...')}</Tooltip>
          <LoadingIndicator />
        </span>
      );
    }
    if (readBy && readBy.length !== 0 && !threadList && !justReadByMe) {
      const lastReadUser = readBy.filter(
        /** @type {(item: import('stream-chat').UserResponse) => boolean} Typescript syntax */
        (item) => !!item && !!client && item.id !== client.user.id,
      )[0];
      return (
        <span
          className="str-chat__message-simple-status"
          data-testid="message-status-read-by"
        >
          <Tooltip>
            {readBy &&
              getReadByTooltipText(readBy, this.props.t, this.props.client)}
          </Tooltip>
          <Avatar
            name={lastReadUser && lastReadUser.name ? lastReadUser.name : null}
            image={
              lastReadUser && lastReadUser.image ? lastReadUser.image : null
            }
            size={15}
          />
          {readBy.length > 2 && (
            <span
              className="str-chat__message-simple-status-number"
              data-testid="message-status-read-by-many"
            >
              {readBy.length - 1}
            </span>
          )}
        </span>
      );
    }
    if (
      message &&
      message.status === 'received' &&
      message.id === lastReceivedId &&
      !threadList
    ) {
      return (
        <span
          className="str-chat__message-simple-status"
          data-testid="message-status-received"
        >
          <Tooltip>{t && t('Delivered')}</Tooltip>
          <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.72 6.633a.955.955 0 1 0-1.352-1.352L6.986 8.663 5.633 7.31A.956.956 0 1 0 4.28 8.663l2.029 2.028a.956.956 0 0 0 1.353 0l4.058-4.058z"
              fill="#006CFF"
              fillRule="evenodd"
            />
          </svg>
        </span>
      );
    }
    return null;
  };

  renderMessageActions = () => {
    const {
      Message,
      getMessageActions,
      messageListRect,
      handleFlag,
      handleMute,
      handleEdit,
      handleDelete,
      isUserMuted,
    } = this.props;
    const messageActions = getMessageActions();

    if (messageActions.length === 0) {
      return null;
    }

    return (
      <div
        data-testid="message-actions"
        onClick={this._onClickOptionsAction}
        className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options"
      >
        <MessageActionsBox
          Message={Message}
          getMessageActions={getMessageActions}
          open={this.state.actionsBoxOpen}
          messageListRect={messageListRect}
          handleFlag={handleFlag}
          isUserMuted={isUserMuted}
          handleMute={handleMute}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          mine={this.isMine()}
        />
        <svg
          width="11"
          height="4"
          viewBox="0 0 11 4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
            fillRule="nonzero"
          />
        </svg>
      </div>
    );
  };

  renderOptions() {
    const {
      message,
      initialMessage,
      channelConfig,
      threadList,
      handleOpenThread,
    } = this.props;
    if (
      !message ||
      message.type === 'error' ||
      message.type === 'system' ||
      message.type === 'ephemeral' ||
      message.status === 'failed' ||
      message.status === 'sending' ||
      initialMessage
    ) {
      return null;
    }
    if (this.isMine()) {
      return (
        <div className="str-chat__message-simple__actions">
          {this.renderMessageActions()}
          {!threadList && channelConfig && channelConfig.replies && (
            <div
              data-testid="thread-action"
              onClick={handleOpenThread}
              className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--thread"
            >
              <svg width="14" height="10" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z"
                  fillRule="evenodd"
                />
              </svg>
            </div>
          )}
          {channelConfig && channelConfig.reactions && (
            <div
              data-testid="simple-message-reaction-action"
              className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--reactions"
              onClick={this._clickReactionList}
            >
              <svg
                width="16"
                height="14"
                viewBox="0 0 16 14"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z"
                  fillRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="str-chat__message-simple__actions">
        {channelConfig && channelConfig.reactions && (
          <div
            className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--reactions"
            onClick={this._clickReactionList}
          >
            <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z"
                fillRule="evenodd"
              />
            </svg>
          </div>
        )}
        {!threadList && channelConfig && channelConfig.replies && (
          <div
            onClick={handleOpenThread}
            className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--thread"
          >
            <svg width="14" height="10" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z"
                fillRule="evenodd"
              />
            </svg>
          </div>
        )}
        {this.renderMessageActions()}
      </div>
    );
  }

  renderMessageText = () => {
    const {
      actionsEnabled,
      message,
      unsafeHTML,
      handleReaction,
      onMentionsHoverMessage,
      onMentionsClickMessage,
      messageListRect,
      t,
    } = this.props;
    const hasReactions = this.hasReactions();
    const hasAttachment = this.hasAttachment();

    if (!message || !message.text) {
      return null;
    }

    return (
      <div className="str-chat__message-text">
        <div
          data-testid="message-simple-inner-wrapper"
          className={`
            str-chat__message-text-inner str-chat__message-simple-text-inner
            ${
              this.state.isFocused
                ? 'str-chat__message-text-inner--focused'
                : ''
            }
            ${
              hasAttachment
                ? 'str-chat__message-text-inner--has-attachment'
                : ''
            }
            ${
              isOnlyEmojis(message.text)
                ? 'str-chat__message-simple-text-inner--is-emoji'
                : ''
            }
          `.trim()}
          onMouseOver={onMentionsHoverMessage}
          onClick={onMentionsClickMessage}
        >
          {message.type === 'error' && (
            <div className="str-chat__simple-message--error-message">
              {t && t('Error · Unsent')}
            </div>
          )}
          {message.status === 'failed' && (
            <div className="str-chat__simple-message--error-message">
              {t && t('Message Failed · Click to try again')}
            </div>
          )}

          {unsafeHTML ? (
            <div dangerouslySetInnerHTML={{ __html: message.html }} />
          ) : (
            renderText(message)
          )}

          {/* if reactions show them */}
          {hasReactions && !this.state.showDetailedReactions && (
            <ReactionsList
              reactions={message.latest_reactions}
              reaction_counts={message.reaction_counts}
              onClick={this._clickReactionList}
              reverse={true}
            />
          )}
          {this.state.showDetailedReactions && (
            <ReactionSelector
              mine={this.isMine()}
              handleReaction={handleReaction}
              actionsEnabled={actionsEnabled}
              detailedView
              reaction_counts={message.reaction_counts}
              latest_reactions={message.latest_reactions}
              messageList={messageListRect}
              ref={this.reactionSelectorRef}
            />
          )}
        </div>
        {this.renderOptions()}
      </div>
    );
  };

  render() {
    const {
      message,
      Attachment,
      editing,
      clearEditingState,
      handleRetry,
      updateMessage,
      handleReaction,
      messageListRect,
      handleAction,
      onUserClick,
      onUserHover,
      threadList,
      handleOpenThread,
      tDateTimeParser,
      MessageDeleted,
    } = this.props;
    const when =
      tDateTimeParser &&
      message &&
      tDateTimeParser(message.created_at).calendar &&
      tDateTimeParser(message.created_at).calendar();
    const hasReactions = this.hasReactions();
    const hasAttachment = this.hasAttachment();

    const messageClasses = this.isMine()
      ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
      : 'str-chat__message str-chat__message-simple';

    const images =
      hasAttachment &&
      message?.attachments?.filter(
        /** @type {(item: import('stream-chat').Attachment) => boolean} Typescript syntax */
        (item) => item.type === 'image',
      );

    if (message?.type === 'message.read' || message?.type === 'message.date') {
      return null;
    }

    if (message?.deleted_at) {
      return smartRender(MessageDeleted, this.props, null);
    }
    return (
      <React.Fragment>
        {editing && (
          <Modal open={editing} onClose={clearEditingState}>
            <MessageInput
              Input={EditMessageForm}
              message={message}
              clearEditingState={clearEditingState}
              updateMessage={updateMessage}
              {...this.props.additionalMessageInputProps}
            />
          </Modal>
        )}
        {message && (
          <div
            key={message.id || ''}
            className={`
						${messageClasses}
						str-chat__message--${message.type}
						str-chat__message--${message.status}
						${message.text ? 'str-chat__message--has-text' : 'has-no-text'}
						${hasAttachment ? 'str-chat__message--has-attachment' : ''}
						${hasReactions ? 'str-chat__message--with-reactions' : ''}
					`.trim()}
            onMouseLeave={this._hideOptions}
          >
            {this.renderStatus()}

            {message.user && (
              <Avatar
                image={message.user.image}
                name={message.user.name || message.user.id}
                onClick={onUserClick}
                onMouseOver={onUserHover}
              />
            )}
            <div
              data-testid="message-inner"
              className="str-chat__message-inner"
              onClick={() => {
                if (message.status === 'failed' && handleRetry) {
                  // FIXME: type checking fails here because in the case of a failed message,
                  // `message` is of type Client.Message (i.e. request object)
                  // instead of Client.MessageResponse (i.e. server response object)
                  // @ts-ignore
                  handleRetry(message);
                }
              }}
            >
              {!message.text && (
                <React.Fragment>
                  {this.renderOptions()}
                  {/* if reactions show them */}
                  {hasReactions && !this.state.showDetailedReactions && (
                    <ReactionsList
                      reactions={message.latest_reactions}
                      reaction_counts={message.reaction_counts}
                      onClick={this._clickReactionList}
                      reverse={true}
                    />
                  )}
                  {this.state.showDetailedReactions && (
                    <ReactionSelector
                      handleReaction={handleReaction}
                      detailedView
                      reaction_counts={message.reaction_counts}
                      latest_reactions={message.latest_reactions}
                      messageList={messageListRect}
                      ref={this.reactionSelectorRef}
                    />
                  )}
                </React.Fragment>
              )}

              <div className="str-chat__message-attachment-container">
                {hasAttachment &&
                  message.attachments?.map(
                    /** @type {(item: import('stream-chat').Attachment) => React.ReactElement | null} Typescript syntax */
                    (attachment, index) => {
                      if (
                        attachment.type === 'image' &&
                        images &&
                        images.length > 1
                      )
                        return null;
                      return (
                        // @ts-ignore Attachment is not yet typed
                        <Attachment
                          key={`${message.id}-${index}`}
                          attachment={attachment}
                          actionHandler={handleAction}
                        />
                      );
                    },
                  )}
              </div>
              {images && images.length > 1 && <Gallery images={images} />}
              {message.text && this.renderMessageText()}
              {!threadList && message.reply_count !== 0 && (
                <div className="str-chat__message-simple-reply-button">
                  <MessageRepliesCountButton
                    onClick={handleOpenThread}
                    reply_count={message.reply_count}
                  />
                </div>
              )}
              <div
                className={`str-chat__message-data str-chat__message-simple-data`}
              >
                {!this.isMine() && message.user ? (
                  <span className="str-chat__message-simple-name">
                    {message.user.name || message.user.id}
                  </span>
                ) : null}
                <span className="str-chat__message-simple-timestamp">
                  {when}
                </span>
              </div>
            </div>
          </div>
        )}
      </React.Fragment>
    );
  }
}

export default withTranslationContext(MessageSimple);
