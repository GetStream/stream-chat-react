import React from 'react';

/**
 * LoadingChannels - Fancy loading indicator for the channel list
 *
 * @example ./docs/LoadingChannels.md
 */
export const LoadingChannels = () => (
  <div className="str-chat__loading-channels">
    <div className="str-chat__loading-channels-item">
      <div className="str-chat__loading-channels-avatar" />
      <div className="str-chat__loading-channels-meta">
        <div className="str-chat__loading-channels-username" />
        <div className="str-chat__loading-channels-status" />
      </div>
    </div>
    <div className="str-chat__loading-channels-item">
      <div className="str-chat__loading-channels-avatar" />
      <div className="str-chat__loading-channels-meta">
        <div className="str-chat__loading-channels-username" />
        <div className="str-chat__loading-channels-status" />
      </div>
    </div>
    <div className="str-chat__loading-channels-item">
      <div className="str-chat__loading-channels-avatar" />
      <div className="str-chat__loading-channels-meta">
        <div className="str-chat__loading-channels-username" />
        <div className="str-chat__loading-channels-status" />
      </div>
    </div>
  </div>
);
