import React from 'react';
import { Channel, MessageList, Thread, Window } from 'stream-chat-react';

import './ChannelContainer.css';

import { ChannelEmptyState } from '../ChannelEmptyState/ChannelEmptyState';
import { CreateChannel } from '../CreateChannel/CreateChannel';
import { TeamChannelHeader } from '../TeamChannelHeader/TeamChannelHeader';
import { TeamMessage } from '../TeamMessage/TeamMessage';
import { TeamMessageInput } from '../TeamMessageInput/TeamMessageInput';
import { ThreadMessageInput } from '../TeamMessageInput/ThreadMessageInput';

export const ChannelContainer = (props) => {
  const { createType, isCreating, setIsCreating } = props;

  return (
    <div className="channel__container">
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
