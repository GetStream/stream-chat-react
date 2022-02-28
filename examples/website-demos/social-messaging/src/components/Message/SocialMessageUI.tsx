import { useEffect, useRef, useState } from 'react';
import {
  Attachment,
  Avatar,
  ReactionSelector,
  MessageText,
  MessageTimestamp,
  MessageUIComponentProps,
  useChannelStateContext,
  useChatContext,
  useMessageContext,
  useEditHandler,
  MessageInput,
  ReactEventHandler,
} from 'stream-chat-react';

import { SocialMessageDeleted } from './SocialMessageDeleted';

import {
  ActionsEllipse,
  DeliveredCheckmark,
  DoubleCheckmark,
  PinnedBy,
  ReactionSmiley,
  SendAlso,
} from '../../assets';

import { StreamChatGenerics } from '../../types';

import { SocialGallery } from '../Gallery/SocialGallery';
import { ThreadReply } from '../ThreadReply/ThreadReply';
import {
  SocialReactionList,
  customReactions,
  ReactionParticipants,
} from '../ReactionList/SocialReactionList';
import { SocialMessageActions } from '../MessageActions/SocialMessageActions';
import { ActionsModal } from '../MessageActions/ActionsModal';
import { SocialModal } from '../MessageInput/SocialModal';
import { EditInput } from '../MessageInput/EditInput';

import { useActionsContext } from '../../contexts/ActionsContext';

import './SocialMessageUI.scss';

type OptionsProps = {
  dropdownOpen: boolean;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMessageActionUser: React.Dispatch<React.SetStateAction<string | undefined>>;
  setShowReactionSelector: React.Dispatch<React.SetStateAction<boolean>>;
  setEdit: ReactEventHandler;
};

const MessageOptions: React.FC<OptionsProps> = (props) => {
  const {
    dropdownOpen,
    setDropdownOpen,
    setEdit,
    setMessageActionUser,
    setShowReactionSelector,
  } = props;

  const { thread } = useChannelStateContext();
  const { handleOpenThread, isMyMessage, message } = useMessageContext();

  const hideActions = (thread && isMyMessage()) || (!thread && message.show_in_channel);

  return (
    <div className='inside'>
      {!hideActions && (
        <span className='inside-ellipse' onClick={() => setDropdownOpen(!dropdownOpen)}>
          <ActionsEllipse />
        </span>
      )}
      <span className='inside-smiley' onClick={() => setShowReactionSelector((prev) => !prev)}>
        <ReactionSmiley />
      </span>
      {dropdownOpen && (
        <div className={`inside-dropdown ${isMyMessage() ? 'mine' : ''}`}>
          <SocialMessageActions
            dropdownOpen={dropdownOpen}
            openThread={handleOpenThread}
            setDropdownOpen={setDropdownOpen}
            setMessageActionUser={setMessageActionUser}
            thread={!thread}
            user={message.user}
            setEdit={setEdit}
          />
        </div>
      )}
    </div>
  );
};

export const SocialMessage: React.FC<MessageUIComponentProps<StreamChatGenerics>> = () => {
  const { channel, pinnedMessages } = useChannelStateContext();
  const { client } = useChatContext();
  const {
    isMyMessage,
    message,
    readBy,
    reactionSelectorRef,
  } = useMessageContext<StreamChatGenerics>();
  const { actionsModalOpenId, userActionType } = useActionsContext();

  const [messageActionUser, setMessageActionUser] = useState<string>();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showReactionSelector, setShowReactionSelector] = useState(false);

  const { clearEdit, editing, setEdit } = useEditHandler();

  const messageIsPinned = pinnedMessages?.length
    ? pinnedMessages.some((pin) => pin.id === message.id)
    : false;

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

  if (message.deleted_at || message.type === 'deleted') {
    return <SocialMessageDeleted />;
  }

  return (
    <>
      {editing && (
        <SocialModal onClose={clearEdit} open={editing}>
          <MessageInput clearEditingState={clearEdit} Input={EditInput} message={message} />
        </SocialModal>
      )}
      <div
        className={`message-wrapper ${myMessage ? 'right' : ''} ${
          messageIsPinned ? 'pinned' : ''
        } ${message.show_in_channel ? 'show' : ''}`}
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => !dropdownOpen && setShowOptions(false)}
      >
        {actionsModalOpenId === message.id && userActionType && (
          <ActionsModal actionId={messageActionUser} userActionType={userActionType} />
        )}
        {!myMessage && (
          <Avatar
            size={36}
            image={message.user?.image}
            name={message.user?.name || message.user?.id}
          />
        )}
        <div className={`message-wrapper-inner ${myMessage ? 'my-message' : ''}`}>
          {messageIsPinned ? (
            <div className='pinned-by'>
              <PinnedBy />
              Pinned
              {message.pinned_by && client.user
                ? message.pinned_by.name === client.user.name
                  ? ' by You'
                  : ` by ${message.pinned_by.name || message.pinned_by.id}`
                : ''}
            </div>
          ) : null}
          {message.show_in_channel ? (
            <div className='send-also'>
              <SendAlso />
            </div>
          ) : null}
          <div className='message-wrapper-inner-text'>
            <SocialReactionList />
            <div className={`${message.show_in_channel ? 'send-also-text' : ''}`}>
              {message.attachments?.length ? (
                <Attachment attachments={message.attachments} Gallery={SocialGallery} />
              ) : null}
              <MessageText customWrapperClass={`${myMessage ? 'my-message' : ''}`} />
            </div>
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
                setMessageActionUser={setMessageActionUser}
                setShowReactionSelector={setShowReactionSelector}
                setEdit={setEdit}
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
    </>
  );
};
