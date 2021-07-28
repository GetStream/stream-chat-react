import React from 'react';
import { Channel, UserResponse } from 'stream-chat';
import { ChannelSearch, useChatContext } from 'stream-chat-react';

import { isChannel } from './utils';

import './ParticipantSearch.scss';

import { CloseX } from '../../assets';

type Props = {
  setDmChannel: React.Dispatch<React.SetStateAction<Channel | undefined>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ParticipantSearch: React.FC<Props> = (props) => {
  const { setDmChannel, setSearching } = props;

  const { client } = useChatContext();

  const handleSelectResult = async (result: Channel | UserResponse) => {
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

  return (
    <div className='search'>
      <div className='search-header'>
        <div className='search-header-close' onClick={() => setSearching(false)}>
          <CloseX />
        </div>
        <div className='search-header-title'> Participants </div>
      </div>
      <ChannelSearch onSelectResult={handleSelectResult} />
    </div>
  );
};
