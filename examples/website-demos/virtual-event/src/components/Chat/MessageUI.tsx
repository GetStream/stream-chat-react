import React, { Suspense, useEffect, useState } from 'react';
import {
  Attachment,
  Avatar,
  isDate,
  MessageRepliesCountButton,
  MessageUIComponentProps,
  SimpleReactionsList,
  useChannelStateContext,
  useEmojiContext,
  useMessageContext,
} from 'stream-chat-react';

import { UserActionsDropdown } from './UserActionsDropdown';
import { customReactions, getFormattedTime } from './utils';

import { MessageActionsEllipse, ReactionSmiley } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

import type {
  AttachmentType,
  ChannelType,
  CommandType,
  EventType,
  MessageType,
  ReactionType,
  UserType,
} from '../../hooks/useInitChat';

type OptionsProps = {
  isRecentMessage: boolean;
  setMessageActionUser?: React.Dispatch<React.SetStateAction<string | undefined>>;
  setShowReactionSelector: React.Dispatch<React.SetStateAction<boolean>>;
};

const MessageOptions: React.FC<OptionsProps> = (props) => {
  const { isRecentMessage, setMessageActionUser, setShowReactionSelector } = props;

  const { handleOpenThread, message } = useMessageContext();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className='message-ui-options'>
      <span onClick={() => setShowReactionSelector((prev) => !prev)}>
        <ReactionSmiley />
      </span>
      <span onClick={() => setDropdownOpen(!dropdownOpen)}>
        <MessageActionsEllipse />
      </span>
      {dropdownOpen && (
        <div className={`message-ui-options-dropdown ${isRecentMessage ? 'recent' : ''}`}>
          <UserActionsDropdown
            dropdownOpen={dropdownOpen}
            openThread={handleOpenThread}
            setDropdownOpen={setDropdownOpen}
            setMessageActionUser={setMessageActionUser}
            thread
            user={message.user}
          />
        </div>
      )}
    </div>
  );
};

const ReactionSelector: React.FC = () => {
  const { Emoji, emojiConfig } = useEmojiContext();
  const { handleReaction } = useMessageContext();

  return (
    <div className='message-ui-reaction-selector'>
      {customReactions.map((reaction, i) => (
        <Suspense fallback={null} key={i}>
          <div onClick={(event) => handleReaction(reaction.id, event)}>
            <Emoji data={emojiConfig.emojiData} emoji={reaction} size={24} />
          </div>
        </Suspense>
      ))}
    </div>
  );
};

export const MessageUI: React.FC<
  MessageUIComponentProps<
    AttachmentType,
    ChannelType,
    CommandType,
    EventType,
    MessageType,
    ReactionType,
    UserType
  > & { setMessageActionUser?: React.Dispatch<React.SetStateAction<string | undefined>> }
> = (props) => {
  const { setMessageActionUser } = props;

  const { messages } = useChannelStateContext();

  const { themeModalOpen } = useEventContext();
  const { handleOpenThread, message } = useMessageContext<
    AttachmentType,
    ChannelType,
    CommandType,
    EventType,
    MessageType,
    ReactionType,
    UserType
  >();

  const [showOptions, setShowOptions] = useState(false);
  const [showReactionSelector, setShowReactionSelector] = useState(false);

  const clearModals = () => {
    setShowOptions(false);
    setShowReactionSelector(false);
  };

  useEffect(() => {
    if (showReactionSelector) document.addEventListener('click', clearModals);
    return () => document.removeEventListener('click', clearModals);
  }, [showReactionSelector]);

  const isRecentMessage =
    messages?.[messages.length - 1].id === message.id ||
    messages?.[messages.length - 2].id === message.id;

  const showTitle = message.user?.title === 'Admin' || message.user?.title === 'Moderator';

  const getTimeSinceMessage = () => {
    if (!message.created_at) return null;

    const secondsSinceLastMessage = isDate(message.created_at)
      ? (Date.now() - message.created_at.getTime()) / 1000
      : 0;

    return getFormattedTime(secondsSinceLastMessage);
  };

  if (!message.user) return null;

  return (
    <div
      className={`message-ui ${themeModalOpen ? 'theme-open' : ''}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={clearModals}
    >
      {showOptions && (
        <MessageOptions
          isRecentMessage={isRecentMessage}
          setMessageActionUser={setMessageActionUser}
          setShowReactionSelector={setShowReactionSelector}
        />
      )}
      {showReactionSelector && <ReactionSelector />}
      <Avatar image={message.user.image} name={message.user.name || message.user.id} />
      <div className='message-ui-content'>
        <div className='message-ui-content-top'>
          <div className='message-ui-content-top-name'>{message.user.name || message.user.id}</div>
          {showTitle && <div className='message-ui-content-top-title'>{message.user.title}</div>}
          <div className='message-ui-content-top-time'>{getTimeSinceMessage()}</div>
        </div>
        <div className='message-ui-content-bottom'>{message.text}</div>
        {message.attachments?.length ? <Attachment attachments={message.attachments} /> : null}
        <div className='str-chat__message-simple-reply-button'>
          <MessageRepliesCountButton onClick={handleOpenThread} reply_count={message.reply_count} />
        </div>
        <SimpleReactionsList reactionOptions={customReactions} />
      </div>
    </div>
  );
};
