import React from 'react';

import './TeamChannelList.css';

import { AddChannel } from '../../assets/AddChannel';

export const DirectChannelList = ({ error = false, loading, children }) => {
  /**
   * Work around to remove children of other channel type, since we have
   * two ChannelList components in the app and each new message send
   * adds the channel in question to children on each list.
   */
  let newChildren = children;
  const childArray = newChildren?.props?.children?.filter(
    (child) => child.props.channel.type === 'messaging',
  );

  newChildren = {
    ...newChildren,
    props: {
      children: childArray,
    },
  };

  if (error) {
    return null;
  }

  if (loading) {
    return (
      <div className="team-channel-list">
        <p className="team-channel-list__message">Messages loading....</p>
      </div>
    );
  }

  return (
    <div className="team-channel-list">
      <div className="team-channel-list__header">
        <p className="team-channel-list__header__title">Direct Messages</p>
        <AddChannel />
      </div>
      {newChildren}
    </div>
  );
};
