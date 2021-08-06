import React from 'react';
import {
  Attachment,
  Avatar,
  isDate,
  MessageUIComponentProps,
  useMessageContext,
} from 'stream-chat-react';

import { getFormattedTime } from './utils';

import type {
  AttachmentType,
  ChannelType,
  CommandType,
  EventType,
  MessageType,
  ReactionType,
  UserType,
} from '../../hooks/useInitChat';

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
  const { message } = useMessageContext<
    AttachmentType,
    ChannelType,
    CommandType,
    EventType,
    MessageType,
    ReactionType,
    UserType
  >();

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
    <div className='message-ui'>
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
