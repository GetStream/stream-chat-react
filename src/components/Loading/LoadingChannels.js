// @ts-check
import React from 'react';

const LoadingItems = () => (
  <div className="str-chat__loading-channels-item">
    <div className="str-chat__loading-channels-avatar" />
    <div className="str-chat__loading-channels-meta">
      <div className="str-chat__loading-channels-username" />
      <div className="str-chat__loading-channels-status" />
    </div>
  </div>
);

/**
 * LoadingChannels - Fancy loading indicator for the channel list
 *
 * @example ../../docs/LoadingChannels.md
 */
const LoadingChannels = () => (
  <div className="str-chat__loading-channels">
    <LoadingItems />
    <LoadingItems />
    <LoadingItems />
  </div>
);

export default React.memo(LoadingChannels);
