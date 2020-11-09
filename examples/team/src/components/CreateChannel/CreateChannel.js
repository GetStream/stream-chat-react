import React, { useState } from 'react';

import './CreateChannel.css';

import { UserList } from './UserList';

import { CloseCreateChannel } from '../../assets/CloseCreateChannel';

const ChannelNameInput = ({ channelName, setChannelName }) => {
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

export const CreateChannel = ({ createType, setIsCreating }) => {
  const [channelName, setChannelName] = useState('');

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
      <UserList />
    </div>
  );
};
