import React, { useState } from 'react';
import { MessageList, Thread, Window } from 'stream-chat-react';

import { ChannelEmptyState } from '../ChannelEmptyState/ChannelEmptyState';
import { PinnedMessageList } from '../PinnedMessageList/PinnedMessageList';
import { TeamChannelHeader } from '../TeamChannelHeader/TeamChannelHeader';
import { TeamMessage } from '../TeamMessage/TeamMessage';
import { TeamMessageInput } from '../TeamMessageInput/TeamMessageInput';
import { ThreadMessageInput } from '../TeamMessageInput/ThreadMessageInput';

export const ChannelInner = (props) => {
  const { pinsOpen, setIsEditing, setPinsOpen } = props;

  const [pinnedMessages, setPinnedMessages] = useState({});
  const pinnedMessagesIds = Object.keys(pinnedMessages);

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <Window>
        <TeamChannelHeader {...{ setIsEditing, setPinsOpen }} />
        <MessageList
          EmptyStateIndicator={ChannelEmptyState}
          Message={(messageProps) => (
            <TeamMessage
              {...messageProps}
              {...{ pinnedMessagesIds, setPinnedMessages, setPinsOpen }}
            />
          )}
          TypingIndicator={() => null}
        />
        <TeamMessageInput focus {...{ pinsOpen }} />
      </Window>
      <Thread
        additionalMessageListProps={{ TypingIndicator: () => null }}
        Message={TeamMessage}
        MessageInput={ThreadMessageInput}
      />
      {pinsOpen && <PinnedMessageList {...{ pinnedMessages, setPinsOpen }} />}
    </div>
  );
};
