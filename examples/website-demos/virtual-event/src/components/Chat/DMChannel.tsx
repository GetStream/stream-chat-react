import React, { useState } from 'react';
import { Channel as StreamChannel } from 'stream-chat';
import { Channel, MessageInput, Thread, VirtualizedMessageList, Window } from 'stream-chat-react';

import './DMChannel.scss';
import { EmptyStateIndicators } from './EmptyStateIndicators';
import { MessageInputUI } from './MessageInputUI';
import { UserActionsModal } from './UserActionsModal';

import { CloseX, Ellipse } from '../../assets';

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
        <UserActionsModal
          actionsOpen={actionsOpen}
          dmChannel={dmChannel}
          setActionsOpen={setActionsOpen}
        />
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
