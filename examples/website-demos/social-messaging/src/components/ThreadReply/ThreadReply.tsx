import {
  Avatar,
  MessageRepliesCountButton,
  useMessageContext,
} from 'stream-chat-react';
import { LeftReply, RightReply, } from '../../assets';

import './ThreadReply.scss';

export const ThreadReply: React.FC = () => {
  const { isMyMessage, message, } = useMessageContext();

  const myMessage = isMyMessage();

  return (
    <>
      {message.thread_participants ? (
      <div className='message-wrapper-inner-reply'>
        {!myMessage && (
          <>
            <RightReply />
            <Avatar size={16} image={message.thread_participants[0].image} />
          </>
        )}
        <MessageRepliesCountButton reply_count={message.reply_count} />
        {myMessage && (
          <>
            <Avatar size={16} image={message.thread_participants[0].image} />
            <LeftReply />
          </>
        )}
      </div> ) : null}
    </>
  );
};
