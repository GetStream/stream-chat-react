import React from 'react';

const LoadingItems = () => (
  <div className='str-chat__channel-preview-loading'>
    <div className='str-chat__loading-channels-avatar' />
    <div className='str-chat__channel-preview-end-loading'>
      <div className='str-chat__loading-channels-username' />
      <div className='str-chat__loading-channels-status' />
    </div>
  </div>
);

export const LoadingChannels = () => (
  <div className='str-chat__loading-channels'>
    <LoadingItems />
    <LoadingItems />
    <LoadingItems />
    <LoadingItems />
    <LoadingItems />
  </div>
);
