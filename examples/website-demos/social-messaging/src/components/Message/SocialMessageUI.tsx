import {
  Avatar,
  MessageText,
  MessageUIComponentProps,
  useChannelStateContext,
  useChatContext,
  useMessageContext,
} from 'stream-chat-react';

import {
  SocialAttachmentType,
  SocialChannelType,
  SocialCommandType,
  SocialEventType,
  SocialMessageType,
  SocialReactionType,
  SocialUserType,
} from '../ChatContainer/ChatContainer';

import './SocialMessageUI.scss';

export const SocialMessage: React.FC<
  MessageUIComponentProps<
    SocialAttachmentType,
    SocialChannelType,
    SocialCommandType,
    SocialEventType,
    SocialMessageType,
    SocialReactionType,
    SocialUserType
  >
> = (props) => {
  const { channel } = useChannelStateContext<
    SocialAttachmentType,
    SocialChannelType,
    SocialCommandType,
    SocialEventType,
    SocialMessageType,
    SocialReactionType,
    SocialUserType
  >();
  const { client } = useChatContext<
    SocialAttachmentType,
    SocialChannelType,
    SocialCommandType,
    SocialEventType,
    SocialMessageType,
    SocialReactionType,
    SocialUserType
  >();
  const { isMyMessage, message } = useMessageContext<
    SocialAttachmentType,
    SocialChannelType,
    SocialCommandType,
    SocialEventType,
    SocialMessageType,
    SocialReactionType,
    SocialUserType
  >();

  const members = Object.values(channel.state.members).filter(
    ({ user }) => user?.id !== client.userID,
  ).length;

  const myMessage = isMyMessage();

  return (
    <div className={`message-wrapper ${myMessage ? 'right' : ''}`}>
      {!myMessage && <Avatar size={36} image={message.user?.image} />}
      <div className='message-wrapper-inner'>
        <MessageText customWrapperClass={`${myMessage ? 'my-message' : ''}`} />
        <div>
          {!myMessage && members > 2 && (
            <span className='message-wrapper-inner'>{message.user?.name || message.user?.id}</span>
          )}
        </div>
      </div>
    </div>
  );
};
