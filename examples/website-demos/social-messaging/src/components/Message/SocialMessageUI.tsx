import { useEffect, useRef, useState } from 'react';
import {
  Attachment,
  Avatar,
  ReactionSelector,
  // MessageOptions,
  MessageText,
  MessageTimestamp,
  MessageUIComponentProps,
  useChannelStateContext,
  useChatContext,
  useMessageContext,
  StreamMessage,
} from 'stream-chat-react';
import {
  DeliveredCheckmark,
  DoubleCheckmark,
  MessageActionsEllipse,
  ReactionSmiley,
} from '../../assets';

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
import {
  SocialReactionList,
  customReactions,
  ReactionParticipants,
} from '../ReactionList/SocialReactionList';
import { UserActionsDropdown } from '../MessageActions/SocialMessageActions';

import './SocialMessageUI.scss';

type OptionsProps = {
  dropdownOpen: boolean;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // setMessageActionUser?: React.Dispatch<React.SetStateAction<string | undefined>>;
  setShowReactionSelector: React.Dispatch<React.SetStateAction<boolean>>;
};

const MessageOptions: React.FC<OptionsProps> = (props) => {
  const {
    dropdownOpen,
    setDropdownOpen,
    // setMessageActionUser,
    setShowReactionSelector,
  } = props;

  const { thread } = useChannelStateContext();
  const { handleOpenThread, isMyMessage, message } = useMessageContext();

  const hideActions = (thread && isMyMessage()) || (!thread && message.show_in_channel);

  return (
    <>
      <span onClick={() => setShowReactionSelector((prev) => !prev)}>
        <ReactionSmiley />
      </span>
      {!hideActions && (
        <span onClick={() => setDropdownOpen(!dropdownOpen)}>
          <MessageActionsEllipse />
        </span>
      )}
      {dropdownOpen && (
        <div className={`message-ui-options-dropdown ${isMyMessage() ? 'mine' : ''}`}>
          <UserActionsDropdown
            dropdownOpen={dropdownOpen}
            openThread={handleOpenThread}
            setDropdownOpen={setDropdownOpen}
            // setMessageActionUser={setMessageActionUser}
            thread={!thread}
            user={message.user}
          />
        </div>
      )}
    </>
  );
};

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
  const { isMyMessage, message, readBy, reactionSelectorRef } = useMessageContext<
    SocialAttachmentType,
    SocialChannelType,
    SocialCommandType,
    SocialEventType,
    SocialMessageType,
    SocialReactionType,
    SocialUserType
  >();

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

  const reactionsSelectorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkIfClickedOutside = (event: MouseEvent) => {
      if (
        reactionsSelectorRef.current &&
        event.target instanceof HTMLElement &&
        !reactionsSelectorRef.current?.contains(event.target)
      ) {
        setShowReactionSelector(false);
      }
    };

    document.addEventListener('mousedown', checkIfClickedOutside);
    return () => {
      document.removeEventListener('mousedown', checkIfClickedOutside);
    };
  }, [showReactionSelector]); // eslint-disable-line

  const isGroup =
    Object.values(channel.state.members).filter(({ user }) => user?.id !== client.userID).length >
    2;

  const myMessage = isMyMessage();

  const readByMembers = readBy?.filter((user) => user.id !== client.user?.id);
  const readByMembersLength = readByMembers?.length === 0 ? undefined : readByMembers?.length;

  return (
    <div
      className={`message-wrapper ${myMessage ? 'right' : ''}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => {
        setDropdownOpen(false);
        setShowOptions(false);
      }}
    >
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
          {message.attachments?.length ? <Attachment attachments={message.attachments} /> : null}
          <MessageText customWrapperClass={`${myMessage ? 'my-message' : ''}`} />
          <ReactionParticipants />
        </div>
        {showReactionSelector && (
          <span ref={reactionsSelectorRef}>
            <ReactionSelector reactionOptions={customReactions} ref={reactionSelectorRef} />
          </span>
        )}
        <ThreadReply />
        <div className='message-wrapper-inner-options'>
          {showOptions && (
            <MessageOptions
              dropdownOpen={dropdownOpen}
              setDropdownOpen={setDropdownOpen}
              // // setMessageActionUser={setMessageActionUser}
              setShowReactionSelector={setShowReactionSelector}
            />
          )}
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
