import React from 'react';
import { ChannelList } from 'stream-chat-react';

import './AgentChannelListContainer.css';

import { AgentChannelList } from '../AgentChannelList/AgentChannelList';
import { AgentChannelPreview } from '../AgentChannelList/AgentChannelPreview';

import { SearchIcon } from '../../assets/SearchIcon';

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

export const AgentChannelListContainer = () => {
  const options = {
    member: true,
    watch: true,
    limit: 3,
  };

  return (
    <div className="agent-channel-list__container">
      <ChannelSearch />
      <p className="agent-channel-list__conversation-header">
        Active Conversations
      </p>
      <ChannelList
        filters={{
          type: 'commerce',
          id: { $in: ['agent-demo', 'support-demo'] },
        }}
        sort={{ last_message_at: -1 }}
        options={options}
        List={AgentChannelList}
        Preview={AgentChannelPreview}
      />
    </div>
  );
};
