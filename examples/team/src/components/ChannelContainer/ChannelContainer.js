import React, { useState } from 'react';
import { Channel, MessageList, Thread, Window } from 'stream-chat-react';

import './ChannelContainer.css';

import { AddChannel } from '../../assets/AddChannel';
import { ChannelEmptyState } from '../ChannelEmptyState/ChannelEmptyState';
import { CreateChannel } from '../CreateChannel/CreateChannel';
import { TeamChannelHeader } from '../TeamChannelHeader/TeamChannelHeader';
import { TeamMessage } from '../TeamMessage/TeamMessage';
import { TeamMessageInput } from '../TeamMessageInput/TeamMessageInput';
import { ThreadMessageInput } from '../TeamMessageInput/ThreadMessageInput';

export const ChannelContainer = () => {
  const [createType, setCreateType] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="channel__container">
      <div className="channel__add first-button">
        <AddChannel
          setCreateType={setCreateType}
          setIsCreating={setIsCreating}
          type="team"
        />
      </div>
      <div className="channel__add second-button">
        <AddChannel
          setCreateType={setCreateType}
          setIsCreating={setIsCreating}
          type="messaging"
        />
      </div>
      {isCreating && createType ? (
        <CreateChannel {...{ createType, setIsCreating }} />
      ) : (
        <Channel>
          <Window>
            <TeamChannelHeader />
            <MessageList
              EmptyStateIndicator={ChannelEmptyState}
              Message={TeamMessage}
              TypingIndicator={() => null}
            />
            <TeamMessageInput focus />
          </Window>
          <Thread
            additionalMessageListProps={{ TypingIndicator: () => null }}
            Message={TeamMessage}
            MessageInput={ThreadMessageInput}
          />
        </Channel>
      )}
    </div>
  );
};
