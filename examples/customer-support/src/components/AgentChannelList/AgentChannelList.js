import React from 'react';

import './AgentChannelList.css';

export const AgentChannelList = ({ error = false, loading, children }) => {
  if (error) {
    return (
      <div className="agent-channel-list">
        <p className="agent-channel-list__message">
          Connection error, please wait a moment and try again.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="agent-channel-list">
        <p className="agent-channel-list__message">Conversations loading....</p>
      </div>
    );
  }

  return <div className="agent-channel-list">{children}</div>;
};
