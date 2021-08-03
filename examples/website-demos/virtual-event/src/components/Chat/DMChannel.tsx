import React, { useEffect, useState } from 'react';
import { Channel as StreamChannel } from 'stream-chat';
import { Channel, MessageInput, Thread, VirtualizedMessageList, Window } from 'stream-chat-react';

import './DMChannel.scss';
import { EmptyStateIndicators } from './EmptyStateIndicators';
import { MessageInputUI } from './MessageInputUI';

import { BlockUser, CloseX, Ellipse, MuteUser, ReportUser } from '../../assets';

type DropDownProps = {
  actionsOpen: boolean;
  dmChannel: StreamChannel;
  setActionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DropDown: React.FC<DropDownProps> = (props) => {
  const { actionsOpen, dmChannel, setActionsOpen } = props;

  const [isChannelMuted, setIsChannelMuted] = useState(false);

  useEffect(() => {
    const muted = dmChannel.muteStatus().muted;
    setIsChannelMuted(muted);
  }, [dmChannel]);

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
    isChannelMuted ? await dmChannel.unmute() : await dmChannel.mute();
    setActionsOpen(false);
  };

  return (
    <div className='dropdown'>
      <div className='dropdown-option' onClick={() => handleMute()}>
        <div>{isChannelMuted ? 'Unmute user' : 'Mute user'}</div>
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

type Props = {
  dmChannel: StreamChannel;
  setDmChannel: React.Dispatch<React.SetStateAction<StreamChannel | undefined>>;
};

export const DMChannel: React.FC<Props> = (props) => {
  const { dmChannel, setDmChannel } = props;

  const [actionsOpen, setActionsOpen] = useState(false);

  const user = dmChannel.state.membership.user?.id;

  const channelTitle = Object.keys(dmChannel.state.members).filter((key) => key !== user);

  return (
    <div className='dm-channel'>
      <div className='dm-header-container'>
        <div className='dm-header-close' onClick={() => setDmChannel(undefined)}>
          <CloseX />
        </div>
        <div className='dm-header-title'>
          <div>{channelTitle}</div>
          <div className='dm-header-title-sub-title'>Direct Message</div>
        </div>
        <div className='dm-header-actions' onClick={() => setActionsOpen((prev) => !prev)}>
          <Ellipse />
        </div>
      </div>
      {actionsOpen && (
        <DropDown actionsOpen={actionsOpen} dmChannel={dmChannel} setActionsOpen={setActionsOpen} />
      )}
      <Channel
        channel={dmChannel}
        EmptyStateIndicator={(props) => <EmptyStateIndicators {...props} isDmChannel />}
        Input={MessageInputUI}
      >
        <Window hideOnThread>
          <VirtualizedMessageList hideDeletedMessages />
          <MessageInput focus />
        </Window>
        <Thread />
      </Channel>
    </div>
  );
};
