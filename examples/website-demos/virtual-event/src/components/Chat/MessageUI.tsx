import React, { useState } from 'react';
import {
  Attachment,
  Avatar,
  isDate,
  MessageUIComponentProps,
  ReactionSelector,
  useChannelStateContext,
  useMessageContext,
} from 'stream-chat-react';

import { UserActionsDropdown } from './UserActionsDropdown';
import { getFormattedTime } from './utils';

import { MessageActionsEllipse, ReactionSmiley } from '../../assets';

import type {
  AttachmentType,
  ChannelType,
  CommandType,
  EventType,
  MessageType,
  ReactionType,
  UserType,
} from '../../hooks/useInitChat';
import { useEffect } from 'react';

type OptionsProps = {
  isRecentMessage: boolean;
  setShowReactionSelector: React.Dispatch<React.SetStateAction<boolean>>;
};

const MessageOptions: React.FC<OptionsProps> = (props) => {
  const { isRecentMessage, setShowReactionSelector } = props;

  const { handleOpenThread } = useMessageContext();

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
            thread
          />
        </div>
      )}
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
  >
> = () => {
  const { messages } = useChannelStateContext();
  const { message } = useMessageContext<
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

  useEffect(() => {
    const handleClick = () => setShowReactionSelector(false);
    if (showReactionSelector) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
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
      className='message-ui'
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => {
        setShowOptions(false);
        setShowReactionSelector(false);
      }}
    >
      {showOptions && (
        <MessageOptions
          isRecentMessage={isRecentMessage}
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
        {message.attachments && <Attachment attachments={message.attachments} />}
      </div>
    </div>
  );
};
