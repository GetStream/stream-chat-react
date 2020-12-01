import React from 'react';
import { ChannelList } from 'stream-chat-react';

import './AgentChannelListContainer.css';

import { AgentChannelList } from '../AgentChannelList/AgentChannelList';
import { AgentChannelPreview } from '../AgentChannelList/AgentChannelPreview';

import { SearchIcon } from '../../assets';

const ChannelSearch = () => (
  <div className="channel-search__container">
    <div className="channel-search__input__wrapper">
      <div className="channel-search__input__icon">
        <SearchIcon />
      </div>
      <input
        className="channel-search__input__text"
        onChange={(e) => console.log(e.target.value)}
        placeholder="Search"
        type="text"
      />
    </div>
  </div>
);

const options = {
  member: true,
  watch: true,
  limit: 3,
};
const sort = { last_message_at: -1 };

export const AgentChannelListContainer = (props) => {
  const { agentChannelId, customerChannelId } = props;

  const filters = {
    type: 'commerce',
    id: { $in: [agentChannelId, customerChannelId] },
  };

  return (
    <div className="agent-channel-list__container">
      <ChannelSearch />
      <p className="agent-channel-list__conversation-header">
        Active Conversations
      </p>
      <ChannelList
        filters={filters}
        sort={sort}
        options={options}
        List={AgentChannelList}
        Preview={(previewProps) => (
          <AgentChannelPreview
            {...previewProps}
            {...{ agentChannelId, customerChannelId }}
          />
        )}
      />
    </div>
  );
};
