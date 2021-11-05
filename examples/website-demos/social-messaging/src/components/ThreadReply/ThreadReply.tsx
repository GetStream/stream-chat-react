import { Avatar, MessageRepliesCountButton, useMessageContext } from 'stream-chat-react';
import { LeftReply, RightReply } from '../../assets';

import './ThreadReply.scss';

export const ThreadReply: React.FC = () => {
  const { handleOpenThread, isMyMessage, message } = useMessageContext();

  const myMessage = isMyMessage();

  const uniqueThreadParticipants = Array.from(new Set(message.thread_participants)).slice(0, 2);

  return (
    <>
      {message.thread_participants ? (
        <div className='message-wrapper-inner-reply'>
          {!myMessage && (
            <>
              <RightReply />
              {uniqueThreadParticipants[0] &&
                uniqueThreadParticipants.map((user, i) => (
                  <div
                    key={user.id}
                    className={`${uniqueThreadParticipants[1] ? `left-avatar-${i + 1}` : ''}`}
                  >
                    <Avatar size={16} image={user.image} name={user.name || user.id} />
                  </div>
                ))}
            </>
          )}
          <MessageRepliesCountButton onClick={handleOpenThread} reply_count={message.reply_count} />
          {myMessage && (
            <>
              {uniqueThreadParticipants[0] &&
                uniqueThreadParticipants.reverse().map((user, i) => (
                  <div
                    key={user.id}
                    className={`${uniqueThreadParticipants[1] ? `right-avatar-${i + 1}` : ''}`}
                  >
                    <Avatar size={16} image={user.image} name={user.name || user.id} />
                  </div>
                ))}
              <LeftReply />
            </>
          )}
        </div>
      ) : null}
    </>
  );
};
