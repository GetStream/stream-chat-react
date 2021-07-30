import React, { useEffect, useState } from 'react';
import { Channel as StreamChannel } from 'stream-chat';
import { Channel, MessageInput, Thread, VirtualizedMessageList, Window } from 'stream-chat-react';

import './DMChannel.scss';
import { EmptyStateIndicators } from './EmptyStateIndicators';
import { MessageInputUI } from './MessageInputUI';

import { CloseX, Ellipse } from '../../assets';

const DropDown = ({
  dmChannel,
  setOpenMenu,
}: {
  dmChannel: StreamChannel;
  setOpenMenu: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [isChannelMuted, setIsChannelMuted] = useState(false);

  useEffect(() => {
    const muted = dmChannel.muteStatus().muted;
    setIsChannelMuted(muted);
  }, [dmChannel]);

  const handleMute = async () => {
    isChannelMuted ? await dmChannel.unmute() : await dmChannel.mute();
    setOpenMenu(false);
  };

  return (
    <div className='dropdown'>
      <div className='dropdown-option' onClick={() => handleMute()}>
        {isChannelMuted ? 'UnmuteUser' : 'Mute User'}
      </div>
      <div className='dropdown-option' onClick={() => setOpenMenu(false)}>
        Block User
      </div>
      <div className='dropdown-option' onClick={() => setOpenMenu(false)}>
        Report User
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
  const [openMenu, setOpenMenu] = useState(false);

  const user = dmChannel.state.membership.user?.id;

  const channelTitle = Object.keys(dmChannel.state.members).filter((key) => key !== user);

  const handleCloseDm = () => setDmChannel(undefined);

  return (
    <div className='dm-channel'>
      <div className='dm-header-container'>
        <div className='dm-header-close' onClick={handleCloseDm}>
          <CloseX />
        </div>
        <div className='dm-header-title'>
          <div>{channelTitle}</div>
          <div className='dm-header-title-sub-title'>Direct Message</div>
        </div>
        <div className='dm-header-actions' onClick={() => setOpenMenu(!openMenu)}>
          <Ellipse />
        </div>
      </div>
      {openMenu && <DropDown dmChannel={dmChannel} setOpenMenu={setOpenMenu} />}
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
