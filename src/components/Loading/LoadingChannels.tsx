import React from 'react';

const LoadingItems: React.FC = () => (
  <div className='str-chat__loading-channels-item'>
    <div className='str-chat__loading-channels-avatar' />
    <div className='str-chat__loading-channels-meta'>
      <div className='str-chat__loading-channels-username' />
      <div className='str-chat__loading-channels-status' />
    </div>
  </div>
);

const UnMemoizedLoadingChannels: React.FC = () => (
  <div className='str-chat__loading-channels'>
    <LoadingItems />
    <LoadingItems />
    <LoadingItems />
  </div>
);

/**
 * Loading indicator for the ChannelList
 */
export const LoadingChannels = React.memo(
  UnMemoizedLoadingChannels,
) as typeof UnMemoizedLoadingChannels;
