import React, { useState } from 'react';
import { MessageList, Thread, Window } from 'stream-chat-react';

import './ChannelContainer.css';

import { ChannelEmptyState } from '../ChannelEmptyState/ChannelEmptyState';
import { PinnedMessageList } from '../PinnedMessageList/PinnedMessageList';
import { TeamChannelHeader } from '../TeamChannelHeader/TeamChannelHeader';
import { TeamMessage } from '../TeamMessage/TeamMessage';
import { TeamMessageInput } from '../TeamMessageInput/TeamMessageInput';
import { ThreadMessageInput } from '../TeamMessageInput/ThreadMessageInput';

export const ChannelInner = (props) => {
  const { pinsOpen, setIsEditing, setPinsOpen } = props;

  const [pinnedMessages, setPinnedMessages] = useState({});

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <Window>
        <TeamChannelHeader {...{ setIsEditing, setPinsOpen }} />
        <MessageList
          EmptyStateIndicator={ChannelEmptyState}
          Message={(messageProps) => (
            <TeamMessage
              {...messageProps}
              {...{ pinnedMessages, setPinnedMessages }}
            />
          )}
          TypingIndicator={() => null}
        />
        <TeamMessageInput focus {...{ pinsOpen }} />
      </Window>
      {!pinsOpen && (
        <Thread
          additionalMessageListProps={{ TypingIndicator: () => null }}
          Message={TeamMessage}
          MessageInput={ThreadMessageInput}
        />
      )}
      {pinsOpen && <PinnedMessageList {...{ pinnedMessages, setPinsOpen }} />}
    </div>
  );
};
