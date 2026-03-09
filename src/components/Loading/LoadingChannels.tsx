import React from 'react';

const LoadingItems = () => (
  <div className='str-chat__channel-preview-container'>
    <div
      aria-hidden='true'
      className='str-chat__channel-preview str-chat__channel-preview--loading'
    >
      <div className='str-chat__loading-channels-avatar' />
      <div className='str-chat__channel-preview-data str-chat__channel-preview-data--loading'>
        <div className='str-chat__loading-channels-username' />
        <div className='str-chat__loading-channels-status' />
      </div>
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
