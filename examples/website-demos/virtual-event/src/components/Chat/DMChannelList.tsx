import React, { useState } from 'react';
import {
  Avatar,
  ChannelList,
  ChannelListMessengerProps,
  ChannelPreviewUIComponentProps,
  ChannelSearch,
  useChatContext,
} from 'stream-chat-react';

import './DMChannelList.scss';
import { DMChannel } from './DMChannel';
import { EmptyStateIndicators } from './EmptyStateIndicators';
import { getFormattedTime, isChannel } from './utils';

import { ClickDMIcon } from '../../assets';

import type {
  Channel as StreamChannel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  UserResponse,
} from 'stream-chat';

const filters: ChannelFilters = { type: 'messaging' };
const options: ChannelOptions = { state: true, presence: true, limit: 10 };
const sort: ChannelSort = { last_message_at: -1 };

const ListWrapper: React.FC = ({ children }) => {
  return <div className='dm-list'>{children}</div>;
};

const ListUI: React.FC<ChannelListMessengerProps> = (props) => {
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

const PreviewUI: React.FC<
  ChannelPreviewUIComponentProps & {
    setDmChannel: React.Dispatch<React.SetStateAction<StreamChannel | undefined>>;
  }
> = (props) => {
  const { channel, displayImage, displayTitle, latestMessage, setDmChannel } = props;

  const secondsSinceLastMessage = channel.state?.last_message_at
    ? (Date.now() - channel.state.last_message_at.getTime()) / 1000
    : 0;

  const formattedTime = getFormattedTime(secondsSinceLastMessage);

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

export const DMChannelList = () => {
  const { client } = useChatContext();

  const [dmChannel, setDmChannel] = useState<StreamChannel>();
  const [searching, setSearching] = useState(false);

  const handleSelectResult = async (result: StreamChannel | UserResponse) => {
    if (!client.userID || isChannel(result)) return;

    try {
      const newChannel = client.channel('messaging', { members: [client.userID, result.id] });
      await newChannel.watch();

      setDmChannel(newChannel);
    } catch (err) {
      console.log(err);
    }

    setSearching(false);
  };

  if (searching) {
    return <ChannelSearch onSelectResult={handleSelectResult} />;
  }

  return (
    <div className='dm'>
      {dmChannel && <DMChannel dmChannel={dmChannel} setDmChannel={setDmChannel} />}
      <div className={dmChannel ? 'dm-hidden' : ''}>
        <ChannelList
          EmptyStateIndicator={EmptyStateIndicators}
          filters={filters}
          List={ListUI}
          options={options}
          Preview={(props) => <PreviewUI {...props} setDmChannel={setDmChannel} />}
          sort={sort}
        />
        <div className='start-chat'>
          <div className='start-chat-button' onClick={() => setSearching(true)}>
            Start a chat
          </div>
        </div>
      </div>
    </div>
  );
};
