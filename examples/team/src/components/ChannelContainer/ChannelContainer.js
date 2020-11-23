import React, { useContext } from 'react';
import {
  Channel,
  ChatContext,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';

import './ChannelContainer.css';

import { ChannelEmptyState } from '../ChannelEmptyState/ChannelEmptyState';
import { CreateChannel } from '../CreateChannel/CreateChannel';
import { EditChannel } from '../EditChannel/EditChannel';
import { TeamChannelHeader } from '../TeamChannelHeader/TeamChannelHeader';
import { TeamMessage } from '../TeamMessage/TeamMessage';
import { TeamMessageInput } from '../TeamMessageInput/TeamMessageInput';
import { ThreadMessageInput } from '../TeamMessageInput/ThreadMessageInput';

export const ChannelContainer = (props) => {
  const {
    createType,
    isCreating,
    isEditing,
    setIsCreating,
    setIsEditing,
  } = props;

  const { channel } = useContext(ChatContext);

  if (isEditing) {
    const filters = {};

    if (channel?.state?.members) {
      const channelMembers = Object.keys(channel.state.members);
      if (channelMembers.length) {
        filters.id = { $nin: channelMembers };
      }
    }

    return (
      <div className="channel__container">
        <EditChannel {...{ filters, setIsEditing }} />
      </div>
    );
  }

  return (
    <div className="channel__container">
      {isCreating && createType ? (
        <CreateChannel {...{ createType, setIsCreating }} />
      ) : (
        <Channel>
          <Window>
            <TeamChannelHeader {...{ setIsEditing }} />
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
