import React, { BaseSyntheticEvent, Suspense, useEffect, useRef, useState } from 'react';
import {
  Attachment,
  Avatar,
  isDate,
  MessageRepliesCountButton,
  MessageUIComponentProps,
  SimpleReactionsList,
  StreamMessage,
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useEmojiContext,
  useMessageContext,
} from 'stream-chat-react';

import { UserActionsDropdown } from './UserActionsDropdown';
import { customReactions, getFormattedTime } from './utils';

import { MessageActionsEllipse, QAThumb, ReactionSmiley } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

import type { StreamChatGenerics } from '../../types';

type OptionsProps = {
  dropdownOpen: boolean;
  isRecentMessage: boolean;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMessageActionUser?: React.Dispatch<React.SetStateAction<string | undefined>>;
  setShowReactionSelector: React.Dispatch<React.SetStateAction<boolean>>;
};

const MessageOptions: React.FC<OptionsProps> = (props) => {
  const {
    dropdownOpen,
    isRecentMessage,
    setDropdownOpen,
    setMessageActionUser,
    setShowReactionSelector,
  } = props;

  const { thread } = useChannelStateContext();
  const { handleOpenThread, isMyMessage, message } = useMessageContext();

  const hideActions = (thread && isMyMessage()) || (!thread && message.show_in_channel);

  return (
    <div className='message-ui-options'>
      <span onClick={() => setShowReactionSelector((prev) => !prev)}>
        <ReactionSmiley />
      </span>
      {!hideActions && (
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
            thread={!thread}
            user={message.user}
          />
        </div>
      )}
    </div>
  );
};

const ReactionSelector: React.FC<{ isTopMessage: boolean }> = ({ isTopMessage }) => {
  const { Emoji, emojiConfig } = useEmojiContext();
  const { handleReaction } = useMessageContext();

  return (
    <div className={`message-ui-reaction-selector ${isTopMessage ? 'top' : ''}`}>
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
  MessageUIComponentProps<StreamChatGenerics> & {
    setMessageActionUser?: React.Dispatch<React.SetStateAction<string | undefined>>;
  }
> = (props) => {
  const { setMessageActionUser } = props;

  const { openThread } = useChannelActionContext();
  const { channel, messages } = useChannelStateContext();
  const { client } = useChatContext();

  const { chatType, themeModalOpen } = useEventContext();
  const { handleOpenThread, message } = useMessageContext<StreamChatGenerics>();

  const replyCount = useRef(message.reply_count);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showReactionSelector, setShowReactionSelector] = useState(false);
  const [threadParent, setThreadParent] = useState<StreamMessage>();

  const clearModals = () => {
    setDropdownOpen(false);
    setShowOptions(false);
    setShowReactionSelector(false);
  };

  useEffect(() => {
    if (!dropdownOpen) clearModals();
  }, [dropdownOpen]);

  useEffect(() => {
    if (showReactionSelector) document.addEventListener('click', clearModals);
    return () => document.removeEventListener('click', clearModals);
  }, [showReactionSelector]);

  useEffect(() => {
    const getMessage = async () => {
      try {
        const { results } = await channel.search({ id: { $eq: message.parent_id || '' } });
        const foundMessage = results[0]?.message;

        if (foundMessage) {
          replyCount.current = foundMessage.reply_count;
          setThreadParent(foundMessage);
        }
      } catch (err) {
        console.log(err);
      }
    };

    if (message.show_in_channel && !replyCount.current) getMessage();
  }, []); // eslint-disable-line

  const customOpenThread = (event: BaseSyntheticEvent) =>
    threadParent ? openThread(threadParent, event) : handleOpenThread(event);

  const isRecentMessage =
    messages?.[messages.length - 1].id === message.id ||
    messages?.[messages.length - 2]?.id === message.id;

  const isTopMessage = messages?.[0].id === message.id;

  const showTitle = message.user?.title === 'Admin' || message.user?.title === 'Moderator';

  const getTimeSinceMessage = () => {
    if (!message.created_at) return null;

    const secondsSinceLastMessage = isDate(message.created_at)
      ? (Date.now() - message.created_at.getTime()) / 1000
      : 0;

    return getFormattedTime(secondsSinceLastMessage);
  };

  const handleQAClick = async (event: React.MouseEvent) => {
    event.stopPropagation();

    const mentionIDs = message.mentioned_users?.map(({ id }) => id);
    let updatedUpVotes;

    if (!message.up_votes) {
      return await client.updateMessage({
        ...message,
        mentioned_users: mentionIDs,
        up_votes: [client.userID],
      });
    } else if (client.userID && message.up_votes.includes(client.userID)) {
      updatedUpVotes = message.up_votes.filter((userID) => userID !== client.userID);
    } else {
      updatedUpVotes = [...message.up_votes, client.userID];
    }

    const updatedMessage = {
      ...message,
      mentioned_users: mentionIDs,
      up_votes: updatedUpVotes,
    };

    return await client.updateMessage(updatedMessage);
  };

  const isQA = chatType === 'qa';
  const userUpVoted = client.userID && message.up_votes?.includes(client.userID);

  const repliesToShow =
    replyCount.current || (!replyCount.current && message.show_in_channel && 2) || undefined;

  if (!message.user) return null;

  return (
    <div
      className={`message-ui ${themeModalOpen ? 'theme-open' : ''}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={clearModals}
    >
      {showOptions && !isQA && (
        <MessageOptions
          dropdownOpen={dropdownOpen}
          isRecentMessage={isRecentMessage}
          setDropdownOpen={setDropdownOpen}
          setMessageActionUser={setMessageActionUser}
          setShowReactionSelector={setShowReactionSelector}
        />
      )}
      {showReactionSelector && !isQA && <ReactionSelector isTopMessage={isTopMessage} />}
      <Avatar
        image={message.user.image}
        name={message.user.name || message.user.id}
        shape='circle'
      />
      <div className='message-ui-content'>
        <div className='message-ui-content-top'>
          <div className='message-ui-content-top-name'>{message.user.name || message.user.id}</div>
          {showTitle && <div className='message-ui-content-top-title'>{message.user.title}</div>}
          <div className='message-ui-content-top-time'>{getTimeSinceMessage()}</div>
        </div>
        <div className='message-ui-content-bottom'>{message.text}</div>
        {message.attachments?.length ? <Attachment attachments={message.attachments} /> : null}
        <MessageRepliesCountButton onClick={customOpenThread} reply_count={repliesToShow} />
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
