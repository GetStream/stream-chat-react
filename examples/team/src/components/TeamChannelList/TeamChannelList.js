import React from 'react';

import './TeamChannelList.css';

import { AddChannel } from '../../assets';

const ChannelList = (props) => {
  const {
    children,
    error = false,
    loading,
    setCreateType,
    setIsCreating,
    setIsEditing,
    type,
  } = props;

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

  if (error) {
    return type === 'team' ? (
      <div className="team-channel-list">
        <p className="team-channel-list__message">
          Connection error, please wait a moment and try again.
        </p>
      </div>
    ) : null;
  }

  if (loading) {
    return (
      <div className="team-channel-list">
        <p className="team-channel-list__message loading">
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
        <AddChannel
          {...{ setCreateType, setIsCreating, setIsEditing }}
          type={type === 'team' ? 'team' : 'messaging'}
        />
      </div>
      {newChildren}
    </div>
  );
};

export const TeamChannelList = React.memo(ChannelList);
