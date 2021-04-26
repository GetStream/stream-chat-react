import React, { useRef } from 'react';
import {
  Attachment,
  Avatar,
  messageHasReactions,
  MessageOptions,
  MessageRepliesCountButton,
  MessageText,
  ReactionSelector,
  SimpleReactionsList,
  MessageTimestamp,
  useMessageContext,
} from 'stream-chat-react';

import './CustomMessage.scss';

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
    <div className='message_wrapper'>
      <Avatar image={message.user?.image} />
      <div className='message_wrapper-inner'>
        <MessageOptions
          displayLeft={false}
          handleOpenThread={handleOpenThread}
          messageWrapperRef={messageWrapperRef}
        />
        <div className='message-header'>
          <div className='message-header-user_name'>{name}</div>
          <div className='message-header-timestamp'>
            <MessageTimestamp />
          </div>
        </div>
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
          <SimpleReactionsList
            reaction_counts={message.reaction_counts || undefined}
            reactions={message.latest_reactions}
          />
        )}
        <MessageRepliesCountButton reply_count={message.reply_count} onClick={handleOpenThread} />
      </div>
    </div>
  );
};
