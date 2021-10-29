import { useState } from 'react';

import { useChannelStateContext, useChatContext } from 'stream-chat-react';

import { ChannelNameInput } from './ChannelNameInput';
import { NewChatUser } from '../NewChat/NewChatUser';

import {
  Copy,
  DeleteMessage,
  Files,
  MuteUser,
  Photos,
  PinMessage,
  SharedGroups,
  UserInfo,
} from '../../assets';

import './ChatInfo.scss';

export const ChatInfo = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();

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
          <PinMessage />
          Pinned Messages
        </div>
        <div className='chat-info-option'>
          <Photos />
          Photos & Videos
        </div>
        <div className='chat-info-option'>
          <Files />
          Files
        </div>
        {members.length === 1 && (
          <div className='chat-info-option'>
            <SharedGroups />
            Shared Groups
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
        <DeleteMessage />
        Delete conversation
      </div>
    </>
  );
};
