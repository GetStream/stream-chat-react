import React, { useState } from 'react';
import { Avatar, useChatContext } from 'stream-chat-react';

import { UserActionsDropdown } from './UserActionsDropdown';

import { CloseX, Ellipse, LinkedInLogo, TwitterLogo } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

import type { Channel, UserResponse } from 'stream-chat';

import type { StreamChatGenerics as VirtualAppStreamChatGenerics } from '../../types';

type Props<
  StreamChatGenerics extends VirtualAppStreamChatGenerics = VirtualAppStreamChatGenerics
> = {
  participantProfile: UserResponse<StreamChatGenerics>;
  setDmChannel: React.Dispatch<React.SetStateAction<Channel | undefined>>;
  setParticipantProfile: React.Dispatch<React.SetStateAction<UserResponse | undefined>>;
};

export const ParticipantProfile = (props: Props<VirtualAppStreamChatGenerics>) => {
  const { participantProfile, setDmChannel, setParticipantProfile } = props;

  const { client } = useChatContext();
  const { setChatType, setShowChannelList } = useEventContext();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { id, image, name, online, title } = participantProfile;

  const handleStartChat = async () => {
    if (!client.userID) return;

    try {
      const newChannel = client.channel('messaging', {
        demo: 'virtual-event',
        members: [client.userID, id],
      });

      await newChannel.watch();

      setChatType('direct');
      setShowChannelList(true);
      setDmChannel(newChannel);
      setParticipantProfile(undefined);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className='profile'>
      <div className='profile-header'>
        <div className='profile-header-close' onClick={() => setParticipantProfile(undefined)}>
          <CloseX />
        </div>
        <div
          className={`profile-header-actions ${dropdownOpen ? 'open' : ''}`}
          onClick={() => setDropdownOpen((prev) => !prev)}
        >
          <Ellipse />
        </div>
      </div>
      {dropdownOpen && (
        <UserActionsDropdown
          dropdownOpen={dropdownOpen}
          participantProfile={participantProfile}
          setDropdownOpen={setDropdownOpen}
        />
      )}
      <div className='profile-details'>
        {image ? (
          <img src={image} alt={image} />
        ) : (
          <Avatar name={name || id} shape='rounded' size={200} />
        )}
        <div className='profile-details-top'>
          {online && <div className='profile-details-top-online' />}
          <div className='profile-details-top-name'>{name || id}</div>
        </div>
        <div className='profile-details-title'>{title || 'Attendee'}</div>
        <div className='profile-details-logos'>
          <TwitterLogo />
          <LinkedInLogo />
        </div>
      </div>
      <div className='start-chat' onClick={handleStartChat}>
        <div className='start-chat-button'>Start a chat</div>
      </div>
    </div>
  );
};
