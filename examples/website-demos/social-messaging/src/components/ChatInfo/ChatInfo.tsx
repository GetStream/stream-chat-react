import { useState } from 'react';

import { useChannelStateContext, useChatContext } from 'stream-chat-react';

import { ChannelNameInput } from './ChannelNameInput';
import { NewChatUser } from '../NewChat/NewChatUser';

import {
  Copy,
  ExpandArrow,
  Files,
  MuteUser,
  Photos,
  PinMessage,
  SharedGroups,
  Trashcan,
  UserInfo,
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

import './ChatInfo.scss';

export const ChatInfo = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext<
    SocialAttachmentType,
    SocialChannelType,
    SocialCommandType,
    SocialEventType,
    SocialMessageType,
    SocialReactionType,
    SocialUserType
  >();

  const members = Object.values(channel.state.members)
    .filter(({ user }) => user?.id !== client.userID)
    .map(({ user }) => user);

  const [channelName, setChannelName] = useState<string | undefined>(channel?.data?.name);

  const updateChannel = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.preventDefault();

    const nameChanged = channelName !== channel?.data?.name;

    if (nameChanged) {
      await channel?.update(
        { name: channelName },
        { text: `Channel name changed to ${channelName}` },
      );
    }
  };

  const pinnedMessages = channel.state.pinnedMessages.length;

  const photosAndImages = channel.state.messages
    .map(({ attachments }) => {
      return attachments?.filter(({ type }) => type !== 'file').length;
    })
    .reduce((total, count) => (total || 0) + (count || 0), 0);

  const files = channel.state.messages
    .map(({ attachments }) => {
      return attachments?.filter(({ type }) => type === 'file').length;
    })
    .reduce((total, count) => (total || 0) + (count || 0), 0);

  const actions = () => {
    return (
      <>
        {members.length === 1 && (
          <div className='chat-info-option'>
            <div className='chat-info-option-start'>
              <UserInfo />@{members[0]?.id}
            </div>
            <div className='chat-info-option-end'>
              <Copy />
            </div>
          </div>
        )}
        <div className='chat-info-option'>
          <div className='chat-info-option-start'>
            <MuteUser />
            {members.length > 1 ? 'Mute Group' : 'Mute User'}
          </div>
          <div className='chat-info-option-end'>TOGGLE HERE</div>
        </div>
        <div className='chat-info-option'>
          <div className='chat-info-option-start'>
            <PinMessage />
            Pinned Messages
          </div>
          <div className='chat-info-option-end'>
            <div className={`chat-info-option-end-items ${pinnedMessages ? '' : 'showNumber'}`}>
              <span className='chat-info-option-end-items-text'>{pinnedMessages}</span>
            </div>
            <ExpandArrow />
          </div>
        </div>
        <div className='chat-info-option'>
          <div className='chat-info-option-start'>
            <Photos />
            Photos & Videos
          </div>
          <div className='chat-info-option-end'>
            <div className={`chat-info-option-end-items ${photosAndImages ? '' : 'showNumber'}`}>
              <span className='chat-info-option-end-items-text'>{photosAndImages}</span>
            </div>
            <ExpandArrow />
          </div>
        </div>
        <div className='chat-info-option'>
          <div className='chat-info-option-start'>
            <Files />
            Files
          </div>
          <div className='chat-info-option-end'>
            <div className={`chat-info-option-end-items ${files ? '' : 'showNumber'}`}>
              <span className='chat-info-option-end-items-text'>{files}</span>
            </div>
            <ExpandArrow />
          </div>
        </div>
        {members.length === 1 && (
          <div className='chat-info-option'>
            <div className='chat-info-option-start'>
              <SharedGroups />
              Shared Groups
            </div>
            <div className='chat-info-option-end'>
              <div className={`chat-info-option-end-items ${pinnedMessages ? '' : 'showNumber'}`}>
                <span className='chat-info-option-end-items-text'>{pinnedMessages}</span>
              </div>
              <ExpandArrow />
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className='chat-info-members'>
        {members.map((user, i) => (
          <NewChatUser key={user?.id} user={user} />
        ))}
      </div>
      <div className='chat-info-divider'></div>
      {members.length !== 1 && (
        <div className='chat-info-name'>
          <div className='chat-info-name-contents'>
            <span className='chat-info-name-contents-label'>NAME</span>
            <ChannelNameInput {...{ channelName, setChannelName }} />
          </div>
          <span className='chat-info-name-save' onClick={updateChannel}>
            SAVE
          </span>
        </div>
      )}
      {actions()}
      <div className='chat-info-divider'></div>
      <div className='chat-info-option-delete'>
        <Trashcan />
        Delete conversation
      </div>
    </>
  );
};
