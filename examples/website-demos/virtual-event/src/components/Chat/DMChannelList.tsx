import React, { useState } from 'react';
import { Channel as StreamChannel, ChannelSort } from 'stream-chat';
import {
  Avatar,
  Channel,
  ChannelList,
  ChannelListMessengerProps,
  ChannelPreviewUIComponentProps,
  ChannelSearch,
  MessageInput,
  Thread,
  VirtualizedMessageList,
  Window,
} from 'stream-chat-react';

import './DMChannelList.scss';
import { EmptyStateIndicators } from './EmptyStateIndicators';

import { ClickDMIcon } from '../../assets';

const filters = { type: 'messaging' };
const options = { state: true, presence: true, limit: 10 };
const sort: ChannelSort = { last_message_at: -1 };

const ListWrapper: React.FC = ({ children }) => {
  return <div className='dm-list'>{children}</div>;
};

const List: React.FC<ChannelListMessengerProps> = (props) => {
  const { children, error, loading } = props;

  if (loading) {
    return (
      <ListWrapper>
        <div>Loading...</div>
      </ListWrapper>
    );
  }

  if (error) {
    return (
      <ListWrapper>
        <div>Error</div>
      </ListWrapper>
    );
  }

  return <ListWrapper>{children}</ListWrapper>;
};

const getFormattedTime = (time: number) => {
  if (!time) return '';
  if (time < 60) return 'Less than 1 min';
  if (time < 120) return '1 min';
  if (time < 3600) return `${Math.floor(time / 60)} mins`;
  if (time < 86400) return `${Math.floor(time / 3600)} hours`;
  return `${Math.floor(time / 86400)} days`;
};

export const DMChannelList = () => {
  const [dmChannel, setDmChannel] = useState<StreamChannel>();
  const [searching, setSearching] = useState(false);

  const Preview: React.FC<ChannelPreviewUIComponentProps> = (props) => {
    const { channel, displayImage, displayTitle, latestMessage } = props;

    const timeSinceLastMessage = channel.state?.last_message_at
      ? (Date.now() - channel.state.last_message_at.getTime()) / 1000
      : 0;

    const formattedTime = getFormattedTime(timeSinceLastMessage);

    return (
      <div className='dm-list-preview' onClick={() => setDmChannel(channel)}>
        <Avatar image={displayImage} />
        <div>
          <div className='dm-list-preview-top'>
            <div>{displayTitle}</div>
            <div>{formattedTime}</div>
          </div>
          <div className='dm-list-preview-bottom'>{latestMessage}</div>
        </div>
        <ClickDMIcon />
      </div>
    );
  };

  if (searching) {
    return <ChannelSearch />;
  }

  return (
    <div className='dm'>
      {dmChannel ? (
        <Channel channel={dmChannel} EmptyStateIndicator={EmptyStateIndicators}>
          <Window hideOnThread>
            <VirtualizedMessageList hideDeletedMessages />
            <MessageInput focus />
          </Window>
          <Thread />
        </Channel>
      ) : (
        <>
          <ChannelList
            EmptyStateIndicator={EmptyStateIndicators}
            filters={filters}
            List={List}
            options={options}
            Preview={Preview}
            sort={sort}
          />
          <div className='start-chat'>
            <div className='start-chat-button' onClick={() => setSearching(true)}>
              Start a chat
            </div>
          </div>
        </>
      )}
    </div>
  );
};
