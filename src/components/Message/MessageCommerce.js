import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import MessageRepliesCountButton from './MessageRepliesCountButton';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar } from '../Avatar';
import { Gallery } from '../Gallery';
import { ReactionsList, ReactionSelector } from '../Reactions';
import { isOnlyEmojis, renderText, smartRender } from '../../utils';
import { withTranslationContext } from '../../context';

/**
 * MessageCommerce - Render component, should be used together with the Message component
 *
 * @example ../../docs/MessageSimple.md
 * @extends PureComponent
 */
class MessageCommerce extends PureComponent {
  static propTypes = {
    /** The [message object](https://getstream.io/chat/docs/#message_format) */
    message: PropTypes.object,
    /**
     * The attachment UI component.
     * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
     * */
    Attachment: PropTypes.elementType,
    /**
     *
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
    /** If its parent message in thread. */
    initialMessage: PropTypes.bool,
    /** Channel config object */
    channelConfig: PropTypes.object,
    /** If component is in thread list */
    threadList: PropTypes.bool,
    /** Function to open thread on current messxage */
    handleOpenThread: PropTypes.func,
    /** Returns true if message belongs to current user */
    isMyMessage: PropTypes.func,
    /** Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute] */
    getMessageActions: PropTypes.func,
    /**
     * Add or remove reaction on message
     *
     * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
     * @param event Dom event which triggered this function
     */
    handleReaction: PropTypes.func,
    /** If actions such as edit, delete, flag, mute are enabled on message */
    actionsEnabled: PropTypes.bool,
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
    /** Position of message in group. Possible values: top, bottom, middle, single */
    groupStyles: PropTypes.array,
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
    /** The component that will be rendered if the message has been deleted.
     * All of Message's props are passed into this component.
     */
    MessageDeleted: PropTypes.elementType,
  };

  static defaultProps = {
    Attachment: DefaultAttachment,
  };

  state = {
    isFocused: false,
    showDetailedReactions: false,
  };

  messageActionsRef = React.createRef();

  reactionSelectorRef = React.createRef();

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
    }
  };

  componentWillUnmount() {
    if (!this.props.message.deleted_at) {
      document.removeEventListener('click', this._closeDetailedReactions);
    }
  }

  isMine() {
    return this.props.isMyMessage(this.props.message);
  }

  renderOptions() {
    if (
      this.props.message.type === 'error' ||
      this.props.message.type === 'system' ||
      this.props.message.type === 'ephemeral' ||
      this.props.message.status === 'sending' ||
      this.props.message.status === 'failed' ||
      !this.props.channelConfig.reactions ||
      this.props.initialMessage
    ) {
      return null;
    }

    return (
      <div
        data-testid="message-commerce-actions"
        className="str-chat__message-commerce__actions"
      >
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

  render() {
    const {
      message,
      groupStyles,
      Attachment,
      handleReaction,
      handleAction,
      actionsEnabled,
      onMentionsHoverMessage,
      onMentionsClickMessage,
      onUserClick,
      onUserHover,
      unsafeHTML,
      threadList,
      handleOpenThread,
      t,
      tDateTimeParser,
      MessageDeleted,
    } = this.props;

    const when = tDateTimeParser(message.created_at).format('LT');

    const messageClasses = !this.isMine()
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

    if (message.deleted_at) {
      return smartRender(MessageDeleted, this.props, null);
    }

    if (message.type === 'message.read' || message.type === 'message.date') {
      return null;
    }

    return (
      <React.Fragment>
        <div
          data-testid={'message-commerce-wrapper'}
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
        >
          {(groupStyles[0] === 'bottom' || groupStyles[0] === 'single') && (
            <Avatar
              image={message.user.image}
              size={32}
              name={message.user.name || message.user.id}
              onClick={onUserClick}
              onMouseOver={onUserHover}
            />
          )}
          <div className="str-chat__message-commerce-inner">
            {!message.text && (
              <React.Fragment>
                {this.renderOptions()}
                {/* if reactions show them */}
                {hasReactions && !this.state.showDetailedReactions && (
                  <ReactionsList
                    reactions={message.latest_reactions}
                    reaction_counts={message.reaction_counts}
                    onClick={this._clickReactionList}
                  />
                )}
                {this.state.showDetailedReactions && (
                  <ReactionSelector
                    reverse={false}
                    handleReaction={handleReaction}
                    actionsEnabled={actionsEnabled}
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
                  actionHandler={handleAction}
                />
              ))}
            {images.length > 1 && <Gallery images={images} />}

            {message.text && (
              <div className="str-chat__message-commerce-text">
                <div
                  data-testid="message-commerce-text-inner-wrapper"
                  className={`str-chat__message-commerce-text-inner
									${hasAttachment ? 'str-chat__message-commerce-text-inner--has-attachment' : ''}
									${
                    isOnlyEmojis(message.text)
                      ? 'str-chat__message-commerce-text-inner--is-emoji'
                      : ''
                  }
                `.trim()}
                  onMouseOver={onMentionsHoverMessage}
                  onClick={onMentionsClickMessage}
                >
                  {message.type === 'error' && (
                    <div className="str-chat__commerce-message--error-message">
                      {t('Error · Unsent')}
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
                      reverse
                      reactions={message.latest_reactions}
                      reaction_counts={message.reaction_counts}
                      onClick={this._clickReactionList}
                    />
                  )}
                  {this.state.showDetailedReactions && (
                    <ReactionSelector
                      reverse={false}
                      handleReaction={handleReaction}
                      actionsEnabled={actionsEnabled}
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
            {!threadList && (
              <div className="str-chat__message-commerce-reply-button">
                <MessageRepliesCountButton
                  onClick={handleOpenThread}
                  reply_count={message.reply_count}
                />
              </div>
            )}
            <div className={`str-chat__message-commerce-data`}>
              {!this.isMine() ? (
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

export default withTranslationContext(MessageCommerce);
