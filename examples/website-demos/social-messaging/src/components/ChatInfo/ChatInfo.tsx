import { useChannelStateContext, useChatContext } from 'stream-chat-react';

import { NewChatUser } from '../NewChat/NewChatUser';

import { DeleteMessage, MuteUser, PinMessage, UserInfo } from '../../assets';

import './ChatInfo.scss';

export const ChatInfo = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();

  const members = Object.values(channel.state.members)
    .filter(({ user }) => user?.id !== client.userID)
    .map(({ user }) => user);

  const actions = () => {
    return (
      <>
        {members.length === 1 && (
          <div className='chat-info-option'>
            <UserInfo />@{members[0]?.id}
          </div>
        )}
        <div className='chat-info-option'>
          <MuteUser />
          {members.length > 1 ? 'Mute Group' : 'Mute User'}
        </div>
        <div className='chat-info-option'>
          <PinMessage />
          Pinned Messages
        </div>
        <div className='chat-info-option'>
          <PinMessage />
          Photos & Videos
        </div>
        <div className='chat-info-option'>
          <PinMessage />
          Files
        </div>
        {members.length === 1 && (
          <div className='chat-info-option'>
            <PinMessage />
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
      <div className='chat-info-name'>Channel Name Here</div>
      {actions()}
      <div className='chat-info-divider'></div>
      <div className='chat-info-option-delete'>
        <DeleteMessage />
        Delete conversation
      </div>
    </>
  );
};
