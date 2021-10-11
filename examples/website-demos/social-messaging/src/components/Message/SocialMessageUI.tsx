import {
  Attachment,
  Avatar,
  ReactionSelector,
  MessageOptions,
  MessageText,
  MessageTimestamp,
  MessageUIComponentProps,
  useChannelStateContext,
  useChatContext,
  useMessageContext,
} from 'stream-chat-react';
import { DeliveredCheckmark, DoubleCheckmark } from '../../assets';

import {
  SocialAttachmentType,
  SocialChannelType,
  SocialCommandType,
  SocialEventType,
  SocialMessageType,
  SocialReactionType,
  SocialUserType,
} from '../ChatContainer/ChatContainer';

import { SocialGallery } from '../Gallery/SocialGallery';
import { ThreadReply } from '../ThreadReply/ThreadReply';
import { SocialReactionList, customReactions } from '../ReactionList/SocialReactionList';

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
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();
  const {
    isMyMessage,
    isReactionEnabled,
    message,
    readBy,
    reactionSelectorRef,
    showDetailedReactions,
  } = useMessageContext<
    SocialAttachmentType,
    SocialChannelType,
    SocialCommandType,
    SocialEventType,
    SocialMessageType,
    SocialReactionType,
    SocialUserType
  >();

  const isGroup =
    Object.values(channel.state.members).filter(({ user }) => user?.id !== client.userID).length >
    2;

  const myMessage = isMyMessage();

  const readByMembers = readBy?.filter((user) => user.id !== client.user?.id);
  const readByMembersLength = readByMembers?.length === 0 ? undefined : readByMembers?.length;

  return (
    <div className={`message-wrapper ${myMessage ? 'right' : ''}`}>
      {!myMessage && (
        <Avatar
          size={36}
          image={message.user?.image}
          name={message.user?.name || message.user?.id}
        />
      )}
      <div className={`message-wrapper-inner ${myMessage ? 'my-message' : ''}`}>
        <div className='message-wrapper-inner-text'>
          <SocialReactionList />
          {message.attachments?.length ? <Attachment attachments={message.attachments} Gallery={SocialGallery} /> : null}
          <MessageText customWrapperClass={`${myMessage ? 'my-message' : ''}`} />
        </div>
        {showDetailedReactions && isReactionEnabled && (
          <ReactionSelector reactionOptions={customReactions} ref={reactionSelectorRef} />
        )}
        <ThreadReply />
        <div className='message-wrapper-inner-options'>
          <MessageOptions />
          <div className='message-wrapper-inner-data'>
            {myMessage &&
              message.status === 'received' &&
              readByMembers &&
              readByMembers?.length < 1 && <DeliveredCheckmark />}
            {myMessage && readByMembersLength && (
              <>
                {isGroup && (
                  <span className='message-wrapper-inner-data-readby'>{readByMembersLength}</span>
                )}
                <DoubleCheckmark />
              </>
            )}
            {!myMessage && isGroup && (
              <div className='message-wrapper-inner-data-info'>
                {message.user?.name || message.user?.id}
              </div>
            )}
            <MessageTimestamp customClass='message-wrapper-inner-data-time' />
          </div>
        </div>
      </div>
    </div>
  );
};
