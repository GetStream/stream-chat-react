import React from 'react';

const LoadingItems = () => (
  <div className='str-chat__loading-channels-item str-chat__channel-preview-loading'>
    <div className='str-chat__loading-channels-avatar' />
    <div className='str-chat__loading-channels-meta str-chat__channel-preview-end-loading'>
      <div className='str-chat__loading-channels-username' />
      <div className='str-chat__loading-channels-status' />
    </div>
  </div>
);

const UnMemoizedLoadingChannels = () => (
  <div className='str-chat__loading-channels'>
    <LoadingItems />
    <LoadingItems />
    <LoadingItems />
  </div>
);

/**
 * Loading indicator for the ChannelList
 */
export const LoadingChannels = React.memo(UnMemoizedLoadingChannels);
