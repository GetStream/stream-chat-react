import React from 'react';

import './TeamChannelList.css';

import { AddChannel } from '../../assets/AddChannel';

export const TeamChannelList = ({ error = false, loading, children, type }) => {
  /**
   * This work around removes children of the other channel type since we have
   * two ChannelList components and each receives the `message.new` event,
   * which by default adds the channel in question to children on each list.
   */
  let newChildren = children;
  let childArray;

  if (type === 'team') {
    childArray = newChildren?.props?.children?.filter(
      (child) => child.props.channel.type === 'team',
    );
  }

  if (type === 'messaging') {
    childArray = newChildren?.props?.children?.filter(
      (child) => child.props.channel.type === 'messaging',
    );
  }

  newChildren = {
    ...newChildren,
    props: {
      children: childArray,
    },
  };

  if (error && type === 'team') {
    return (
      <div className="team-channel-list">
        <p className="team-channel-list__message">
          Connection error, please wait a moment and try again.
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
      <div className="team-channel-list__header">
        <p className="team-channel-list__header__title">
          {type === 'team' ? 'Channels' : 'Direct Messages'}
        </p>
        <AddChannel />
      </div>
      {newChildren}
    </div>
  );
};
