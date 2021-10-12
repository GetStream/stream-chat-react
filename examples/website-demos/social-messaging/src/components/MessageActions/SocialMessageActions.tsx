import React, { useEffect, useState } from 'react';
import { ReactEventHandler, useChatContext } from 'stream-chat-react';

import {
  CopyMessage,
  DeleteMessage,
  EditMessage,
  FlagMessage,
  MuteUser,
  PinMessage,
  QuoteReply,
  StartThread,
} from '../../assets';
import { useViewContext, UserActions } from '../../contexts/ViewContext';

import type { Channel, UserResponse } from 'stream-chat';

type Props = {
  dropdownOpen: boolean;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dmChannel?: Channel;
  openThread?: ReactEventHandler;
  participantProfile?: UserResponse;
  setMessageActionUser?: React.Dispatch<React.SetStateAction<string | undefined>>;
  thread?: boolean;
  user?: UserResponse | null;
};

export const UserActionsDropdown: React.FC<Props> = (props) => {
  const {
    dropdownOpen,
    dmChannel,
    openThread,
    participantProfile,
    setDropdownOpen,
    setMessageActionUser,
    thread,
    user,
  } = props;

  const { client, mutes } = useChatContext();
  const { setMessageActionsOpen, setUserActionType } = useViewContext();

  const [isUserMuted, setIsUserMuted] = useState(false);

  useEffect(() => {
    if (mutes.length) {
      const actionUserId =
        participantProfile?.id ||
        user?.id ||
        Object.keys(dmChannel?.state.members || []).filter((member) => member !== client.userID)[0];

      const actionUserIsMuted = mutes.some((mute) => mute.target.id === actionUserId);
      setIsUserMuted(actionUserIsMuted);
    }
  }, [mutes.length]); // eslint-disable-line

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (event.target instanceof HTMLElement) {
        const elements = document.getElementsByClassName('dropdown');
        const actionsModal = elements.item(0);

        if (!actionsModal?.contains(event.target)) {
          setDropdownOpen(false);
        }
      }
    };

    if (dropdownOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]); // eslint-disable-line

  const handleClick = (action: UserActions) => {
    if (user) setMessageActionUser?.(user.id);
    setMessageActionsOpen(true);
    setDropdownOpen(false);
    setUserActionType(action);
  };

  const isOwnUser = client.userID === participantProfile?.id || client.userID === user?.id;

  return (
    <div className='dropdown'>
      {thread && openThread && (
        <div className='dropdown-option' onClick={openThread}>
          <QuoteReply />
          <div className='dropdown-option-text'>Reply</div>
        </div>
      )}
      {thread && openThread && (
        <div className='dropdown-option' onClick={openThread}>
          <StartThread />
          <div className='dropdown-option-text'>Thread Reply</div>
        </div>
      )}
      <div className='dropdown-option' onClick={openThread}>
        <CopyMessage />
        <div className='dropdown-option-text'>Copy Message</div>
      </div>
      <div className='dropdown-option' onClick={openThread}>
        <PinMessage />
        <div className='dropdown-option-text'>Pin to this Conversation</div>
      </div>
      {!isOwnUser && (
        <>
          <div className='dropdown-option' onClick={() => handleClick('flag')}>
            <FlagMessage />
            <div className='dropdown-option-text'>Flag Message</div>
          </div>
          <div
            className='dropdown-option'
            onClick={() => handleClick(isUserMuted ? 'unmute' : 'mute')}
          >
            <MuteUser />
            <div className='dropdown-option-text'>{isUserMuted ? 'Unmute User' : 'Mute User'}</div>
          </div>
        </>
      )}
      {isOwnUser && (
        <>
          <div className='dropdown-option' onClick={() => handleClick('flag')}>
            <EditMessage />
            <div className='dropdown-option-text'>Edit Message</div>
          </div>
          <div className='dropdown-option' onClick={() => handleClick('flag')}>
            <DeleteMessage />
            <div className='dropdown-option-text'>Delete Message</div>
          </div>
        </>
      )}
    </div>
  );
};
