import React from 'react';

import './TeamChannelList.css';

export const TeamChannelList = ({ error = false, loading, children, type }) => {
  if (error) {
    return (
      <div className="team-channel-list">
        <p className="team-channel-list__message">
          {type === 'team' &&
            'Connection error, please wait a moment and try again.'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="team-channel-list">
        <p className="team-channel-list__message">
          {type === 'team' ? 'Channels' : 'Messages'} loading....
        </p>
      </div>
    );
  }

  return (
    <div className="team-channel-list">
      <p className="team-channel-list__header">
        {type === 'team' ? 'Channels' : 'Direct Messages'}
      </p>
      {children}
    </div>
  );
};
