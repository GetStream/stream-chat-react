import React, { useEffect, useState } from 'react';
import { Avatar, useChatContext } from 'stream-chat-react';

import './ParticipantProfile.scss';

import {
  BlockUser,
  CloseX,
  Ellipse,
  LinkedInLogo,
  MuteUser,
  ReportUser,
  TwitterLogo,
} from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

import type { Channel, UserResponse } from 'stream-chat';

import type { UserType } from '../../hooks/useInitChat';

type DropDownProps = {
  actionsOpen: boolean;
  setActionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DropDown: React.FC<DropDownProps> = (props) => {
  const { actionsOpen, setActionsOpen } = props;

  const [isUserMuted, setIsUserMuted] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (event.target instanceof HTMLElement) {
        const elements = document.getElementsByClassName('dropdown');
        const actionsModal = elements.item(0);

        if (!actionsModal?.contains(event.target)) {
          setActionsOpen(false);
        }
      }
    };

    if (actionsOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionsOpen]); // eslint-disable-line

  const handleMute = async () => {
    setIsUserMuted((prev) => !prev);
    setActionsOpen(false);
  };

  return (
    <div className='dropdown'>
      <div className='dropdown-option' onClick={() => handleMute()}>
        <div>{isUserMuted ? 'Unmute user' : 'Mute user'}</div>
        <MuteUser />
      </div>
      <div className='dropdown-option' onClick={() => setActionsOpen(false)}>
        <div>Block user</div>
        <BlockUser />
      </div>
      <div className='dropdown-option' onClick={() => setActionsOpen(false)}>
        <div>Report user</div>
        <ReportUser />
      </div>
    </div>
  );
};

type Props<UserType> = {
  participantProfile: UserResponse<UserType>;
  setDmChannel: React.Dispatch<React.SetStateAction<Channel | undefined>>;
  setParticipantProfile: React.Dispatch<React.SetStateAction<UserResponse | undefined>>;
};

export const ParticipantProfile = (props: Props<UserType>) => {
  const { participantProfile, setDmChannel, setParticipantProfile } = props;

  const { client } = useChatContext();
  const { setChatType, setShowChannelList } = useEventContext();

  const [actionsOpen, setActionsOpen] = useState(false);

  const { id, image, name, online, title } = participantProfile;

  const handleStartChat = async () => {
    if (!client.userID) return;

    try {
      const newChannel = client.channel('messaging', { members: [client.userID, id] });
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
        <div className='profile-header-actions' onClick={() => setActionsOpen((prev) => !prev)}>
          <Ellipse />
        </div>
      </div>
      {actionsOpen && <DropDown actionsOpen={actionsOpen} setActionsOpen={setActionsOpen} />}
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
