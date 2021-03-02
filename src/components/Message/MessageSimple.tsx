import React, { useRef } from 'react';

import {
  MessageDeleted as DefaultMessageDeleted,
  MessageDeletedProps,
} from './MessageDeleted';
import { MessageOptions } from './MessageOptions';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageText } from './MessageText';
import { MessageTimestamp } from './MessageTimestamp';
import {
  ActionHandlerReturnType,
  useActionHandler,
  useOpenThreadHandler,
  useReactionClick,
  useReactionHandler,
  useRetryHandler,
  useUserHandler,
  useUserRole,
} from './hooks';
import { DeliveredCheckIcon, PinIndicatorProps } from './icons';
import {
  areMessagePropsEqual,
  getReadByTooltipText,
  messageHasAttachments,
  messageHasReactions,
} from './utils';

import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { LoadingIndicator } from '../Loading';
import {
  EditMessageForm as DefaultEditMessageForm,
  MessageInput,
} from '../MessageInput';
import { MML } from '../MML';
import { Modal } from '../Modal';
import {
  ReactionsList as DefaultReactionList,
  ReactionSelector as DefaultReactionSelector,
} from '../Reactions';
import { Tooltip } from '../Tooltip';

import {
  RetrySendMessage,
  useChannelContext,
  useChatContext,
  useTranslationContext,
} from '../../context';
import { smartRender } from '../../utils';

import type { ChannelConfigWithInfo } from 'stream-chat';

import type { EventHandlerReturnType, MessageProps } from '.';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type MessageUIComponentProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageProps<At, Ch, Co, Ev, Me, Re, Us> & {
  /** If actions such as edit, delete, flag, mute are enabled on message */
  actionsEnabled: boolean;
  /** Function to exit edit state */
  clearEditingState: (
    event?: React.MouseEvent<HTMLElement, globalThis.MouseEvent> | undefined,
  ) => void;
  /** If the message is in edit state */
  editing: boolean;
  /**
   * Returns all allowed actions on message by current user e.g., ['edit', 'delete', 'flag', 'mute', 'react', 'reply']
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.tsx) component for default implementation.
   * */
  getMessageActions(): Array<string>;
  /** Function to send an action in a channel */
  handleAction: ActionHandlerReturnType;
  /** Function to delete a message in a channel */
  handleDelete: EventHandlerReturnType;
  /** Function to edit a message in a channel */
  handleEdit: EventHandlerReturnType;
  /** Function to flag a message in a channel */
  handleFlag: EventHandlerReturnType;
  /** Function to mute a user in a channel */
  handleMute: EventHandlerReturnType;
  /** Function to open a thread on a message */
  handleOpenThread: EventHandlerReturnType;
  /** Function to pin a message in a channel */
  handlePin: EventHandlerReturnType;
  /** Function to post a reaction on a message */
  handleReaction: (
    reactionType: string,
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => void;
  /** Function to retry sending a message */
  handleRetry: RetrySendMessage<At, Ch, Co, Me, Re, Us>;
  /** Function to toggle the edit state on a message */
  setEditingState: EventHandlerReturnType;
  /** Channel config object */
  channelConfig?: ChannelConfigWithInfo<Co>;
  /**
   * Custom UI component to override default edit message input
   * Defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.tsx)
   * */
  EditMessageInput?: React.ComponentType<unknown>; // TODO - add React.ComponentType<MessageInputProps<generics>> when typed
  /** Whether the threaded message is the first in the thread list */
  initialMessage?: boolean;
  /** Function that returns whether or not the message belongs to the current user */
  isMyMessage?: () => boolean;
  /**
   * The component that will be rendered if the message has been deleted.
   * Defaults to and accepts same props as: [MessageDeleted](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageDeleted.tsx)
   */
  MessageDeleted?: React.ComponentType<
    MessageDeletedProps<At, Ch, Co, Me, Re, Us>
  >;
  /** Handler function for a click event on an @mention in message */
  onMentionsClickMessage?: EventHandlerReturnType;
  /** Handler function for a hover event on an @mention in message */
  onMentionsHoverMessage?: EventHandlerReturnType;
  /** Handler function for a click event on the user that posted the message */
  onUserClick?: EventHandlerReturnType;
  /** Handler function for a hover event on the user that posted the message */
  onUserHover?: EventHandlerReturnType;
  /**
   * Custom UI component to override default pinned message indicator
   * Defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icon.tsx)
   * */
  PinIndicator?: React.ComponentType<PinIndicatorProps>;
  /**
   * A component to display the selector that allows a user to react to a certain message
   * Defaults to and accepts same props as: [ReactionSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionSelector.tsx)
   */
  ReactionSelector?: React.ComponentType<unknown>; // TODO - add generic when Reactions types
  /**
   * A component to display the a message list of reactions
   * Defaults to and accepts same props as: [ReactionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionsList.tsx)
   */
  ReactionsList?: React.ComponentType<unknown>; // TODO - add generic when Reactions types
  /** Whether or not the current message is in a thread */
  threadList?: boolean;
};

/**
 * MessageSimple - Render component, should be used together with the Message component
 *
 * @example ./MessageSimple.md
 */
const UnMemoizedMessageSimple = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    Attachment = DefaultAttachment,
    Avatar = DefaultAvatar,
    clearEditingState,
    editing,
    EditMessageInput = DefaultEditMessageForm,
    formatDate,
    handleAction: propHandleAction,
    handleOpenThread: propHandleOpenThread,
    handleReaction: propHandleReaction,
    handleRetry: propHandleRetry,
    message,
    MessageDeleted = DefaultMessageDeleted,
    onUserClick: onUserClickCustomHandler,
    onUserHover: onUserHoverCustomHandler,
    ReactionSelector = DefaultReactionSelector,
    ReactionsList = DefaultReactionList,
    threadList,
    updateMessage: propUpdateMessage,
  } = props;

  const { updateMessage: channelUpdateMessage } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  const updateMessage = propUpdateMessage || channelUpdateMessage;

  const { isMyMessage } = useUserRole(message);
  const handleOpenThread = useOpenThreadHandler(message);
  const handleReaction = useReactionHandler(message);
  const handleAction = useActionHandler(message);
  const handleRetry = useRetryHandler<At, Ch, Co, Ev, Me, Re, Us>();

  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: onUserClickCustomHandler,
    onUserHoverHandler: onUserHoverCustomHandler,
  });

  const reactionSelectorRef = useRef<HTMLDivElement | null>(null);
  const messageWrapperRef = useRef<HTMLDivElement | null>(null);

  const {
    isReactionEnabled,
    onReactionListClick,
    showDetailedReactions,
  } = useReactionClick(message, reactionSelectorRef);

  const hasReactions = messageHasReactions(message);
  const hasAttachment = messageHasAttachments(message);

  const messageClasses = isMyMessage
    ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
    : 'str-chat__message str-chat__message-simple';

  if (message?.type === 'message.read' || message?.type === 'message.date') {
    return null;
  }

  if (message?.deleted_at) {
    return smartRender(MessageDeleted, { message }, null);
  }

  return (
    <>
      {editing && (
        <Modal onClose={clearEditingState} open={editing}>
          <MessageInput
            clearEditingState={clearEditingState}
            Input={EditMessageInput}
            message={message}
            updateMessage={updateMessage}
            {...props.additionalMessageInputProps}
          />
        </Modal>
      )}
      {message && (
        <div
          className={`
						${messageClasses}
						str-chat__message--${message.type}
						str-chat__message--${message.status}
						${message.text ? 'str-chat__message--has-text' : 'has-no-text'}
						${hasAttachment ? 'str-chat__message--has-attachment' : ''}
            ${
              hasReactions && isReactionEnabled
                ? 'str-chat__message--with-reactions'
                : ''
            }
            ${message?.pinned ? 'pinned-message' : ''}
					`.trim()}
          key={message.id || ''}
          ref={messageWrapperRef}
        >
          <MessageSimpleStatus<At, Ch, Co, Ev, Me, Re, Us> {...props} />
          {message.user && (
            <Avatar
              image={message.user.image}
              name={message.user.name || message.user.id}
              onClick={onUserClick}
              onMouseOver={onUserHover}
            />
          )}
          <div
            className='str-chat__message-inner'
            data-testid='message-inner'
            onClick={() => {
              if (
                message.status === 'failed' &&
                (propHandleRetry || handleRetry)
              ) {
                const retryHandler = propHandleRetry || handleRetry;
                retryHandler(message);
              }
            }}
          >
            {!message.text && (
              <>
                {
                  <MessageOptions<At, Ch, Co, Ev, Me, Re, Us>
                    {...props}
                    handleOpenThread={propHandleOpenThread}
                    messageWrapperRef={messageWrapperRef}
                    onReactionListClick={onReactionListClick}
                  />
                }
                {hasReactions &&
                  !showDetailedReactions &&
                  isReactionEnabled && (
                    <ReactionsList
                      onClick={onReactionListClick}
                      own_reactions={message.own_reactions}
                      reaction_counts={message.reaction_counts || undefined}
                      reactions={message.latest_reactions}
                      reverse={true}
                    />
                  )}
                {showDetailedReactions && isReactionEnabled && (
                  <ReactionSelector
                    detailedView
                    handleReaction={propHandleReaction || handleReaction}
                    latest_reactions={message.latest_reactions}
                    own_reactions={message.own_reactions}
                    reaction_counts={message.reaction_counts || undefined}
                    ref={reactionSelectorRef}
                  />
                )}
              </>
            )}
            {message?.attachments && Attachment && (
              <Attachment<At>
                actionHandler={propHandleAction || handleAction}
                attachments={message.attachments}
              />
            )}
            {message.text && (
              <MessageText<At, Ch, Co, Ev, Me, Re, Us>
                {...props}
                customOptionProps={{
                  handleOpenThread: propHandleOpenThread,
                  messageWrapperRef,
                }}
                reactionSelectorRef={reactionSelectorRef}
              />
            )}
            {message.mml && (
              <MML
                actionHandler={handleAction}
                align={isMyMessage ? 'right' : 'left'}
                source={message.mml}
              />
            )}
            {!threadList && message.reply_count !== 0 && (
              <div className='str-chat__message-simple-reply-button'>
                <MessageRepliesCountButton
                  onClick={propHandleOpenThread || handleOpenThread}
                  reply_count={message.reply_count}
                />
              </div>
            )}
            <div
              className={`str-chat__message-data str-chat__message-simple-data`}
            >
              {!isMyMessage && message.user ? (
                <span className='str-chat__message-simple-name'>
                  {message.user.name || message.user.id}
                </span>
              ) : null}
              <MessageTimestamp<At, Ch, Co, Me, Re, Us>
                calendar
                customClass='str-chat__message-simple-timestamp'
                formatDate={formatDate}
                message={message}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const MessageSimpleStatus = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({
  Avatar = DefaultAvatar,
  readBy,
  message,
  threadList,
  lastReceivedId,
}: MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const { isMyMessage } = useUserRole(message);

  if (!isMyMessage || message?.type === 'error') {
    return null;
  }

  const justReadByMe =
    readBy &&
    readBy.length === 1 &&
    readBy[0] &&
    client &&
    readBy[0].id === client.user?.id;
  if (message && message.status === 'sending') {
    return (
      <span
        className='str-chat__message-simple-status'
        data-testid='message-status-sending'
      >
        <Tooltip>{t('Sending...')}</Tooltip>
        <LoadingIndicator />
      </span>
    );
  }

  if (readBy && readBy.length !== 0 && !threadList && !justReadByMe) {
    const lastReadUser = readBy.filter(
      (item) => !!item && !!client && item.id !== client.user?.id,
    )[0];
    return (
      <span
        className='str-chat__message-simple-status'
        data-testid='message-status-read-by'
      >
        <Tooltip>{readBy && getReadByTooltipText(readBy, t, client)}</Tooltip>
        <Avatar
          image={lastReadUser?.image}
          name={lastReadUser?.name}
          size={15}
        />
        {readBy.length > 2 && (
          <span
            className='str-chat__message-simple-status-number'
            data-testid='message-status-read-by-many'
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
        className='str-chat__message-simple-status'
        data-testid='message-status-received'
      >
        <Tooltip>{t('Delivered')}</Tooltip>
        <DeliveredCheckIcon />
      </span>
    );
  }

  return null;
};

export const MessageSimple = React.memo(
  UnMemoizedMessageSimple,
  areMessagePropsEqual,
) as typeof UnMemoizedMessageSimple;
