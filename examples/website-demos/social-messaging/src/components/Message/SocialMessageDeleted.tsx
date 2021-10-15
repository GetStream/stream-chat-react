import React from 'react';

import {
  useUserRole,
  MessageUIComponentProps,
  useMessageContext,
  MessageTimestamp,
} from 'stream-chat-react';

import { Eye } from '../../assets/Eye';

import {
  SocialAttachmentType,
  SocialChannelType,
  SocialCommandType,
  SocialEventType,
  SocialMessageType,
  SocialReactionType,
  SocialUserType,
} from '../ChatContainer/ChatContainer';

export const SocialMessageDeleted: React.FC<
  MessageUIComponentProps<
    SocialAttachmentType,
    SocialChannelType,
    SocialCommandType,
    SocialEventType,
    SocialMessageType,
    SocialReactionType,
    SocialUserType
  >
> = () => {
  const { message } = useMessageContext();

  const { isMyMessage } = useUserRole(message);

  const messageClasses = isMyMessage
    ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
    : 'str-chat__message str-chat__message-simple';

  if (!isMyMessage) return null;

  return (
    <div className={`${messageClasses} str-chat__message--deleted ${message.type} `}>
      <div className='str-chat__message--deleted-inner'>Message deleted</div>
      <div className='visible'>
        <Eye />
        Only visible to you
        <MessageTimestamp customClass='message-wrapper-inner-data-time' />
      </div>
    </div>
  );
};
