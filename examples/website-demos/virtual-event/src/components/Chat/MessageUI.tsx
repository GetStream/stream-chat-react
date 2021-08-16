import React, { Suspense, useEffect, useState } from 'react';
import {
  Attachment,
  Avatar,
  isDate,
  MessageRepliesCountButton,
  MessageUIComponentProps,
  SimpleReactionsList,
  useChannelStateContext,
  useChatContext,
  useEmojiContext,
  useMessageContext,
} from 'stream-chat-react';

import { UserActionsDropdown } from './UserActionsDropdown';
import { customReactions, getFormattedTime } from './utils';

import { MessageActionsEllipse, QAThumb, ReactionSmiley } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

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
  isRecentMessage: boolean;
  setMessageActionUser?: React.Dispatch<React.SetStateAction<string | undefined>>;
  setShowReactionSelector: React.Dispatch<React.SetStateAction<boolean>>;
};

const MessageOptions: React.FC<OptionsProps> = (props) => {
  const { isRecentMessage, setMessageActionUser, setShowReactionSelector } = props;

  const { thread } = useChannelStateContext();
  const { handleOpenThread, isMyMessage, message } = useMessageContext();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const myMessageInThread = thread && isMyMessage();

  return (
    <div className='message-ui-options'>
      <span onClick={() => setShowReactionSelector((prev) => !prev)}>
        <ReactionSmiley />
      </span>
      {!myMessageInThread && (
        <span onClick={() => setDropdownOpen(!dropdownOpen)}>
          <MessageActionsEllipse />
        </span>
      )}
      {dropdownOpen && (
        <div
          className={`message-ui-options-dropdown ${isRecentMessage ? 'recent' : ''} ${
            isMyMessage() ? 'mine' : ''
          }`}
        >
          <UserActionsDropdown
            dropdownOpen={dropdownOpen}
            openThread={handleOpenThread}
            setDropdownOpen={setDropdownOpen}
            setMessageActionUser={setMessageActionUser}
            thread
            user={message.user}
          />
        </div>
      )}
    </div>
  );
};

const ReactionSelector: React.FC = () => {
  const { Emoji, emojiConfig } = useEmojiContext();
  const { handleReaction } = useMessageContext();

  return (
    <div className='message-ui-reaction-selector'>
      {customReactions.map((reaction, i) => (
        <Suspense fallback={null} key={i}>
          <div onClick={(event) => handleReaction(reaction.id, event)}>
            <Emoji data={emojiConfig.emojiData} emoji={reaction} size={24} />
          </div>
        </Suspense>
      ))}
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
  > & { setMessageActionUser?: React.Dispatch<React.SetStateAction<string | undefined>> }
> = (props) => {
  const { setMessageActionUser } = props;

  const { messages } = useChannelStateContext();
  const { client } = useChatContext();

  const { themeModalOpen } = useEventContext();
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
  const [showReactionSelector, setShowReactionSelector] = useState(false);

  const clearModals = () => {
    setShowOptions(false);
    setShowReactionSelector(false);
  };

  useEffect(() => {
    if (showReactionSelector) document.addEventListener('click', clearModals);
    return () => document.removeEventListener('click', clearModals);
  }, [showReactionSelector]);

  const isRecentMessage =
    (messages?.[messages.length - 1].id === message.id ||
      messages?.[messages.length - 2].id === message.id) &&
    messages.length > 2;

  const showTitle = message.user?.title === 'Admin' || message.user?.title === 'Moderator';

  const getTimeSinceMessage = () => {
    if (!message.created_at) return null;

    const secondsSinceLastMessage = isDate(message.created_at)
      ? (Date.now() - message.created_at.getTime()) / 1000
      : 0;

    return getFormattedTime(secondsSinceLastMessage);
  };

  const handleQAClick = async () => {
    const mentionIDs = message.mentioned_users?.map(({ id }) => id);
    let updatedUpVotes;

    if (!message.up_votes) {
      await client.updateMessage({
        ...message,
        mentioned_users: mentionIDs,
        up_votes: [client.user?.id],
      });
    } else if (client.user?.id && message.up_votes.includes(client.user?.id)) {
      updatedUpVotes = message.up_votes.filter((userID) => userID !== client.user?.id);
    } else {
      updatedUpVotes = [...message.up_votes, client.user?.id];
    }

    const updatedMessage = {
      ...message,
      mentioned_users: mentionIDs,
      up_votes: updatedUpVotes,
    };

    await client.updateMessage(updatedMessage);
  };

  const isQA = message.cid?.slice(-3) === ':qa';
  const userUpVoted = client.user && message.up_votes?.includes(client.user?.id);

  if (!message.user) return null;

  return (
    <div
      className={`message-ui ${themeModalOpen ? 'theme-open' : ''}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={clearModals}
    >
      {showOptions && !isQA && (
        <MessageOptions
          isRecentMessage={isRecentMessage}
          setMessageActionUser={setMessageActionUser}
          setShowReactionSelector={setShowReactionSelector}
        />
      )}
      {showReactionSelector && !isQA && <ReactionSelector />}
      <Avatar image={message.user.image} name={message.user.name || message.user.id} />
      <div className='message-ui-content'>
        <div className='message-ui-content-top'>
          <div className='message-ui-content-top-name'>{message.user.name || message.user.id}</div>
          {showTitle && <div className='message-ui-content-top-title'>{message.user.title}</div>}
          <div className='message-ui-content-top-time'>{getTimeSinceMessage()}</div>
        </div>
        <div className='message-ui-content-bottom'>{message.text}</div>
        {message.attachments?.length ? <Attachment attachments={message.attachments} /> : null}
        <MessageRepliesCountButton onClick={handleOpenThread} reply_count={message.reply_count} />
        <SimpleReactionsList reactionOptions={customReactions} />
      </div>
      {isQA && (
        <div className={`message-ui-qa ${userUpVoted ? 'up-voted' : ''}`} onClick={handleQAClick}>
          <QAThumb />
          <div className='message-ui-qa-text'>{message.up_votes?.length || 0}</div>
        </div>
      )}
    </div>
  );
};
