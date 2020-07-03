// @ts-check
import React, { useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { TranslationContext } from '../../context';
import { smartRender } from '../../utils';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar } from '../Avatar';
import { Gallery } from '../Gallery';
import { ReactionsList, ReactionSelector } from '../Reactions';
import MessageRepliesCountButton from './MessageRepliesCountButton';
import {
  areMessagePropsEqual,
  messageHasReactions,
  messageHasAttachments,
  getImages,
} from './utils';
import { MessageOptions } from './MessageOptions';
import { MessageText } from './MessageText';
import {
  useUserRole,
  useReactionClick,
  useReactionHandler,
  useActionHandler,
  useOpenThreadHandler,
  useUserHandler,
} from './hooks';

/**
 * MessageCommerce - Render component, should be used together with the Message component
 *
 * @example ../../docs/MessageCommerce.md
 * @type { React.FC<import('types').MessageCommerceProps> }
 */
const MessageCommerce = (props) => {
  const {
    message,
    groupStyles,
    actionsEnabled,
    threadList,
    MessageDeleted,
    getMessageActions,
    handleReaction: propHandleReaction,
    handleAction: propHandleAction,
    handleOpenThread: propHandleOpenThread,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    tDateTimeParser: propTDateTimeParser,
  } = props;
  const Attachment = props.Attachment || DefaultAttachment;
  const hasReactions = messageHasReactions(message);
  const handleAction = useActionHandler(message);
  const handleReaction = useReactionHandler(message);
  const handleOpenThread = useOpenThreadHandler(message);
  const { tDateTimeParser } = useContext(TranslationContext);
  const reactionSelectorRef = useRef(null);
  const { onReactionListClick, showDetailedReactions } = useReactionClick(
    reactionSelectorRef,
    message,
  );
  const { onUserClick, onUserHover } = useUserHandler(
    {
      onUserClickHandler: propOnUserClick,
      onUserHoverHandler: propOnUserHover,
    },
    message,
  );
  const dateTimeParser = propTDateTimeParser || tDateTimeParser;
  const when =
    message &&
    dateTimeParser &&
    dateTimeParser(message.created_at).format('LT');
  const { isMyMessage } = useUserRole(message);
  const messageClasses = `str-chat__message-commerce str-chat__message-commerce--${
    isMyMessage ? 'right' : 'left'
  }`;

  const hasAttachment = messageHasAttachments(message);
  const images = getImages(message);

  const firstGroupStyle = groupStyles ? groupStyles[0] : '';

  if (message?.deleted_at) {
    return smartRender(MessageDeleted, props, null);
  }

  if (
    message &&
    (message.type === 'message.read' || message.type === 'message.date')
  ) {
    return null;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  return (
    <React.Fragment>
      <div
        data-testid="message-commerce-wrapper"
        key={message?.id || ''}
        className={`
						${messageClasses}
						str-chat__message-commerce--${message?.type}
						${
              message?.text
                ? 'str-chat__message-commerce--has-text'
                : 'str-chat__message-commerce--has-no-text'
            }
						${hasAttachment ? 'str-chat__message-commerce--has-attachment' : ''}
						${hasReactions ? 'str-chat__message-commerce--with-reactions' : ''}
						${`str-chat__message-commerce--${firstGroupStyle}`}
					`.trim()}
      >
        {(firstGroupStyle === 'bottom' || firstGroupStyle === 'single') && (
          <Avatar
            image={message?.user?.image}
            size={32}
            name={message?.user?.name || message?.user?.id}
            onClick={onUserClick}
            onMouseOver={onUserHover}
          />
        )}
        <div className="str-chat__message-commerce-inner">
          {message && !message.text && (
            <React.Fragment>
              {
                <MessageOptions
                  {...props}
                  displayLeft={false}
                  displayReplies={false}
                  displayActions={false}
                  onReactionListClick={onReactionListClick}
                  theme={'commerce'}
                />
              }
              {/* if reactions show them */}
              {hasReactions && !showDetailedReactions && (
                <ReactionsList
                  reactions={message.latest_reactions}
                  reaction_counts={message.reaction_counts}
                  onClick={onReactionListClick}
                />
              )}
              {showDetailedReactions && (
                <ReactionSelector
                  reverse={false}
                  handleReaction={propHandleReaction || handleReaction}
                  detailedView
                  reaction_counts={message.reaction_counts}
                  latest_reactions={message.latest_reactions}
                  ref={reactionSelectorRef}
                />
              )}
            </React.Fragment>
          )}

          {message?.attachments &&
            (!images || images.length <= 1) &&
            message.attachments.map(
              /** @type {(item: import('stream-chat').Attachment) => React.ReactElement | null} Typescript syntax */
              (attachment, index) => (
                // @ts-ignore
                <Attachment
                  key={`${message.id}-${index}`}
                  attachment={attachment}
                  actionHandler={propHandleAction || handleAction}
                />
              ),
            )}
          {!!images.length && <Gallery images={images} />}

          {message?.text && (
            <MessageText
              actionsEnabled={actionsEnabled}
              customWrapperClass="str-chat__message-commerce-text"
              customInnerClass="str-chat__message-commerce-text-inner"
              customOptionProps={{
                displayLeft: false,
                displayReplies: false,
                displayActions: false,
                theme: 'commerce',
              }}
              getMessageActions={getMessageActions}
              message={message}
              messageListRect={props.messageListRect}
              unsafeHTML={props.unsafeHTML}
              onMentionsClickMessage={props.onMentionsClickMessage}
              onMentionsHoverMessage={props.onMentionsHoverMessage}
              theme="commerce"
            />
          )}
          {!threadList && (
            <div className="str-chat__message-commerce-reply-button">
              <MessageRepliesCountButton
                onClick={propHandleOpenThread || handleOpenThread}
                reply_count={message?.reply_count}
              />
            </div>
          )}
          <div className="str-chat__message-commerce-data">
            {!isMyMessage ? (
              <span className="str-chat__message-commerce-name">
                {message?.user?.name || message?.user?.id}
              </span>
            ) : null}
            <span className="str-chat__message-commerce-timestamp">{when}</span>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

MessageCommerce.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  // @ts-ignore
  message: PropTypes.object,
  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  // @ts-ignore
  Attachment: PropTypes.elementType,
  /**
   *
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   *
   */
  // @ts-ignore
  Message: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func,
    PropTypes.object,
  ]),
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,
  /** If its parent message in thread. */
  initialMessage: PropTypes.bool,
  /** Channel config object */
  // @ts-ignore
  channelConfig: PropTypes.object,
  /** If component is in thread list */
  threadList: PropTypes.bool,
  /**
   * Function to open thread on current messxage
   * @deprecated The component now relies on the useThreadHandler custom hook
   * You can customize the behaviour for your thread handler on the <Channel> component instead.
   */
  handleOpenThread: PropTypes.func,
  /** Returns true if message belongs to current user */
  isMyMessage: PropTypes.func,
  /** Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute] */
  // @ts-ignore
  getMessageActions: PropTypes.func,
  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
   * @deprecated This component now relies on the useReactionHandler custom hook.
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
   * @deprecated This component now relies on the useActionHandler custom hook, and this prop will be removed on the next major release.
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
   * @deprecated This component now relies on the useUserHandler custom hook, and this prop will be removed on the next major release.
   */
  onUserClick: PropTypes.func,
  /**
   * The handler for mouseOver event on the user that posted the message
   *
   * @param event Dom mouseOver event which triggered handler.
   * @deprecated This component now relies on the useUserHandler custom hook, and this prop will be removed on the next major release.
   */
  onUserHover: PropTypes.func,
  /** The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  // @ts-ignore
  MessageDeleted: PropTypes.elementType,
};

export default React.memo(MessageCommerce, areMessagePropsEqual);
