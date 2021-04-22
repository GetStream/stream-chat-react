import React, { useRef } from 'react';
import {
  Attachment,
  Avatar,
  messageHasReactions,
  MessageOptions,
  MessageRepliesCountButton,
  MessageText,
  ReactionSelector,
  ReactionsList,
  // MessageTimestamp,
  useMessageContext,
} from 'stream-chat-react';

import './CustomMessage.css';

export const CustomMessage = () => {
  const {
    handleOpenThread,
    showDetailedReactions,
    isReactionEnabled,
    message,
    reactionSelectorRef,
  } = useMessageContext();

  const messageWrapperRef = useRef<HTMLDivElement | null>(null);

  const hasReactions = messageHasReactions(message);

  const name = message.user?.name;

  return (
    <>
      <div className='wrapper'>
        <Avatar image={message.user?.image} />
        <div className='message_wrapper'>
          <MessageOptions
            handleOpenThread={handleOpenThread}
            messageWrapperRef={messageWrapperRef}
          />
          <div className='user_name'>{name}</div>
          {showDetailedReactions && isReactionEnabled && (
            <ReactionSelector
              detailedView
              latest_reactions={message.latest_reactions}
              own_reactions={message.own_reactions}
              reaction_counts={message.reaction_counts || undefined}
              ref={reactionSelectorRef}
            />
          )}
          <MessageText />
          {message.attachments && <Attachment attachments={message.attachments} />}
          {hasReactions && !showDetailedReactions && isReactionEnabled && (
            <ReactionsList
              own_reactions={message.own_reactions}
              reaction_counts={message.reaction_counts || undefined}
              reactions={message.latest_reactions}
              reverse
            />
          )}
          <MessageRepliesCountButton reply_count={message.reply_count} onClick={handleOpenThread} />
          {/* <MessageTimestamp /> */}
        </div>
      </div>
    </>
  );
};
