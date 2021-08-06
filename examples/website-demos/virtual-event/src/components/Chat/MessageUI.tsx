import React, { useState } from 'react';
import {
  Attachment,
  Avatar,
  isDate,
  MessageUIComponentProps,
  ReactEventHandler,
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

type OptionsProps = {
  openThread: ReactEventHandler;
};

const MessageOptions: React.FC<OptionsProps> = (props) => {
  const { openThread } = props;

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className='message-ui-options'>
      <span>
        <ReactionSmiley />
      </span>
      <span onClick={() => setDropdownOpen(!dropdownOpen)}>
        <MessageActionsEllipse />
      </span>
      {dropdownOpen && (
        <div className='message-ui-options-dropdown'>
          <UserActionsDropdown
            dropdownOpen={dropdownOpen}
            openThread={openThread}
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

  const getTimeSinceMessage = () => {
    if (!message.created_at) return null;

    const secondsSinceLastMessage = isDate(message.created_at)
      ? (Date.now() - message.created_at.getTime()) / 1000
      : 0;

    return getFormattedTime(secondsSinceLastMessage);
  };

  const showTitle = message.user?.title === 'Admin' || message.user?.title === 'Moderator';

  if (!message.user) return null;

  return (
    <div
      className='message-ui'
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {showOptions && <MessageOptions openThread={handleOpenThread} />}
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
