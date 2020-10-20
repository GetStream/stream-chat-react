import React, { useContext } from 'react';
import { ChannelContext } from 'stream-chat-react';

import './TeamChannelHeader.css';

export const TeamChannelHeader = () => {
  const { channel, watcher_count } = useContext(ChannelContext);

  const getChannelHeader = () => {
    if (channel.type === 'team') {
      return `# ${channel.data.id || 'random'}`;
    }

    const members = Object.values(channel.state.members);
    return members[0]?.user.name || 'Johnny Blaze';
  };

  const getWatcherText = (watchers) => {
    if (channel.type !== 'team') return '';
    if (!watchers) return 'No users online';
    if (watchers === 1) return '1 user online';
    return `${watchers} users online`;
  };

  return (
    <div className="team-channel-header__container">
      <p className="team-channel-header__name">{getChannelHeader()}</p>
      <p className="team-channel-header__watchers">
        {getWatcherText(watcher_count)}
      </p>
    </div>
  );
};
