import {
  Attachment,
  Avatar,
  ReactionSelector,
  messageHasReactions,
  MessageOptions,
  MessageText,
  MessageTimestamp,
  MessageUIComponentProps,
  SimpleReactionsList,
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

import { ThreadReply } from '../ThreadReply/ThreadReply';

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

  const members = Object.values(channel.state.members).filter(
    ({ user }) => user?.id !== client.userID,
  ).length;

  const hasReactions = messageHasReactions(message);

  const myMessage = isMyMessage();

  const readByMembers = readBy?.filter((user) => user.id !== client.user?.id);
  const readByMembersLength = readByMembers?.length === 0 ? undefined : readByMembers?.length;

    const customReactions = [
  {
    colons: ':heart:',
    emoticons: ['<3'],
    id: 'heart',
    name: 'Heart',
    native: '❤️',
    skin: null,
    unified: '2764',
  },
  {
    colons: ':+1:',
    emoticons: ['b'],
    id: 'thumbsup',
    name: 'Thumbs Up',
    native: '👍',
    skin: null,
    unified: '1F44D',
  },
  {
    colons: ':-1:',
    emoticons: ['p'],
    id: 'thumbsdown',
    name: 'Thumbs Down',
    native: '👎',
    skin: null,
    unified: '1f44e',
  },
  {
    colons: ':laughing:',
    emoticons: ['x)'],
    id: 'laughing',
    name: 'Grinning Squinting Face',
    native: '😆',
    skin: null,
    unified: '1F606',
  },
  {
    colons: ':angry:',
    emoticons: ['=/'],
    id: 'angry',
    name: 'Angry',
    native: '😠',
    skin: null,
    unified: '1F620',
  },
];

  // Group Channel
  if (members > 2) {
    return (
      <div className={`message-wrapper ${myMessage ? 'right' : ''}`}>
        {!myMessage && <Avatar size={36} image={message.user?.image} name={message.user?.name} />}
        <div className='message-wrapper-inner'>
          {message.attachments?.length ? <Attachment attachments={message.attachments} /> : null}
          <MessageText customWrapperClass={`${myMessage ? 'my-message' : ''}`} />
          <div className={`message-wrapper-inner-data ${myMessage ? 'my-message' : ''}`}>
            {!myMessage && (
              <div className='message-wrapper-inner-data-info'>
                {message.user?.name || message.user?.id}
              </div>
            )}
            {myMessage && readByMembersLength && (
              <>
                <span className='message-wrapper-inner-data-readby'>{readByMembersLength}</span>{' '}
                <DoubleCheckmark />
              </>
            )}
            <MessageTimestamp customClass='message-wrapper-inner-data-time' />
          </div>
        </div>
      </div>
    );
  }

  // DM channel
  return (
    <div className={`message-wrapper ${myMessage ? 'right' : ''}`}>
      {!myMessage && <Avatar size={36} image={message.user?.image} />}
      <div className={`message-wrapper-inner ${myMessage ? 'my-message' : ''}`}>
        {hasReactions && !showDetailedReactions && isReactionEnabled && <SimpleReactionsList />}
        <MessageText customWrapperClass={`${myMessage ? 'my-message' : ''}`} />
        {message.attachments?.length ? <Attachment attachments={message.attachments} /> : null}
        {showDetailedReactions && isReactionEnabled && (
          <ReactionSelector reactionOptions={customReactions} ref={reactionSelectorRef} />
        )}
        <ThreadReply />
        <div className='message-wrapper-inner-options'>
          {myMessage && <MessageOptions displayReplies={true} />}
          <div className='message-wrapper-inner-data'>
            {myMessage &&
              message.status === 'received' &&
              readByMembers &&
              readByMembers?.length < 1 && <DeliveredCheckmark />}
            {myMessage && readByMembers && readByMembersLength && <DoubleCheckmark />}
            {!myMessage && (
              <div className='message-wrapper-inner-data-info'>
                {message.user?.name || message.user?.id}
              </div>
            )}
            <MessageTimestamp customClass='message-wrapper-inner-data-time' />
          </div>
          {!myMessage && <MessageOptions />}
        </div>
      </div>
    </div>
  );
};
