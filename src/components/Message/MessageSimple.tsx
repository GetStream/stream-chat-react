import React, { useContext, useRef } from 'react';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';
import { smartRender } from '../../utils';
import { ChannelContext, TranslationContext } from '../../context';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { MML } from '../MML';
import { Modal } from '../Modal';
import {
  EditMessageForm as DefaultEditMessageForm,
  MessageInput,
} from '../MessageInput';
import { Tooltip } from '../Tooltip';
import { LoadingIndicator } from '../Loading';
import {
  ReactionsList as DefaultReactionList,
  ReactionSelector as DefaultReactionSelector,
} from '../Reactions';
import { MessageOptions } from './MessageOptions';
import { MessageText } from './MessageText';
import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import {
  useActionHandler,
  useOpenThreadHandler,
  useReactionClick,
  useReactionHandler,
  useRetryHandler,
  useUserHandler,
  useUserRole,
} from './hooks';
import {
  areMessagePropsEqual,
  getReadByTooltipText,
  messageHasAttachments,
  messageHasReactions,
} from './utils';
import { DeliveredCheckIcon } from './icons';
import { MessageTimestamp } from './MessageTimestamp';

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
import type { MessageUIComponentProps } from 'types';

export interface MessageSimpleProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> extends Omit<
    MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
    'PinIndicator'
  > {}
/**
 * MessageSimple - Render component, should be used together with the Message component
 *
 * @example ../../docs/MessageSimple.md
 */
const UnMemoizedMessageSimple = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    clearEditingState,
    editing,
    EditMessageInput = DefaultEditMessageForm,
    message,
    threadList,
    formatDate,
    updateMessage: propUpdateMessage,
    handleAction: propHandleAction,
    handleOpenThread: propHandleOpenThread,
    handleReaction: propHandleReaction,
    handleRetry: propHandleRetry,
    onUserClick: onUserClickCustomHandler,
    onUserHover: onUserHoverCustomHandler,
    tDateTimeParser: propTDateTimeParser,
  } = props;
  const { updateMessage: channelUpdateMessage } = useContext(ChannelContext);
  const updateMessage = propUpdateMessage || channelUpdateMessage;
  const { isMyMessage } = useUserRole(message);
  const handleOpenThread = useOpenThreadHandler(message);
  const handleReaction = useReactionHandler(message);
  const handleAction = useActionHandler(message);
  const handleRetry = useRetryHandler<At, Ch, Co, Ev, Me, Re, Us>();
  const { onUserClick, onUserHover } = useUserHandler<At, Ch, Co, Me, Re, Us>(
    message,
    {
      onUserClickHandler: onUserClickCustomHandler,
      onUserHoverHandler: onUserHoverCustomHandler,
    },
  );
  const reactionSelectorRef = React.createRef<HTMLDivElement>();
  const messageWrapperRef = useRef(null);
  const {
    isReactionEnabled,
    onReactionListClick,
    showDetailedReactions,
  } = useReactionClick<At, Ch, Co, Ev, Me, Re, Us>(
    message,
    reactionSelectorRef,
  );
  const {
    Attachment = DefaultAttachment,
    Avatar = DefaultAvatar,
    MessageDeleted = DefaultMessageDeleted,
    ReactionSelector = DefaultReactionSelector,
    ReactionsList = DefaultReactionList,
  } = props;

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
    <React.Fragment>
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
          <MessageSimpleStatus {...props} />

          {message.user && (
            <Avatar
              //@ts-expect-error
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
                //@ts-expect-error
                retryHandler(message);
              }
            }}
          >
            {!message.text && (
              <React.Fragment>
                {
                  <MessageOptions
                    {...props}
                    handleOpenThread={propHandleOpenThread}
                    messageWrapperRef={messageWrapperRef}
                    onReactionListClick={onReactionListClick}
                  />
                }
                {/* if reactions show them */}
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
              </React.Fragment>
            )}

            {message?.attachments && Attachment && (
              <Attachment
                // @ts-expect-error
                actionHandler={propHandleAction || handleAction}
                attachments={message.attachments}
              />
            )}

            {message.text && (
              <MessageText
                {...props}
                customOptionProps={{
                  handleOpenThread: propHandleOpenThread,
                  messageWrapperRef,
                }}
                // FIXME: There's some unmatched definition between the infered and the declared
                // ReactionSelector reference
                // @ts-expect-error
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
              <MessageTimestamp
                calendar
                customClass='str-chat__message-simple-timestamp'
                formatDate={formatDate}
                message={message}
                //@ts-expect-error
                tDateTimeParser={propTDateTimeParser}
              />
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

const MessageSimpleStatus = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  Avatar = DefaultAvatar,
  readBy,
  message,
  threadList,
  lastReceivedId,
}: MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { t } = useContext(TranslationContext);
  const { client } = useContext(ChannelContext);
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
        <Tooltip>{t && t('Sending...')}</Tooltip>
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
          //@ts-expect-error
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
        <Tooltip>{t && t('Delivered')}</Tooltip>
        <DeliveredCheckIcon />
      </span>
    );
  }
  return null;
};

export const MessageSimple = React.memo(
  UnMemoizedMessageSimple,
  //@ts-expect-error
  areMessagePropsEqual,
) as typeof UnMemoizedMessageSimple;
