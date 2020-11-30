import React, { useContext, useState } from 'react';
import { ChatContext } from 'stream-chat-react';

import './CreateChannel.css';

import { UserList } from './UserList';

import { CloseCreateChannel } from '../../assets';

const ChannelNameInput = ({ channelName = '', setChannelName }) => {
  const handleChange = (event) => {
    event.preventDefault();
    setChannelName(event.target.value);
  };

  return (
    <div className="channel-name-input__wrapper">
      <p>Name</p>
      <input
        onChange={handleChange}
        placeholder="channel-name"
        type="text"
        value={channelName}
      />
      <p>Add Members</p>
    </div>
  );
};

export const CreateChannel = ({ createType, filters, setIsCreating }) => {
  const { client, setActiveChannel } = useContext(ChatContext);

  const [channelName, setChannelName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([client.userID]);

  const createChannel = async (event) => {
    event.preventDefault();

    const newChannel = await client.channel(createType, channelName, {
      name: channelName,
      members: selectedUsers,
    });

    await newChannel.watch();

    setChannelName('');
    setIsCreating(false);
    setSelectedUsers([client.userID]);
    setActiveChannel(newChannel);
  };

  return (
    <div className="create-channel__container">
      <div className="create-channel__header">
        <p>
          {createType === 'team'
            ? 'Create a New Channel'
            : 'Send a Direct Message'}
        </p>
        <CloseCreateChannel {...{ setIsCreating }} />
      </div>
      {createType === 'team' && (
        <ChannelNameInput {...{ channelName, setChannelName }} />
      )}
      <UserList {...{ filters, setSelectedUsers }} />
      <div
        className={`create-channel__button-wrapper ${createType}`}
        onClick={createChannel}
      >
        <p>
          {createType === 'team' ? 'Create Channel' : 'Create Message Group'}
        </p>
      </div>
    </div>
  );
};
