import { useState } from 'react';
import Dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Avatar, useChannelStateContext, useChatContext } from 'stream-chat-react';

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

import { StreamChatGenerics } from '../../types';

import './ChatInfo.scss';

export const ChatInfo = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext<StreamChatGenerics>();

  const members = Object.values(channel.state.members)
    .filter(({ user }) => user?.id !== client.userID)
    .map(({ user }) => user);

  const online = channel.state.watcher_count > 1 ? true : false;

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

  const sharedGroups = 0; // todo

  const users = () => {
    const user = Object.values(channel.state.members)
      .filter(({ user }) => user?.id !== client.userID)
      .map(({ user }) => user)[0];

    Dayjs.extend(relativeTime);
    let status = Dayjs().from(Dayjs(user?.last_active), true);

    if (members.length === 1) {
      return (
        <div className='single-user'>
          <Avatar image={user?.image || ''} name={user?.name || user?.id} size={64} />
          <div className='single-user-name'>{user?.name || user?.id}</div>
          <div className='single-user-status'>
            {online && <div className='single-user-status-online'></div>}
            {user?.last_active ? <span>Last online {status} ago</span> : <span>Not online</span>}
          </div>
        </div>
      );
    }

    return (
      <div>
        {members.map((user) => (
          <NewChatUser key={user?.id} user={user} />
        ))}
      </div>
    );
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
          <div className='chat-info-option-start'>
            <PinMessage />
            Pinned Messages
          </div>
          <div className='chat-info-option-end'>
            <div className={`chat-info-option-end-items ${pinnedMessages ? '' : 'showNumber'}`}>
              <span className='chat-info-option-end-items-text'>{pinnedMessages}</span>
            </div>
            <ExpandArrow chatInfoItem='Pinned Messages' />
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
            <ExpandArrow chatInfoItem='Photos & Videos' />
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
            <ExpandArrow chatInfoItem='Files' />
          </div>
        </div>
        {members.length === 1 && (
          <div className='chat-info-option'>
            <div className='chat-info-option-start'>
              <SharedGroups />
              Shared Groups
            </div>
            <div className='chat-info-option-end'>
              <div className={`chat-info-option-end-items ${sharedGroups ? '' : 'showNumber'}`}>
                <span className='chat-info-option-end-items-text'>{sharedGroups}</span>
              </div>
              <ExpandArrow chatInfoItem='Shared Groups' />
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className='chat-info'>
      <div className='chat-info-members'>{users()}</div>
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
    </div>
  );
};
